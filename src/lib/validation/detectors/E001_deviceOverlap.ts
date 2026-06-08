import type { Alert, Detector, ValidationContext } from '@/types/validation';
import type { FactoryNode } from '@/types/graph';
import type { Machine } from '@/types/machine';

const GRID_CELL_SIZE = 16;

function gridCoordinate(value: number): number {
    return Math.round(value / GRID_CELL_SIZE);
}

function getRotation(node: FactoryNode): number {
    return ((node.data?.rotation ?? 0) as number) % 4;
}

function getMachineSize(machine: Machine, rotation: number): { width: number; height: number } {
    return rotation % 2 === 1
        ? { width: machine.height, height: machine.width }
        : { width: machine.width, height: machine.height };
}

function getOccupiedCells(node: FactoryNode, machine: Machine): Array<{ x: number; y: number }> {
    const rotation = getRotation(node);
    const { width, height } = getMachineSize(machine, rotation);
    const startX = gridCoordinate(node.position.x);
    const startY = gridCoordinate(node.position.y);

    const cells: Array<{ x: number; y: number }> = [];
    for (let x = startX; x < startX + width; x += 1) {
        for (let y = startY; y < startY + height; y += 1) {
            cells.push({ x, y });
        }
    }
    return cells;
}

export const E001_deviceOverlap: Detector = {
    code: 'E001',
    level: 'error',
    run(ctx: ValidationContext): Alert[] {
        const cellMap = new Map<string, string[]>();
        const alerts: Alert[] = [];
        const reportedPairs = new Set<string>();

        for (const device of ctx.devices) {
            const machineType = device.data?.machineType;
            if (!machineType) continue;

            const machine = ctx.getDef(machineType);
            if (!machine) continue;

            const deviceCells = getOccupiedCells(device, machine);
            for (const cell of deviceCells) {
                const key = `${cell.x},${cell.y}`;
                const existing = cellMap.get(key) ?? [];
                cellMap.set(key, [...existing, device.id]);
            }
        }

        for (const deviceIds of cellMap.values()) {
            if (deviceIds.length < 2) continue;

            for (let i = 0; i < deviceIds.length - 1; i += 1) {
                for (let j = i + 1; j < deviceIds.length; j += 1) {
                    const first = deviceIds[i];
                    const second = deviceIds[j];
                    const pairKey = first < second ? `${first}|${second}` : `${second}|${first}`;
                    if (reportedPairs.has(pairKey)) continue;
                    reportedPairs.add(pairKey);

                    const firstNode = ctx.devices.find((d) => d.id === first);
                    const secondNode = ctx.devices.find((d) => d.id === second);
                    const firstLabel = firstNode?.data?.label ?? first;
                    const secondLabel = secondNode?.data?.label ?? second;

                    const message = `設備重疊：${firstLabel} 與 ${secondLabel}`;
                    alerts.push({
                        uid: crypto.randomUUID(),
                        level: 'error',
                        code: 'E001',
                        message: message,
                        relatedDeviceUids: [first, second],
                        relatedConnectionUids: [],
                    });
                    console.log('[E001]', message, { first, second });
                }
            }
        }

        return alerts;
    },
};
