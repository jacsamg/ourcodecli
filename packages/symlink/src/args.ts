import { CliError, ErrorCode } from './errors.js';

export interface SymlinkArgs {
  source: string | null;
  targets: string[];
  targetName: string | null;
  force: boolean;
  config: string | null;
  help: boolean;
  version: boolean;
}

export function showHelp(): void {
  const usage = `
Uso:
  our-symlink <sourcePath> <targetPath>,<targetPath>,... [opciones]
  our-symlink --config <path>

Opciones:
  -n, --name <name>      Renombra el enlace en el directorio de destino
  -f, --force            Reemplaza la entrada de destino si existe
  -c, --config <path>    Archivo JSON que cumple con OurSymlinkConfig
  -h, --help             Muestra esta ayuda
  -v, --version          Muestra la versión

Ejemplos:
  our-symlink ./src.txt ./apps/a,./apps/b
  our-symlink ./src-dir ./apps/a,./apps/b --name shared --force
  our-symlink --config ./our-symlink.json
`;
  console.log(usage.trim());
}

export function parseTargetList(raw: string): string[] {
  return raw
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export function parseArgs(argv: string[]): SymlinkArgs {
  const out: SymlinkArgs = {
    source: null,
    targets: [],
    targetName: null,
    force: false,
    config: null,
    help: false,
    version: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    switch (arg) {
      case '--name':
      case '-n': {
        const next = argv[i + 1];
        if (!next || next.startsWith('-')) {
          throw new CliError(
            ErrorCode.MISSING_NAME_VALUE,
            'Falta el valor de la opción --name.',
          );
        }
        out.targetName = next;
        i++;
        break;
      }
      case '--force':
      case '-f':
        out.force = true;
        break;
      case '--config':
      case '-c': {
        const next = argv[i + 1];
        if (!next || next.startsWith('-')) {
          throw new CliError(
            ErrorCode.MISSING_CONFIG_VALUE,
            'Falta el valor de la opción --config.',
          );
        }
        out.config = next;
        i++;
        break;
      }
      case '--help':
      case '-h':
        out.help = true;
        break;
      case '--version':
      case '-v':
        out.version = true;
        break;
      default:
        if (arg.startsWith('-')) {
          throw new CliError(
            ErrorCode.TOO_MANY_ARGS,
            `Opción desconocida: ${arg}`,
          );
        }
        if (out.source === null) {
          out.source = arg;
        } else if (out.targets.length === 0) {
          out.targets = parseTargetList(arg);
        } else {
          throw new CliError(
            ErrorCode.TOO_MANY_ARGS,
            'Se recibieron demasiados argumentos posicionales.',
          );
        }
    }
  }

  if (out.config !== null && (out.targetName !== null || out.force)) {
    throw new CliError(
      ErrorCode.CONFIG_WITH_INLINE_OPTIONS,
      'Al usar --config, no pases --name ni --force en la línea de comandos.',
    );
  }

  return out;
}
