/**
 * 埠錨點索引：展開與命中判定
 *
 * 供 {@link resolveConnections} 與 {@link canConnect} **共用**——兩邊各寫一份時，
 * 同格多埠會對同一條 draft 解出不同的 from／to。
 */

import type { PlacedDevice, PortDirection, PortRef } from '@/types/layout';
import type { Machine, PortDef } from '@/types/machine';
import { getMachineMode } from '@/types/machine';
import { getMachineById } from '@/data/machines';
import { resolveDisplayGrid, rotatePort } from '@/utils/portUtils';
import { resolvePortAnchorCell } from '@/utils/layout/portAnchors';

/** 以 machineType（Machine.id）查機器定義 */
export type GetMachineFn = (machineType: string) => Machine | undefined;

/** 預設查表（與 resolveConnections 相同） */
export const defaultGetMachine: GetMachineFn = getMachineById;

/** 預先展開的埠錨點（平面格） */
export interface PortAnchorEntry {
    ref: PortRef;
    x: number;
    y: number;
}

/**
 * 展開所有設備的埠外側錨點。
 *
 * 查不到機器定義的設備略過（該機上的埠不會被對上）。
 */
export function collectPortAnchors(
    devices: readonly PlacedDevice[],
    getMachine: GetMachineFn = defaultGetMachine,
): PortAnchorEntry[] {
    const anchors: PortAnchorEntry[] = [];

    for (const device of devices) {
        const def = getMachine(device.machineType);
        if (!def) {
            continue;
        }

        const mode = getMachineMode(def, device.machineMode);
        const display = resolveDisplayGrid(def.width, def.height, device.rotation);

        const pushPorts = (ports: readonly PortDef[], portType: PortDirection): void => {
            for (let portIndex = 0; portIndex < ports.length; portIndex++) {
                const port = ports[portIndex];
                const rotated = rotatePort(
                    port.side,
                    port.offset,
                    def.width,
                    def.height,
                    device.rotation,
                );
                const cell = resolvePortAnchorCell(
                    device.position.x,
                    device.position.y,
                    display.widthCells,
                    display.heightCells,
                    rotated.side,
                    rotated.offset,
                );
                anchors.push({
                    ref: {
                        deviceId: device.id,
                        portType,
                        portIndex,
                    },
                    x: cell.x,
                    y: cell.y,
                });
            }
        };

        pushPorts(mode.input_ports, 'input');
        pushPorts(mode.output_ports, 'output');
    }

    return anchors;
}

/**
 * 在錨點表中找 (x, y) 對應的埠。
 *
 * 多個埠同格時：若有 `prefer` 方向優先；否則取掃描順序第一個。
 */
export function findPortAt(
    anchors: readonly PortAnchorEntry[],
    x: number,
    y: number,
    prefer?: PortDirection,
): PortRef | null {
    const matches = anchors.filter((a) => a.x === x && a.y === y);
    if (matches.length === 0) {
        return null;
    }
    if (prefer) {
        const preferred = matches.find((m) => m.ref.portType === prefer);
        if (preferred) {
            return preferred.ref;
        }
    }
    return matches[0].ref;
}
