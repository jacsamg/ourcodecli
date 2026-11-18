import { CliError, ErrorCode } from './errors.js';

export interface CopyArgs {
  force: boolean;
  source: string | null;
  destination: string | null;
  preserveSymlinks: boolean;
  rename: string | null;
  help: boolean;
  version: boolean;
  dryRun: boolean;
}

export function showHelp(): void {
  const usage = `
Uso: our-copy <source> <destination> [opciones]

Opciones:
  -f, --force               Sobrescribe el destino si existe
  -p, --preserve-symlinks   Conserva los enlaces simbólicos en lugar de resolverlos
  -r, --rename <newName>    Nuevo nombre del archivo o directorio copiado
  -n, --dry-run             Muestra las acciones previstas sin modificar el sistema de archivos
  -h, --help                Muestra esta ayuda
  -v, --version             Muestra la versión

Ejemplos:
  our-copy src dist
  our-copy ./templates ./out -f
  our-copy ./dir ./dest --rename new-name
  our-copy ./link ./dest --preserve-symlinks
`;
  console.log(usage.trim());
}

export function parseArgs(argv: string[]): CopyArgs {
  const args = argv;
  const copyArgs: CopyArgs = {
    force: false,
    source: null,
    destination: null,
    preserveSymlinks: false,
    rename: null,
    help: false,
    version: false,
    dryRun: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--force':
      case '-f':
        copyArgs.force = true;
        break;
      case '--preserve-symlinks':
      case '-p':
        copyArgs.preserveSymlinks = true;
        break;
      case '--rename':
      case '-r': {
        const next = args[i + 1];
        if (!next || next.startsWith('-')) {
          throw new CliError(
            ErrorCode.MISSING_RENAME_VALUE,
            'Falta el valor de la opción --rename.',
          );
        }
        copyArgs.rename = next;
        i++;
        break;
      }
      case '--help':
      case '-h':
        copyArgs.help = true;
        break;
      case '--dry-run':
      case '-n':
        copyArgs.dryRun = true;
        break;
      case '--version':
      case '-v':
        copyArgs.version = true;
        break;
      default:
        if (arg.startsWith('-')) {
          // Flag desconocido: muestra la ayuda vía TOO_MANY_ARGS para reutilizar el manejador
          throw new CliError(
            ErrorCode.TOO_MANY_ARGS,
            `Opción desconocida: ${arg}`,
          );
        }
        if (copyArgs.source === null) {
          copyArgs.source = arg;
        } else if (copyArgs.destination === null) {
          copyArgs.destination = arg;
        } else {
          throw new CliError(
            ErrorCode.TOO_MANY_ARGS,
            'Se recibieron demasiados argumentos.',
          );
        }
    }
  }

  return copyArgs;
}
