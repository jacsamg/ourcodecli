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
      'El origen y el destino no pueden ser la misma ruta.',
    );
  }

  if (isSubPath(absSource, absDest)) {
    throw new CliError(
      ErrorCode.DEST_INSIDE_SOURCE,
      'El destino no puede estar dentro del origen (provocaría recursión).',
    );
  }

  try {
    await stat(absSource);
  } catch (_err) {
    throw new CliError(
      ErrorCode.SOURCE_NOT_FOUND,
      `No se encontró el origen: ${absSource}`,
    );
  }

  // Asegura que exista el directorio padre del destino (se omite en dry-run)
  if (dryRun) {
    console.log(
      `Se aseguraría que exista el directorio padre: ${dirname(absDest)}`,
    );
  } else {
    await mkdir(dirname(absDest), { recursive: true });
  }

  if (dryRun) {
    if (force) {
      console.log(`Se eliminaría el destino (si existe): ${absDest}`);
    }
    console.log(
      `Se copiaría de ${absSource} a ${absDest} (opciones: dereference=${!preserveSymlinks}, recursive=true, force=${force})`,
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
