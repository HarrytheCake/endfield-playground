# W1018-T1：連線幾何抽離驗證紀錄

日期：2026-10-28。依據 [分析文件](./W1018-T1_connection_waypoints_analysis.md)。

## 變更與責任邊界

- 新增 `src/utils/layout/connectionWaypoints.ts`：buildConnectionWaypoints 生成直線／單轉角，buildGapConnectionWaypoints 生成固定空隙雙轉角，無可用通道時回 null。
- 純函式僅使用既有 Position、PortSide 型別與參數，不讀取 Vue、Pinia、DOM、機型資料或碰撞狀態。輸入以 readonly 表達，回傳各自獨立的位置副本。
- LayoutView 只映射錨點、媒質層與旋轉後設備範圍，再呼叫函式。元件已無方向選軸、gap 邊界、laneX／laneY 中線及折點公式。
- 保留原有預檢順序：canConnect、完整 PortRef 比對、assessInvolving；只有原路徑碰撞限於來源／目標設備時才嘗試空隙路徑，替代路徑仍須通過碰撞檢查。
- 不引入自動避障、不改完整 C3 方向矩陣、不修改 store。先前旋轉修正及未提交文件均保留。

## 步驟 1：基準

dev/toby HEAD 為 a9e3209，與遠端因前次 rebase 而分歧。開始時已有 LayoutView 旋轉提示修正、PR 文案及 1028 文件；本次在既有內容上修改，未提交或推送。

## 步驟 2：純函式與單元測試

新增 `src/__tests__/utils/layout/connectionWaypoints.test.ts`，**51 項通過**。涵蓋四來源方向及四象限、直線／同格、水平／垂直空隙及反向、奇偶／負座標中線、至少一格通道、緊鄰／交疊／包含範圍、混合方向不產生空隙路徑、z=0／1、重複折點與輸入凍結／輸出不共用參考。

各有效案例亦檢查端點順序、軸對齊、整數座標及固定 z。測試使用純資料，未啟動 Vue／Pinia，未使用圖片或 JSON fixture。

針對性指令：`pnpm test -- src/__tests__/utils/layout/connectionWaypoints.test.ts`，1 個檔案、51 項通過。

## 步驟 3：LayoutView 串接

已改為呼叫兩個純函式。connectionDeviceBounds 只保留 store／機型查詢與 resolveDisplayGrid 尺寸映射，回傳明確 ConnectionDeviceBounds 型別；候選 id、media、語意規則、碰撞檢查及 pointerup 唯一提交入口不變。

靜態檢查：LayoutView 無 laneX、laneY、gapLeft、gapRight、gapTop、gapBottom、verticalPorts 或 horizontalPorts 計算。既有旋轉入口仍呼叫 #79 的 action，沒有復原為自訂 L1 實作。

## 步驟 4：正式頁驗證

使用系統暫存腳本啟動 Chromium headless，開啟本機正式頁 `http://127.0.0.1:5174/`。透過既有 loadSnapshot 建立情境，再以原生滑鼠從輸出埠拖曳到輸入埠，讀取 SVG 預覽座標與實際儲存的 waypoints 比對，並檢查歷史筆數。

| 案例 | 結果 |
| --- | --- |
| 共線直線 | 預覽與兩點提交一致，一筆歷史 |
| 單轉角 | 預期折點、預覽、提交一致 |
| 水平空隙雙轉角 | 固定中央 x 通道，預覽與提交一致 |
| 右往左連線 | 選相同通道，保持輸出到輸入順序 |
| 旋轉非正方設備的垂直空隙 | 旋轉後範圍映射正確，固定中央 y 通道 |
| 第三設備擋住空隙替代路徑 | 無法提交、零新增歷史 |
| 既有管線擋住空隙替代路徑 | 無法提交，保留原管線、零新增歷史 |
| 原路徑撞第三設備 | 不改道，維持拒絕 |
| 無空隙 | 保留原候選並拒絕，不生成任意外繞路徑 |
| pipe 單轉角 | 全線 z=1，預覽與提交一致 |
| pointercancel 取消有效預覽 | 清除預覽，不提交、不新增歷史 |

最終 **11 組通過，pageerror=0**。

腳本調整紀錄：直線 SVG polyline 的幾何高度為零，Playwright 的 visible 判斷不適用，改檢查節點已掛載再比對座標；旋轉案例更正預期埠位置為既有 rotatePort 所對應的位置；取消改用現有 pointercancel 事件，未把未實作的 Escape 行為當成驗收條件。每次修正腳本後均完整重跑；未因此更改產品行為。

## 步驟 5：完整品質檢查

依 validate-changes skill 依序執行，全部通過：

1. pnpm format。
2. pnpm lint。
3. pnpm type-check。
4. pnpm test：**57 個測試檔、1028 項測試通過**。

相較上一項旋轉驗證增加 1 個幾何測試檔、51 項測試；未修改 L1 store 或旋轉契約測試。

## 步驟 6：交付檢查

git diff --check 與文件相對連結檢查通過。layoutStore.ts、layoutStore.rotation.test.ts、GridCanvas.stories.ts 及 WarningIcon 本體相對 origin/master 均無差異。

暫時瀏覽器腳本已刪除，未新增演示頁、測試圖片、截圖或 JSON 報告。本次尚未提交或推送。
