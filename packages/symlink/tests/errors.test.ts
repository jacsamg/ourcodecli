import { CliError, ErrorCode } from '../src/errors.ts';
import { describe, expect, it } from 'vitest';

describe('CliError', () => {
  it('sets code, message, name and default exitCode', () => {
    const err = new CliError(ErrorCode.MISSING_ARGS, 'oops');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('CliError');
    expect(err.message).toBe('oops');
    expect(err.code).toBe(ErrorCode.MISSING_ARGS);
    expect(err.exitCode).toBe(1);
  });

  it('allows custom exitCode', () => {
    const err = new CliError(ErrorCode.INVALID_CONFIG, 'bad config', 7);
    expect(err.exitCode).toBe(7);
  });
});
