# @ourcodecli/icon-generator

Generate PWA icon PNGs at common sizes from a single source image.

## Usage

```
our-icon-gen <source> <destination> <name> [options]
```

- source: Path to source image (e.g. a large square PNG or SVG)
- destination: Output directory where icons will be written
- name: Base name for generated files (e.g. `app` -> `app-192x192.png`)

### Options

- `-s, --sizes <list>` Comma-separated list of sizes to generate (default: 72,96,128,144,152,192,384,512)
- `-n, --dry-run` Show what would be generated without writing files
- `-h, --help` Show help
- `-v, --version` Show version

### Examples

```
our-icon-gen ./logo.png ./public/icons app
our-icon-gen ./logo.png ./icons app --sizes 72,96,128 -n
```

## Notes

- The tool uses `sharp` for image processing.
- Source images should be large enough to downscale cleanly to the target sizes.

