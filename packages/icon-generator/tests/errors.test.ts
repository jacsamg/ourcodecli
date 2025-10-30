import { CliError, ErrorCode } from '../src/errors.ts';
import { describe, it, expect } from 'vitest';

describe('CliError', () => {
  it('sets code, message, name and default exitCode', () => {
    const err = new CliError(ErrorCode.TOO_MANY_ARGS, 'oops');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('CliError');
    expect(err.message).toBe('oops');
    expect(err.code).toBe(ErrorCode.TOO_MANY_ARGS);
    expect(err.exitCode).toBe(1);
  });

  it('allows custom exitCode', () => {
    const err = new CliError(ErrorCode.SOURCE_NOT_FOUND, 'not found', 7);
    expect(err.exitCode).toBe(7);
  });
});
