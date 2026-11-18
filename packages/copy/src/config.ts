import { readFile } from 'node:fs/promises';
import { COPY_CONFIG_SCHEMA } from './config-schema.js';
import { CliError, ErrorCode } from './errors.js';
import type { CopyConfig, OurCopyConfig } from './types.js';

const ENTRY_SCHEMA = COPY_CONFIG_SCHEMA.properties.copies.items;
const REQUIRED_KEYS = ENTRY_SCHEMA.required;
const ALLOWED_KEYS = Object.keys(ENTRY_SCHEMA.properties);
const ALLOWED_KEYS_SET = new Set(ALLOWED_KEYS);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function invalid(message: string): CliError {
  return new CliError(ErrorCode.INVALID_CONFIG, message);
}

function validateOptionalBoolean(value: unknown, key: string): boolean {
  if (value !== undefined && typeof value !== 'boolean') {
    throw invalid(
      `La propiedad "${key}" debe ser un booleano cuando se indica.`,
    );
  }

  return value === true;
}

function validateEntry(item: unknown): CopyConfig {
  if (!isPlainObject(item)) {
    throw invalid(
      'Cada entrada de la configuración debe ser un objeto con sourcePath, targetPath y, opcionalmente, force/preserveSymlinks/rename.',
    );
  }

  for (const key of Object.keys(item)) {
    if (!ALLOWED_KEYS_SET.has(key)) {
      throw invalid(
        `Propiedad desconocida "${key}" en una entrada de la configuración. Propiedades permitidas: ${ALLOWED_KEYS.join(', ')}.`,
      );
    }
  }

  for (const key of REQUIRED_KEYS) {
    if (!(key in item)) {
      throw invalid(
        `Falta la propiedad "${key}" en una entrada de la configuración. Propiedades obligatorias: ${REQUIRED_KEYS.join(', ')}.`,
      );
    }
  }

  const { sourcePath, targetPath, rename } = item;
  const force = validateOptionalBoolean(item.force, 'force');
  const preserveSymlinks = validateOptionalBoolean(
    item.preserveSymlinks,
    'preserveSymlinks',
  );

  if (typeof sourcePath !== 'string' || sourcePath.trim().length === 0) {
    throw invalid('La propiedad "sourcePath" debe ser un texto no vacío.');
  }

  if (
    rename !== undefined &&
    (typeof rename !== 'string' || rename.trim().length === 0)
  ) {
    throw invalid(
      'La propiedad "rename" debe ser un texto no vacío cuando se indica.',
    );
  }

  if (!Array.isArray(targetPath)) {
    throw invalid('La propiedad "targetPath" debe ser un arreglo de textos.');
  }

  if (targetPath.some((t) => typeof t !== 'string')) {
    throw invalid('La propiedad "targetPath" solo debe contener textos.');
  }

  const cleanTargetPath = (targetPath as string[])
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  if (cleanTargetPath.length === 0) {
    throw invalid(
      'La propiedad "targetPath" debe incluir al menos una ruta no vacía.',
    );
  }

  return {
    force,
    preserveSymlinks,
    rename: typeof rename === 'string' ? rename.trim() : undefined,
    sourcePath: sourcePath.trim(),
    targetPath: cleanTargetPath,
  };
}

export function validateConfig(value: unknown): OurCopyConfig {
  if (!isPlainObject(value)) {
    throw invalid(
      'La raíz de la configuración debe ser un objeto con un arreglo "copies".',
    );
  }

  if (!Array.isArray(value.copies)) {
    throw invalid('La propiedad raíz "copies" debe ser un arreglo.');
  }

  return { copies: value.copies.map(validateEntry) };
}

export async function loadConfig(
  absConfigPath: string,
): Promise<OurCopyConfig> {
  let raw: string;
  try {
    raw = await readFile(absConfigPath, 'utf8');
  } catch (_error) {
    throw invalid(
      `No se pudo leer el archivo de configuración: ${absConfigPath}`,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch (_error) {
    throw invalid(
      `JSON inválido en el archivo de configuración: ${absConfigPath}`,
    );
  }

  return validateConfig(parsed);
}
