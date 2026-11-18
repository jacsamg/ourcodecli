#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { type CopyArgs, parseArgs, showHelp } from './args.js';
import { loadConfig } from './config.js';
import { copyPath } from './copy.js';
import { CliError, ErrorCode } from './errors.js';

interface ResolvedEntry {
  force: boolean;
  preserveSymlinks: boolean;
  rename: string | null;
  sourcePath: string;
  targetPath: string[];
}

// Errores de uso del CLI: además del mensaje se muestra la ayuda
const USAGE_ERROR_CODES = new Set<ErrorCode>([
  ErrorCode.TOO_MANY_ARGS,
  ErrorCode.MISSING_RENAME_VALUE,
  ErrorCode.MISSING_ARGS,
  ErrorCode.MISSING_CONFIG_VALUE,
  ErrorCode.CONFIG_WITH_POSITIONALS,
  ErrorCode.CONFIG_WITH_INLINE_OPTIONS,
  ErrorCode.INVALID_CONFIG,
]);

async function getVersion(): Promise<string> {
  // Resuelve la ruta a package.json (dist/index.js está junto a package.json)
  const thisFile = fileURLToPath(import.meta.url);
  const pkgPath = join(thisFile, '..', '..', 'package.json');
  try {
    const raw = await readFile(pkgPath, 'utf8');
    const pkg = JSON.parse(raw) as { version?: string };
    return pkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

async function resolveEntries(args: CopyArgs): Promise<ResolvedEntry[]> {
  if (args.config !== null) {
    if (args.source !== null || args.destination !== null) {
      throw new CliError(
        ErrorCode.CONFIG_WITH_POSITIONALS,
        'No pases argumentos posicionales al usar --config.',
      );
    }

    const config = await loadConfig(resolve(args.config));
    return config.copies.map((entry) => ({
      force: entry.force ?? false,
      preserveSymlinks: entry.preserveSymlinks ?? false,
      rename: entry.rename ?? null,
      sourcePath: entry.sourcePath,
      targetPath: entry.targetPath,
    }));
  }

  if (!args.source || !args.destination) {
    throw new CliError(
      ErrorCode.MISSING_ARGS,
      'Faltan argumentos obligatorios: <source> y <destination>.',
    );
  }

  return [
    {
      force: args.force,
      preserveSymlinks: args.preserveSymlinks,
      rename: args.rename,
      sourcePath: args.source,
      targetPath: [args.destination],
    },
  ];
}

async function main(argv: string[]): Promise<number> {
  try {
    const args: CopyArgs = parseArgs(argv);

    if (args.help) {
      showHelp();
      return 0;
    }

    if (args.version) {
      const version = await getVersion();
      console.log(version);
      return 0;
    }

    const entries = await resolveEntries(args);
    let total = 0;
    let success = 0;
    let failed = 0;

    for (const entry of entries) {
      const absSource = resolve(entry.sourcePath);
      for (const target of entry.targetPath) {
        total++;
        const absTarget = resolve(target);
        const absDest = entry.rename
          ? join(absTarget, entry.rename)
          : absTarget;
        try {
          await copyPath({
            absSource,
            absDest,
            force: entry.force,
            preserveSymlinks: entry.preserveSymlinks,
            dryRun: args.dryRun,
          });
          if (!args.dryRun) {
            console.log(`Se copió correctamente de ${absSource} a ${absDest}`);
          }
          success++;
        } catch (error) {
          failed++;
          const prefix = `Falló el destino "${target}" con el origen "${entry.sourcePath}":`;
          if (error instanceof CliError) {
            console.error(`${prefix} ${error.message}`);
          } else {
            console.error(prefix, error);
          }
        }
      }
    }

    if (failed > 0) {
      console.error(
        `Terminó con errores. Correctos: ${success}, fallidos: ${failed}, total: ${total}.`,
      );
      return 1;
    }

    if (args.dryRun) {
      console.log('Simulación completada. No se realizaron cambios.');
    } else {
      console.log(`Terminó correctamente. Copias realizadas: ${success}.`);
    }
    return 0;
  } catch (error) {
    if (error instanceof CliError) {
      console.error(error.message);
      if (USAGE_ERROR_CODES.has(error.code)) {
        showHelp();
      }
      return error.exitCode ?? 1;
    }

    // Error desconocido o inesperado
    console.error('Error al copiar la ruta:', error);
    return 1;
  }
}

// Se ejecuta cuando se invoca como script
main(process.argv.slice(2))
  .then((code) => {
    // Sale explícitamente con el código devuelto para un comportamiento consistente en la shell
    process.exit(code);
  })
  .catch((err) => {
    console.error('Error fatal:', err);
    process.exit(1);
  });
