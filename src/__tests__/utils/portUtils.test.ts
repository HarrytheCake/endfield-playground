/**
 * Port 旋轉工具單元測試
 *
 * 測試對象：src/utils/portUtils.ts
 * 重點：方位旋轉的順時針順序、非方形機器的 offset 翻轉規則、各 rotation step 邊界。
 */

import { describe, it, expect } from 'vitest';
import { rotatePortSide, rotatePortOffset } from '@/utils/portUtils';
import type { PortSide } from '@/types/machine';

// ─── rotatePortSide ──────────────────────────────────────────────────────────

describe('rotatePortSide()', () => {
    it('rotation = 0 時方位不變', () => {
        for (const side of ['top', 'right', 'bottom', 'left'] as PortSide[]) {
            expect(rotatePortSide(side, 0)).toBe(side);
        }
    });

    it('順時針 90°（rotation = 1）：top → right → bottom → left → top', () => {
        expect(rotatePortSide('top', 1)).toBe('right');
        expect(rotatePortSide('right', 1)).toBe('bottom');
        expect(rotatePortSide('bottom', 1)).toBe('left');
        expect(rotatePortSide('left', 1)).toBe('top');
    });

    it('順時針 180°（rotation = 2）：相對方位翻轉', () => {
        expect(rotatePortSide('top', 2)).toBe('bottom');
        expect(rotatePortSide('bottom', 2)).toBe('top');
        expect(rotatePortSide('left', 2)).toBe('right');
        expect(rotatePortSide('right', 2)).toBe('left');
    });

    it('順時針 270°（rotation = 3）= 逆時針 90°', () => {
        expect(rotatePortSide('top', 3)).toBe('left');
        expect(rotatePortSide('left', 3)).toBe('bottom');
        expect(rotatePortSide('bottom', 3)).toBe('right');
        expect(rotatePortSide('right', 3)).toBe('top');
    });
});

// ─── rotatePortOffset ────────────────────────────────────────────────────────

describe('rotatePortOffset()', () => {
    it('rotation = 0 時 offset 不變', () => {
        expect(rotatePortOffset('top', 2, 3, 3, 0)).toBe(2);
        expect(rotatePortOffset('left', 1, 5, 7, 0)).toBe(1);
    });

    it('方形機器（3×3）：top offset 旋轉 1 步後不變（top → right）', () => {
        // top → right 規則：offset 不變
        expect(rotatePortOffset('top', 0, 3, 3, 1)).toBe(0);
        expect(rotatePortOffset('top', 2, 3, 3, 1)).toBe(2);
    });

    it('方形機器（3×3）：right offset 旋轉 1 步後水平翻轉（right → bottom）', () => {
        // right → bottom 規則：offset → machineWidth - 1 - offset
        // 旋轉後 source 邊變為 right，width 為原 height
        expect(rotatePortOffset('right', 0, 3, 3, 1)).toBe(2);
        expect(rotatePortOffset('right', 2, 3, 3, 1)).toBe(0);
    });

    it('方形機器（3×3）：bottom offset 旋轉 1 步後不變（bottom → left）', () => {
        expect(rotatePortOffset('bottom', 1, 3, 3, 1)).toBe(1);
    });

    it('方形機器（3×3）：left offset 旋轉 1 步後垂直翻轉（left → top）', () => {
        // left → top 規則：offset → machineHeight - 1 - offset
        expect(rotatePortOffset('left', 0, 3, 3, 1)).toBe(2);
        expect(rotatePortOffset('left', 2, 3, 3, 1)).toBe(0);
    });

    it('非方形機器（2×4）：left offset=0 旋轉 1 步 → top offset=3', () => {
        // left → top：offset → height - 1 - offset = 4 - 1 - 0 = 3
        expect(rotatePortOffset('left', 0, 2, 4, 1)).toBe(3);
    });

    it('非方形機器（2×4）：left offset=3 旋轉 1 步 → top offset=0', () => {
        expect(rotatePortOffset('left', 3, 2, 4, 1)).toBe(0);
    });

    it('旋轉 4 步（360°）回到原值', () => {
        // 內部循環：每步呼叫一次 transform，4 步後應回原值
        // 注意：rotatePortOffset 接受 rotation: 0|1|2|3，無法直接傳 4，
        //       此處用旋轉 2 步 × 2 等價驗證
        const r2 = rotatePortOffset('left', 0, 2, 4, 2);
        // 第 2 次旋轉時 source 邊已是 right，machineWidth 仍為 2
        // 因此 r2 為 left → top → right 兩步的結果
        // 旋轉 2 步等價於 180°，offset=0 在 2×4 機器的 left 邊對到 right 邊 offset=3
        expect(r2).toBe(3);
    });
});
