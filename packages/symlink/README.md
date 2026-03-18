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
  force?: boolean;
  sourcePath: string;
  targetName?: string;
  targetDir: string[];
}

export interface OurSymlinkConfig {
  symlinks: SymlinkConfig[];
}
```

Example:

```json
{
  "symlinks": [
    {
      "force": true,
      "sourcePath": "./packages/shared/src",
      "targetName": "shared-lib",
      "targetDir": ["./apps/web", "./apps/admin"]
    },
    {
      "sourcePath": "./packages/theme/tokens.json",
      "targetDir": ["./apps/web", "./apps/mobile"]
    },
    {
      "force": false,
      "sourcePath": "./packages/utils/src",
      "targetName": "utils",
      "targetDir": ["./apps/web", "./apps/mobile"]
    }
  ]
}
```

JSON Schema available at:
- `config.schema.json` (portable JSON Schema file)
- `src/config-schema.ts` (`SYMLINK_CONFIG_SCHEMA`, used by config validation in `src/symlink.ts`)

## Notes

- Relative and absolute paths are supported. All paths are normalized from current working directory.
- `sourcePath` can be a file or directory.
- `targetPath` values are treated as destination directories. Missing directories are created.
- `force` is optional in config and defaults to `false`.
- `targetName` is optional in config and defaults to the source basename.
- Execution continues across multiple targets and reports a final success/failure summary.
- When using `--config`, do not pass `--name` or `--force` in command line (those values come from each config entry).
- On Windows, directory links use `junction` for compatibility.
