import { existsSync } from 'node:fs';
import { mkdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { CliError, ErrorCode } from './errors.js';

export const DEFAULT_ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

export async function generateIcons(params: {
  absSource: string;
  absDest: string;
  baseName: string;
  sizes?: number[] | null;
  dryRun?: boolean;
}): Promise<void> {
  const {
    absSource,
    absDest,
    baseName,
    sizes = DEFAULT_ICON_SIZES,
    dryRun = false,
  } = params;

  // Validate source exists
  try {
    await stat(absSource);
  } catch {
    throw new CliError(
      ErrorCode.SOURCE_NOT_FOUND,
      `Source image not found: ${absSource}`,
    );
  }

  // Ensure destination directory
  if (!existsSync(absDest)) {
    if (dryRun) {
      console.log(`Would create directory: ${absDest}`);
    } else {
      await mkdir(absDest, { recursive: true });
    }
  }

  const uniqueSizes = Array.from(new Set(sizes)).sort((a, b) => a - b);

  for (const size of uniqueSizes) {
    const filename = `${baseName}-${size}x${size}.png`;
    const outputPath = join(absDest, filename);
    if (dryRun) {
      console.log(`Would generate: ${outputPath}`);
      continue;
    }
    await sharp(absSource)
      .resize(size, size, { fit: 'cover', position: 'center' })
      .png()
      .toFile(outputPath);
  }
}
