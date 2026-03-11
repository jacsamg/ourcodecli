#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { type SymlinkArgs, parseArgs, showHelp } from './args.js';
import { CliError, ErrorCode } from './errors.js';
import { createSymlinkInTarget, loadConfig } from './symlink.js';

interface ResolvedEntry {
  name: string | null;
  force: boolean;
  source: string;
  target: string[];
}

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
    const args: SymlinkArgs = parseArgs(argv);

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
      const absSource = resolve(entry.source);
      const linkName = entry.name ?? basename(absSource);
      for (const target of entry.target) {
        total++;
        const absTargetDir = resolve(target);
        try {
          const absDest = await createSymlinkInTarget({
            absSource,
            absTargetDir,
            linkName,
            force: entry.force,
          });
          console.log(`Linked ${absDest} -> ${absSource}`);
          success++;
        } catch (error) {
          failed++;
          if (error instanceof CliError) {
            console.error(
              `Failed for target "${target}" using source "${entry.source}": ${error.message}`,
            );
          } else {
            console.error(
              `Failed for target "${target}" using source "${entry.source}":`,
              error,
            );
          }
        }
      }
    }

    if (failed > 0) {
      console.error(
        `Finished with errors. Success: ${success}, Failed: ${failed}, Total: ${total}.`,
      );
      return 1;
    }

    console.log(`Finished successfully. Created ${success} symlink(s).`);
    return 0;
  } catch (error) {
    if (error instanceof CliError) {
      const err = error as CliError;
      console.error(err.message);
      if (
        err.code === ErrorCode.TOO_MANY_ARGS ||
        err.code === ErrorCode.MISSING_ARGS ||
        err.code === ErrorCode.MISSING_NAME_VALUE ||
        err.code === ErrorCode.MISSING_CONFIG_VALUE ||
        err.code === ErrorCode.CONFIG_WITH_POSITIONALS ||
        err.code === ErrorCode.CONFIG_WITH_INLINE_OPTIONS ||
        err.code === ErrorCode.INVALID_CONFIG
      ) {
        showHelp();
      }
      return err.exitCode ?? 1;
    }

    console.error('Error creating symlink(s):', error);
    return 1;
  }
}

async function resolveEntries(args: SymlinkArgs): Promise<ResolvedEntry[]> {
  if (args.config) {
    if (args.source !== null || args.targets.length > 0) {
      throw new CliError(
        ErrorCode.CONFIG_WITH_POSITIONALS,
        'Do not pass positional arguments when using --config.',
      );
    }
    const entries = await loadConfig(resolve(args.config));
    return entries.map((entry) => ({
      name: entry.name,
      force: entry.force,
      source: entry.source,
      target: entry.target,
    }));
  }

  if (args.source === null || args.targets.length === 0) {
    throw new CliError(
      ErrorCode.MISSING_ARGS,
      'Missing required arguments: <sourcePath> <targetPath>,<targetPath>,...',
    );
  }

  return [
    {
      name: args.name,
      force: args.force,
      source: args.source,
      target: args.targets,
    },
  ];
}

main(process.argv.slice(2))
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
