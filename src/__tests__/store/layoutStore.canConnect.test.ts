/**
 * addPipeline 內部 canConnect 防線（V14 提前接入）
 *
 * 斷線管線（規則 7）仍可寫入；同向／反向／自連須 invalid 且不進 store。
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useLayoutStore } from '@/store/layoutStore';
import type { PlacedDevice } from '@/types/layout';
import type { Machine } from '@/types/machine';
import { getMachineById } from '@/data/machines';
import { getMachineMode } from '@/types/machine';
import { resolveDisplayGrid, rotatePort } from '@/utils/portUtils';
import { resolvePortAnchorCell } from '@/utils/layout/portAnchors';

function freshStore() {
    setActivePinia(createPinia());
    return useLayoutStore();
}

function makeSplitter(id: string, x: number, y: number): PlacedDevice {
    return {
        id,
        machineType: 'splitter',
        position: { x, y, z: 0 },
        rotation: 0,
        label: id,
    };
}

function portAnchor(
    device: PlacedDevice,
    portType: 'input' | 'output',
    portIndex: number,
): { x: number; y: number; z: number } {
    const machine = getMachineById(device.machineType) as Machine;
    const mode = getMachineMode(machine, device.machineMode);
    const ports = portType === 'input' ? mode.input_ports : mode.output_ports;
    const port = ports[portIndex];
    const rotated = rotatePort(
        port.side,
        port.offset,
        machine.width,
        machine.height,
        device.rotation,
    );
    const display = resolveDisplayGrid(machine.width, machine.height, device.rotation);
    const cell = resolvePortAnchorCell(
        device.position.x,
        device.position.y,
        display.widthCells,
        display.heightCells,
        rotated.side,
        rotated.offset,
    );
    return { x: cell.x, y: cell.y, z: 0 };
}

describe('useLayoutStore.addPipeline — canConnect 防線', () => {
    beforeEach(() => freshStore());

    it('兩端未命中埠（規則 7）→ 仍可寫入', () => {
        const store = useLayoutStore();
        expect(
            store.addPipeline({
                id: 'float',
                media: 'belt',
                waypoints: [
                    { x: 50, y: 50, z: 0 },
                    { x: 51, y: 50, z: 0 },
                ],
            }),
        ).toEqual({ ok: true });
        expect(store.pipelines).toHaveLength(1);
    });

    it('output → input → ok', () => {
        const store = useLayoutStore();
        const src = makeSplitter('src', 0, 0);
        const dst = makeSplitter('dst', 4, 0);
        store.addDevice(src);
        store.addDevice(dst);

        /** splitter 右出＝output[1]；左入＝input[0] */
        const start = portAnchor(src, 'output', 1);
        const end = portAnchor(dst, 'input', 0);

        expect(
            store.addPipeline({
                id: 'ok-belt',
                media: 'belt',
                waypoints: [start, { x: 2, y: 0, z: 0 }, end],
            }),
        ).toEqual({ ok: true });
        expect(store.pipelines).toHaveLength(1);
    });

    it('同機兩 output → invalid，不寫入', () => {
        const store = useLayoutStore();
        const device = makeSplitter('a', 0, 0);
        store.addDevice(device);

        const start = portAnchor(device, 'output', 0); // top
        const end = portAnchor(device, 'output', 1); // right

        expect(
            store.addPipeline({
                id: 'bad-same',
                media: 'belt',
                waypoints: [start, { x: start.x + 1, y: start.y, z: 0 }, end],
            }),
        ).toEqual({ ok: false, reason: 'invalid', invalidIds: ['bad-same'] });
        expect(store.pipelines).toHaveLength(0);
    });

    it('兩機 output → output → invalid，不寫入', () => {
        const store = useLayoutStore();
        const a = makeSplitter('a', 0, 0);
        const b = makeSplitter('b', 4, 0);
        store.addDevice(a);
        store.addDevice(b);

        const start = portAnchor(a, 'output', 1);
        const end = portAnchor(b, 'output', 1);

        expect(
            store.addPipeline({
                id: 'bad-dir',
                media: 'belt',
                waypoints: [start, { x: 2, y: 0, z: 0 }, end],
            }),
        ).toEqual({ ok: false, reason: 'invalid', invalidIds: ['bad-dir'] });
        expect(store.pipelines).toHaveLength(0);
    });

    it('反向 input → output → invalid，不寫入', () => {
        const store = useLayoutStore();
        const src = makeSplitter('src', 0, 0);
        const dst = makeSplitter('dst', 4, 0);
        store.addDevice(src);
        store.addDevice(dst);

        const start = portAnchor(dst, 'input', 0);
        const end = portAnchor(src, 'output', 1);

        expect(
            store.addPipeline({
                id: 'reversed',
                media: 'belt',
                waypoints: [start, { x: 2, y: 0, z: 0 }, end],
            }),
        ).toEqual({ ok: false, reason: 'invalid', invalidIds: ['reversed'] });
        expect(store.pipelines).toHaveLength(0);
    });
});
