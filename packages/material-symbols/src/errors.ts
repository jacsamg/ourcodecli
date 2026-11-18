export enum ErrorCode {
  UNKNOWN_OPTION = 'UNKNOWN_OPTION',
  TOO_MANY_ARGS = 'TOO_MANY_ARGS',
  MISSING_CONFIG_VALUE = 'MISSING_CONFIG_VALUE',
  INVALID_CONFIG = 'INVALID_CONFIG',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  INVALID_FONT = 'INVALID_FONT',
  LIMIT_EXCEEDED = 'LIMIT_EXCEEDED',
  BUDGET_EXCEEDED = 'BUDGET_EXCEEDED',
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
