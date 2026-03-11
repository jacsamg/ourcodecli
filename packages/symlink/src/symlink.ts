import { readFile } from 'node:fs/promises';
import { lstat, mkdir, rm, stat, symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { CliError, ErrorCode } from './errors.js';
import type { OurSymlinkConfig, SymlinkConfig } from './types.js';

interface SourceInfo {
  isDirectory: boolean;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateConfig(value: unknown): OurSymlinkConfig {
  if (!Array.isArray(value)) {
    throw new CliError(
      ErrorCode.INVALID_CONFIG,
      'Config root must be an array of { name, force, source, target[] } entries.',
    );
  }

  const entries: SymlinkConfig[] = [];
  for (const item of value) {
    if (!isPlainObject(item)) {
      throw new CliError(
        ErrorCode.INVALID_CONFIG,
        'Each config entry must be an object with name, force, source and target.',
      );
    }

    const name = item.name;
    const force = item.force;
    const source = item.source;
    const target = item.target;
    if (typeof name !== 'string' || name.trim().length === 0) {
      throw new CliError(
        ErrorCode.INVALID_CONFIG,
        'Config entry "name" must be a non-empty string.',
      );
    }
    if (typeof force !== 'boolean') {
      throw new CliError(
        ErrorCode.INVALID_CONFIG,
        'Config entry "force" must be a boolean.',
      );
    }
    if (typeof source !== 'string' || source.trim().length === 0) {
      throw new CliError(
        ErrorCode.INVALID_CONFIG,
        'Config entry "source" must be a non-empty string.',
      );
    }
    if (!Array.isArray(target)) {
      throw new CliError(
        ErrorCode.INVALID_CONFIG,
        'Config entry "target" must be an array of strings.',
      );
    }
    if (target.some((t) => typeof t !== 'string')) {
      throw new CliError(
        ErrorCode.INVALID_CONFIG,
        'Config entry "target" must contain only strings.',
      );
    }

    const cleanTarget = target
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (cleanTarget.length === 0) {
      throw new CliError(
        ErrorCode.INVALID_CONFIG,
        'Config entry "target" must include at least one non-empty directory path.',
      );
    }

    entries.push({
      name: name.trim(),
      force,
      source: source.trim(),
      target: cleanTarget,
    });
  }

  return entries;
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
