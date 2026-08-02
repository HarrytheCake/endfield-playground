/**
 * E001 設備重疊偵測測試
 */

import { describe, it, expect } from 'vitest';
import { E001_deviceOverlap } from '@/lib/validation/detectors/E001_deviceOverlap';
import type { ValidationContext } from '@/types/validation';
import type { FactoryNode } from '@/types/graph';
import type { Machine } from '@/types/machine';

describe('E001_deviceOverlap', () => {
    // 測試用機器定義（2x2 設備）
    const mockMachine: Machine = {
        id: 'test_machine',
        name: '測試設備',
        width: 2,
        height: 2,
        power: 10,
        tags: [],
        is_source: false,
        is_sink: false,
        modes: [
            {
                id: 'base_mode',
                label: '基礎模式',
                input_ports: [],
                output_ports: [],
                loss: null,
            },
        ],
        onTick: null,
        onInput: null,
        onOutput: null,
        calcEfficiency: null,
    };

    // 輔助函式：建立測試設備
    function createDevice(id: string, x: number, y: number): FactoryNode {
        return {
            id,
            type: 'factory-node',
            position: { x, y },
            data: {
                label: '測試',
                machineType: 'test_machine',
            },
        };
    }

    // 輔助函式：建立測試 context
    function createContext(devices: FactoryNode[]): ValidationContext {
        return {
            devices,
            connections: [],
            getDef: () => mockMachine,
            baseRegion: null,
        };
    }

    it('H1：無設備時不應產生錯誤', () => {
        const ctx = createContext([]);
        const alerts = E001_deviceOverlap.run(ctx);
        expect(alerts).toHaveLength(0);
    });

    it('H2：單一設備時不應產生錯誤', () => {
        const device = createDevice('dev1', 0, 0);
        const ctx = createContext([device]);
        const alerts = E001_deviceOverlap.run(ctx);
        expect(alerts).toHaveLength(0);
    });

    it('H3：兩個不重疊的設備不應產生錯誤', () => {
        const deviceA = createDevice('devA', 0, 0); // 佔據 (0,0) ~ (1,1)
        const deviceB = createDevice('devB', 3, 3); // 佔據 (3,3) ~ (4,4)
        const ctx = createContext([deviceA, deviceB]);
        const alerts = E001_deviceOverlap.run(ctx);
        expect(alerts).toHaveLength(0);
    });

    it('H4：兩個完全重疊的設備應產生一筆錯誤', () => {
        const deviceA = createDevice('devA', 0, 0);
        const deviceB = createDevice('devB', 0, 0); // 同位置
        const ctx = createContext([deviceA, deviceB]);
        const alerts = E001_deviceOverlap.run(ctx);

        expect(alerts).toHaveLength(1);
        expect(alerts[0].code).toBe('E001');
        expect(alerts[0].level).toBe('error');
        expect(alerts[0].relatedDeviceUids).toContain('devA');
        expect(alerts[0].relatedDeviceUids).toContain('devB');
    });

    it('H5：兩個部分重疊的設備應產生一筆錯誤', () => {
        const deviceA = createDevice('devA', 0, 0); // 佔據 (0,0) ~ (1,1)
        const deviceB = createDevice('devB', 1, 1); // 佔據 (1,1) ~ (2,2)
        // 共用格子 (1,1)
        const ctx = createContext([deviceA, deviceB]);
        const alerts = E001_deviceOverlap.run(ctx);

        expect(alerts).toHaveLength(1);
        expect(alerts[0].code).toBe('E001');
    });

    it('H6：三個設備兩兩重疊應產生三筆錯誤', () => {
        const deviceA = createDevice('devA', 0, 0);
        const deviceB = createDevice('devB', 0, 0);
        const deviceC = createDevice('devC', 0, 0);
        const ctx = createContext([deviceA, deviceB, deviceC]);
        const alerts = E001_deviceOverlap.run(ctx);

        // 三台設備兩兩配對：(A,B), (A,C), (B,C)
        expect(alerts).toHaveLength(3);
    });

    it('H7：設備 machineType 為空時應跳過檢查', () => {
        const device: FactoryNode = {
            id: 'dev1',
            type: 'factory-node',
            position: { x: 0, y: 0 },
            data: {
                label: '測試',
                // machineType 未定義
            },
        };
        const ctx = createContext([device]);
        const alerts = E001_deviceOverlap.run(ctx);

        expect(alerts).toHaveLength(0);
    });

    it('H8：getDef 返回 undefined 時應跳過檢查', () => {
        const deviceA = createDevice('devA', 0, 0);
        const deviceB = createDevice('devB', 0, 0);
        const ctx: ValidationContext = {
            devices: [deviceA, deviceB],
            connections: [],
            getDef: () => undefined, // 模擬無定義
            baseRegion: null,
        };
        const alerts = E001_deviceOverlap.run(ctx);

        expect(alerts).toHaveLength(0);
    });
});
