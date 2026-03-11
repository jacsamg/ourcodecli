export enum ErrorCode {
  TOO_MANY_ARGS = 'TOO_MANY_ARGS',
  MISSING_ARGS = 'MISSING_ARGS',
  MISSING_NAME_VALUE = 'MISSING_NAME_VALUE',
  MISSING_CONFIG_VALUE = 'MISSING_CONFIG_VALUE',
  CONFIG_WITH_POSITIONALS = 'CONFIG_WITH_POSITIONALS',
  CONFIG_WITH_INLINE_OPTIONS = 'CONFIG_WITH_INLINE_OPTIONS',
  INVALID_CONFIG = 'INVALID_CONFIG',
  SOURCE_NOT_FOUND = 'SOURCE_NOT_FOUND',
  SOURCE_INVALID_TYPE = 'SOURCE_INVALID_TYPE',
  TARGET_NOT_DIRECTORY = 'TARGET_NOT_DIRECTORY',
  DEST_EXISTS = 'DEST_EXISTS',
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
