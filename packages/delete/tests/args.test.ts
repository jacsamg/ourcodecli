import { parseArgs, showHelp } from '../src/args.ts';
import { CliError, ErrorCode } from '../src/errors.ts';
import { describe, it, expect, vi } from 'vitest';

describe('parseArgs', () => {
  it('parses flags and positional args', () => {
    const args = parseArgs(['-f', '-s', 'a', 'b']);
    expect(args.force).toBe(true);
    expect(args.strict).toBe(true);
    expect(args.paths).toEqual(['a', 'b']);
    expect(args.help).toBe(false);
    expect(args.version).toBe(false);
  });

  it('sets help and version', () => {
    const a = parseArgs(['--help']);
    expect(a.help).toBe(true);
    const b = parseArgs(['--version']);
    expect(b.version).toBe(true);
  });

  it('throws on unknown option', () => {
    expect(() => parseArgs(['--wat'])).toThrow(CliError);
    try {
      parseArgs(['--wat']);
    } catch (e) {
      const err = e as CliError;
      expect(err.code).toBe(ErrorCode.TOO_MANY_ARGS);
    }
  });
});

describe('showHelp', () => {
  it('prints usage information', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => { });
    showHelp();
    expect(spy).toHaveBeenCalled();
    const printed = spy.mock.calls.flat().join('\n');
    expect(printed).toContain('Usage: our-delete');
    spy.mockRestore();
  });
});
