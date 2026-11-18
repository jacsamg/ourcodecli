export enum ErrorCode {
  TOO_MANY_ARGS = 'TOO_MANY_ARGS',
  MISSING_RENAME_VALUE = 'MISSING_RENAME_VALUE',
  MISSING_ARGS = 'MISSING_ARGS',
  MISSING_CONFIG_VALUE = 'MISSING_CONFIG_VALUE',
  CONFIG_WITH_POSITIONALS = 'CONFIG_WITH_POSITIONALS',
  CONFIG_WITH_INLINE_OPTIONS = 'CONFIG_WITH_INLINE_OPTIONS',
  INVALID_CONFIG = 'INVALID_CONFIG',
  SOURCE_NOT_FOUND = 'SOURCE_NOT_FOUND',
  SAME_SOURCE_DEST = 'SAME_SOURCE_DEST',
  DEST_INSIDE_SOURCE = 'DEST_INSIDE_SOURCE',
}

export class CliError extends Error {
  code: ErrorCode;
  exitCode: number;

  constructor(code: ErrorCode, message: string, exitCode = 1) {
    super(message);
    this.name = 'CliError';
    this.code = code;
    this.exitCode = exitCode;
  }
}
