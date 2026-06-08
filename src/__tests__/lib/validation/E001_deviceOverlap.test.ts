import { describe, it, expect } from 'vitest';
import { E001_deviceOverlap } from '@/lib/validation/detectors/E001_deviceOverlap';
import { getMachine } from '@/data/machines';
import type { ValidationContext } from '@/types/validation';
import type { FactoryNode } from '@/types/graph';

function makeNode(id: string, x: number, y: number, machineType: string, label?: string, rotation?: number): FactoryNode {
    return {
        id,
        type: 'default',
        position: { x, y },
        data: {
            label: label ?? `${machineType} ${id}`,
            machineType,
            rotation,
        },
    };
}

describe('E001_deviceOverlap', () => {
    const baseCtx: ValidationContext = {
        devices: [],
        connections: [],
        getDef: getMachine,
    };

    it('should report overlap when two devices occupy the same grid cell', () => {
        const ctx: ValidationContext = {
            ...baseCtx,
            devices: [makeNode('a', 0, 0, '粉碎機'), makeNode('b', 0, 0, '配件機')],
        };

        const alerts = E001_deviceOverlap.run(ctx);

        expect(alerts).toHaveLength(1);
        expect(alerts[0].code).toBe('E001');
        expect(alerts[0].level).toBe('error');
        expect(alerts[0].relatedDeviceUids).toEqual(['a', 'b']);
        expect(alerts[0].message).toContain('a');
        expect(alerts[0].message).toContain('b');
    });

    it('should not report overlap when devices are adjacent but not sharing cells', () => {
        const ctx: ValidationContext = {
            ...baseCtx,
            devices: [makeNode('a', 0, 0, '粉碎機'), makeNode('b', 120, 0, '配件機')],
        };

        const alerts = E001_deviceOverlap.run(ctx);

        expect(alerts).toHaveLength(0);
    });

    it('should dedupe overlapping pairs when more than two devices share cells', () => {
        const ctx: ValidationContext = {
            ...baseCtx,
            devices: [
                makeNode('a', 0, 0, '粉碎機'),
                makeNode('b', 0, 0, '配件機'),
                makeNode('c', 0, 0, '精煉爐'),
            ],
        };

        const alerts = E001_deviceOverlap.run(ctx);

        expect(alerts).toHaveLength(3);
        const pairs = alerts.map((alert) => alert.relatedDeviceUids.sort().join('|'));
        expect(new Set(pairs)).toEqual(new Set(['a|b', 'a|c', 'b|c']));
    });
});
