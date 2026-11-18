import type { Stats } from 'node:fs';
import { lstat, mkdir, readFile, rm, stat, symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { SYMLINK_CONFIG_SCHEMA } from './config-schema.js';
import { CliError, ErrorCode } from './errors.js';
import type { OurSymlinkConfig, SymlinkConfig } from './types.js';

interface SourceInfo {
  isDirectory: boolean;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateConfig(value: unknown): OurSymlinkConfig {
  const rootSchema = SYMLINK_CONFIG_SCHEMA;
  const entrySchema = rootSchema.properties.symlinks.items;
  const requiredKeys = entrySchema.required;
  const allowedKeys = Object.keys(entrySchema.properties);
  const allowedKeysSet = new Set(allowedKeys);

  if (!isPlainObject(value)) {
    throw new CliError(
      ErrorCode.INVALID_CONFIG,
      'La raíz de la configuración debe ser un objeto con un arreglo "symlinks".',
    );
  }

  const symlinks = value.symlinks;
  if (!Array.isArray(symlinks)) {
    throw new CliError(
      ErrorCode.INVALID_CONFIG,
      'La propiedad raíz "symlinks" debe ser un arreglo.',
    );
  }

  const entries: SymlinkConfig[] = [];
  for (const item of symlinks) {
    if (!isPlainObject(item)) {
      throw new CliError(
        ErrorCode.INVALID_CONFIG,
        'Cada entrada de la configuración debe ser un objeto con sourcePath, targetDir y, opcionalmente, force/targetName.',
      );
    }

    for (const key of Object.keys(item)) {
      if (!allowedKeysSet.has(key)) {
        throw new CliError(
          ErrorCode.INVALID_CONFIG,
          `Propiedad desconocida "${key}" en una entrada de la configuración. Propiedades permitidas: ${allowedKeys.join(', ')}.`,
        );
      }
    }
    for (const key of requiredKeys) {
      if (!(key in item)) {
        throw new CliError(
          ErrorCode.INVALID_CONFIG,
          `Falta la propiedad "${key}" en una entrada de la configuración. Propiedades obligatorias: ${requiredKeys.join(', ')}.`,
        );
      }
    }

    const force = item.force;
    const sourcePath = item.sourcePath;
    const targetName = item.targetName;
    const targetDir = item.targetDir;
    if (force !== undefined && typeof force !== 'boolean') {
      throw new CliError(
        ErrorCode.INVALID_CONFIG,
        'La propiedad "force" debe ser un booleano cuando se indica.',
      );
    }
    if (typeof sourcePath !== 'string' || sourcePath.trim().length === 0) {
      throw new CliError(
        ErrorCode.INVALID_CONFIG,
        'La propiedad "sourcePath" debe ser un texto no vacío.',
      );
    }
    if (
      targetName !== undefined &&
      (typeof targetName !== 'string' || targetName.trim().length === 0)
    ) {
      throw new CliError(
        ErrorCode.INVALID_CONFIG,
        'La propiedad "targetName" debe ser un texto no vacío cuando se indica.',
      );
    }
    if (!Array.isArray(targetDir)) {
      throw new CliError(
        ErrorCode.INVALID_CONFIG,
        'La propiedad "targetDir" debe ser un arreglo de textos.',
      );
    }
    if (targetDir.some((t) => typeof t !== 'string')) {
      throw new CliError(
        ErrorCode.INVALID_CONFIG,
        'La propiedad "targetDir" solo debe contener textos.',
      );
    }

    const cleanTargetDir = targetDir
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (cleanTargetDir.length === 0) {
      throw new CliError(
        ErrorCode.INVALID_CONFIG,
        'La propiedad "targetDir" debe incluir al menos una ruta de directorio no vacía.',
      );
    }

    entries.push({
      force: force ?? false,
      sourcePath: sourcePath.trim(),
      targetName:
        typeof targetName === 'string' ? targetName.trim() : undefined,
      targetDir: cleanTargetDir,
    });
  }

  return { symlinks: entries };
}

export async function loadConfig(
  absConfigPath: string,
): Promise<OurSymlinkConfig> {
  let raw = '';
  try {
    raw = await readFile(absConfigPath, 'utf8');
  } catch (_error) {
    throw new CliError(
      ErrorCode.INVALID_CONFIG,
      `No se pudo leer el archivo de configuración: ${absConfigPath}`,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch (_error) {
    throw new CliError(
      ErrorCode.INVALID_CONFIG,
      `JSON inválido en el archivo de configuración: ${absConfigPath}`,
    );
  }

  return validateConfig(parsed);
}

export async function ensureSource(absSource: string): Promise<SourceInfo> {
  let sourceStats: Stats;
  try {
    sourceStats = await stat(absSource);
  } catch (_error) {
    throw new CliError(
      ErrorCode.SOURCE_NOT_FOUND,
      `No se encontró la ruta de origen: ${absSource}`,
    );
  }

  if (!sourceStats.isFile() && !sourceStats.isDirectory()) {
    throw new CliError(
      ErrorCode.SOURCE_INVALID_TYPE,
      `El origen debe ser un archivo o un directorio: ${absSource}`,
    );
  }

  return {
    isDirectory: sourceStats.isDirectory(),
  };
}

export async function createSymlinkInTarget(params: {
  absSource: string;
  absTargetDir: string;
  linkName: string;
  force: boolean;
}): Promise<string> {
  const { absSource, absTargetDir, linkName, force } = params;
  const sourceInfo = await ensureSource(absSource);

  try {
    const targetStats = await stat(absTargetDir);
    if (!targetStats.isDirectory()) {
      throw new CliError(
        ErrorCode.TARGET_NOT_DIRECTORY,
        `La ruta de destino debe ser un directorio: ${absTargetDir}`,
      );
    }
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (error instanceof CliError) {
      throw error;
    }
    if (err.code === 'ENOENT') {
      await mkdir(absTargetDir, { recursive: true });
    } else {
      throw new CliError(
        ErrorCode.TARGET_NOT_DIRECTORY,
        `No se puede acceder a la ruta de destino: ${absTargetDir}`,
      );
    }
  }

  const absDest = join(absTargetDir, linkName);
  try {
    await lstat(absDest);
    if (!force) {
      throw new CliError(
        ErrorCode.DEST_EXISTS,
        `El destino ya existe: ${absDest}. Usa --force para reemplazarlo.`,
      );
    }
    await rm(absDest, { recursive: true, force: true });
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (error instanceof CliError) {
      throw error;
    }
    if (err.code !== 'ENOENT') {
      throw error;
    }
  }

  const type = sourceInfo.isDirectory ? 'junction' : 'file';
  await symlink(absSource, absDest, type);
  return absDest;
}
