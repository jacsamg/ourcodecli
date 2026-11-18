import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.ts';
import { ErrorCode } from '../src/errors.ts';

let tmpRoot: string;

beforeEach(async () => {
  tmpRoot = await mkdtemp(join(tmpdir(), 'ourcopy-config-'));
});

afterEach(async () => {
  await rm(tmpRoot, { recursive: true, force: true });
});

async function writeConfig(name: string, value: unknown): Promise<string> {
  const configPath = resolve(tmpRoot, name);
  const raw = typeof value === 'string' ? value : JSON.stringify(value);
  await writeFile(configPath, raw, 'utf8');
  return configPath;
}

async function expectInvalid(value: unknown): Promise<void> {
  const configPath = await writeConfig('bad.json', value);
  await expect(loadConfig(configPath)).rejects.toMatchObject({
    code: ErrorCode.INVALID_CONFIG,
  });
}

describe('loadConfig', () => {
  it('loads valid config', async () => {
    const configPath = await writeConfig('our-copy.json', {
      $schema: './config.schema.json',
      copies: [
        {
          force: true,
          preserveSymlinks: true,
          rename: ' shared ',
          sourcePath: ' ./src ',
          targetPath: ['./apps/a', ' ', './apps/b '],
        },
      ],
    });

    const config = await loadConfig(configPath);
    expect(config.copies).toEqual([
      {
        force: true,
        preserveSymlinks: true,
        rename: 'shared',
        sourcePath: './src',
        targetPath: ['./apps/a', './apps/b'],
      },
    ]);
  });

  it('uses defaults when optional properties are omitted', async () => {
    const configPath = await writeConfig('defaults.json', {
      copies: [{ sourcePath: './src', targetPath: ['./dist'] }],
    });

    const config = await loadConfig(configPath);
    expect(config.copies[0]?.force).toBe(false);
    expect(config.copies[0]?.preserveSymlinks).toBe(false);
    expect(config.copies[0]?.rename).toBeUndefined();
  });

  it('fails when the file does not exist', async () => {
    await expect(
      loadConfig(resolve(tmpRoot, 'missing.json')),
    ).rejects.toMatchObject({ code: ErrorCode.INVALID_CONFIG });
  });

  it('fails on invalid JSON', async () => {
    await expectInvalid('{ not json');
  });

  it('fails on invalid root shape', async () => {
    await expectInvalid({ source: 'a' });
    await expectInvalid([]);
    await expectInvalid({ copies: {} });
  });

  it('fails on unknown entry property', async () => {
    await expectInvalid({
      copies: [{ sourcePath: './a', targetPath: ['./b'], dryRun: true }],
    });
  });

  it('fails when required properties are missing', async () => {
    await expectInvalid({ copies: [{ targetPath: ['./b'] }] });
    await expectInvalid({ copies: [{ sourcePath: './a' }] });
  });

  it('fails on invalid property types', async () => {
    await expectInvalid({
      copies: [{ sourcePath: './a', targetPath: ['./b'], force: 'yes' }],
    });
    await expectInvalid({
      copies: [{ sourcePath: './a', targetPath: ['./b'], preserveSymlinks: 1 }],
    });
    await expectInvalid({
      copies: [{ sourcePath: './a', targetPath: ['./b'], rename: ' ' }],
    });
    await expectInvalid({ copies: [{ sourcePath: '', targetPath: ['./b'] }] });
    await expectInvalid({ copies: [{ sourcePath: './a', targetPath: './b' }] });
  });

  it('fails when targetPath has non-string or only empty values', async () => {
    await expectInvalid({
      copies: [{ sourcePath: './a', targetPath: ['./b', 2] }],
    });
    await expectInvalid({ copies: [{ sourcePath: './a', targetPath: [' '] }] });
    await expectInvalid({ copies: [{ sourcePath: './a', targetPath: [] }] });
  });
});
