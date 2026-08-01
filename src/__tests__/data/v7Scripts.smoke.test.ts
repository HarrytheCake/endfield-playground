/**
 * V7-F1 — sync / generate 腳本可重跑煙霧測試
 */

import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const root = join(__dirname, '../../..');

describe('V7-F1 scripts smoke', () => {
    it('sync:aaaaa-data --dry-run 成功', () => {
        const out = execFileSync(
            process.execPath,
            ['docs/aaaaa/scripts/sync-data-from-v1.mjs', '--dry-run'],
            { cwd: root, encoding: 'utf8' },
        );
        expect(out).toMatch(/dry-run|would|files|OK|done/i);
    });

    it('generate-src-data --dry-run 成功', () => {
        const out = execFileSync(
            process.execPath,
            ['docs/aaaaa/scripts/generate-src-data.mjs', '--dry-run'],
            { cwd: root, encoding: 'utf8' },
        );
        expect(out).toMatch(/dry-run|would write|machines|products/i);
    });

    it('docs/aaaaa/data 與 src/data 關鍵檔存在', () => {
        expect(existsSync(join(root, 'docs/aaaaa/data/machines.json'))).toBe(true);
        expect(existsSync(join(root, 'docs/aaaaa/data/products.json'))).toBe(true);
        expect(existsSync(join(root, 'src/data/machines.ts'))).toBe(true);
        expect(existsSync(join(root, 'src/data/products.ts'))).toBe(true);
        expect(existsSync(join(root, 'src/data/environments.ts'))).toBe(true);
    });
});
