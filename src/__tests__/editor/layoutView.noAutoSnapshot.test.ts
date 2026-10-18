/**
 * V17-H1／#58：正式頁 LayoutView 不得開頁自動載 connected 示範。
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

const layoutViewSrc = readFileSync(join(process.cwd(), 'src/editor/layout/LayoutView.vue'), 'utf8');

describe('LayoutView — V17-H1 停自動示範快照', () => {
    it('不 import mockLayout；無 onMounted 自動載 connected', () => {
        expect(layoutViewSrc).not.toMatch(/from ['"]@\/data\/mockLayout['"]/);
        expect(layoutViewSrc).not.toMatch(/getMockLayoutScenario\s*\(/);
        expect(layoutViewSrc).not.toMatch(/toLayoutSnapshot\s*\(/);
        expect(layoutViewSrc).not.toMatch(/onMounted\s*\(/);
        expect(layoutViewSrc).not.toMatch(/loadSnapshot\s*\(\s*toLayoutSnapshot/);
    });
});
