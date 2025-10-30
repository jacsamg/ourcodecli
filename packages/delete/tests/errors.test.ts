import { CliError, ErrorCode } from '../src/errors.ts';
import { describe, it, expect } from 'vitest';

describe('CliError', () => {
    it('sets fields and defaults', () => {
        const err = new CliError(ErrorCode.MISSING_ARGS, 'oops');
        expect(err).toBeInstanceOf(Error);
        expect(err.name).toBe('CliError');
        expect(err.message).toBe('oops');
        expect(err.code).toBe(ErrorCode.MISSING_ARGS);
        expect(err.exitCode).toBe(1);
    });

    it('allows custom exitCode', () => {
        const err = new CliError(ErrorCode.DELETE_FAILED, 'fail', 7);
        expect(err.exitCode).toBe(7);
    });
});
