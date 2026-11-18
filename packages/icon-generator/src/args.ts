import { CliError, ErrorCode } from './errors.js';

export interface IconArgs {
  source: string | null;
  destination: string | null;
  name: string | null;
  sizes: number[] | null;
  dryRun: boolean;
  help: boolean;
  version: boolean;
}

export function showHelp(): void {
  const usage = `
Uso: our-icon-gen <source> <destination> <name> [opciones]

Genera iconos de PWA a partir de una imagen de origen.

Opciones:
  -s, --sizes <list>   Lista de tamaños separados por comas (p. ej. 72,96,128)
  -n, --dry-run        Muestra los archivos previstos sin escribirlos
  -h, --help           Muestra esta ayuda
  -v, --version        Muestra la versión

Ejemplos:
  our-icon-gen ./logo.png ./public/icons app
  our-icon-gen ./logo.png ./icons app --sizes 72,96,128 -n
`;
  console.log(usage.trim());
}

export function parseArgs(argv: string[]): IconArgs {
  const args = argv;
  const parsed: IconArgs = {
    source: null,
    destination: null,
    name: null,
    sizes: null,
    dryRun: false,
    help: false,
    version: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--sizes':
      case '-s': {
        const next = args[i + 1];
        if (!next || next.startsWith('-')) {
          throw new CliError(
            ErrorCode.INVALID_SIZES,
            'Falta el valor de la opción --sizes.',
          );
        }
        const parts = next
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean);
        const numbers = parts.map((p) => Number.parseInt(p, 10));
        if (numbers.some((n) => Number.isNaN(n) || n <= 0)) {
          throw new CliError(
            ErrorCode.INVALID_SIZES,
            'Lista de tamaños inválida. Indica enteros positivos separados por comas.',
          );
        }
        parsed.sizes = numbers;
        i++;
        break;
      }
      case '--dry-run':
      case '-n':
        parsed.dryRun = true;
        break;
      case '--help':
      case '-h':
        parsed.help = true;
        break;
      case '--version':
      case '-v':
        parsed.version = true;
        break;
      default:
        if (arg.startsWith('-')) {
          throw new CliError(
            ErrorCode.TOO_MANY_ARGS,
            `Opción desconocida: ${arg}`,
          );
        }
        if (parsed.source === null) {
          parsed.source = arg;
        } else if (parsed.destination === null) {
          parsed.destination = arg;
        } else if (parsed.name === null) {
          parsed.name = arg;
        } else {
          throw new CliError(
            ErrorCode.TOO_MANY_ARGS,
            'Se recibieron demasiados argumentos.',
          );
        }
    }
  }

  return parsed;
}
