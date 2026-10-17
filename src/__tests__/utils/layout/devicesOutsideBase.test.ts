/**
 * V15-C1／W1004-A0 ② — devicesOutsideBase 單元測試
 *
 * 釘：全在內／部分出界／完全出界／混合／旋轉出界／未知略過／null 基地；
 * 不寫 store；不改 canPlaceDevice。
 */

import { describe, expect, it } from 'vitest';
import type { PlacedDevice } from '@/types/layout';
import { devicesOutsideBase } from '@/utils/layout/devicesOutsideBase';

function makeSplitter(id: string, x: number, y = 0, rotation: 0 | 1 | 2 | 3 = 0): PlacedDevice {
    return {
        id,
        machineType: 'splitter',
        position: { x, y, z: 0 },
        rotation,
        label: id,
    };
}

/** 6×4；旋轉 1／3 時佔格變 4×6 */
function makeFillingMachine(
    id: string,
    x: number,
    y: number,
    rotation: 0 | 1 | 2 | 3 = 0,
): PlacedDevice {
    return {
        id,
        machineType: 'filling_machine',
        position: { x, y, z: 0 },
        rotation,
        label: id,
    };
}

describe('devicesOutsideBase', () => {
    it('未選基地（null）→ []', () => {
        expect(devicesOutsideBase([makeSplitter('a', 999, 999)], null)).toEqual([]);
    });

    it('全在基地內 → []', () => {
        expect(
            devicesOutsideBase([makeSplitter('a', 0, 0), makeSplitter('b', 10, 10)], 'wuling'),
        ).toEqual([]);
    });

    it('一台部分出界 → 含該 id', () => {
        /** wuling 256×256；1×1 在 (255,0) 全在內，佔兩格需更大機或貼邊多格 */
        /** filling 6×4 放在 x=251 → 佔 251..256，含 x=256 出界 */
        const result = devicesOutsideBase([makeFillingMachine('partial', 251, 0)], 'wuling');
        expect(result).toEqual(['partial']);
    });

    it('一台完全出界 → 含該 id', () => {
        expect(devicesOutsideBase([makeSplitter('far', 300, 0)], 'wuling')).toEqual(['far']);
    });

    it('多台混合 → 僅出界者（維持輸入順序）', () => {
        const result = devicesOutsideBase(
            [
                makeSplitter('in', 0, 0),
                makeSplitter('out', 300, 0),
                makeSplitter('in2', 5, 5),
                makeFillingMachine('edge', 251, 0),
            ],
            'wuling',
        );
        expect(result).toEqual(['out', 'edge']);
    });

    it('旋轉後佔格出界', () => {
        /**
         * filling 6×4 於 (0, 252)、rotation 0：y=252..255 全在 wuling 內。
         * rotation 1 → 佔格 4×6：y=252..257，含 256／257 出界。
         */
        const inside = makeFillingMachine('r0', 0, 252, 0);
        const outside = makeFillingMachine('r1', 0, 252, 1);
        expect(devicesOutsideBase([inside], 'wuling')).toEqual([]);
        expect(devicesOutsideBase([outside], 'wuling')).toEqual(['r1']);
    });

    it('未知機型略過（不進列表）', () => {
        const unknown: PlacedDevice = {
            id: 'ghost',
            machineType: 'not_a_real_machine_zzz',
            position: { x: 999, y: 999, z: 0 },
            rotation: 0,
        };
        expect(devicesOutsideBase([unknown, makeSplitter('far', 300, 0)], 'wuling')).toEqual([
            'far',
        ]);
    });

    it('valley4 邊界（192×192）', () => {
        expect(devicesOutsideBase([makeSplitter('ok', 191, 191)], 'valley4')).toEqual([]);
        expect(devicesOutsideBase([makeSplitter('out', 192, 0)], 'valley4')).toEqual(['out']);
    });
});
