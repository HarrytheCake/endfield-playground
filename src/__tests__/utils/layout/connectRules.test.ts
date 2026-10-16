/**
 * V14-D1 — connectRules 單元測試（W0921-A1）
 *
 * 釘：方向／媒質／單埠單線／自連各一正一反；規則 7 斷線放行；malformed。
 * `resolveConnections` 既有測試不得為此改動。
 */

import { describe, it, expect } from 'vitest';
import type { Machine } from '@/types/machine';
import type { PlacedDevice, Pipeline } from '@/types/layout';
import { getMachineMode } from '@/types/machine';
import { resolveDisplayGrid, rotatePort } from '@/utils/portUtils';
import { resolvePortAnchorCell } from '@/utils/layout/portAnchors';
import { canConnect, describeConnectFailure } from '@/utils/layout/connectRules';

/** 1×1：左入、右出（belt） */
function stubBelt1x1(): Machine {
    return {
        id: 'stub_belt',
        name: 'stub belt',
        width: 1,
        height: 1,
        power: 0,
        tags: [],
        is_source: false,
        is_sink: false,
        modes: [
            {
                id: 'default',
                label: '預設',
                input_ports: [{ side: 'left', offset: 0, media: 'belt' }],
                output_ports: [{ side: 'right', offset: 0, media: 'belt' }],
                loss: null,
            },
        ],
        onTick: null,
        onInput: null,
        onOutput: null,
        calcEfficiency: null,
    };
}

/** 1×1：左入、右出（pipe） */
function stubPipe1x1(): Machine {
    const base = stubBelt1x1();
    return {
        ...base,
        id: 'stub_pipe',
        name: 'stub pipe',
        modes: [
            {
                id: 'default',
                label: '預設',
                input_ports: [{ side: 'left', offset: 0, media: 'pipe' }],
                output_ports: [{ side: 'right', offset: 0, media: 'pipe' }],
                loss: null,
            },
        ],
    };
}

const belt = stubBelt1x1();
const pipe = stubPipe1x1();

const getMachine = (id: string): Machine | undefined => {
    if (id === belt.id) return belt;
    if (id === pipe.id) return pipe;
    return undefined;
};

function portAnchor(
    device: PlacedDevice,
    machine: Machine,
    portType: 'input' | 'output',
    portIndex: number,
    z: number,
): { x: number; y: number; z: number } {
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
    return { x: cell.x, y: cell.y, z };
}

function deviceAt(id: string, machineType: string, x: number, y: number): PlacedDevice {
    return { id, machineType, position: { x, y, z: 0 }, rotation: 0 };
}

describe('canConnect — malformed', () => {
    it('少於兩點 → malformed', () => {
        expect(
            canConnect(
                { media: 'belt', waypoints: [{ x: 0, y: 0, z: 0 }] },
                { devices: [], pipelines: [] },
                getMachine,
            ),
        ).toEqual({ ok: false, reason: 'malformed' });
    });

    it('斜向段 → malformed', () => {
        expect(
            canConnect(
                {
                    media: 'belt',
                    waypoints: [
                        { x: 0, y: 0, z: 0 },
                        { x: 1, y: 1, z: 0 },
                    ],
                },
                { devices: [], pipelines: [] },
                getMachine,
            ),
        ).toEqual({ ok: false, reason: 'malformed' });
    });
});

describe('canConnect — 規則 7 斷線放行', () => {
    it('兩端皆未命中埠 → ok:true 且 from／to 為 null', () => {
        const result = canConnect(
            {
                media: 'belt',
                waypoints: [
                    { x: 99, y: 99, z: 0 },
                    { x: 100, y: 99, z: 0 },
                ],
            },
            { devices: [], pipelines: [] },
            getMachine,
        );
        expect(result).toEqual({ ok: true, from: null, to: null });
    });

    it('僅一端命中 output、終點懸空 → ok:true', () => {
        const src = deviceAt('src', 'stub_belt', 0, 0);
        const start = portAnchor(src, belt, 'output', 0, 0);
        const result = canConnect(
            {
                media: 'belt',
                waypoints: [start, { x: start.x + 1, y: start.y, z: 0 }],
            },
            { devices: [src], pipelines: [] },
            getMachine,
        );
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.from).toEqual({ deviceId: 'src', portType: 'output', portIndex: 0 });
            expect(result.to).toBeNull();
        }
    });

    it('起點落在 input、終點懸空 → direction（非 null 端仍查）', () => {
        const src = deviceAt('src', 'stub_belt', 0, 0);
        const start = portAnchor(src, belt, 'input', 0, 0);
        const result = canConnect(
            {
                media: 'belt',
                waypoints: [start, { x: start.x - 1, y: start.y, z: 0 }],
            },
            { devices: [src], pipelines: [] },
            getMachine,
        );
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.reason).toBe('direction');
            if (result.reason === 'direction') {
                expect(result.ports).toEqual([
                    { deviceId: 'src', portType: 'input', portIndex: 0 },
                ]);
            }
        }
    });

    it('pipe 從 belt 輸出拉出、終點懸空 → media', () => {
        const src = deviceAt('src', 'stub_belt', 0, 0);
        const start = portAnchor(src, belt, 'output', 0, 0);
        const result = canConnect(
            {
                media: 'pipe',
                waypoints: [start, { x: start.x + 1, y: start.y, z: 0 }],
            },
            { devices: [src], pipelines: [] },
            getMachine,
        );
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.reason).toBe('media');
    });

    it('輸出埠已被佔用、再拉同起點懸空管線 → port_occupied', () => {
        const src = deviceAt('src', 'stub_belt', 0, 0);
        const dst = deviceAt('dst', 'stub_belt', 4, 0);
        const start = portAnchor(src, belt, 'output', 0, 0);
        const end = portAnchor(dst, belt, 'input', 0, 0);
        const existing: Pipeline = {
            id: 'taken',
            media: 'belt',
            waypoints: [start, { x: 2, y: 0, z: 0 }, end],
        };
        const result = canConnect(
            {
                media: 'belt',
                waypoints: [start, { x: start.x + 1, y: start.y, z: 0 }],
            },
            { devices: [src, dst], pipelines: [existing] },
            getMachine,
        );
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.reason).toBe('port_occupied');
    });
});

describe('canConnect — 方向', () => {
    it('output → input → ok', () => {
        const src = deviceAt('src', 'stub_belt', 0, 0);
        const dst = deviceAt('dst', 'stub_belt', 4, 0);
        const start = portAnchor(src, belt, 'output', 0, 0);
        const end = portAnchor(dst, belt, 'input', 0, 0);

        const result = canConnect(
            { media: 'belt', waypoints: [start, { x: 2, y: 0, z: 0 }, end] },
            { devices: [src, dst], pipelines: [] },
            getMachine,
        );
        expect(result).toEqual({
            ok: true,
            from: { deviceId: 'src', portType: 'output', portIndex: 0 },
            to: { deviceId: 'dst', portType: 'input', portIndex: 0 },
        });
    });

    it('兩端皆 output → direction', () => {
        const a = deviceAt('a', 'stub_belt', 0, 0);
        const b = deviceAt('b', 'stub_belt', 4, 0);
        /** 兩台的右（output）錨點互連：起終皆偏好 output 時仍可能命中 output */
        const start = portAnchor(a, belt, 'output', 0, 0);
        const end = portAnchor(b, belt, 'output', 0, 0);

        const result = canConnect(
            { media: 'belt', waypoints: [start, { x: 2, y: 0, z: 0 }, end] },
            { devices: [a, b], pipelines: [] },
            getMachine,
        );

        /**
         * 終點偏好 input，但 b 的 output 錨若無 input 同格，會落到 output。
         * 起點亦為 output → 非 output→input。
         */
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.reason).toBe('direction');
    });

    it('兩端皆 input → direction', () => {
        const a = deviceAt('a', 'stub_belt', 0, 0);
        const b = deviceAt('b', 'stub_belt', 4, 0);
        const start = portAnchor(a, belt, 'input', 0, 0);
        const end = portAnchor(b, belt, 'input', 0, 0);

        const result = canConnect(
            { media: 'belt', waypoints: [start, { x: 2, y: 0, z: 0 }, end] },
            { devices: [a, b], pipelines: [] },
            getMachine,
        );

        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.reason).toBe('direction');
    });

    it('起點 input、終點 output（反向）→ direction', () => {
        const src = deviceAt('src', 'stub_belt', 0, 0);
        const dst = deviceAt('dst', 'stub_belt', 4, 0);
        /** waypoints 反過來：起點在 dst 的 input、終點在 src 的 output */
        const start = portAnchor(dst, belt, 'input', 0, 0);
        const end = portAnchor(src, belt, 'output', 0, 0);

        const result = canConnect(
            { media: 'belt', waypoints: [start, { x: 2, y: 0, z: 0 }, end] },
            { devices: [src, dst], pipelines: [] },
            getMachine,
        );

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.reason).toBe('direction');
            expect(describeConnectFailure(result)).toBe('須由輸出埠接到輸入埠');
        }
    });
});

describe('canConnect — 媒質', () => {
    it('三方 belt 一致 → ok', () => {
        const src = deviceAt('src', 'stub_belt', 0, 0);
        const dst = deviceAt('dst', 'stub_belt', 4, 0);
        const start = portAnchor(src, belt, 'output', 0, 0);
        const end = portAnchor(dst, belt, 'input', 0, 0);

        expect(
            canConnect(
                { media: 'belt', waypoints: [start, { x: 2, y: 0, z: 0 }, end] },
                { devices: [src, dst], pipelines: [] },
                getMachine,
            ).ok,
        ).toBe(true);
    });

    it('pipe 管線接到 belt 埠 → media', () => {
        const src = deviceAt('src', 'stub_belt', 0, 0);
        const dst = deviceAt('dst', 'stub_belt', 4, 0);
        const start = portAnchor(src, belt, 'output', 0, 0);
        const end = portAnchor(dst, belt, 'input', 0, 0);

        const result = canConnect(
            { media: 'pipe', waypoints: [start, { x: 2, y: 0, z: 0 }, end] },
            { devices: [src, dst], pipelines: [] },
            getMachine,
        );
        expect(result.ok).toBe(false);
        if (!result.ok && result.reason === 'media') {
            expect(result.pipelineMedia).toBe('pipe');
            expect(result.mismatched.length).toBeGreaterThan(0);
            expect(result.mismatched.every((m) => m.media === 'belt')).toBe(true);
        }
    });
});

describe('canConnect — 自連', () => {
    it('兩端落在不同設備 → 非 self_loop', () => {
        const src = deviceAt('src', 'stub_belt', 0, 0);
        const dst = deviceAt('dst', 'stub_belt', 4, 0);
        const start = portAnchor(src, belt, 'output', 0, 0);
        const end = portAnchor(dst, belt, 'input', 0, 0);
        expect(
            canConnect(
                { media: 'belt', waypoints: [start, { x: 2, y: 0, z: 0 }, end] },
                { devices: [src, dst], pipelines: [] },
                getMachine,
            ).ok,
        ).toBe(true);
    });

    it('兩端同一設備 → self_loop', () => {
        /** 2×1 機：左入右出，waypoints 從右錨繞到左錨 */
        const wide: Machine = {
            ...belt,
            id: 'stub_wide',
            width: 2,
            height: 1,
        };
        const get = (id: string) => (id === wide.id ? wide : undefined);
        const d: PlacedDevice = {
            id: 'solo',
            machineType: 'stub_wide',
            position: { x: 0, y: 0, z: 0 },
            rotation: 0,
        };
        const start = portAnchor(d, wide, 'output', 0, 0);
        const end = portAnchor(d, wide, 'input', 0, 0);
        const result = canConnect(
            {
                media: 'belt',
                waypoints: [start, { x: start.x, y: 2, z: 0 }, { x: end.x, y: 2, z: 0 }, end],
            },
            { devices: [d], pipelines: [] },
            get,
        );
        expect(result).toEqual({ ok: false, reason: 'self_loop', deviceId: 'solo' });
    });
});

describe('canConnect — 單埠單線', () => {
    it('埠空閒 → ok', () => {
        const src = deviceAt('src', 'stub_belt', 0, 0);
        const dst = deviceAt('dst', 'stub_belt', 4, 0);
        const start = portAnchor(src, belt, 'output', 0, 0);
        const end = portAnchor(dst, belt, 'input', 0, 0);
        expect(
            canConnect(
                { media: 'belt', waypoints: [start, { x: 2, y: 0, z: 0 }, end] },
                { devices: [src, dst], pipelines: [] },
                getMachine,
            ).ok,
        ).toBe(true);
    });

    it('目標埠已被佔用 → port_occupied', () => {
        const src = deviceAt('src', 'stub_belt', 0, 0);
        const dst = deviceAt('dst', 'stub_belt', 4, 0);
        const other = deviceAt('other', 'stub_belt', 0, 3);
        const start = portAnchor(src, belt, 'output', 0, 0);
        const end = portAnchor(dst, belt, 'input', 0, 0);
        const otherStart = portAnchor(other, belt, 'output', 0, 0);

        const existing: Pipeline = {
            id: 'taken',
            media: 'belt',
            waypoints: [otherStart, { x: end.x, y: otherStart.y, z: 0 }, end],
        };

        const result = canConnect(
            { media: 'belt', waypoints: [start, { x: 2, y: 0, z: 0 }, end] },
            { devices: [src, dst, other], pipelines: [existing] },
            getMachine,
        );
        expect(result.ok).toBe(false);
        if (!result.ok && result.reason === 'port_occupied') {
            expect(
                result.occupied.some(
                    (p) => p.deviceId === 'dst' && p.portType === 'input' && p.portIndex === 0,
                ),
            ).toBe(true);
        }
    });
});

describe('describeConnectFailure', () => {
    it('ok 時回 null', () => {
        expect(describeConnectFailure({ ok: true, from: null, to: null })).toBeNull();
    });

    it('malformed 有繁中短句', () => {
        expect(describeConnectFailure({ ok: false, reason: 'malformed' })).toMatch(/不良構/);
    });
});
