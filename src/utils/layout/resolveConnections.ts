/**
 * 由設備與管線幾何重算衍生連線
 *
 * 管線端點格（waypoints 首／末）與設備埠外側錨點（{@link resolvePortAnchorCell}）  \
 * 座標相等時掛上該埠；任一端無對上則該側為 `null`（斷線），管線本身不刪除。
 *
 * 初稿只做 **xy 幾何對齊**；媒質不相容等規則見 {@link canConnect}。
 *
 * 錨點展開／命中與 canConnect **共用** {@link collectPortAnchors}／{@link findPortAt}。
 */

import type { Connection, PlacedDevice, Pipeline } from '@/types/layout';
import {
    collectPortAnchors,
    defaultGetMachine,
    findPortAt,
    type GetMachineFn,
} from '@/utils/layout/portAnchorIndex';

export type { GetMachineFn } from '@/utils/layout/portAnchorIndex';

/**
 * 重算衍生連線：一條 pipeline → 一條 Connection（id 固定＝pipelineId）。
 *
 * @param devices 已放置設備
 * @param pipelines 管線（含絕對 waypoints）
 * @param getMachine 查機器定義；預設 {@link getMachineById}
 * @returns 與 pipelines 等長、順序對齊的 Connection 陣列
 *
 * @example
 * const connections = resolveConnections(devices, pipelines);
 * // 斷線時 from／to 可為 null；pipelines 陣列不變
 */
export function resolveConnections(
    devices: PlacedDevice[],
    pipelines: Pipeline[],
    getMachine: GetMachineFn = defaultGetMachine,
): Connection[] {
    const anchors = collectPortAnchors(devices, getMachine);

    return pipelines.map((pipeline) => {
        const waypoints = pipeline.waypoints;
        if (waypoints.length === 0) {
            return {
                id: pipeline.id,
                pipelineId: pipeline.id,
                from: null,
                to: null,
            };
        }

        const start = waypoints[0];
        const end = waypoints[waypoints.length - 1];

        /** 起點偏好輸出埠、終點偏好輸入埠（同格多埠時的穩定規則） */
        const from = findPortAt(anchors, start.x, start.y, 'output');
        const to = findPortAt(anchors, end.x, end.y, 'input');

        return {
            id: pipeline.id,
            pipelineId: pipeline.id,
            from,
            to,
        };
    });
}
