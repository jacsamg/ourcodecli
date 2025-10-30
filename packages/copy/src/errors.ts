export enum ErrorCode {
  TOO_MANY_ARGS = 'TOO_MANY_ARGS',
  MISSING_RENAME_VALUE = 'MISSING_RENAME_VALUE',
  MISSING_ARGS = 'MISSING_ARGS',
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
