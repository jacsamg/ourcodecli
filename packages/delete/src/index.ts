#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { type DeleteArgs, parseArgs, showHelp } from './args.js';
import { CliError, ErrorCode } from './errors.js';
import { removePath } from './remove.js';

async function getVersion(): Promise<string> {
  // Resolve path to package.json (dist/index.js sits next to package.json)
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
        'Missing required argument(s): <path1> [path2] ...',
      );
    }

    for (const relativePath of args.paths) {
      const absPath = resolve(relativePath);
      await removePath({ absPath, force: args.force, strict: args.strict });
      console.log(`Successfully deleted ${absPath}`);
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
    console.error('Error deleting path:', error);
    return 1;
  }
}

// Execute when run as a script
main(process.argv.slice(2))
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
