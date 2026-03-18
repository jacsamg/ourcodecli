export const SYMLINK_CONFIG_SCHEMA = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'OurSymlinkConfig',
  type: 'array',
  items: {
    type: 'object',
    additionalProperties: false,
    required: ['sourcePath', 'targetDir'],
    properties: {
      force: {
        type: 'boolean',
      },
      sourcePath: {
        type: 'string',
        minLength: 1,
      },
      targetName: {
        type: 'string',
        minLength: 1,
      },
      targetDir: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'string',
          minLength: 1,
        },
      },
    },
  },
} as const;
