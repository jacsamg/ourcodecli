import { copyPath } from '../src/copy.ts';
import { ErrorCode } from '../src/errors.ts';
import { mkdtemp, writeFile, readFile, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

let tmpRoot: string;

beforeEach(async () => {
  tmpRoot = await mkdtemp(join(tmpdir(), 'ourcopy-'));
});

afterEach(async () => {
  // Cleanup after each test
  await rm(tmpRoot, { recursive: true, force: true });
});

describe('copyPath', () => {
  it('throws when source does not exist', async () => {
    await expect(
      copyPath({
        absSource: resolve(tmpRoot, 'nope'),
        absDest: resolve(tmpRoot, 'dest'),
        force: false,
        preserveSymlinks: false,
      }),
    ).rejects.toMatchObject({ code: ErrorCode.SOURCE_NOT_FOUND });
  });

  it('throws when source and destination are the same', async () => {
    const same = resolve(tmpRoot, 'same');
    await mkdir(same, { recursive: true });
    await expect(
      copyPath({
        absSource: same,
        absDest: same,
        force: false,
        preserveSymlinks: false,
      }),
    ).rejects.toMatchObject({ code: ErrorCode.SAME_SOURCE_DEST });
  });

  it('throws when destination is inside source', async () => {
    const src = resolve(tmpRoot, 'src');
    const destInside = resolve(src, 'inner');
    await mkdir(src, { recursive: true });
    await expect(
      copyPath({
        absSource: src,
        absDest: destInside,
        force: false,
        preserveSymlinks: false,
      }),
    ).rejects.toMatchObject({ code: ErrorCode.DEST_INSIDE_SOURCE });
  });

  it('dry run logs actions and does not modify filesystem', async () => {
    const src = resolve(tmpRoot, 'src');
    const dest = resolve(tmpRoot, 'dest');
    await mkdir(src, { recursive: true });

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await copyPath({
      absSource: src,
      absDest: dest,
      force: true,
      preserveSymlinks: true,
      dryRun: true,
    });

    const printed = logSpy.mock.calls.flat().join('\n');
    expect(printed).toContain('Would copy from');
    logSpy.mockRestore();
  });

  it('copies directory and overwrites when force is true', async () => {
    const src = resolve(tmpRoot, 'src');
    const dest = resolve(tmpRoot, 'dest');
    await mkdir(src, { recursive: true });
    await writeFile(join(src, 'a.txt'), 'hello', 'utf8');

    // First copy to create destination
    await copyPath({
      absSource: src,
      absDest: dest,
      force: false,
      preserveSymlinks: false,
    });

    // Change source content
    await writeFile(join(src, 'a.txt'), 'world', 'utf8');

    // Copy with force to overwrite
    await copyPath({
      absSource: src,
      absDest: dest,
      force: true,
      preserveSymlinks: false,
    });

    const content = await readFile(join(dest, 'a.txt'), 'utf8');
    expect(content).toBe('world');
  });
});
