#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { type DeleteArgs, parseArgs, showHelp } from './args.js';
import { CliError, ErrorCode } from './errors.js';
import { removePath } from './remove.js';

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
    const args: DeleteArgs = parseArgs(argv);

    if (args.help) {
      showHelp();
      return 0;
    }

    if (args.version) {
      const version = await getVersion();
      console.log(version);
      return 0;
    }

    if (args.paths.length === 0) {
      throw new CliError(
        ErrorCode.MISSING_ARGS,
        'Faltan argumentos obligatorios: <path1> [path2] ...',
      );
    }

    for (const relativePath of args.paths) {
      const absPath = resolve(relativePath);
      await removePath({ absPath, force: args.force, strict: args.strict });
      console.log(`Se eliminó correctamente ${absPath}`);
    }
    return 0;
  } catch (error) {
    if (error instanceof CliError) {
      const err = error as CliError;
      console.error(err.message);
      if (
        err.code === ErrorCode.TOO_MANY_ARGS ||
        err.code === ErrorCode.MISSING_ARGS
      ) {
        showHelp();
      }
      return err.exitCode ?? 1;
    }
    console.error('Error al eliminar la ruta:', error);
    return 1;
  }
}

// Se ejecuta cuando se invoca como script
main(process.argv.slice(2))
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error('Error fatal:', err);
    process.exit(1);
  });
