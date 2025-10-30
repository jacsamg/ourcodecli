import { removePath } from '../src/remove.ts';
import { mkdtemp, writeFile, rm, mkdir, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

let tmpRoot: string;

beforeEach(async () => {
    tmpRoot = await mkdtemp(join(tmpdir(), 'ourdelete-'));
});

afterEach(async () => {
    await rm(tmpRoot, { recursive: true, force: true });
});

describe('removePath', () => {
    it('removes files and directories', async () => {
        const dir = resolve(tmpRoot, 'dir');
        await mkdir(dir, { recursive: true });
        const file = join(dir, 'a.txt');
        await writeFile(file, 'hello', 'utf8');

        await removePath({ absPath: dir, force: true, strict: true });

        await expect(stat(dir)).rejects.toBeTruthy();
    });

    it('does not throw when target is missing (non-strict default)', async () => {
        await expect(
            removePath({ absPath: resolve(tmpRoot, 'nope'), force: true, strict: false }),
        ).resolves.toBeUndefined();
    });
});
