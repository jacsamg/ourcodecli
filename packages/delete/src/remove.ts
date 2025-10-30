import { rm } from 'node:fs/promises';
import { CliError, ErrorCode } from './errors.js';

export async function removePath(params: {
  absPath: string;
  force: boolean;
  strict: boolean;
}): Promise<void> {
  const { absPath, force, strict } = params;
  try {
    await rm(absPath, { recursive: true, force });
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      // Nonexistent path is not an error
      return;
    }
    if (strict) {
      throw new CliError(
        ErrorCode.DELETE_FAILED,
        `Failed to delete: ${absPath} (${err.code ?? 'UNKNOWN'})`,
      );
    }
    // In non-strict mode, swallow errors to continue deleting other paths
  }
}
