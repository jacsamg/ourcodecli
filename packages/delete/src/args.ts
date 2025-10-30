import { CliError, ErrorCode } from './errors.js';

export interface DeleteArgs {
  force: boolean;
  strict: boolean;
  help: boolean;
  version: boolean;
  paths: string[];
}

export function showHelp(): void {
  const usage = `
Usage: our-delete <path1> [path2] ... [options]

Options:
  -f, --force     Force deletion without confirmation
  -s, --strict    Exit on first error (stop processing further paths)
  -h, --help      Show this help message
  -v, --version   Show version

Examples:
  our-delete ./dist
  our-delete ./dist ./tmp -f
  our-delete ./foo -s
`;
  console.log(usage.trim());
}

export function parseArgs(argv: string[]): DeleteArgs {
  const args = argv;
  const out: DeleteArgs = {
    force: false,
    strict: false,
    help: false,
    version: false,
    paths: [],
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--force':
      case '-f':
        out.force = true;
        break;
      case '--strict':
      case '-s':
        out.strict = true;
        break;
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
          throw new CliError(ErrorCode.TOO_MANY_ARGS, `Unknown option: ${arg}`);
        }
        out.paths.push(arg);
    }
  }

  return out;
}
