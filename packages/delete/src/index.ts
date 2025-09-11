#!/usr/bin/env node

import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';

interface DeleteArgs {
  force: boolean;
  strict: boolean;
  paths: string[];
}

function showHelp(): void {
  console.log(
    'Usage: our-delete <path1> [path2] ... [--force] [--strict] [--help]',
  );
  console.log('Options:');
  console.log('  --force: Force deletion without confirmation');
  console.log('  --strict: Exit on first error');
  console.log('  --help, -h: Show this help message');
}

function parseArgs(): DeleteArgs {
  const args = process.argv.slice(2);
  const deleteArgs: DeleteArgs = { force: false, strict: false, paths: [] };

  for (const arg of args) {
    switch (arg) {
      case '--force':
        deleteArgs.force = true;
        break;
      case '--strict':
        deleteArgs.strict = true;
        break;
      case '--help':
      case '-h':
        showHelp();
        return process.exit(1);
      default:
        deleteArgs.paths.push(arg);
    }
  }

  return deleteArgs;
}

async function removePath(
  absPath: string,
  force: boolean,
  strict: boolean,
): Promise<void> {
  try {
    await rm(absPath, { recursive: true, force });
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return; // Path does not exist, nothing to do
    } else if (strict) {
      throw error;
    }
  }
}

(async () => {
  try {
    const { force, strict, paths } = parseArgs();

    if (paths.length === 0) {
      showHelp();
      process.exit(1);
    }

    for (const relativePath of paths) {
      const absPath = resolve(relativePath);

      await removePath(absPath, force, strict);
      console.log(`Successfully deleted ${absPath}`);
    }
  } catch (error: unknown) {
    console.error(`Error deleting path:`, error);
    process.exit(1);
  }
})();
