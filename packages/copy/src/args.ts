import { CliError, ErrorCode } from './errors.js';

export interface CopyArgs {
  force: boolean;
  source: string | null;
  destination: string | null;
  preserveSymlinks: boolean;
  rename: string | null;
  config: string | null;
  help: boolean;
  version: boolean;
  dryRun: boolean;
}

export function showHelp(): void {
  const usage = `
Uso: our-copy <source> <destination> [opciones]
     our-copy --config <path> [--dry-run]

Opciones:
  -f, --force               Sobrescribe el destino si existe
  -p, --preserve-symlinks   Conserva los enlaces simbólicos en lugar de resolverlos
  -r, --rename <newName>    Nuevo nombre del archivo o directorio copiado
  -c, --config <path>       Archivo JSON que cumple con OurCopyConfig
  -n, --dry-run             Muestra las acciones previstas sin modificar el sistema de archivos
  -h, --help                Muestra esta ayuda
  -v, --version             Muestra la versión

Ejemplos:
  our-copy src dist
  our-copy ./templates ./out -f
  our-copy ./dir ./dest --rename new-name
  our-copy ./link ./dest --preserve-symlinks
  our-copy --config ./our-copy.json
`;
  console.log(usage.trim());
}

function readOptionValue(
  args: string[],
  index: number,
  code: ErrorCode,
  option: string,
): string {
  const next = args[index + 1];
  if (!next || next.startsWith('-')) {
    throw new CliError(code, `Falta el valor de la opción ${option}.`);
  }

  return next;
}

export function parseArgs(argv: string[]): CopyArgs {
  const args = argv;
  const copyArgs: CopyArgs = {
    force: false,
    source: null,
    destination: null,
    preserveSymlinks: false,
    rename: null,
    config: null,
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
      case '-r':
        copyArgs.rename = readOptionValue(
          args,
          i,
          ErrorCode.MISSING_RENAME_VALUE,
          '--rename',
        );
        i++;
        break;
      case '--config':
      case '-c':
        if (copyArgs.config !== null) {
          throw new CliError(
            ErrorCode.CONFIG_WITH_INLINE_OPTIONS,
            'La opción --config solo puede indicarse una vez.',
          );
        }
        copyArgs.config = readOptionValue(
          args,
          i,
          ErrorCode.MISSING_CONFIG_VALUE,
          '--config',
        );
        i++;
        break;
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

  if (
    copyArgs.config !== null &&
    (copyArgs.force || copyArgs.preserveSymlinks || copyArgs.rename !== null)
  ) {
    throw new CliError(
      ErrorCode.CONFIG_WITH_INLINE_OPTIONS,
      'Al usar --config, no pases --force, --preserve-symlinks ni --rename en la línea de comandos (se definen en cada entrada de la configuración).',
    );
  }

  return copyArgs;
}
