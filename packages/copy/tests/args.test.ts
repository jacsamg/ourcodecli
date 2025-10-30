import { parseArgs, showHelp } from '../src/args.ts';
import { CliError, ErrorCode } from '../src/errors.ts';
import { describe, it, expect, vi } from 'vitest';

describe('parseArgs', () => {
  it('parses all supported flags and positional args', () => {
    const args = parseArgs([
      'src/path',
      'dest/path',
      '-f',
      '--preserve-symlinks',
      '--rename',
      'newName',
      '-n',
    ]);

    expect(args.source).toBe('src/path');
    expect(args.destination).toBe('dest/path');
    expect(args.force).toBe(true);
    expect(args.preserveSymlinks).toBe(true);
    expect(args.rename).toBe('newName');
    expect(args.dryRun).toBe(true);
    expect(args.help).toBe(false);
    expect(args.version).toBe(false);
  });

  it('throws on unknown option', () => {
    expect(() => parseArgs(['a', 'b', '--wat'])).toThrow(CliError);
    try {
      parseArgs(['a', 'b', '--wat']);
    } catch (e) {
      const err = e as CliError;
      expect(err.code).toBe(ErrorCode.TOO_MANY_ARGS);
    }
  });

  it('throws when --rename has no value', () => {
    expect(() => parseArgs(['a', 'b', '--rename'])).toThrow(CliError);
    try {
      parseArgs(['a', 'b', '--rename']);
    } catch (e) {
      const err = e as CliError;
      expect(err.code).toBe(ErrorCode.MISSING_RENAME_VALUE);
    }
  });
});

describe('showHelp', () => {
  it('prints usage information', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    showHelp();
    expect(spy).toHaveBeenCalled();
    const printed = spy.mock.calls
      .map((c: unknown[]) => (c as unknown[]).join(' '))
      .join('\n');
    expect(printed).toContain('Usage: our-copy');
    spy.mockRestore();
  });
});
