#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { type CopyArgs, parseArgs, showHelp } from './args.js';
import { copyPath } from './copy.js';
import { CliError, ErrorCode } from './errors.js';

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

    const { source, destination } = args;
    if (!source || !destination) {
      throw new CliError(
        ErrorCode.MISSING_ARGS,
        'Faltan argumentos obligatorios: <source> y <destination>.',
      );
    }

    const absSource = resolve(source);
    let absDest = resolve(destination);

    if (args.rename) {
      absDest = join(absDest, args.rename);
    }

    await copyPath({
      absSource,
      absDest,
      force: args.force,
      preserveSymlinks: args.preserveSymlinks,
      dryRun: args.dryRun,
    });

    if (args.dryRun) {
      console.log('Simulación completada. No se realizaron cambios.');
    } else {
      console.log(`Se copió correctamente de ${absSource} a ${absDest}`);
    }
    return 0;
  } catch (error) {
    if (error instanceof CliError) {
      const err = error as CliError;
      console.error(err.message);
      if (
        err.code === ErrorCode.TOO_MANY_ARGS ||
        err.code === ErrorCode.MISSING_RENAME_VALUE ||
        err.code === ErrorCode.MISSING_ARGS
      ) {
        showHelp();
      }
      return err.exitCode ?? 1;
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
