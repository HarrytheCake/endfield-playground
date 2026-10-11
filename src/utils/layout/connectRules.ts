/**
 * 連線前檢查（V14／W0921-A1｜R-C2）
 *
 * 規則依 [detail/C2 §4.1](docs/roadmap/detail/C2_add_connection_contract.md)：
 * 方向／媒質三方一致／單埠單線／自連；斷線（規則 7）＝null **本身**不違規，
 * 但已命中埠的那一端仍套用規則 1–3。
 *
 * 端點判定與 {@link resolveConnections} **共用** {@link collectPortAnchors}／{@link findPortAt}。
 * 埠媒質與 FlowEngine **共用** {@link getMachinePortMedia}。
 *
 * `layoutStore.addPipeline` 已呼叫本函式；`addDevice`／`moveDevice` 幾何貼上既有管線
 * **尚未**重跑本檢查（已知缺口，見 V14_closeout）。
 */

import type { PlacedDevice, Pipeline, PortRef } from '@/types/layout';
import type { PortMedia } from '@/types/machine';
import {
    collectPortAnchors,
    defaultGetMachine,
    findPortAt,
    type GetMachineFn,
} from '@/utils/layout/portAnchorIndex';
import { getMachinePortMedia } from '@/utils/layout/portMedia';
import { pipelineWaypointsValid } from '@/utils/layout/placementCheck';
import { resolveConnections } from '@/utils/layout/resolveConnections';

/** 連線失敗原因；命名風格對齊 PlacementFailReason */
export type ConnectFailReason = 'direction' | 'media' | 'port_occupied' | 'self_loop' | 'malformed';

/** 媒質不符的單一埠 */
export interface PortMediaMismatch {
    port: PortRef;
    /** 該埠實際的媒質 */
    media: PortMedia;
}

/**
 * 連線可行性結果；不 throw，供 L2 決定 draft 的顏色
 *
 * `ok: true` 時 from／to 可為 null（合法但尚未接上；見規則 7）。
 * `message` **不**放進 union——見 {@link describeConnectFailure}。
 * `direction.ports` 長度 1 或 2（單端斷線時只列已命中端）。
 */
export type ConnectResult =
    | { ok: true; from: PortRef | null; to: PortRef | null }
    | { ok: false; reason: 'direction'; ports: PortRef[] }
    | { ok: false; reason: 'media'; pipelineMedia: PortMedia; mismatched: PortMediaMismatch[] }
    | { ok: false; reason: 'port_occupied'; occupied: PortRef[] }
    | { ok: false; reason: 'self_loop'; deviceId: string }
    | { ok: false; reason: 'malformed' };

/** 目前佈局；唯讀 */
export interface ConnectLayoutView {
    devices: readonly PlacedDevice[];
    pipelines: readonly Pipeline[];
}

function portRefKey(ref: PortRef): string {
    return `${ref.deviceId}\0${ref.portType}\0${ref.portIndex}`;
}

/**
 * 連線前檢查：draft 管線會不會產生非法連線
 *
 * @param draft 尚未落地的管線；不需要 id（還沒生）
 * @param layout 目前佈局；用來展開埠錨點與查已佔用的埠
 */
export function canConnect(
    draft: Pick<Pipeline, 'media' | 'waypoints'>,
    layout: ConnectLayoutView,
    getMachine: GetMachineFn = defaultGetMachine,
): ConnectResult {
    const asPipeline: Pipeline = {
        id: '__draft_pipeline__',
        media: draft.media,
        waypoints: draft.waypoints,
    };
    if (!pipelineWaypointsValid(asPipeline)) {
        return { ok: false, reason: 'malformed' };
    }

    const anchors = collectPortAnchors(layout.devices, getMachine);
    const start = draft.waypoints[0];
    const end = draft.waypoints[draft.waypoints.length - 1];
    const from = findPortAt(anchors, start.x, start.y, 'output');
    const to = findPortAt(anchors, end.x, end.y, 'input');

    /**
     * 規則 7：from／to 為 null **本身**不是違規（兩端皆空＝純斷線放行）。
     * 已命中的那一端仍須通過方向／媒質／單埠單線。
     */
    if (from === null && to === null) {
        return { ok: true, from, to };
    }

    if (from !== null && to !== null && from.deviceId === to.deviceId) {
        return { ok: false, reason: 'self_loop', deviceId: from.deviceId };
    }

    /** 有序：已命中端必須是 output（起）／input（終） */
    const directionPorts: PortRef[] = [];
    if (from !== null && from.portType !== 'output') {
        directionPorts.push(from);
    }
    if (to !== null && to.portType !== 'input') {
        directionPorts.push(to);
    }
    if (directionPorts.length > 0) {
        return { ok: false, reason: 'direction', ports: directionPorts };
    }

    const deviceById = new Map(layout.devices.map((d) => [d.id, d]));
    const mismatched: PortMediaMismatch[] = [];
    for (const ref of [from, to]) {
        if (ref === null) continue;
        const device = deviceById.get(ref.deviceId);
        const media = getMachinePortMedia(
            device?.machineType ?? '',
            device?.machineMode,
            ref.portType,
            ref.portIndex,
            getMachine,
        );
        if (media == null || media !== draft.media) {
            mismatched.push({
                port: ref,
                media: media ?? draft.media,
            });
        }
    }
    if (mismatched.length > 0) {
        return {
            ok: false,
            reason: 'media',
            pipelineMedia: draft.media,
            mismatched,
        };
    }

    const existing = resolveConnections([...layout.devices], [...layout.pipelines], getMachine);
    const occupiedKeys = new Set<string>();
    for (const conn of existing) {
        if (conn.from) occupiedKeys.add(portRefKey(conn.from));
        if (conn.to) occupiedKeys.add(portRefKey(conn.to));
    }
    const occupied: PortRef[] = [];
    if (from !== null && occupiedKeys.has(portRefKey(from))) occupied.push(from);
    if (to !== null && occupiedKeys.has(portRefKey(to))) occupied.push(to);
    if (occupied.length > 0) {
        return { ok: false, reason: 'port_occupied', occupied };
    }

    return { ok: true, from, to };
}

/**
 * 把失敗結果轉成一行繁中短句；`ok` 時回 null
 */
export function describeConnectFailure(result: ConnectResult): string | null {
    if (result.ok) return null;
    switch (result.reason) {
        case 'malformed':
            return '管線路徑不良構（須至少兩點、座標有限、逐段軸對齊）';
        case 'direction':
            return '須由輸出埠接到輸入埠';
        case 'self_loop':
            return `不可連接同一台設備（${result.deviceId}）`;
        case 'media':
            return `管線媒質（${result.pipelineMedia}）與埠媒質不一致`;
        case 'port_occupied':
            return '埠已被其他管線佔用';
        default: {
            const _exhaustive: never = result;
            return _exhaustive;
        }
    }
}
