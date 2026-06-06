/**
 * CR-03 驗證系統型別定義
 *
 * Detector 為純函式：吃 ValidationContext，吐 Alert[]。  \
 * useValidationStore 統一收集所有 detector 結果為 alerts 陣列。
 */

import type { FactoryNode, FactoryEdge } from './graph';
import type { Machine } from './machine';

/** 警示等級 */
export type AlertLevel = 'error' | 'warning';

/**
 * 單一警示項目
 */
export interface Alert {
    /** 警示唯一識別碼（建議用 crypto.randomUUID()） */
    uid: string;
    /** 警示等級 */
    level: AlertLevel;
    /** 警示代碼，例如 'E001' / 'W003' */
    code: string;
    /** 人類可讀說明 */
    message: string;
    /** 相關設備 uid 列表（用於畫布導覽與紅框顯示） */
    relatedDeviceUids: string[];
    /** 相關管線 uid 列表 */
    relatedConnectionUids: string[];
}

/**
 * Detector 執行所需上下文
 *
 * 由 useValidationStore.run() 統一組裝後傳入。  \
 * 不含 graph topology 結構 —— E001~E006 detector 均不需要，  \
 * 若未來新 detector 確實需要 graph，再由 aaaaa 從 useFlowEngine.ts 暴露對應 helper 補入。
 */
export interface ValidationContext {
    /** 範圍內所有已部署設備 */
    devices: FactoryNode[];
    /** 範圍內所有已部署管線 */
    connections: FactoryEdge[];
    /** 取得設備靜態定義（耗電量、port 配置、tags 等） */
    getDef: (machineType: string) => Machine | undefined;
}

/**
 * Detector 介面
 *
 * 每個 detector 必須為純函式，無副作用，僅依輸入 context 決定輸出。  \
 * 同一個 ctx 多次執行應產生相同結果。
 *
 * @example
 * import type { Detector } from '@/types/validation'
 *
 * export const E001_deviceOverlap: Detector = {
 *   code: 'E001',
 *   level: 'error',
 *   run(ctx) {
 *     const alerts: Alert[] = []
 *     // ... 偵測重疊邏輯
 *     return alerts
 *   },
 * }
 */
export interface Detector {
    /** 警示代碼，必須與 detector 產出的 Alert.code 一致 */
    code: string;
    /** 警示等級 */
    level: AlertLevel;
    /** 執行偵測，回傳 Alert 列表（無問題時回傳空陣列） */
    run: (ctx: ValidationContext) => Alert[];
}
