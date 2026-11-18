import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_CONFIG_PATH, parseArgs, showHelp } from '../src/args.ts';
import { CliError, ErrorCode } from '../src/errors.ts';

function codeOf(fn: () => unknown): ErrorCode | undefined {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(CliError);
    return (error as CliError).code;
  }
  return undefined;
}

describe('parseArgs', () => {
  it('uses the default config path', () => {
    expect(parseArgs([])).toEqual({ config: DEFAULT_CONFIG_PATH, help: false, version: false });
  });

  it('parses --config and -c', () => {
    expect(parseArgs(['--config', './a.json']).config).toBe('./a.json');
    expect(parseArgs(['-c', './b.json']).config).toBe('./b.json');
  });

  it('parses help and version flags', () => {
    expect(parseArgs(['-h']).help).toBe(true);
    expect(parseArgs(['--version']).version).toBe(true);
  });

  it('throws when --config has no value', () => {
    expect(codeOf(() => parseArgs(['--config']))).toBe(ErrorCode.MISSING_CONFIG_VALUE);
    expect(codeOf(() => parseArgs(['--config', '-h']))).toBe(ErrorCode.MISSING_CONFIG_VALUE);
  });

  it('throws on unknown options', () => {
    expect(codeOf(() => parseArgs(['--dry-run']))).toBe(ErrorCode.UNKNOWN_OPTION);
  });

  it('throws on positional arguments', () => {
    expect(codeOf(() => parseArgs(['./config.json']))).toBe(ErrorCode.TOO_MANY_ARGS);
  });
});

describe('showHelp', () => {
  it('prints usage information', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    showHelp();
    const printed = spy.mock.calls.flat().join('\n');
    expect(printed).toContain('Uso:');
    expect(printed).toContain('our-material-symbols');
    spy.mockRestore();
  });
});
