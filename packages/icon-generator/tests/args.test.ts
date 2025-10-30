import { parseArgs, showHelp } from '../src/args.ts';
import { CliError, ErrorCode } from '../src/errors.ts';
import { describe, it, expect, vi } from 'vitest';

describe('parseArgs', () => {
  it('parses positional args and flags', () => {
    const args = parseArgs([
      'src/logo.png',
      'dist/icons',
      'app',
      '--sizes',
      '72,96,128',
      '-n',
    ]);

    expect(args.source).toBe('src/logo.png');
    expect(args.destination).toBe('dist/icons');
    expect(args.name).toBe('app');
    expect(args.sizes).toEqual([72, 96, 128]);
    expect(args.dryRun).toBe(true);
    expect(args.help).toBe(false);
    expect(args.version).toBe(false);
  });

  it('throws on unknown option', () => {
    expect(() => parseArgs(['a', 'b', 'c', '--wat'])).toThrow(CliError);
    try {
      parseArgs(['a', 'b', 'c', '--wat']);
    } catch (e) {
      const err = e as CliError;
      expect(err.code).toBe(ErrorCode.TOO_MANY_ARGS);
    }
  });

  it('validates sizes list', () => {
    expect(() => parseArgs(['a', 'b', 'c', '--sizes'])).toThrow(CliError);
    try {
      parseArgs(['a', 'b', 'c', '--sizes']);
    } catch (e) {
      const err = e as CliError;
      expect(err.code).toBe(ErrorCode.INVALID_SIZES);
    }

    expect(() => parseArgs(['a', 'b', 'c', '--sizes', '10,0'])).toThrow(CliError);
  });
});

describe('showHelp', () => {
  it('prints usage information', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => { });
    showHelp();
    expect(spy).toHaveBeenCalled();
    const printed = spy.mock.calls.map((c: unknown[]) => (c as unknown[]).join(' ')).join('\n');
    expect(printed).toContain('Usage: our-icon-gen');
    spy.mockRestore();
  });
});
