import { CliError, ErrorCode } from './errors.js';

export interface SymlinkArgs {
  source: string | null;
  targets: string[];
  name: string | null;
  force: boolean;
  config: string | null;
  help: boolean;
  version: boolean;
}

export function showHelp(): void {
  const usage = `
Usage:
  our-symlink <sourcePath> <targetPath>,<targetPath>,... [options]
  our-symlink --config <path>

Options:
  -n, --name <name>      Rename symlink in destination directory
  -f, --force            Replace destination entry if it exists
  -c, --config <path>    JSON file matching OurSymlinkConfig
  -h, --help             Show this help message
  -v, --version          Show version

Examples:
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
    name: null,
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
            'Missing value for --name option.',
          );
        }
        out.name = next;
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
            'Missing value for --config option.',
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
          throw new CliError(ErrorCode.TOO_MANY_ARGS, `Unknown option: ${arg}`);
        }
        if (out.source === null) {
          out.source = arg;
        } else if (out.targets.length === 0) {
          out.targets = parseTargetList(arg);
        } else {
          throw new CliError(
            ErrorCode.TOO_MANY_ARGS,
            'Too many positional arguments provided.',
          );
        }
    }
  }

  if (out.config !== null && (out.name !== null || out.force)) {
    throw new CliError(
      ErrorCode.CONFIG_WITH_INLINE_OPTIONS,
      'When using --config, do not pass --name or --force in command line.',
    );
  }

  return out;
}
