const axisNumber = { type: 'number' } as const;

const axisValueMap = {
  type: 'object',
  additionalProperties: false,
  properties: {
    opsz: axisNumber,
    wght: axisNumber,
    FILL: axisNumber,
    GRAD: axisNumber,
    ROND: axisNumber,
  },
} as const;

const axisSchema = {
  oneOf: [
    {
      type: 'object',
      additionalProperties: false,
      required: ['enabled'],
      properties: { enabled: { const: false } },
    },
    {
      type: 'object',
      additionalProperties: false,
      required: ['enabled', 'mode', 'value'],
      properties: {
        enabled: { const: true },
        mode: { const: 'fixed' },
        value: axisNumber,
      },
    },
    {
      type: 'object',
      additionalProperties: false,
      required: ['enabled', 'mode', 'min', 'max'],
      properties: {
        enabled: { const: true },
        mode: { const: 'range' },
        min: axisNumber,
        max: axisNumber,
        value: axisNumber,
      },
    },
  ],
} as const;

const nonEmptyString = { type: 'string', minLength: 1 } as const;
const positiveInteger = { type: 'integer', minimum: 1 } as const;

export const MATERIAL_SYMBOLS_CONFIG_SCHEMA = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'OurMaterialSymbolsConfig',
  type: 'object',
  additionalProperties: false,
  required: ['icons'],
  properties: {
    $schema: nonEmptyString,
    icons: {
      description: 'Ligaduras que se incluirán en todas las familias.',
      type: 'array',
      minItems: 1,
      uniqueItems: true,
      items: { type: 'string', pattern: '^\\s*[a-z0-9]+(?:_[a-z0-9]+)*\\s*$' },
    },
    families: {
      description: 'Variantes a generar. Por defecto: ["Rounded"].',
      type: 'array',
      minItems: 1,
      uniqueItems: true,
      items: { enum: ['Outlined', 'Rounded', 'Sharp'] },
    },
    axes: {
      description:
        'Ejes variables. enabled:false usa el valor por defecto de Google; mode:"fixed" fija un valor; mode:"range" conserva el rango.',
      type: 'object',
      additionalProperties: false,
      properties: {
        opsz: axisSchema,
        wght: axisSchema,
        FILL: axisSchema,
        GRAD: axisSchema,
        ROND: axisSchema,
      },
    },
    display: { enum: ['auto', 'block', 'swap', 'fallback', 'optional'] },
    fontOutputDirectory: nonEmptyString,
    publicFontBaseUrl: { type: 'string', pattern: '^/' },
    cssOutputPath: nonEmptyString,
    metadataOutputPath: nonEmptyString,
    preloadOutputPath: nonEmptyString,
    cssClassPrefix: { type: 'string', pattern: '^[a-zA-Z][a-zA-Z0-9_-]*$' },
    localFontFamilyPrefix: nonEmptyString,
    useContentHash: { type: 'boolean' },
    fileBaseName: { type: 'string', pattern: '^[a-zA-Z0-9][a-zA-Z0-9._-]*$' },
    allowMultipleFontFilesPerFamily: { type: 'boolean' },
    removeObsoleteGeneratedFonts: { type: 'boolean' },
    requestTimeoutMs: positiveInteger,
    maximumCssBytes: positiveInteger,
    maximumFontBytesEach: positiveInteger,
    maximumTotalFontBytes: positiveInteger,
    performanceBudgetBytes: {
      description:
        'Presupuesto conjunto de todas las fuentes; null lo desactiva.',
      oneOf: [positiveInteger, { type: 'null' }],
    },
    userAgent: nonEmptyString,
    css: {
      type: 'object',
      additionalProperties: false,
      properties: {
        includeBaseClasses: { type: 'boolean' },
        includeAxisUtilities: { type: 'boolean' },
        includeSourceComment: { type: 'boolean' },
        defaultAxisValues: axisValueMap,
        utilities: {
          type: 'object',
          propertyNames: { pattern: '^[a-zA-Z0-9_-]+$' },
          additionalProperties: axisValueMap,
        },
      },
    },
    dryRun: { type: 'boolean' },
  },
} as const;
