# Our code CLI - Delete
- A CLI tool to delete files and directories
- Install with `npm i -D @ourcodecli/delete`

## Usage

```bash
# Delete one or more paths
our-delete <path1> [path2] ...

# Force deletion without confirmation
our-delete <path> --force

# Exit on first error (stop processing further paths)
our-delete <path> --strict

# Show help or version
our-delete --help
our-delete --version
```

Options:

- -f, --force     Force deletion without confirmation
- -s, --strict    Exit on first error (stop processing further paths)
- -h, --help      Show help message
- -v, --version   Print version
