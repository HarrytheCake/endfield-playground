import type { Position } from '@/types/euclideanSpace';
import type { PortSide } from '@/types/machine';

/** 已映射至固定媒質層的外側格錨點，不包含 store 或視覺邊心。 */
export interface ConnectionAnchor {
    /** 同一次呼叫的兩端須在同一 z 層，且各軸為整數格。 */
    readonly position: Readonly<Position>;
    /** 設備旋轉後的埠所在邊，用於決定路徑先走的軸。 */
    readonly side: PortSide;
}

/** 旋轉後設備佔格的閉區間；呼叫端負責查詢設備與映射尺寸。 */
export interface ConnectionDeviceBounds {
    /** 最左側佔格的 x。 */
    readonly left: number;
    /** 最右側佔格的 x，包含此格。 */
    readonly right: number;
    /** 最上側佔格的 y。 */
    readonly top: number;
    /** 最下側佔格的 y，包含此格。 */
    readonly bottom: number;
}

/**
 * 產生直線或單轉角路徑，保持既有來源埠優先的選軸規則。
 * 輸入須為同層整數格錨點；本函式不驗證媒質、碰撞或端點身分。
 * @param source 來源錨點與旋轉後埠方位
 * @param target 目標錨點與旋轉後埠方位
 * @returns 獨立的位置副本；同格兩端亦保留，不簡化零長度段
 * @example
 * buildConnectionWaypoints(
 *     { position: { x: 0, y: 0, z: 0 }, side: 'right' },
 *     { position: { x: 4, y: 3, z: 0 }, side: 'top' },
 * );
 */
export function buildConnectionWaypoints(
    source: ConnectionAnchor,
    target: ConnectionAnchor,
): Position[] {
    /** 回傳值不可持有輸入的可寫參考。 */
    const first = { ...source.position };
    /** 兩端各自複製，連同格路徑也不共用同一物件。 */
    const last = { ...target.position };
    /** 路徑只在本次呼叫內組裝，避免多次預覽共用狀態。 */
    const waypoints = [first];
    if (first.x !== last.x && first.y !== last.y) {
        waypoints.push(
            source.side === 'left' || source.side === 'right'
                ? { x: last.x, y: first.y, z: first.z }
                : { x: first.x, y: last.y, z: first.z },
        );
    }
    waypoints.push(last);
    return waypoints;
}

/**
 * 僅沿兩端設備間的固定中央通道產生雙轉角，不搜尋其他繞障路徑。
 * 呼叫端須提供同層整數錨點及有效閉區間；結果仍須交給既有碰撞預檢。
 * @param source 來源錨點與旋轉後埠方位
 * @param target 目標錨點與旋轉後埠方位
 * @param sourceBounds 來源設備旋轉後的佔格範圍
 * @param targetBounds 目標設備旋轉後的佔格範圍
 * @returns 獨立的路徑副本；方向不支援或沒有至少一格通道時回 null
 * @example
 * buildGapConnectionWaypoints(
 *     { position: { x: 1, y: 3, z: 0 }, side: 'bottom' },
 *     { position: { x: 7, y: -1, z: 0 }, side: 'top' },
 *     { left: 0, right: 2, top: 0, bottom: 2 },
 *     { left: 6, right: 8, top: 0, bottom: 2 },
 * );
 */
export function buildGapConnectionWaypoints(
    source: ConnectionAnchor,
    target: ConnectionAnchor,
    sourceBounds: ConnectionDeviceBounds,
    targetBounds: ConnectionDeviceBounds,
): Position[] | null {
    /** 上下埠僅使用水平分離的設備空隙。 */
    const verticalPorts =
        (source.side === 'top' || source.side === 'bottom') &&
        (target.side === 'top' || target.side === 'bottom');
    /** 左右埠僅使用垂直分離的設備空隙。 */
    const horizontalPorts =
        (source.side === 'left' || source.side === 'right') &&
        (target.side === 'left' || target.side === 'right');
    /** 排除左右兩台設備本體，交換來源目標也選同一閉區間。 */
    const gapLeft =
        sourceBounds.right < targetBounds.left ? sourceBounds.right + 1 : targetBounds.right + 1;
    /** 水平通道最後一格，不包含右側設備。 */
    const gapRight =
        sourceBounds.right < targetBounds.left ? targetBounds.left - 1 : sourceBounds.left - 1;
    /** 垂直方向同樣排除設備本體。 */
    const gapTop =
        sourceBounds.bottom < targetBounds.top ? sourceBounds.bottom + 1 : targetBounds.bottom + 1;
    /** 垂直通道最後一格，不包含下側設備。 */
    const gapBottom =
        sourceBounds.bottom < targetBounds.top ? targetBounds.top - 1 : sourceBounds.top - 1;
    /** 端點副本與折點分開配置，輸出可安全供呼叫端組裝本地候選。 */
    const first = { ...source.position };
    /** 保留輸入順序與固定媒質層。 */
    const last = { ...target.position };
    if (verticalPorts && gapLeft <= gapRight) {
        /** 負座標亦向下取整，不採四捨五入或逐格搜尋。 */
        const laneX = Math.floor((gapLeft + gapRight) / 2);
        return [
            first,
            { x: laneX, y: first.y, z: first.z },
            { x: laneX, y: last.y, z: first.z },
            last,
        ];
    }
    if (horizontalPorts && gapTop <= gapBottom) {
        /** 與水平通道採相同的固定中線規則。 */
        const laneY = Math.floor((gapTop + gapBottom) / 2);
        return [
            first,
            { x: first.x, y: laneY, z: first.z },
            { x: last.x, y: laneY, z: first.z },
            last,
        ];
    }
    return null;
}
