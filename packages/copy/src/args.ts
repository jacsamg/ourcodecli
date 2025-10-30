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
Usage: our-copy <source> <destination> [options]

Options:
  -f, --force               Overwrite destination if it exists
  -p, --preserve-symlinks   Preserve symbolic links instead of dereferencing them
  -r, --rename <newName>    New name for the copied file or directory
  -n, --dry-run             Print planned actions without modifying the filesystem
  -h, --help                Show this help message
  -v, --version             Show version

Examples:
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
            'Missing value for --rename option.',
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
          // Unknown flag – show help via TOO_MANY_ARGS to reuse handler
          throw new CliError(ErrorCode.TOO_MANY_ARGS, `Unknown option: ${arg}`);
        }
        if (copyArgs.source === null) {
          copyArgs.source = arg;
        } else if (copyArgs.destination === null) {
          copyArgs.destination = arg;
        } else {
          throw new CliError(
            ErrorCode.TOO_MANY_ARGS,
            'Too many arguments provided.',
          );
        }
    }
  }

  return copyArgs;
}
