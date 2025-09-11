# Our code CLI - Copy
- A CLI tool to copy files and directories
- Install with `npm i -D @ourcodecli/copy`

## Usage

```bash
# Copy a file or directory
our-copy <source> <destination>

# Overwrite destination if it exists
our-copy <source> <destination> --force

# Preserve symbolic links instead of dereferencing them
our-copy <source> <destination> --preserve-symlinks

# Show help
our-copy --help
```
