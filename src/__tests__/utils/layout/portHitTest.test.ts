/**
 * V15-D1／W1004-A0 ③ — hitTestPortAt 單元測試
 *
 * 釘：視覺埠邊心命中／熱區邊緣／區外／四向旋轉視覺點／多埠最近／無 store。
 */

import { describe, expect, it } from 'vitest';
import type { PlacedDevice } from '@/types/layout';
import type { PortSide } from '@/types/machine';
import { portPointOnMachine, resolveDisplayGrid, rotatePort } from '@/utils/portUtils';
import { DEFAULT_HIT_RADIUS_CELLS, hitTestPortAt } from '@/utils/layout/portHitTest';
import { getMachineById } from '@/data/machines';

function makeSplitter(id: string, x: number, y: number, rotation: 0 | 1 | 2 | 3 = 0): PlacedDevice {
    return {
        id,
        machineType: 'splitter',
        position: { x, y, z: 0 },
        rotation,
        label: id,
    };
}

/** splitter 指定埠在畫布上的視覺邊心（與 hitTestPortAt 同源） */
function visualPortPoint(
    device: PlacedDevice,
    portType: 'input' | 'output',
    portIndex: number,
): { x: number; y: number; side: PortSide } {
    const def = getMachineById(device.machineType);
    if (!def) throw new Error('missing machine');
    const mode = def.modes[0];
    const ports = portType === 'input' ? mode.input_ports : mode.output_ports;
    const port = ports[portIndex];
    if (!port) throw new Error('missing port');
    const rotated = rotatePort(port.side, port.offset, def.width, def.height, device.rotation);
    const display = resolveDisplayGrid(def.width, def.height, device.rotation);
    const local = portPointOnMachine(
        rotated.side,
        rotated.offset,
        display.widthCells,
        display.heightCells,
    );
    return {
        x: device.position.x + local.x,
        y: device.position.y + local.y,
        side: rotated.side,
    };
}

describe('hitTestPortAt', () => {
    it('預設熱區半徑為半格', () => {
        expect(DEFAULT_HIT_RADIUS_CELLS).toBe(0.5);
    });

    it('點在埠視覺位置 → 命中（含 PortRef 三鍵＋side＋media）', () => {
        const device = makeSplitter('s', 10, 10, 0);
        const visual = visualPortPoint(device, 'input', 0);
        const hit = hitTestPortAt({ x: visual.x, y: visual.y }, [device]);

        expect(hit).toEqual({
            deviceId: 's',
            portType: 'input',
            portIndex: 0,
            side: 'left',
            media: 'belt',
        });
    });

    it('審查案例：左埠視覺 (10,10.5) 命中 input 0，不命中鄰埠', () => {
        const device = makeSplitter('s', 10, 10, 0);
        const hit = hitTestPortAt({ x: 10, y: 10.5 }, [device]);
        expect(hit).toMatchObject({
            deviceId: 's',
            portType: 'input',
            portIndex: 0,
            side: 'left',
        });
    });

    it('錨點格左上角／格心不再當圓心（審查反例）', () => {
        const device = makeSplitter('s', 10, 10, 0);
        /** 舊實作會命中左錨 (9,10)；修正後圓心在 (10,10.5)，距 (9,10)＝√1.25＞0.5 */
        expect(hitTestPortAt({ x: 9, y: 10 }, [device])).toBeNull();
        /** 左錨格心 (9.5,10.5) 距視覺點＝0.5 → 仍在熱區邊界，應命中左埠 */
        expect(hitTestPortAt({ x: 9.5, y: 10.5 }, [device])).toMatchObject({
            portType: 'input',
            portIndex: 0,
        });
    });

    it('點在熱區邊緣內（距離＝0.5）→ 命中', () => {
        const device = makeSplitter('s', 10, 10, 0);
        const visual = visualPortPoint(device, 'input', 0);
        const hit = hitTestPortAt({ x: visual.x - 0.5, y: visual.y }, [device]);
        expect(hit).toMatchObject({ portType: 'input', portIndex: 0 });
    });

    it('點在熱區外 → null', () => {
        const device = makeSplitter('s', 10, 10, 0);
        const visual = visualPortPoint(device, 'input', 0);
        expect(hitTestPortAt({ x: visual.x - 0.51, y: visual.y }, [device])).toBeNull();
        expect(hitTestPortAt({ x: 100, y: 100 }, [device])).toBeNull();
    });

    it.each([
        { rotation: 0 as const, expectSide: 'left' as const },
        { rotation: 1 as const, expectSide: 'top' as const },
        { rotation: 2 as const, expectSide: 'right' as const },
        { rotation: 3 as const, expectSide: 'bottom' as const },
    ])(
        'rotation=$rotation：點擊 input 視覺位置 → 命中該埠、不命中鄰埠',
        ({ rotation, expectSide }) => {
            const device = makeSplitter(`r${rotation}`, 10, 10, rotation);
            const visual = visualPortPoint(device, 'input', 0);
            expect(visual.side).toBe(expectSide);

            const hit = hitTestPortAt({ x: visual.x, y: visual.y }, [device]);
            expect(hit).toMatchObject({
                deviceId: device.id,
                portType: 'input',
                portIndex: 0,
                side: expectSide,
            });

            /** 鄰埠視覺點各自命中自己，不互相搶 */
            for (const portIndex of [0, 1, 2]) {
                const outVisual = visualPortPoint(device, 'output', portIndex);
                const outHit = hitTestPortAt({ x: outVisual.x, y: outVisual.y }, [device]);
                expect(outHit).toMatchObject({
                    portType: 'output',
                    portIndex,
                    side: outVisual.side,
                });
                expect(outHit?.portType === 'input' && outHit.portIndex === 0).toBe(false);
            }
        },
    );

    it('多埠同時在熱區內 → 取距離最近者', () => {
        const a = makeSplitter('a', 0, 0, 0);
        const b = makeSplitter('b', 5, 0, 0);
        const aVisual = visualPortPoint(a, 'output', 1); // right
        const hit = hitTestPortAt({ x: aVisual.x, y: aVisual.y }, [a, b]);
        expect(hit?.deviceId).toBe('a');
    });

    it('同距離時取展開掃描序較前者', () => {
        const device = makeSplitter('s', 10, 10, 0);
        const left = visualPortPoint(device, 'input', 0); // (10, 10.5)
        const top = visualPortPoint(device, 'output', 0); // (10.5, 10)
        const midX = (left.x + top.x) / 2;
        const midY = (left.y + top.y) / 2;
        /** 視覺圓心中點到兩埠皆 √0.125 ≈ 0.353，等距且在預設熱區內 */
        const dLeft = Math.hypot(midX - left.x, midY - left.y);
        const dTop = Math.hypot(midX - top.x, midY - top.y);
        expect(dLeft).toBeCloseTo(dTop, 10);
        expect(dLeft).toBeLessThan(DEFAULT_HIT_RADIUS_CELLS);

        /** 掃描序 input 先於 output → left input 勝 */
        const hit = hitTestPortAt({ x: midX, y: midY }, [device]);
        expect(hit).toMatchObject({
            deviceId: 's',
            portType: 'input',
            portIndex: 0,
        });
    });

    it('緊貼埠對埠：prefer 不受設備陣列順序影響', () => {
        const a = makeSplitter('a', 0, 0, 0);
        const b = makeSplitter('b', 1, 0, 0);
        /** A 右出與 B 左入視覺點皆 (1, 0.5) */
        const aRight = visualPortPoint(a, 'output', 1);
        const bLeft = visualPortPoint(b, 'input', 0);
        expect(aRight).toMatchObject({ x: 1, y: 0.5 });
        expect(bLeft).toMatchObject({ x: 1, y: 0.5 });

        for (const order of [
            [a, b],
            [b, a],
        ] as const) {
            const point = { x: 1, y: 0.5 };
            expect(
                hitTestPortAt(point, order, undefined, { prefer: 'output' }),
                `order=${order.map((d) => d.id).join(',')} prefer=output`,
            ).toMatchObject({
                deviceId: 'a',
                portType: 'output',
                portIndex: 1,
            });
            expect(
                hitTestPortAt(point, order, undefined, { prefer: 'input' }),
                `order=${order.map((d) => d.id).join(',')} prefer=input`,
            ).toMatchObject({
                deviceId: 'b',
                portType: 'input',
                portIndex: 0,
            });
        }
    });

    it('未知機型設備不產生命中', () => {
        const ghost: PlacedDevice = {
            id: 'ghost',
            machineType: 'not_a_real_machine_zzz',
            position: { x: 0, y: 0, z: 0 },
            rotation: 0,
        };
        expect(hitTestPortAt({ x: 0, y: 0 }, [ghost])).toBeNull();
    });

    it('空設備列表 → null', () => {
        expect(hitTestPortAt({ x: 0, y: 0 }, [])).toBeNull();
    });
});

describe('hitTestPortAt — 無 store 依賴', () => {
    it('模組原始碼不含 pinia／store import', async () => {
        const fs = await import('node:fs/promises');
        const path = await import('node:path');
        const src = await fs.readFile(path.resolve('src/utils/layout/portHitTest.ts'), 'utf8');
        expect(src).not.toMatch(/from ['"]@\/store\//);
        expect(src).not.toMatch(/from ['"]pinia['"]/);
        expect(src).not.toMatch(/defineStore|useLayoutStore|useEditorStore/);
    });
});
