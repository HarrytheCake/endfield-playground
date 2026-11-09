import { describe, expect, it } from 'vitest';
import {
    buildConnectionWaypoints,
    buildGapConnectionWaypoints,
    type ConnectionAnchor,
    type ConnectionDeviceBounds,
} from '@/utils/layout/connectionWaypoints';
import { isAxisAlignedPath } from '@/utils/layout/pipelineGeometry';
import type { Position } from '@/types/euclideanSpace';
import type { PortSide } from '@/types/machine';

/**
 * 建立純座標輸入，避免測試依賴機型資料、Vue 或 Pinia。
 * @param x 外側整數錨點 x
 * @param y 外側整數錨點 y
 * @param side 已旋轉的埠方位
 * @param z 固定媒質層
 * @returns 本次測試獨立的錨點
 * @example
 * anchor(0, 0, 'right');
 */
function anchor(x: number, y: number, side: PortSide, z = 0): ConnectionAnchor {
    return { position: { x, y, z }, side };
}

/**
 * 檢查可提交幾何的共通條件，不複製選路公式。
 * @param points 生成的路徑
 * @param source 原始來源錨點
 * @param target 原始目標錨點
 * @returns 無；斷言失敗時由 Vitest 回報
 * @example
 * assertPath(buildConnectionWaypoints(from, to), from, to);
 */
function assertPath(points: Position[], source: ConnectionAnchor, target: ConnectionAnchor): void {
    expect(points.length).toBeGreaterThanOrEqual(2);
    expect(points[0]).toEqual(source.position);
    expect(points.at(-1)).toEqual(target.position);
    expect(isAxisAlignedPath(points)).toBe(true);
    for (const point of points) {
        expect(point.z).toBe(source.position.z);
        expect(Object.values(point).every(Number.isInteger)).toBe(true);
    }
}

/** 各來源方向搭配四象限，驗證選軸不受座標正負影響。 */
const singleCases = (['left', 'right', 'top', 'bottom'] as const).flatMap((side) =>
    [
        [6, 4],
        [-6, 4],
        [6, -4],
        [-6, -4],
    ].map(([x, y]) => ({ side, x, y })),
);
/** 水平分離的兩台設備，空隙閉區間為 3 至 5，通道為 x=4。 */
const leftBounds: ConnectionDeviceBounds = { left: 0, right: 2, top: 0, bottom: 2 };
/** 與來源同高度，來源／目標交換後仍應選同一通道。 */
const rightBounds: ConnectionDeviceBounds = { left: 6, right: 8, top: 0, bottom: 2 };
/** 垂直分離設備的下方範圍，通道為 y=4。 */
const bottomBounds: ConnectionDeviceBounds = { left: 0, right: 2, top: 6, bottom: 8 };

describe('buildConnectionWaypoints', () => {
    it.each(singleCases)('$side 至 ($x,$y) 保持既有單轉角', ({ side, x, y }) => {
        const source = anchor(0, 0, side);
        const target = anchor(x, y, 'top');
        const points = buildConnectionWaypoints(source, target);
        expect(points).toHaveLength(3);
        expect(points[1]).toEqual(
            side === 'left' || side === 'right' ? { x, y: 0, z: 0 } : { x: 0, y, z: 0 },
        );
        assertPath(points, source, target);
    });

    it.each([
        [0, 5],
        [0, -5],
        [5, 0],
        [-5, 0],
        [0, 0],
    ])('共線或同格 (0,0) 至 (%s,%s) 保留兩端', (x, y) => {
        const source = anchor(0, 0, 'bottom');
        const target = anchor(x, y, 'top');
        const points = buildConnectionWaypoints(source, target);
        expect(points).toHaveLength(2);
        assertPath(points, source, target);
        expect(points[0]).not.toBe(points[1]);
    });

    it.each([0, 1])('整條單轉角路徑維持 z=%s', (z) => {
        const source = anchor(1, 2, 'right', z);
        const target = anchor(5, 6, 'left', z);
        assertPath(buildConnectionWaypoints(source, target), source, target);
    });
});

describe('buildGapConnectionWaypoints', () => {
    it.each([
        ['top', 'top'],
        ['top', 'bottom'],
        ['bottom', 'top'],
        ['bottom', 'bottom'],
    ] as const)('%s／%s 使用水平空隙，左右交換仍選 x=4', (fromSide, toSide) => {
        const source = anchor(1, 3, fromSide);
        const target = anchor(7, -1, toSide);
        const points = buildGapConnectionWaypoints(source, target, leftBounds, rightBounds)!;
        expect(points).toEqual([
            source.position,
            { x: 4, y: 3, z: 0 },
            { x: 4, y: -1, z: 0 },
            target.position,
        ]);
        expect(buildGapConnectionWaypoints(target, source, rightBounds, leftBounds)).toEqual(
            [...points].reverse(),
        );
        assertPath(points, source, target);
    });

    it.each([
        ['left', 'left'],
        ['left', 'right'],
        ['right', 'left'],
        ['right', 'right'],
    ] as const)('%s／%s 使用垂直空隙，上下交換仍選 y=4', (fromSide, toSide) => {
        const source = anchor(3, 1, fromSide);
        const target = anchor(-1, 7, toSide);
        const points = buildGapConnectionWaypoints(source, target, leftBounds, bottomBounds)!;
        expect(points).toEqual([
            source.position,
            { x: 3, y: 4, z: 0 },
            { x: -1, y: 4, z: 0 },
            target.position,
        ]);
        expect(buildGapConnectionWaypoints(target, source, bottomBounds, leftBounds)).toEqual(
            [...points].reverse(),
        );
        assertPath(points, source, target);
    });

    it.each([
        { name: '一格', left: 4, right: 6, lane: 3 },
        { name: '兩格向下取整', left: 5, right: 7, lane: 3 },
        { name: '三格', left: 6, right: 8, lane: 4 },
        { name: '負座標向下取整', left: -5, right: -3, lane: -2 },
    ])('$name 空隙的中線及垂直對稱情況', ({ left, right, lane }) => {
        const source = anchor(1, 3, 'bottom');
        const target = anchor(left + 1, -1, 'top');
        const bounds = { ...rightBounds, left, right };
        const points = buildGapConnectionWaypoints(source, target, leftBounds, bounds)!;
        expect(points.slice(1, -1).map((point) => point.x)).toEqual([lane, lane]);
        assertPath(points, source, target);
        const verticalSource = anchor(3, 1, 'right');
        const verticalTarget = anchor(-1, left + 1, 'left');
        const vertical = buildGapConnectionWaypoints(verticalSource, verticalTarget, leftBounds, {
            ...leftBounds,
            top: left,
            bottom: right,
        })!;
        expect(vertical.slice(1, -1).map((point) => point.y)).toEqual([lane, lane]);
        assertPath(vertical, verticalSource, verticalTarget);
    });

    it.each([
        { name: '緊鄰', left: 3, right: 5 },
        { name: '共用邊界格', left: 2, right: 4 },
        { name: '部分交疊', left: 1, right: 3 },
        { name: '包含來源', left: -1, right: 3 },
        { name: '被來源包含', left: 1, right: 1 },
    ])('$name 不生成水平或垂直空隙路徑', ({ left, right }) => {
        expect(
            buildGapConnectionWaypoints(anchor(1, 3, 'bottom'), anchor(4, -1, 'top'), leftBounds, {
                ...rightBounds,
                left,
                right,
            }),
        ).toBeNull();
        expect(
            buildGapConnectionWaypoints(anchor(3, 1, 'right'), anchor(-1, 4, 'left'), leftBounds, {
                ...leftBounds,
                top: left,
                bottom: right,
            }),
        ).toBeNull();
    });

    it.each([
        ['top', 'left'],
        ['top', 'right'],
        ['bottom', 'left'],
        ['bottom', 'right'],
        ['left', 'top'],
        ['left', 'bottom'],
        ['right', 'top'],
        ['right', 'bottom'],
    ] as const)('混合方向 %s／%s 不嘗試空隙繞路', (fromSide, toSide) => {
        expect(
            buildGapConnectionWaypoints(anchor(1, 3, fromSide), anchor(7, -1, toSide), leftBounds, {
                left: 6,
                right: 8,
                top: 6,
                bottom: 8,
            }),
        ).toBeNull();
    });

    it.each([0, 1])('雙轉角維持 z=%s，保留重複折點', (z) => {
        const source = anchor(4, 3, 'bottom', z);
        const target = anchor(7, 3, 'top', z);
        const points = buildGapConnectionWaypoints(source, target, leftBounds, rightBounds)!;
        expect(points).toHaveLength(4);
        expect(points[0]).toEqual(points[1]);
        expect(points[1]).toEqual(points[2]);
        expect(points[0]).not.toBe(points[1]);
        assertPath(points, source, target);
    });
});

describe('路徑純度', () => {
    it('凍結輸入仍可呼叫，輸出互不共用位置物件', () => {
        const source = Object.freeze({
            position: Object.freeze({ x: 1, y: 3, z: 0 }),
            side: 'bottom' as const,
        });
        const target = Object.freeze({
            position: Object.freeze({ x: 7, y: -1, z: 0 }),
            side: 'top' as const,
        });
        const fromBounds = Object.freeze({ ...leftBounds });
        const toBounds = Object.freeze({ ...rightBounds });
        const single = buildConnectionWaypoints(source, target);
        const gap = buildGapConnectionWaypoints(source, target, fromBounds, toBounds)!;
        const nextSingle = buildConnectionWaypoints(source, target);
        const nextGap = buildGapConnectionWaypoints(source, target, fromBounds, toBounds)!;
        expect(single).toEqual(nextSingle);
        expect(gap).toEqual(nextGap);
        for (const point of [...single, ...gap]) point.x = 999;
        expect(source.position.x).toBe(1);
        expect(target.position.x).toBe(7);
        expect(nextSingle[0].x).toBe(1);
        expect(nextGap[1].x).toBe(4);
        expect(fromBounds).toEqual(leftBounds);
        expect(toBounds).toEqual(rightBounds);
    });
});
