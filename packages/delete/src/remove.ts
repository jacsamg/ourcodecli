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
      // Una ruta inexistente no es un error
      return;
    }
    if (strict) {
      throw new CliError(
        ErrorCode.DELETE_FAILED,
        `No se pudo eliminar: ${absPath} (${err.code ?? 'UNKNOWN'})`,
      );
    }
    // En modo no estricto, se ignoran los errores para seguir eliminando las demás rutas
  }
}
