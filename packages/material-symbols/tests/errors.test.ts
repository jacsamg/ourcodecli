import { describe, expect, it } from 'vitest';
import { CliError, ErrorCode } from '../src/errors.ts';

describe('CliError', () => {
  it('stores code, message and default exit code', () => {
    const error = new CliError(ErrorCode.INVALID_CONFIG, 'boom');
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('CliError');
    expect(error.code).toBe(ErrorCode.INVALID_CONFIG);
    expect(error.message).toBe('boom');
    expect(error.exitCode).toBe(1);
  });

  it('accepts a custom exit code', () => {
    expect(new CliError(ErrorCode.NETWORK_ERROR, 'x', 3).exitCode).toBe(3);
  });
});
