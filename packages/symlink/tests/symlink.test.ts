import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createSymlinkInTarget, loadConfig } from '../src/symlink.ts';
import { ErrorCode } from '../src/errors.ts';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

let tmpRoot: string;

beforeEach(async () => {
  tmpRoot = await mkdtemp(join(tmpdir(), 'oursymlink-'));
});

afterEach(async () => {
  await rm(tmpRoot, { recursive: true, force: true });
});

describe('createSymlinkInTarget', () => {
  it('creates a symlink to a file and creates missing target dir', async () => {
    const sourceFile = resolve(tmpRoot, 'src.txt');
    await writeFile(sourceFile, 'hello', 'utf8');

    const targetDir = resolve(tmpRoot, 'apps', 'web');
    const linkPath = await createSymlinkInTarget({
      absSource: sourceFile,
      absTargetDir: targetDir,
      linkName: 'shared.txt',
      force: false,
    });

    expect(linkPath).toBe(resolve(targetDir, 'shared.txt'));
    const content = await readFile(linkPath, 'utf8');
    expect(content).toBe('hello');
  });

  it('replaces destination when force is true', async () => {
    const sourceFile = resolve(tmpRoot, 'source.txt');
    await writeFile(sourceFile, 'new-content', 'utf8');

    const targetDir = resolve(tmpRoot, 'target');
    await createSymlinkInTarget({
      absSource: sourceFile,
      absTargetDir: targetDir,
      linkName: 'shared.txt',
      force: false,
    });

    const replacementSource = resolve(tmpRoot, 'replacement.txt');
    await writeFile(replacementSource, 'replacement', 'utf8');

    const replaced = await createSymlinkInTarget({
      absSource: replacementSource,
      absTargetDir: targetDir,
      linkName: 'shared.txt',
      force: true,
    });

    const content = await readFile(replaced, 'utf8');
    expect(content).toBe('replacement');
  });

  it('fails when destination exists and force is false', async () => {
    const sourceFile = resolve(tmpRoot, 'source.txt');
    await writeFile(sourceFile, 'first', 'utf8');
    const targetDir = resolve(tmpRoot, 'target');

    await createSymlinkInTarget({
      absSource: sourceFile,
      absTargetDir: targetDir,
      linkName: 'shared.txt',
      force: false,
    });

    await expect(
      createSymlinkInTarget({
        absSource: sourceFile,
        absTargetDir: targetDir,
        linkName: 'shared.txt',
        force: false,
      }),
    ).rejects.toMatchObject({ code: ErrorCode.DEST_EXISTS });
  });

  it('fails when source does not exist', async () => {
    await expect(
      createSymlinkInTarget({
        absSource: resolve(tmpRoot, 'missing.txt'),
        absTargetDir: resolve(tmpRoot, 'target'),
        linkName: 'x.txt',
        force: false,
      }),
    ).rejects.toMatchObject({ code: ErrorCode.SOURCE_NOT_FOUND });
  });
});

describe('loadConfig', () => {
  it('loads valid config', async () => {
    const configPath = resolve(tmpRoot, 'our-symlink.json');
    await writeFile(
      configPath,
      JSON.stringify(
        [
          {
            force: true,
            sourcePath: './src/a.txt',
            targetName: 'shared',
            targetDir: ['./apps/a', './apps/b'],
          },
        ],
        null,
        2,
      ),
      'utf8',
    );

    const config = await loadConfig(configPath);
    expect(config).toHaveLength(1);
    expect(config[0]?.targetName).toBe('shared');
    expect(config[0]?.force).toBe(true);
    expect(config[0]?.targetDir).toEqual(['./apps/a', './apps/b']);
  });

  it('uses defaults when force and targetName are omitted', async () => {
    const configPath = resolve(tmpRoot, 'defaults.json');
    await writeFile(
      configPath,
      JSON.stringify([{ sourcePath: './src/a.txt', targetDir: ['./apps/a'] }], null, 2),
      'utf8',
    );

    const config = await loadConfig(configPath);
    expect(config[0]?.force).toBe(false);
    expect(config[0]?.targetName).toBeUndefined();
  });

  it('fails on invalid config shape', async () => {
    const configPath = resolve(tmpRoot, 'bad.json');
    await writeFile(configPath, JSON.stringify({ source: 'a' }), 'utf8');

    await expect(loadConfig(configPath)).rejects.toMatchObject({
      code: ErrorCode.INVALID_CONFIG,
    });
  });

  it('fails when target list contains non-string values', async () => {
    const configPath = resolve(tmpRoot, 'bad-targets.json');
    await writeFile(
      configPath,
      JSON.stringify([
        { force: false, sourcePath: './src/a.txt', targetName: 'shared', targetDir: ['./apps/a', 2] },
      ]),
      'utf8',
    );

    await expect(loadConfig(configPath)).rejects.toMatchObject({
      code: ErrorCode.INVALID_CONFIG,
    });
  });

  it('fails when required sourcePath/targetDir are missing in config entry', async () => {
    const configPath = resolve(tmpRoot, 'bad-flags.json');
    await writeFile(
      configPath,
      JSON.stringify([{ force: true, targetName: 'x' }]),
      'utf8',
    );

    await expect(loadConfig(configPath)).rejects.toMatchObject({
      code: ErrorCode.INVALID_CONFIG,
    });
  });
});
