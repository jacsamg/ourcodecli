import { parseArgs, parseTargetList, showHelp } from '../src/args.ts';
import { CliError, ErrorCode } from '../src/errors.ts';
import { describe, expect, it, vi } from 'vitest';

describe('parseTargetList', () => {
  it('parses csv and removes empty entries', () => {
    expect(parseTargetList('a,b,,,c,')).toEqual(['a', 'b', 'c']);
  });
});

describe('parseArgs', () => {
  it('parses positional arguments and flags', () => {
    const args = parseArgs([
      './source.txt',
      './apps/a,./apps/b,,',
      '--name',
      'my-link',
      '--force',
    ]);

    expect(args.source).toBe('./source.txt');
    expect(args.targets).toEqual(['./apps/a', './apps/b']);
    expect(args.targetName).toBe('my-link');
    expect(args.force).toBe(true);
    expect(args.config).toBeNull();
  });

  it('parses config mode', () => {
    const args = parseArgs(['--config', './our-symlink.json']);
    expect(args.config).toBe('./our-symlink.json');
    expect(args.force).toBe(false);
    expect(args.targetName).toBeNull();
  });

  it('throws when --config is combined with --name', () => {
    expect(() => parseArgs(['--config', './our-symlink.json', '--name', 'x'])).toThrow(
      CliError,
    );
    try {
      parseArgs(['--config', './our-symlink.json', '--name', 'x']);
    } catch (error) {
      const err = error as CliError;
      expect(err.code).toBe(ErrorCode.CONFIG_WITH_INLINE_OPTIONS);
    }
  });

  it('throws when --config is combined with --force', () => {
    expect(() => parseArgs(['--config', './our-symlink.json', '--force'])).toThrow(
      CliError,
    );
    try {
      parseArgs(['--config', './our-symlink.json', '--force']);
    } catch (error) {
      const err = error as CliError;
      expect(err.code).toBe(ErrorCode.CONFIG_WITH_INLINE_OPTIONS);
    }
  });

  it('throws on unknown options', () => {
    expect(() => parseArgs(['--wat'])).toThrow(CliError);
    try {
      parseArgs(['--wat']);
    } catch (error) {
      const err = error as CliError;
      expect(err.code).toBe(ErrorCode.TOO_MANY_ARGS);
    }
  });

  it('throws when --name has no value', () => {
    expect(() => parseArgs(['a', 'b', '--name'])).toThrow(CliError);
    try {
      parseArgs(['a', 'b', '--name']);
    } catch (error) {
      const err = error as CliError;
      expect(err.code).toBe(ErrorCode.MISSING_NAME_VALUE);
    }
  });

  it('throws when --config has no value', () => {
    expect(() => parseArgs(['--config'])).toThrow(CliError);
    try {
      parseArgs(['--config']);
    } catch (error) {
      const err = error as CliError;
      expect(err.code).toBe(ErrorCode.MISSING_CONFIG_VALUE);
    }
  });
});

describe('showHelp', () => {
  it('prints usage information', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    showHelp();
    expect(spy).toHaveBeenCalled();
    const printed = spy.mock.calls.flat().join('\n');
    expect(printed).toContain('Usage:');
    expect(printed).toContain('our-symlink');
    spy.mockRestore();
  });
});
