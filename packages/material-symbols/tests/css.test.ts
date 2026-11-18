import { describe, expect, it } from 'vitest';
import { resolveConfig } from '../src/config.ts';
import {
  buildBaseClass,
  buildGeneratedCss,
  buildPreloadHtml,
  buildUtilityClasses,
  rewriteGoogleCss,
} from '../src/css.ts';
import { generatedFileName } from '../src/files.ts';
import { buildCssApiUrl, detectFontFormat, extractRemoteFontUrls } from '../src/google-fonts.ts';
import type { DownloadedFont } from '../src/types.ts';

const config = resolveConfig({ icons: ['search', 'add'] }, '/project');

const REMOTE_CSS = `/* fallback */
@font-face {
  font-family: 'Material Symbols Rounded';
  font-style: normal;
  font-weight: 400;
  font-display: block;
  src: url(https://fonts.gstatic.com/s/abc.woff2) format('woff2');
}

.material-symbols-rounded {
  font-family: 'Material Symbols Rounded';
}`;

const font = {
  family: 'Rounded',
  sourceUrl: 'https://fonts.gstatic.com/s/abc.woff2',
  fileName: 'material-symbols-rounded.0123456789ab.woff2',
  extension: '.woff2',
} as DownloadedFont;

describe('buildCssApiUrl', () => {
  it('orders axes alphabetically and includes sorted icons', () => {
    const url = new URL(buildCssApiUrl(config, 'Rounded', config.icons));
    expect(url.origin + url.pathname).toBe('https://fonts.googleapis.com/css2');
    expect(url.searchParams.get('family')).toBe(
      'Material Symbols Rounded:FILL,GRAD,opsz,wght@0..1,0,24,400',
    );
    expect(url.searchParams.get('icon_names')).toBe('add,search');
    expect(url.searchParams.get('display')).toBe('block');
  });

  it('omits the axis spec when every axis is disabled', () => {
    const off = { enabled: false } as const;
    const bare = resolveConfig(
      {
        icons: ['add'],
        axes: { opsz: off, wght: off, FILL: off, GRAD: off, ROND: off },
      },
      '/project',
    );
    const url = new URL(buildCssApiUrl(bare, 'Sharp', bare.icons));
    expect(url.searchParams.get('family')).toBe('Material Symbols Sharp');
  });
});

describe('google fonts helpers', () => {
  it('extracts unique remote font URLs', () => {
    expect(extractRemoteFontUrls(`${REMOTE_CSS}\n${REMOTE_CSS}`)).toEqual([
      'https://fonts.gstatic.com/s/abc.woff2',
    ]);
    expect(() => extractRemoteFontUrls('body {}')).toThrow('No se encontraron fuentes');
  });

  it('detects WOFF/WOFF2 signatures', () => {
    expect(detectFontFormat(Buffer.from('wOF2rest'), 'u').extension).toBe('.woff2');
    expect(detectFontFormat(Buffer.from('wOFFrest'), 'u').extension).toBe('.woff');
    expect(() => detectFontFormat(Buffer.from('<htm'), 'u')).toThrow('WOFF/WOFF2');
  });

  it('builds file names with and without hash', () => {
    const hash = 'abcdef0123456789';
    expect(generatedFileName(config, 'Rounded', 0, 1, hash, '.woff2')).toBe(
      'material-symbols-rounded.abcdef012345.woff2',
    );
    expect(
      generatedFileName({ ...config, useContentHash: false }, 'Sharp', 1, 2, hash, '.woff'),
    ).toBe('material-symbols-sharp-2.woff');
  });
});

describe('CSS generation', () => {
  it('rewrites @font-face with local URLs and font family, dropping remote classes', () => {
    const css = rewriteGoogleCss(config, { family: 'Rounded', remoteCss: REMOTE_CSS, fonts: [font] });
    expect(css).toContain(`url(/fonts/${font.fileName})`);
    expect(css).toContain("font-family: 'Local Material Symbols Rounded';");
    expect(css).not.toContain('gstatic');
    expect(css).not.toContain('.material-symbols-rounded');
  });

  it('builds a base class with axis variables and no font-size', () => {
    const css = buildBaseClass(config, 'Rounded');
    expect(css).toContain('.material-symbols-rounded {');
    expect(css).toContain('--material-symbols-fill: 0;');
    expect(css).toContain("'wght' var(--material-symbols-wght)");
    expect(css).not.toContain('font-size');
  });

  it('only emits utilities whose values exist in the font', () => {
    const css = buildUtilityClasses(config);
    expect(css).toContain('.material-symbols--filled {');
    expect(css).toContain('.material-symbols--regular {');
    expect(css).not.toContain('--bold');
    expect(css).not.toContain('--round');
  });

  it('assembles the full stylesheet', () => {
    const css = buildGeneratedCss(config, [
      { family: 'Rounded', remoteCss: REMOTE_CSS, fonts: [font], cssApiUrl: 'https://x' },
    ]);
    expect(css.startsWith('/* AUTO-GENERATED FILE')).toBe(true);
    expect(css).toContain('/* Rounded: https://x */');
    expect(css.endsWith('\n')).toBe(true);
  });

  it('builds preload links', () => {
    const html = buildPreloadHtml({ publicFontBaseUrl: '/assets/fonts/' }, [font]);
    expect(html).toContain(`href="/assets/fonts/${font.fileName}"`);
    expect(html).toContain('type="font/woff2"');
  });
});
