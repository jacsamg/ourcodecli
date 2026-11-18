#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseArgs, showHelp } from './args.js';
import { loadConfig } from './config.js';
import { CliError, ErrorCode } from './errors.js';
import { generate } from './generate.js';

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

const ARGUMENT_ERRORS: ReadonlySet<ErrorCode> = new Set([
  ErrorCode.UNKNOWN_OPTION,
  ErrorCode.TOO_MANY_ARGS,
  ErrorCode.MISSING_CONFIG_VALUE,
]);

async function main(argv: string[]): Promise<number> {
  try {
    const args = parseArgs(argv);

    if (args.help) {
      showHelp();
      return 0;
    }

    if (args.version) {
      console.log(await getVersion());
      return 0;
    }

    const config = await loadConfig(resolve(args.config));
    await generate(config);
    return 0;
  } catch (error) {
    if (error instanceof CliError) {
      console.error(error.message);
      if (ARGUMENT_ERRORS.has(error.code)) {
        console.error('');
        showHelp();
      }
      return error.exitCode;
    }

    console.error('Error al generar Material Symbols:', error);
    return 1;
  }
}

main(process.argv.slice(2))
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error('Error fatal:', err);
    process.exit(1);
  });
