import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DEFAULTS, loadConfig, resolveConfig } from '../src/config.ts';
import { CliError, ErrorCode } from '../src/errors.ts';

const BASE = resolve('/project/tools');

function expectInvalid(raw: unknown, messagePart: string): void {
  try {
    resolveConfig(raw, BASE);
  } catch (error) {
    expect(error).toBeInstanceOf(CliError);
    expect((error as CliError).code).toBe(ErrorCode.INVALID_CONFIG);
    expect((error as CliError).message).toContain(messagePart);
    return;
  }
  throw new Error('Expected resolveConfig to throw');
}

describe('resolveConfig', () => {
  it('applies defaults and resolves paths from the config directory', () => {
    const config = resolveConfig({ icons: [' search ', 'add', 'home'] }, BASE);
    expect(config.icons).toEqual(['add', 'home', 'search']);
    expect(config.families).toEqual(['Rounded']);
    expect(config.axes).toEqual(DEFAULTS.axes);
    expect(config.fontOutputDirectory).toBe(resolve(BASE, 'public/fonts'));
    expect(config.cssOutputPath).toBe(resolve(BASE, 'src/styles/material-symbols.css'));
    expect(config.performanceBudgetBytes).toBe(250 * 1024);
    expect(config.dryRun).toBe(false);
  });

  it('keeps absolute paths and merges partial axes', () => {
    const config = resolveConfig(
      {
        icons: ['add'],
        cssOutputPath: '/abs/out.css',
        axes: { wght: { enabled: true, mode: 'range', min: 100, max: 700 } },
        performanceBudgetBytes: null,
      },
      BASE,
    );
    expect(config.cssOutputPath).toBe(resolve('/abs/out.css'));
    expect(config.axes.wght).toEqual({ enabled: true, mode: 'range', min: 100, max: 700 });
    expect(config.axes.opsz).toEqual(DEFAULTS.axes.opsz);
    expect(config.performanceBudgetBytes).toBeNull();
  });

  it('accepts the $schema property', () => {
    expect(() =>
      resolveConfig({ $schema: './config.schema.json', icons: ['add'] }, BASE),
    ).not.toThrow();
  });

  it('rejects non-object roots and missing icons', () => {
    expectInvalid([], 'la raíz debe ser un objeto');
    expectInvalid({}, '"icons"');
  });

  it('rejects unknown properties', () => {
    expectInvalid({ icons: ['add'], iconz: [] }, 'propiedad desconocida "iconz"');
    expectInvalid({ icons: ['add'], css: { foo: true } }, 'propiedad desconocida "foo"');
  });

  it('rejects invalid and duplicated icons', () => {
    expectInvalid({ icons: [] }, 'al menos un icono');
    expectInvalid({ icons: ['Add'] }, 'nombres de icono inválidos');
    expectInvalid({ icons: ['add', ' add'] }, 'duplicados: add');
  });

  it('rejects invalid families', () => {
    expectInvalid({ icons: ['add'], families: ['Filled'] }, 'familia inválida');
    expectInvalid({ icons: ['add'], families: ['Sharp', 'Sharp'] }, 'duplicados');
  });

  it('rejects axes out of range', () => {
    expectInvalid(
      { icons: ['add'], axes: { wght: { enabled: true, mode: 'fixed', value: 900 } } },
      'axes.wght.value=900',
    );
    expectInvalid(
      { icons: ['add'], axes: { FILL: { enabled: true, mode: 'range', min: 1, max: 0 } } },
      'menor que',
    );
    expectInvalid(
      { icons: ['add'], axes: { GRAD: { enabled: true, mode: 'other' } } },
      '"fixed" o "range"',
    );
  });

  it('rejects CSS default axis values that the font will not contain', () => {
    expectInvalid(
      { icons: ['add'], css: { defaultAxisValues: { wght: 700 } } },
      'wght=700',
    );
  });

  it('rejects invalid scalar options', () => {
    expectInvalid({ icons: ['add'], display: 'fast' }, '"display" inválido');
    expectInvalid({ icons: ['add'], publicFontBaseUrl: 'fonts' }, 'iniciar con "/"');
    expectInvalid({ icons: ['add'], cssClassPrefix: '1x' }, 'cssClassPrefix');
    expectInvalid({ icons: ['add'], requestTimeoutMs: -1 }, 'entero positivo');
    expectInvalid({ icons: ['add'], dryRun: 'yes' }, '"dryRun" debe ser boolean');
  });
});

describe('loadConfig', () => {
  let dir = '';

  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'our-material-symbols-'));
  });

  afterAll(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('reads JSON and resolves paths relative to the file', async () => {
    const path = join(dir, 'material-symbols.config.json');
    await writeFile(path, JSON.stringify({ icons: ['home'], cssOutputPath: 'out/icons.css' }));
    const config = await loadConfig(path);
    expect(config.cssOutputPath).toBe(join(dir, 'out/icons.css'));
  });

  it('fails on missing files and invalid JSON', async () => {
    await expect(loadConfig(join(dir, 'missing.json'))).rejects.toThrow('No se puede leer');
    const bad = join(dir, 'bad.json');
    await writeFile(bad, '{ nope');
    await expect(loadConfig(bad)).rejects.toThrow('JSON inválido');
  });
});
