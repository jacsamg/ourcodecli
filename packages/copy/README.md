# Our code CLI - Copy
- A CLI tool to copy files and directories
- Install with `npm i -D @ourcodecli/copy`

## Usage

```bash
# Copy a file or directory
our-copy <source> <destination>

# Overwrite destination if it exists
our-copy <source> <destination> --force
our-copy <source> <destination> -f

# Preserve symbolic links instead of dereferencing them
our-copy <source> <destination> --preserve-symlinks
our-copy <source> <destination> -p

# Rename the copied entry at destination
our-copy <source> <destination> --rename <newName>
our-copy <source> <destination> -r <newName>

# Simular sin escribir cambios
our-copy <source> <destination> --dry-run
our-copy <source> <destination> -n

# Show help and version
our-copy --help
our-copy --version
```
