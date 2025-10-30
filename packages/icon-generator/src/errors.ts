export enum ErrorCode {
  TOO_MANY_ARGS = 'TOO_MANY_ARGS',
  MISSING_ARGS = 'MISSING_ARGS',
  SOURCE_NOT_FOUND = 'SOURCE_NOT_FOUND',
  INVALID_SIZES = 'INVALID_SIZES',
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
