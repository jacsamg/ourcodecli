#!/usr/bin/env node

import { cp, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

interface CopyArgs {
  force: boolean;
  source: string | null;
  destination: string | null;
  preserveSymlinks: boolean;
}

const errors = {
  TOO_MANY_ARGS: {
    code: 'TOO_MANY_ARGS',
    message: 'Too many arguments provided.',
  },
};

function showHelp() {
  console.log('Usage: our-copy <source> <destination> [--force] [--help]');
  console.log('Options:');
  console.log('  --force: Overwrite destination if it exists');
  console.log(
    '  --preserve-symlinks: Preserve symbolic links instead of dereferencing them',
  );
  console.log('  --help, -h: Show this help message');
}

function parseArgs(): CopyArgs {
  const args = process.argv.slice(2);
  const copyArgs: CopyArgs = {
    force: false,
    source: null,
    destination: null,
    preserveSymlinks: false,
  };

  for (const arg of args) {
    switch (arg) {
      case '--force':
        copyArgs.force = true;
        break;
      case '--preserve-symlinks':
        copyArgs.preserveSymlinks = true;
        break;
      case '--help':
      case '-h':
        showHelp();
        return process.exit(0);
      default:
        if (copyArgs.source === null) {
          copyArgs.source = arg;
        } else if (copyArgs.destination === null) {
          copyArgs.destination = arg;
        } else {
          throw new Error(errors.TOO_MANY_ARGS.code);
        }
    }
  }

  return copyArgs;
}

async function copyPath(
  absSource: string,
  absDest: string,
  force: boolean,
  preserveSymlinks: boolean,
): Promise<void> {
  try {
    if (force) {
      await rm(absDest, { recursive: true, force: true });
    }

    await cp(absSource, absDest, {
      recursive: true,
      dereference: preserveSymlinks === false,
      force,
    });
  } catch (error: unknown) {
    console.error(`Error copying:`, (error as Error).message);
    throw error;
  }
}

(async () => {
  try {
    const { force, source, destination, preserveSymlinks } = parseArgs();

    if (!source || !destination) {
      showHelp();
      process.exit(1);
    }

    const absSource = resolve(source);
    const absDest = resolve(destination);

    await copyPath(absSource, absDest, force, preserveSymlinks);
    console.log(`Successfully copied from ${absSource} to ${absDest}`);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === errors.TOO_MANY_ARGS.code) {
      console.error(errors.TOO_MANY_ARGS.message);
      showHelp();
    } else {
      console.error('Error copying path:', error);
    }

    process.exit(1);
  }
})();
