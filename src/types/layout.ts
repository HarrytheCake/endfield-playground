/**
 * 佈局視角領域模型（V11）
 *
 * 設備與管線各自持有絕對格子座標；連接狀態由 `resolveConnections` 每次重算，  \
 * **不**寫入藍圖儲存。幾何佔格請轉成 {@link DeviceFootprint}／{@link PipelineFootprint}
 *（見 `src/utils/layout/toFootprint.ts`），勿讓 layout 型別直接耦合佔格展開。
 *
 * ## Breaking 註記（相對現行 editorStore／藍圖）
 *
 * | 舊 | 新（目標） | V11-B1 狀態 |
 * |----|------------|-------------|
 * | `nodes`／`edges` | `devices`／`pipelines`；`connections` 為衍生 | 型別已落地；平行 `layoutStore`（V12）不改 `editorStore` |
 * | `addConnection`／`removeConnection` | 廢除；改管線 path actions | 註記 |
 * | `removeDevices` 連帶刪邊 | 管線留在原地（可斷線） | 註記 |
 * | 藍圖 JSON `nodes`／`edges` | `devices`／`pipelines` | 註記（遷移不在 V12） |
 */

import type { Position } from '@/types/euclideanSpace';
import type { Rotation } from '@/types/editor';
import type { PortMedia } from '@/types/machine';

/** 埠方向：相對設備的輸入／輸出列表 */
export type PortDirection = 'input' | 'output';

/**
 * 設備上的一個埠參照（衍生連線端點）
 */
export interface PortRef {
    /** 已放置設備 uid */
    deviceId: string;
    /** 輸入或輸出埠 */
    portType: PortDirection;
    /** 對應當前 machineMode 下 ports 陣列的 0-based 索引 */
    portIndex: number;
}

/**
 * 已放置設備（佈局領域；藍圖目標儲存形之一）
 *
 * `machineType` 存 {@link Machine.id}（方案 B）。  \
 * `position` 為佔格左上角格子座標（含 z 佔用層起點）。
 */
export interface PlacedDevice {
    /** 實例 uid */
    id: string;
    /** 機器定義 id（snake_case） */
    machineType: string;
    /** 佔格左上角；z 為佔用層起點 */
    position: Position;
    /** 旋轉次數（0–3，順時針 90°） */
    rotation: Rotation;
    /**
     * 機器型態 id；缺省時以該機 `modes[0].id` 解釋
     */
    machineMode?: string;
    /** 顯示用標籤；缺省可由機器中文名填 */
    label?: string;
    /**
     * 配方索引（除錯／提示）；引擎產出以實際輸入匹配為準（V9-E1）
     */
    recipeIndex?: number;
    /** 節點環境標籤；缺省 `"none"` */
    environment?: string;
    /** Source 節點產出的品項名 */
    primaryOutput?: string;
    /** Source 節點產出速率（個／分） */
    sourceRatePerMin?: number;
}

/**
 * 管線（佈局領域；藍圖目標儲存形之一）
 *
 * 路徑以絕對格子 waypoints 表示（含兩端端點格）；**不含** Connection。  \
 * z 通常由媒質層慣例決定（belt＝0、pipe＝1），路徑本身不沿 z 位移。
 */
export interface Pipeline {
    /** 管線 uid */
    id: string;
    /** 傳輸媒質 */
    media: PortMedia;
    /**
     * 依序連接的格子座標：起點埠錨點 → 彎折點… → 終點埠錨點
     */
    waypoints: Position[];
}

/**
 * 衍生連線（**不**進藍圖儲存）
 *
 * 由 `resolveConnections(devices, pipelines)` 產生。  \
 * `from`／`to` 為 `null` 表示該端尚未對上任何埠錨點（斷線）；管線物件仍保留。
 */
export interface Connection {
    /**
     * 連線 id；初稿建議可穩定推導（例如綁定 `pipelineId`），  \
     * 實際規則由 resolveConnections 測試釘死。
     */
    id: string;
    /** 對應的管線 uid */
    pipelineId: string;
    /** 起點埠；斷線時為 null */
    from: PortRef | null;
    /** 終點埠；斷線時為 null */
    to: PortRef | null;
}

/**
 * 佈局快照（純資料；非 Pinia）
 *
 * 對應未來 `editorStore` 的 `devices`／`pipelines`；`connections` 不在此儲存。
 */
export interface LayoutSnapshot {
    devices: PlacedDevice[];
    pipelines: Pipeline[];
}

/**
 * 放置／移動失敗原因（V12 layoutStore）
 *
 * - `overlap`：與既有設備或管線佔格衝突
 * - `invalid`：缺機器定義、找不到 uid、重複 id、座標不合法等
 */
export type PlacementFailReason = 'overlap' | 'invalid';

/**
 * 放置合法性結果；**不 throw**，供 L2 決定是否畫紅框
 *
 * `overlap` 時帶 `conflicts`（detectOverlaps 的 id 配對），紅框只落在真正重疊者。  \
 * `invalid` 時可帶 `invalidIds`（缺定義／非法座標的物件）。
 */
export type PlacementResult =
    | { ok: true }
    | { ok: false; reason: 'overlap'; conflicts: [string, string][] }
    | { ok: false; reason: 'invalid'; invalidIds?: string[] };

/**
 * 佈局整體檢查結果；**同時**帶所有類別的問題
 *
 * 單一操作用 {@link PlacementResult}（一次一個 reason 就夠）；  \
 * 但整份佈局可能同時有「未知機型」與「兩台重疊」，只回一種 reason 會讓  \
 * L2 漏掉另一種的紅框，故聚合面另立本型別。
 *
 * `invalidIds` 的物件**不參與**重疊偵測：缺機器定義或座標非有限者無法展開佔格，  \
 * id 重複者無法把佔格歸給哪一個，硬算只會得到「自己跟自己重疊」這種無意義配對。
 */
export interface LayoutIssues {
    /** `invalidIds` 與 `conflicts` 皆空時為 true */
    ok: boolean;
    /** 不合法者：缺機器定義、座標非有限、id 空或重複、管線路徑不良構 */
    invalidIds: string[];
    /** 重疊的 id 配對；來自 `detectOverlaps` */
    conflicts: [string, string][];
}
