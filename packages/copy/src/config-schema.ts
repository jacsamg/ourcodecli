export const COPY_CONFIG_SCHEMA = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'OurCopyConfig',
  type: 'object',
  additionalProperties: false,
  required: ['copies'],
  properties: {
    $schema: {
      type: 'string',
      minLength: 1,
    },
    copies: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['sourcePath', 'targetPath'],
        properties: {
          force: {
            type: 'boolean',
          },
          preserveSymlinks: {
            type: 'boolean',
          },
          rename: {
            type: 'string',
            minLength: 1,
          },
          sourcePath: {
            type: 'string',
            minLength: 1,
          },
          targetPath: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'string',
              minLength: 1,
            },
          },
        },
      },
    },
  },
} as const;
