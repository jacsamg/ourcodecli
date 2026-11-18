import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import { defaultAxisEntries } from './axes.js';
import { MATERIAL_SYMBOLS_CONFIG_SCHEMA } from './config-schema.js';
import { AXIS_LIMITS, AXIS_ORDER, FAMILY_NAMES } from './constants.js';
import { CliError, ErrorCode } from './errors.js';
import type {
  AxesConfig,
  AxisConfig,
  AxisValueMap,
  CssConfig,
  FontDisplay,
  MaterialSymbolAxis,
  MaterialSymbolFamily,
  ResolvedConfig,
} from './types.js';

const VALID_FAMILIES: ReadonlySet<string> = new Set(Object.keys(FAMILY_NAMES));
const VALID_DISPLAY_VALUES: ReadonlySet<string> = new Set<FontDisplay>([
  'auto',
  'block',
  'swap',
  'fallback',
  'optional',
]);

const ICON_NAME_PATTERN = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;
const CSS_PREFIX_PATTERN = /^[a-zA-Z][a-zA-Z0-9_-]*$/;
const FILE_BASE_NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;
const UTILITY_NAME_PATTERN = /^[a-zA-Z0-9_-]+$/;

export const DEFAULTS = {
  families: ['Rounded'],
  axes: {
    opsz: { enabled: true, mode: 'fixed', value: 24 },
    wght: { enabled: true, mode: 'fixed', value: 400 },
    FILL: { enabled: true, mode: 'range', min: 0, max: 1, value: 0 },
    GRAD: { enabled: true, mode: 'fixed', value: 0 },
    ROND: { enabled: false },
  },
  display: 'block',

  fontOutputDirectory: 'public/fonts',
  publicFontBaseUrl: '/fonts',
  cssOutputPath: 'src/styles/material-symbols.css',
  metadataOutputPath: 'material-symbols.metadata.json',
  preloadOutputPath: 'material-symbols.preload.html',

  cssClassPrefix: 'material-symbols',
  localFontFamilyPrefix: 'Local Material Symbols',
  useContentHash: true,
  fileBaseName: 'material-symbols',

  allowMultipleFontFilesPerFamily: true,
  removeObsoleteGeneratedFonts: true,

  requestTimeoutMs: 30_000,
  maximumCssBytes: 256 * 1024,
  maximumFontBytesEach: 5 * 1024 * 1024,
  maximumTotalFontBytes: 15 * 1024 * 1024,
  performanceBudgetBytes: 250 * 1024,

  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
    'AppleWebKit/537.36 (KHTML, like Gecko) ' +
    'Chrome/136.0.0.0 Safari/537.36',

  css: {
    includeBaseClasses: true,
    includeAxisUtilities: true,
    includeSourceComment: true,
    defaultAxisValues: { opsz: 24, wght: 400, FILL: 0, GRAD: 0, ROND: 0 },
    utilities: {
      outlined: { FILL: 0 },
      filled: { FILL: 1 },
      thin: { wght: 200 },
      regular: { wght: 400 },
      bold: { wght: 700 },
      gradeLow: { GRAD: -25 },
      gradeHigh: { GRAD: 200 },
      square: { ROND: 0 },
      round: { ROND: 100 },
      optical20: { opsz: 20 },
      optical24: { opsz: 24 },
      optical40: { opsz: 40 },
      optical48: { opsz: 48 },
    },
  },

  dryRun: false,
} as const satisfies Omit<ResolvedConfig, 'icons'>;

/* -------------------------------------------------------------------------- */
/* Helpers de validación                                                       */
/* -------------------------------------------------------------------------- */

function invalid(message: string): never {
  throw new CliError(
    ErrorCode.INVALID_CONFIG,
    `Configuración inválida: ${message}`,
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function checkKnownKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  where: string,
): void {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) {
      invalid(
        `propiedad desconocida "${key}" en ${where}. Permitidas: ${allowed.join(', ')}.`,
      );
    }
  }
}

function readBoolean(value: unknown, name: string, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  if (typeof value !== 'boolean') invalid(`"${name}" debe ser boolean.`);
  return value;
}

function readString(
  value: unknown,
  name: string,
  fallback: string,
  pattern?: RegExp,
): string {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || value.trim().length === 0) {
    invalid(`"${name}" debe ser un string no vacío.`);
  }
  const trimmed = value.trim();
  if (pattern && !pattern.test(trimmed)) {
    invalid(`"${name}" tiene un formato inválido: ${JSON.stringify(trimmed)}.`);
  }
  return trimmed;
}

function readPositiveInteger(
  value: unknown,
  name: string,
  fallback: number,
): number {
  if (value === undefined) return fallback;
  if (!Number.isInteger(value) || (value as number) <= 0) {
    invalid(`"${name}" debe ser un entero positivo.`);
  }
  return value as number;
}

/* -------------------------------------------------------------------------- */
/* Validadores de cada sección                                                 */
/* -------------------------------------------------------------------------- */

export function normalizeIconNames(value: unknown): string[] {
  if (!Array.isArray(value) || value.some((icon) => typeof icon !== 'string')) {
    invalid('"icons" debe ser un arreglo de strings.');
  }
  const normalized = (value as string[]).map((name) => name.trim());
  if (normalized.length === 0)
    invalid('debes incluir al menos un icono en "icons".');

  const wrong = normalized.filter((name) => !ICON_NAME_PATTERN.test(name));
  if (wrong.length > 0) {
    invalid(
      `nombres de icono inválidos: ${wrong.map((n) => JSON.stringify(n)).join(', ')}.`,
    );
  }

  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const name of normalized) {
    if (seen.has(name)) duplicates.add(name);
    seen.add(name);
  }
  if (duplicates.size > 0) {
    invalid(`"icons" contiene duplicados: ${[...duplicates].join(', ')}.`);
  }

  return [...normalized].sort((a, b) => a.localeCompare(b, 'en'));
}

function readFamilies(value: unknown): MaterialSymbolFamily[] {
  if (value === undefined) return [...DEFAULTS.families];
  if (!Array.isArray(value) || value.length === 0) {
    invalid('"families" debe ser un arreglo con al menos una familia.');
  }
  for (const family of value) {
    if (typeof family !== 'string' || !VALID_FAMILIES.has(family)) {
      invalid(
        `familia inválida ${JSON.stringify(family)}. Permitidas: ${[...VALID_FAMILIES].join(', ')}.`,
      );
    }
  }
  if (new Set(value).size !== value.length)
    invalid('"families" contiene duplicados.');
  return value as MaterialSymbolFamily[];
}

function readAxis(tag: MaterialSymbolAxis, value: unknown): AxisConfig {
  const where = `axes.${tag}`;
  if (!isPlainObject(value)) invalid(`"${where}" debe ser un objeto.`);
  if (typeof value.enabled !== 'boolean')
    invalid(`"${where}.enabled" debe ser boolean.`);

  if (!value.enabled) {
    checkKnownKeys(value, ['enabled'], where);
    return { enabled: false };
  }

  const limits = AXIS_LIMITS[tag];
  const range = `${limits.min}..${limits.max}`;

  if (value.mode === 'fixed') {
    checkKnownKeys(value, ['enabled', 'mode', 'value'], where);
    if (!isFiniteNumber(value.value))
      invalid(`"${where}.value" debe ser un número.`);
    if (value.value < limits.min || value.value > limits.max) {
      invalid(`${where}.value=${value.value} queda fuera de ${range}.`);
    }
    return { enabled: true, mode: 'fixed', value: value.value };
  }

  if (value.mode === 'range') {
    checkKnownKeys(value, ['enabled', 'mode', 'min', 'max', 'value'], where);
    const { min, max } = value;
    if (!isFiniteNumber(min) || !isFiniteNumber(max)) {
      invalid(`"${where}.min" y "${where}.max" deben ser números.`);
    }
    if (min >= max) invalid(`${where}.min debe ser menor que ${where}.max.`);
    if (min < limits.min || max > limits.max) {
      invalid(`${where}=${min}..${max} queda fuera de ${range}.`);
    }
    if (value.value !== undefined && !isFiniteNumber(value.value)) {
      invalid(`"${where}.value" debe ser un número.`);
    }
    return value.value === undefined
      ? { enabled: true, mode: 'range', min, max }
      : { enabled: true, mode: 'range', min, max, value: value.value };
  }

  return invalid(`"${where}.mode" debe ser "fixed" o "range".`);
}

function readAxes(value: unknown): AxesConfig {
  if (value === undefined) return DEFAULTS.axes;
  if (!isPlainObject(value)) invalid('"axes" debe ser un objeto.');
  checkKnownKeys(value, AXIS_ORDER, 'axes');

  const axes: Record<MaterialSymbolAxis, AxisConfig> = { ...DEFAULTS.axes };
  for (const tag of AXIS_ORDER) {
    if (value[tag] !== undefined) axes[tag] = readAxis(tag, value[tag]);
  }
  return axes;
}

function readAxisValueMap(value: unknown, where: string): AxisValueMap {
  if (!isPlainObject(value)) invalid(`"${where}" debe ser un objeto.`);
  checkKnownKeys(value, AXIS_ORDER, where);
  const out: Partial<Record<MaterialSymbolAxis, number>> = {};
  for (const [tag, axisValue] of Object.entries(value)) {
    if (!isFiniteNumber(axisValue))
      invalid(`"${where}.${tag}" debe ser un número.`);
    out[tag as MaterialSymbolAxis] = axisValue;
  }
  return out;
}

function readCss(value: unknown): CssConfig {
  if (value === undefined) return DEFAULTS.css;
  if (!isPlainObject(value)) invalid('"css" debe ser un objeto.');
  checkKnownKeys(
    value,
    Object.keys(MATERIAL_SYMBOLS_CONFIG_SCHEMA.properties.css.properties),
    'css',
  );

  let utilities: Record<string, AxisValueMap> = DEFAULTS.css.utilities;
  if (value.utilities !== undefined) {
    if (!isPlainObject(value.utilities))
      invalid('"css.utilities" debe ser un objeto.');
    utilities = {};
    for (const [name, map] of Object.entries(value.utilities)) {
      if (!UTILITY_NAME_PATTERN.test(name)) {
        invalid(`nombre de utilidad inválido: ${JSON.stringify(name)}.`);
      }
      utilities[name] = readAxisValueMap(map, `css.utilities.${name}`);
    }
  }

  return {
    includeBaseClasses: readBoolean(
      value.includeBaseClasses,
      'css.includeBaseClasses',
      DEFAULTS.css.includeBaseClasses,
    ),
    includeAxisUtilities: readBoolean(
      value.includeAxisUtilities,
      'css.includeAxisUtilities',
      DEFAULTS.css.includeAxisUtilities,
    ),
    includeSourceComment: readBoolean(
      value.includeSourceComment,
      'css.includeSourceComment',
      DEFAULTS.css.includeSourceComment,
    ),
    defaultAxisValues:
      value.defaultAxisValues === undefined
        ? DEFAULTS.css.defaultAxisValues
        : readAxisValueMap(value.defaultAxisValues, 'css.defaultAxisValues'),
    utilities,
  };
}

function readPublicBaseUrl(value: unknown): string {
  const raw = readString(
    value,
    'publicFontBaseUrl',
    DEFAULTS.publicFontBaseUrl,
  );
  if (!raw.startsWith('/'))
    invalid('"publicFontBaseUrl" debe iniciar con "/".');
  return raw;
}

function readPerformanceBudget(value: unknown): number | null {
  if (value === null) return null;
  return readPositiveInteger(
    value,
    'performanceBudgetBytes',
    DEFAULTS.performanceBudgetBytes,
  );
}

/* -------------------------------------------------------------------------- */
/* API pública                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Valida el contenido del JSON, aplica valores por defecto y resuelve las
 * rutas relativas contra `baseDir` (el directorio del archivo de config).
 */
export function resolveConfig(raw: unknown, baseDir: string): ResolvedConfig {
  if (!isPlainObject(raw)) invalid('la raíz debe ser un objeto.');
  checkKnownKeys(
    raw,
    Object.keys(MATERIAL_SYMBOLS_CONFIG_SCHEMA.properties),
    'la raíz',
  );
  if (!('icons' in raw)) invalid('falta la propiedad requerida "icons".');

  const display = raw.display ?? DEFAULTS.display;
  if (typeof display !== 'string' || !VALID_DISPLAY_VALUES.has(display)) {
    invalid(
      `"display" inválido: ${JSON.stringify(display)}. Permitidos: ${[...VALID_DISPLAY_VALUES].join(', ')}.`,
    );
  }

  const path = (value: unknown, name: string, fallback: string): string =>
    resolve(baseDir, readString(value, name, fallback));

  const config: ResolvedConfig = {
    families: readFamilies(raw.families),
    icons: normalizeIconNames(raw.icons),
    axes: readAxes(raw.axes),
    display: display as FontDisplay,

    fontOutputDirectory: path(
      raw.fontOutputDirectory,
      'fontOutputDirectory',
      DEFAULTS.fontOutputDirectory,
    ),
    publicFontBaseUrl: readPublicBaseUrl(raw.publicFontBaseUrl),
    cssOutputPath: path(
      raw.cssOutputPath,
      'cssOutputPath',
      DEFAULTS.cssOutputPath,
    ),
    metadataOutputPath: path(
      raw.metadataOutputPath,
      'metadataOutputPath',
      DEFAULTS.metadataOutputPath,
    ),
    preloadOutputPath: path(
      raw.preloadOutputPath,
      'preloadOutputPath',
      DEFAULTS.preloadOutputPath,
    ),

    cssClassPrefix: readString(
      raw.cssClassPrefix,
      'cssClassPrefix',
      DEFAULTS.cssClassPrefix,
      CSS_PREFIX_PATTERN,
    ),
    localFontFamilyPrefix: readString(
      raw.localFontFamilyPrefix,
      'localFontFamilyPrefix',
      DEFAULTS.localFontFamilyPrefix,
    ),
    useContentHash: readBoolean(
      raw.useContentHash,
      'useContentHash',
      DEFAULTS.useContentHash,
    ),
    fileBaseName: readString(
      raw.fileBaseName,
      'fileBaseName',
      DEFAULTS.fileBaseName,
      FILE_BASE_NAME_PATTERN,
    ),

    allowMultipleFontFilesPerFamily: readBoolean(
      raw.allowMultipleFontFilesPerFamily,
      'allowMultipleFontFilesPerFamily',
      DEFAULTS.allowMultipleFontFilesPerFamily,
    ),
    removeObsoleteGeneratedFonts: readBoolean(
      raw.removeObsoleteGeneratedFonts,
      'removeObsoleteGeneratedFonts',
      DEFAULTS.removeObsoleteGeneratedFonts,
    ),

    requestTimeoutMs: readPositiveInteger(
      raw.requestTimeoutMs,
      'requestTimeoutMs',
      DEFAULTS.requestTimeoutMs,
    ),
    maximumCssBytes: readPositiveInteger(
      raw.maximumCssBytes,
      'maximumCssBytes',
      DEFAULTS.maximumCssBytes,
    ),
    maximumFontBytesEach: readPositiveInteger(
      raw.maximumFontBytesEach,
      'maximumFontBytesEach',
      DEFAULTS.maximumFontBytesEach,
    ),
    maximumTotalFontBytes: readPositiveInteger(
      raw.maximumTotalFontBytes,
      'maximumTotalFontBytes',
      DEFAULTS.maximumTotalFontBytes,
    ),
    performanceBudgetBytes: readPerformanceBudget(raw.performanceBudgetBytes),

    userAgent: readString(raw.userAgent, 'userAgent', DEFAULTS.userAgent),
    css: readCss(raw.css),
    dryRun: readBoolean(raw.dryRun, 'dryRun', DEFAULTS.dryRun),
  };

  const { outOfRange } = defaultAxisEntries(
    config.axes,
    config.css.defaultAxisValues,
  );
  if (outOfRange.length > 0) {
    invalid(
      `los valores CSS iniciales ${outOfRange.join(', ')} no existen en la fuente. ` +
        'Ajusta "css.defaultAxisValues" o la configuración de "axes".',
    );
  }

  return config;
}

export async function loadConfig(
  absConfigPath: string,
): Promise<ResolvedConfig> {
  let text: string;
  try {
    text = await readFile(absConfigPath, 'utf8');
  } catch {
    throw new CliError(
      ErrorCode.INVALID_CONFIG,
      `No se puede leer el archivo de configuración: ${absConfigPath}`,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    throw new CliError(
      ErrorCode.INVALID_CONFIG,
      `JSON inválido en el archivo de configuración: ${absConfigPath}`,
    );
  }

  return resolveConfig(parsed, dirname(absConfigPath));
}
