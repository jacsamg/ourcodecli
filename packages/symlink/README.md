# Our code CLI - Symlink
- A CLI tool to create symbolic links to files or directories
- Install with `npm i -D @ourcodecli/symlink`

## Usage

```bash
# Create symlink(s) in one or more target directories
our-symlink <sourcePath> <targetPath>,<targetPath>,...

# Rename the symlink in destinations
our-symlink <sourcePath> <targetPath>,<targetPath> --name <name>
our-symlink <sourcePath> <targetPath>,<targetPath> -n <name>

# Replace destination entry if it exists
our-symlink <sourcePath> <targetPath>,<targetPath> --force
our-symlink <sourcePath> <targetPath>,<targetPath> -f

# Load operations from config JSON
our-symlink --config <pathToConfig>
our-symlink -c <pathToConfig>

# Show help and version
our-symlink --help
our-symlink --version
```

## Config format (`--config`)

Config file must match `OurSymlinkConfig`:

```ts
export interface SymlinkConfig {
  name: string;
  force: boolean;
  source: string;
  target: string[];
}

export type OurSymlinkConfig = SymlinkConfig[];
```

Example:

```json
[
  {
    "name": "shared-lib",
    "force": true,
    "source": "./packages/shared/src",
    "target": ["./apps/web", "./apps/admin"]
  },
  {
    "name": "tokens",
    "force": false,
    "source": "./packages/theme/tokens.json",
    "target": ["./apps/web", "./apps/mobile"]
  }
]
```

## Notes

- Relative and absolute paths are supported. All paths are normalized from current working directory.
- `sourcePath` can be a file or directory.
- `targetPath` values are treated as destination directories. Missing directories are created.
- Execution continues across multiple targets and reports a final success/failure summary.
- When using `--config`, do not pass `--name` or `--force` in command line (those values come from each config entry).
- On Windows, directory links use `junction` for compatibility.
