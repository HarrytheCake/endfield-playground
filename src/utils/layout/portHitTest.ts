/**
 * 埠熱區命中（V15／W1004-A0 ③｜R-C1）
 *
 * 供 L2 draft 連線呼叫。輸入為**連續格座標**（原點＝格左上角；像素 ↔ 格由 L2 換算）。
 * 熱區圓心＝設備邊上的埠邊心（{@link portPointOnMachine}），**不是**外側錨點格索引。
 * 勿與格點精確匹配的 {@link findPortAt}（給 `canConnect`）混淆。
 *
 * draft 狀態不在本模組（C1 §4.1 方案 C＝L2 local ref）。
 */

import type { PlacedDevice, PortDirection, PortRef } from '@/types/layout';
import type { PortDef, PortMedia, PortSide } from '@/types/machine';
import { getMachineMode } from '@/types/machine';
import { portPointOnMachine, resolveDisplayGrid, rotatePort } from '@/utils/portUtils';
import { defaultGetMachine, type GetMachineFn } from '@/utils/layout/portAnchorIndex';

/** 預設熱區半徑（格）；C1 §4.3 凍結 ≥ 半格 */
export const DEFAULT_HIT_RADIUS_CELLS = 0.5;

/**
 * 熱區命中結果＝{@link PortRef}＋旋轉後 `side`＋`media`
 */
export type PortHitResult = PortRef & {
    /** 旋轉後的埠邊（與錨點／視覺點計算同源） */
    side: PortSide;
    /** 埠媒介（belt／pipe；來自機型 PortDef） */
    media: PortMedia;
};

/** 等距判定用的平方距離容差（浮點誤差） */
const DIST_SQ_EPS = 1e-12;

/** {@link hitTestPortAt} 可選參數 */
export interface HitTestPortOptions {
    /**
     * 熱區半徑（格）；預設 {@link DEFAULT_HIT_RADIUS_CELLS}（0.5）。
     * 呼叫端若需更大熱區可覆寫；螢幕像素下限由 L2 換算進 `point` 後再呼叫。
     */
    hitRadiusCells?: number;
    /**
     * 同點／等距多埠時優先的方向（比照 {@link findPortAt}）。
     * C1 L2：開始拖線傳 `'output'`，放開時傳 `'input'`。
     * 未指定時等距取展開掃描序較前者。
     */
    prefer?: PortDirection;
}

/** 展開後的命中目標（視覺圓心＋回傳欄位） */
interface PortHitTarget {
    /** 設備 id */
    deviceId: string;
    /** 埠方向 */
    portType: PortDirection;
    /** 埠索引 */
    portIndex: number;
    /** 旋轉後的埠邊 */
    side: PortSide;
    /** 埠媒介 */
    media: PortMedia;
    /** 熱區圓心 x（連續格座標） */
    x: number;
    /** 熱區圓心 y（連續格座標） */
    y: number;
}

/**
 * 在設備埠視覺位置的熱區內找命中埠。
 *
 * - 輸入慣例：連續格座標，原點為格左上角（非整數合法；像素換算由 L2 完成）
 * - 熱區圓心＝旋轉後設備邊上的埠邊心（{@link portPointOnMachine}）；與外側錨點格無關
 * - 距離＝點到圓心的歐氏距離（格）
 * - 多埠同時在半徑內：**距離最近**者勝
 * - 距離相同（含浮點誤差內）：若有 `prefer` 則優先 `portType === prefer`；否則取展開掃描序較前者
 *
 * @param point 連續格座標（原點＝格左上角）
 * @param devices 已放置設備
 * @param getMachine 機器查表；預設與 resolveConnections 相同
 * @param options 熱區／`prefer` 等
 */
export function hitTestPortAt(
    point: { x: number; y: number },
    devices: readonly PlacedDevice[],
    getMachine: GetMachineFn = defaultGetMachine,
    options?: HitTestPortOptions,
): PortHitResult | null {
    const radius = options?.hitRadiusCells ?? DEFAULT_HIT_RADIUS_CELLS;
    const radiusSq = radius * radius;
    const prefer = options?.prefer;
    const targets = collectPortHitTargets(devices, getMachine);

    let best: PortHitTarget | null = null;
    let bestDistSq = Infinity;

    for (const target of targets) {
        const dx = point.x - target.x;
        const dy = point.y - target.y;
        const distSq = dx * dx + dy * dy;
        if (distSq > radiusSq) {
            continue;
        }
        /** 明顯較近 → 直接勝出；等距時保留掃描序較前者（除非 `prefer` 指定另一方向） */
        if (best === null || distSq < bestDistSq - DIST_SQ_EPS) {
            bestDistSq = distSq;
            best = target;
            continue;
        }
        if (
            prefer &&
            Math.abs(distSq - bestDistSq) <= DIST_SQ_EPS &&
            target.portType === prefer &&
            best.portType !== prefer
        ) {
            best = target;
        }
    }

    if (!best) {
        return null;
    }

    return {
        deviceId: best.deviceId,
        portType: best.portType,
        portIndex: best.portIndex,
        side: best.side,
        media: best.media,
    };
}

/**
 * 展開所有設備埠的熱區目標（視覺圓心＋side／media）。
 *
 * 掃描序與 {@link collectPortAnchors} 相同：設備序 → input → output；查不到機型略過。
 */
function collectPortHitTargets(
    devices: readonly PlacedDevice[],
    getMachine: GetMachineFn,
): PortHitTarget[] {
    const targets: PortHitTarget[] = [];

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
                const local = portPointOnMachine(
                    rotated.side,
                    rotated.offset,
                    display.widthCells,
                    display.heightCells,
                );
                targets.push({
                    deviceId: device.id,
                    portType,
                    portIndex,
                    side: rotated.side,
                    media: port.media,
                    x: device.position.x + local.x,
                    y: device.position.y + local.y,
                });
            }
        };

        pushPorts(mode.input_ports, 'input');
        pushPorts(mode.output_ports, 'output');
    }

    return targets;
}
