#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { type IconArgs, parseArgs, showHelp } from './args.js';
import { DEFAULT_ICON_SIZES, generateIcons } from './core.js';
import { CliError, ErrorCode } from './errors.js';

async function getVersion(): Promise<string> {
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
    const args: IconArgs = parseArgs(argv);

    if (args.help) {
      showHelp();
      return 0;
    }

    if (args.version) {
      const version = await getVersion();
      console.log(version);
      return 0;
    }

    const { source, destination, name, sizes, dryRun } = args;
    if (!source || !destination || !name) {
      throw new CliError(
        ErrorCode.MISSING_ARGS,
        'Faltan argumentos obligatorios: <source> <destination> <name>.',
      );
    }

    const absSource = resolve(source);
    const absDest = resolve(destination);

    await generateIcons({
      absSource,
      absDest,
      baseName: name,
      sizes: sizes ?? DEFAULT_ICON_SIZES,
      dryRun,
    });

    if (dryRun) {
      console.log('Simulación completada. No se escribieron archivos.');
    } else {
      console.log(
        `\n✅ Todos los iconos se generaron correctamente en ${absDest}`,
      );
    }
    return 0;
  } catch (error) {
    if (error instanceof CliError) {
      console.error(error.message);
      if (
        error.code === ErrorCode.MISSING_ARGS ||
        error.code === ErrorCode.INVALID_SIZES ||
        error.code === ErrorCode.TOO_MANY_ARGS
      ) {
        showHelp();
      }
      return error.exitCode ?? 1;
    }
    console.error('❌ Error al generar los iconos:', error);
    return 1;
  }
}

main(process.argv.slice(2))
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error('Error fatal:', err);
    process.exit(1);
  });
