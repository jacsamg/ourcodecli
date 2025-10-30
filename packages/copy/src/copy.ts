import { cp, mkdir, rm, stat } from 'node:fs/promises';
import { dirname, sep } from 'node:path';
import { CliError, ErrorCode } from './errors.js';

function isSubPath(parent: string, child: string): boolean {
  if (parent === child) return true;
  const normParent = parent.endsWith(sep) ? parent : parent + sep;
  const normChild = child.endsWith(sep) ? child : child + sep;
  return normChild.startsWith(normParent);
}

export async function copyPath(params: {
  absSource: string;
  absDest: string;
  force: boolean;
  preserveSymlinks: boolean;
  dryRun?: boolean;
}): Promise<void> {
  const {
    absSource,
    absDest,
    force,
    preserveSymlinks,
    dryRun = false,
  } = params;

  if (absSource === absDest) {
    throw new CliError(
      ErrorCode.SAME_SOURCE_DEST,
      'Source and destination cannot be the same path.',
    );
  }

  if (isSubPath(absSource, absDest)) {
    throw new CliError(
      ErrorCode.DEST_INSIDE_SOURCE,
      'Destination cannot be inside the source path (would cause recursion).',
    );
  }

  try {
    await stat(absSource);
  } catch (_err) {
    throw new CliError(
      ErrorCode.SOURCE_NOT_FOUND,
      `Source not found: ${absSource}`,
    );
  }

  // Ensure destination parent exists (skipped on dry-run)
  if (dryRun) {
    console.log(`Would ensure parent directory exists: ${dirname(absDest)}`);
  } else {
    await mkdir(dirname(absDest), { recursive: true });
  }

  if (dryRun) {
    if (force) {
      console.log(`Would remove destination (if exists): ${absDest}`);
    }
    console.log(
      `Would copy from ${absSource} to ${absDest} (options: dereference=${!preserveSymlinks}, recursive=true, force=${force})`,
    );
    return;
  }

  if (force) {
    await rm(absDest, { recursive: true, force: true });
  }

  await cp(absSource, absDest, {
    recursive: true,
    dereference: !preserveSymlinks,
    force,
  });
}
