import { mkdir, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';

import type {
  FontFormat,
  MaterialSymbolFamily,
  ResolvedConfig,
} from './types.js';

export function familySlug(family: MaterialSymbolFamily): string {
  return family.toLowerCase();
}

export function generatedFileName(
  config: Pick<ResolvedConfig, 'fileBaseName' | 'useContentHash'>,
  family: MaterialSymbolFamily,
  index: number,
  count: number,
  hash: string,
  extension: FontFormat['extension'],
): string {
  const ordinal = count > 1 ? `-${index + 1}` : '';
  const base = `${config.fileBaseName}-${familySlug(family)}${ordinal}`;
  return config.useContentHash
    ? `${base}.${hash.slice(0, 12)}${extension}`
    : `${base}${extension}`;
}

export async function writeAtomically(
  path: string,
  data: string | Buffer,
): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temporary, data);
  try {
    await rename(temporary, path);
  } catch {
    await rm(path, { force: true });
    await rename(temporary, path);
  }
}

/**
 * Elimina fuentes generadas anteriormente (mismo prefijo) que no forman parte
 * de la generación actual. Devuelve las rutas eliminadas.
 */
export async function removeObsoleteFonts(
  config: Pick<
    ResolvedConfig,
    'removeObsoleteGeneratedFonts' | 'fontOutputDirectory' | 'fileBaseName'
  >,
  currentFileNames: readonly string[],
): Promise<string[]> {
  if (!config.removeObsoleteGeneratedFonts) return [];

  let entries: import('node:fs').Dirent[];
  try {
    entries = await readdir(config.fontOutputDirectory, {
      withFileTypes: true,
    });
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }

  const current = new Set(currentFileNames);
  const obsolete = entries
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.startsWith(`${config.fileBaseName}-`) &&
        ['.woff', '.woff2'].includes(extname(entry.name)) &&
        !current.has(entry.name),
    )
    .map((entry) => resolve(config.fontOutputDirectory, entry.name));

  await Promise.all(obsolete.map((path) => rm(path, { force: true })));
  return obsolete;
}
