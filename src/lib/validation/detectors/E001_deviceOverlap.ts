/**
 * E001 設備重疊偵測（CR-03）
 *
 * 觸發條件：兩台（含）以上設備佔用相同格子。  \
 * 對應 spec：`spec/03_validation.md` §2.2 「Error」 / E001。
 *
 * ---
 *
 * **遷移自 shirone 的草稿**（`origin/shirone/0522:src/validation_check/overlap.ts`）。  \
 * 原本是「增量更新（移動一台設備時只更新相關 overlap）」的設計，  \
 * 但本專案 Detector 為純函式（每次 run 都全量重算），  \
 * 因此 `remove_old_overlap` 這類增量 helper 不再需要 —— 已捨棄。
 *
 * 邏輯尚未實作，shirone 可依下列算法草稿補上 `run()` 內容。
 *
 * ---
 *
 * ### 算法草稿（取自 shirone 的 overlap.md）
 *
 * 使用格子掃描法（grid sweep）：
 *
 * 1. 建立 `grid: Map<"x,y", string[]>`（每格存放佔用該格的設備 uid 列表）
 * 2. 對每台 device：
 *    - 依其 position、size、rotation 計算佔用的所有格子座標
 *    - 對每個格子，若 grid 已有其他 uid，則該 uid 與本設備互相重疊
 *    - 將本設備 uid 推入 grid[該格]
 * 3. 將每組「重疊對」整理為 Alert
 *
 * 範例：position (3,3) + size (4,6) → 佔用 (3,3) ~ (6,8) 共 24 格。
 *
 * ---
 *
 * ### 待 shirone 補的細節
 *
 * - FactoryNode 的 `position` 是 Vue Flow 的 pixel 座標（非格子）；  \
 *   需先用 `canvasStore.gridSize` 換算為格子座標（或直接擴充 FactoryNodeData 新增 gridX/gridY）。
 * - Machine 的 width / height 來自 `ctx.getDef(machineType)`；非方形機器在 rotation = 1/3 時 W ↔ H 對調。
 * - 同一組重疊（A, B）只應產生**一筆** Alert（避免 (A,B) 與 (B,A) 重複）。
 */

import type { Alert, Detector, ValidationContext } from '@/types/validation';
import { getOccupiedCells, cellsOverlap } from '@/utils/geometryUtils';

/**
 * E001 detector 實例。  \
 * 註冊方式：`validationStore.registerDetector(E001_deviceOverlap)`
 *
 * @example
 * import { useValidationStore } from '@/store/validationStore'
 * import { E001_deviceOverlap } from '@/lib/validation/detectors/E001_deviceOverlap'
 *
 * useValidationStore().registerDetector(E001_deviceOverlap)
 */
export const E001_deviceOverlap: Detector = {
    code: 'E001',
    level: 'error',
    run(ctx: ValidationContext): Alert[] {
        const alerts: Alert[] = [];
        const devices = ctx.devices;

        // 使用兩層迴圈檢查所有設備對
        for (let i = 0; i < devices.length; i++) {
            for (let j = i + 1; j < devices.length; j++) {
                const deviceA = devices[i];
                const deviceB = devices[j];

                // 取得設備定義
                const defA = ctx.getDef(deviceA.data?.machineType ?? '');
                const defB = ctx.getDef(deviceB.data?.machineType ?? '');

                if (!defA || !defB) {
                    continue; // 跳過無效定義的設備
                }

                // 計算佔據的格子
                const cellsA = getOccupiedCells(deviceA, defA);
                const cellsB = getOccupiedCells(deviceB, defB);

                // 檢查重疊
                if (cellsOverlap(cellsA, cellsB)) {
                    alerts.push({
                        uid: crypto.randomUUID(),
                        level: 'error',
                        code: 'E001',
                        message: `設備「${defA.name}」與「${defB.name}」重疊`,
                        relatedDeviceUids: [deviceA.id, deviceB.id],
                        relatedConnectionUids: [],
                    });
                }
            }
        }

        return alerts;
    },
};
