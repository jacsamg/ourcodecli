export type MaterialSymbolFamily = 'Outlined' | 'Rounded' | 'Sharp';
export type MaterialSymbolAxis = 'opsz' | 'wght' | 'FILL' | 'GRAD' | 'ROND';
export type FontDisplay = 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
export type AxisMode = 'fixed' | 'range';

export type AxisConfig =
  | {
      readonly enabled: false;
    }
  | {
      readonly enabled: true;
      readonly mode: 'fixed';
      readonly value: number;
    }
  | {
      readonly enabled: true;
      readonly mode: 'range';
      readonly min: number;
      readonly max: number;
      readonly value?: number;
    };

export type AxesConfig = Readonly<Record<MaterialSymbolAxis, AxisConfig>>;
export type AxisValueMap = Partial<
  Readonly<Record<MaterialSymbolAxis, number>>
>;

export interface CssConfig {
  readonly includeBaseClasses: boolean;
  readonly includeAxisUtilities: boolean;
  readonly includeSourceComment: boolean;
  readonly defaultAxisValues: AxisValueMap;
  readonly utilities: Readonly<Record<string, AxisValueMap>>;
}

/** Configuración ya resuelta: todos los valores presentes y rutas absolutas. */
export interface ResolvedConfig {
  readonly families: readonly MaterialSymbolFamily[];
  /** Iconos normalizados, sin duplicados y ordenados alfabéticamente. */
  readonly icons: readonly string[];
  readonly axes: AxesConfig;
  readonly display: FontDisplay;

  readonly fontOutputDirectory: string;
  readonly publicFontBaseUrl: string;
  readonly cssOutputPath: string;
  readonly metadataOutputPath: string;
  readonly preloadOutputPath: string;

  readonly cssClassPrefix: string;
  readonly localFontFamilyPrefix: string;
  readonly useContentHash: boolean;
  readonly fileBaseName: string;

  readonly allowMultipleFontFilesPerFamily: boolean;
  readonly removeObsoleteGeneratedFonts: boolean;

  readonly requestTimeoutMs: number;
  readonly maximumCssBytes: number;
  readonly maximumFontBytesEach: number;
  readonly maximumTotalFontBytes: number;
  readonly performanceBudgetBytes: number | null;

  readonly userAgent: string;
  readonly css: CssConfig;
  readonly dryRun: boolean;
}

/** Forma del archivo JSON de configuración (`material-symbols.config.json`). */
export interface MaterialSymbolsConfig {
  $schema?: string;
  icons: string[];
  families?: MaterialSymbolFamily[];
  axes?: Partial<Record<MaterialSymbolAxis, AxisConfig>>;
  display?: FontDisplay;

  fontOutputDirectory?: string;
  publicFontBaseUrl?: string;
  cssOutputPath?: string;
  metadataOutputPath?: string;
  preloadOutputPath?: string;

  cssClassPrefix?: string;
  localFontFamilyPrefix?: string;
  useContentHash?: boolean;
  fileBaseName?: string;

  allowMultipleFontFilesPerFamily?: boolean;
  removeObsoleteGeneratedFonts?: boolean;

  requestTimeoutMs?: number;
  maximumCssBytes?: number;
  maximumFontBytesEach?: number;
  maximumTotalFontBytes?: number;
  performanceBudgetBytes?: number | null;

  userAgent?: string;
  css?: Partial<CssConfig>;
  dryRun?: boolean;
}

export interface FontFormat {
  readonly extension: '.woff2' | '.woff';
  readonly cssFormat: 'woff2' | 'woff';
}

export interface DownloadedFont {
  readonly family: MaterialSymbolFamily;
  readonly sourceUrl: string;
  readonly finalPath: string;
  readonly fileName: string;
  readonly extension: FontFormat['extension'];
  readonly cssFormat: FontFormat['cssFormat'];
  readonly bytes: number;
  readonly sha256: string;
  readonly contentType: string | null;
  readonly buffer: Buffer;
}

export interface FamilyResult {
  readonly family: MaterialSymbolFamily;
  readonly cssApiUrl: string;
  readonly remoteCss: string;
  readonly cssResponseMetadata: {
    readonly contentType: string | null;
    readonly etag: string | null;
    readonly lastModified: string | null;
    readonly sha256: string;
    readonly bytes: number;
  };
  readonly fonts: readonly DownloadedFont[];
}
