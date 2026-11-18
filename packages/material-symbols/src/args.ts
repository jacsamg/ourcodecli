import { CliError, ErrorCode } from './errors.js';

export const DEFAULT_CONFIG_PATH = './material-symbols.config.json';

export interface MaterialSymbolsArgs {
  config: string;
  help: boolean;
  version: boolean;
}

export function showHelp(): void {
  const usage = `
Uso:
  our-material-symbols [opciones]

Genera subconjuntos self-hosted de Google Material Symbols (WOFF2 + CSS)
a partir de un archivo de configuración JSON.

Opciones:
  -c, --config <ruta>    Archivo de configuración (por defecto: ${DEFAULT_CONFIG_PATH})
  -h, --help             Muestra esta ayuda
  -v, --version          Muestra la versión

Las rutas relativas del archivo de configuración se resuelven desde el
directorio que contiene dicho archivo.

Ejemplos:
  our-material-symbols
  our-material-symbols --config ./tools/material-symbols.config.json
`;
  console.log(usage.trim());
}

export function parseArgs(argv: string[]): MaterialSymbolsArgs {
  const out: MaterialSymbolsArgs = {
    config: DEFAULT_CONFIG_PATH,
    help: false,
    version: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    switch (arg) {
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
            ErrorCode.UNKNOWN_OPTION,
            `Opción desconocida: ${arg}`,
          );
        }
        throw new CliError(
          ErrorCode.TOO_MANY_ARGS,
          `Argumento inesperado: ${arg}. Usa --config <ruta> para indicar el archivo de configuración.`,
        );
    }
  }

  return out;
}
