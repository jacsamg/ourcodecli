import { axisContainsValue, defaultAxisEntries, formatNumber } from './axes.js';
import { AXIS_ORDER } from './constants.js';
import { CliError, ErrorCode } from './errors.js';
import { familySlug } from './files.js';
import type {
  DownloadedFont,
  FamilyResult,
  MaterialSymbolAxis,
  MaterialSymbolFamily,
  ResolvedConfig,
} from './types.js';

type CssBuildConfig = Pick<
  ResolvedConfig,
  | 'axes'
  | 'css'
  | 'cssClassPrefix'
  | 'localFontFamilyPrefix'
  | 'publicFontBaseUrl'
>;

export function normalizePublicBaseUrl(value: string): string {
  return value === '/' ? '' : value.replace(/\/+$/, '');
}

export function escapeCssString(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll("'", "\\'");
}

export function cssFamilyClass(
  config: Pick<ResolvedConfig, 'cssClassPrefix'>,
  family: MaterialSymbolFamily,
): string {
  return `${config.cssClassPrefix}-${familySlug(family)}`;
}

export function localFontFamily(
  config: Pick<ResolvedConfig, 'localFontFamilyPrefix'>,
  family: MaterialSymbolFamily,
): string {
  return `${config.localFontFamilyPrefix} ${family}`;
}

function axisCssVariable(
  config: Pick<ResolvedConfig, 'cssClassPrefix'>,
  tag: MaterialSymbolAxis,
): string {
  return `--${config.cssClassPrefix}-${tag.toLowerCase()}`;
}

/**
 * Clase base por familia. No fija `font-size`: el icono hereda el tamaño del
 * contenedor y las utilidades (p. ej. `text-2xl` de Tailwind) pueden cambiarlo
 * en el mismo elemento sin competir con esta clase.
 */
export function buildBaseClass(
  config: CssBuildConfig,
  family: MaterialSymbolFamily,
): string {
  const { entries } = defaultAxisEntries(
    config.axes,
    config.css.defaultAxisValues,
  );
  const variableDeclarations = entries
    .map(
      ([tag, value]) =>
        `  ${axisCssVariable(config, tag)}: ${formatNumber(value)};`,
    )
    .join('\n');
  const variationSettings = entries
    .map(([tag]) => `'${tag}' var(${axisCssVariable(config, tag)})`)
    .join(',\n    ');
  const variationBlock =
    entries.length > 0
      ? `\n${variableDeclarations}\n  font-variation-settings:\n    ${variationSettings};`
      : '';

  return `.${cssFamilyClass(config, family)} {
  font-family: '${escapeCssString(localFontFamily(config, family))}';
  font-weight: normal;
  font-style: normal;
  display: inline-block;
  line-height: 2;
  text-transform: none;
  letter-spacing: normal;
  word-wrap: normal;
  white-space: nowrap;
  direction: ltr;
  user-select: none;
  font-feature-settings: 'liga';
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;${variationBlock}
}`;
}

/** Utilidades `.prefix--nombre`; se omiten las que no existen en la fuente. */
export function buildUtilityClasses(config: CssBuildConfig): string {
  if (!config.css.includeAxisUtilities) return '';
  const blocks: string[] = [];

  for (const [name, requested] of Object.entries(config.css.utilities)) {
    const declarations: string[] = [];

    for (const tag of AXIS_ORDER) {
      const value = requested[tag];
      if (value === undefined) continue;
      if (axisContainsValue(config.axes[tag], value)) {
        declarations.push(
          `  ${axisCssVariable(config, tag)}: ${formatNumber(value)};`,
        );
      }
    }

    if (declarations.length > 0) {
      blocks.push(
        `.${config.cssClassPrefix}--${name} {\n${declarations.join('\n')}\n}`,
      );
    }
  }

  return blocks.join('\n\n');
}

export function extractFontFaceBlocks(cssText: string): string[] {
  const blocks = cssText.match(/@font-face\s*\{[\s\S]*?\}/g) ?? [];
  if (blocks.length === 0) {
    throw new CliError(
      ErrorCode.INVALID_RESPONSE,
      'El CSS remoto no contiene bloques @font-face.',
    );
  }
  return blocks;
}

export function rewriteGoogleCss(
  config: CssBuildConfig,
  result: Pick<FamilyResult, 'family' | 'remoteCss' | 'fonts'>,
): string {
  let css = extractFontFaceBlocks(result.remoteCss).join('\n\n');
  const baseUrl = normalizePublicBaseUrl(config.publicFontBaseUrl);

  for (const font of result.fonts) {
    css = css.split(font.sourceUrl).join(`${baseUrl}/${font.fileName}`);
  }

  css = css.replace(
    /font-family:\s*(['"])[^'"]+\1\s*;/g,
    `font-family: '${escapeCssString(localFontFamily(config, result.family))}';`,
  );

  return css.trim();
}

export function buildGeneratedCss(
  config: CssBuildConfig,
  results: readonly Pick<
    FamilyResult,
    'family' | 'remoteCss' | 'fonts' | 'cssApiUrl'
  >[],
): string {
  const sections: string[] = [];
  if (config.css.includeSourceComment) {
    sections.push(
      '/* AUTO-GENERATED FILE by our-material-symbols. DO NOT EDIT. */',
    );
  }

  for (const result of results) {
    sections.push(
      `/* ${result.family}: ${result.cssApiUrl} */\n${rewriteGoogleCss(config, result)}`,
    );
    if (config.css.includeBaseClasses)
      sections.push(buildBaseClass(config, result.family));
  }

  const utilities = buildUtilityClasses(config);
  if (utilities) sections.push(utilities);
  return `${sections.join('\n\n')}\n`;
}

export function buildPreloadHtml(
  config: Pick<ResolvedConfig, 'publicFontBaseUrl'>,
  fonts: readonly Pick<DownloadedFont, 'fileName' | 'extension'>[],
): string {
  const baseUrl = normalizePublicBaseUrl(config.publicFontBaseUrl);
  return `${fonts
    .map((font) => {
      const type = font.extension === '.woff2' ? 'font/woff2' : 'font/woff';
      return `<link\n  rel="preload"\n  type="${type}"\n  as="font"\n  href="${baseUrl}/${font.fileName}"\n  crossorigin\n/>`;
    })
    .join('\n')}\n`;
}
