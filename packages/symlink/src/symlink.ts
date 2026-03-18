import { readFile } from 'node:fs/promises';
import { lstat, mkdir, rm, stat, symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { CliError, ErrorCode } from './errors.js';
import { SYMLINK_CONFIG_SCHEMA } from './config-schema.js';
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
      'Config root must be an object with a "symlinks" array.',
    );
  }

  const symlinks = value.symlinks;
  if (!Array.isArray(symlinks)) {
    throw new CliError(
      ErrorCode.INVALID_CONFIG,
      'Config root property "symlinks" must be an array.',
    );
  }

  const entries: SymlinkConfig[] = [];
  for (const item of symlinks) {
    if (!isPlainObject(item)) {
      throw new CliError(
        ErrorCode.INVALID_CONFIG,
        'Each config entry must be an object with sourcePath, targetDir and optional force/targetName.',
      );
    }

    for (const key of Object.keys(item)) {
      if (!allowedKeysSet.has(key)) {
        throw new CliError(
          ErrorCode.INVALID_CONFIG,
          `Unknown config entry property "${key}". Allowed properties: ${allowedKeys.join(', ')}.`,
        );
      }
    }
    for (const key of requiredKeys) {
      if (!(key in item)) {
        throw new CliError(
          ErrorCode.INVALID_CONFIG,
          `Missing config entry property "${key}". Required properties: ${requiredKeys.join(', ')}.`,
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
        'Config entry "force" must be a boolean when provided.',
      );
    }
    if (typeof sourcePath !== 'string' || sourcePath.trim().length === 0) {
      throw new CliError(
        ErrorCode.INVALID_CONFIG,
        'Config entry "sourcePath" must be a non-empty string.',
      );
    }
    if (
      targetName !== undefined &&
      (typeof targetName !== 'string' || targetName.trim().length === 0)
    ) {
      throw new CliError(
        ErrorCode.INVALID_CONFIG,
        'Config entry "targetName" must be a non-empty string when provided.',
      );
    }
    if (!Array.isArray(targetDir)) {
      throw new CliError(
        ErrorCode.INVALID_CONFIG,
        'Config entry "targetDir" must be an array of strings.',
      );
    }
    if (targetDir.some((t) => typeof t !== 'string')) {
      throw new CliError(
        ErrorCode.INVALID_CONFIG,
        'Config entry "targetDir" must contain only strings.',
      );
    }

    const cleanTargetDir = targetDir
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (cleanTargetDir.length === 0) {
      throw new CliError(
        ErrorCode.INVALID_CONFIG,
        'Config entry "targetDir" must include at least one non-empty directory path.',
      );
    }

    entries.push({
      force: force ?? false,
      sourcePath: sourcePath.trim(),
      targetName: typeof targetName === 'string' ? targetName.trim() : undefined,
      targetDir: cleanTargetDir,
    });
  }

  return { symlinks: entries };
}

export async function loadConfig(absConfigPath: string): Promise<OurSymlinkConfig> {
  let raw = '';
  try {
    raw = await readFile(absConfigPath, 'utf8');
  } catch (_error) {
    throw new CliError(
      ErrorCode.INVALID_CONFIG,
      `Cannot read config file: ${absConfigPath}`,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch (_error) {
    throw new CliError(
      ErrorCode.INVALID_CONFIG,
      `Invalid JSON in config file: ${absConfigPath}`,
    );
  }

  return validateConfig(parsed);
}

export async function ensureSource(absSource: string): Promise<SourceInfo> {
  let sourceStats;
  try {
    sourceStats = await stat(absSource);
  } catch (_error) {
    throw new CliError(
      ErrorCode.SOURCE_NOT_FOUND,
      `Source path not found: ${absSource}`,
    );
  }

  if (!sourceStats.isFile() && !sourceStats.isDirectory()) {
    throw new CliError(
      ErrorCode.SOURCE_INVALID_TYPE,
      `Source must be a file or directory: ${absSource}`,
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
        `Target path must be a directory: ${absTargetDir}`,
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
        `Target path is not accessible: ${absTargetDir}`,
      );
    }
  }

  const absDest = join(absTargetDir, linkName);
  try {
    await lstat(absDest);
    if (!force) {
      throw new CliError(
        ErrorCode.DEST_EXISTS,
        `Destination already exists: ${absDest}. Use --force to replace it.`,
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
