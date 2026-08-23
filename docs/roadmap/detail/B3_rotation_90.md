# R-B3 — 旋轉 90 度

| meta | value |
|------|-------|
| 對應大綱 | [ROADMAP_OUTLINE.md](../ROADMAP_OUTLINE.md) §4 |
| 里程碑 | M2（2026-09-27）；最遲不得晚於 9/27 |
| 擋門檻 | 否（加分，但 10 月連線月依賴其正確性） |
| 建議主責／備援 | toby／harry（暫定）／aaaaa 提供 port 換算測試 |
| 性質 | 接線（L2） |
| 依賴 | [A2](./A2_grid_and_port_alignment.md)、[B2](./B2_placement_chain.md) |
| 狀態 | `[!]` 封鎖中（同 B2 人力；且需 A2 錯機清單） |
| 最後更新 | 2026-08-22 |

---

## 1. 背景與動機

旋轉表面上是「方塊轉 90 度」，實際上是**埠的換算問題**。一台 3×2 的機器轉 90 度後變 2×3，原本在 `top` 邊 offset 1 的埠會跑到 `right` 邊，offset 也要跟著換算。如果這層算錯，10 月的 port 對 port 連線會連到不存在的位置，而且錯得很隱蔽——畫面上看起來有埠，點下去卻找不到。

`src/utils/portUtils.ts` 已提供 `rotatePortSide(side, rotation)` 與 `rotatePortOffset(...)`，`rotateDevice(uid, rotation)` 也已在 `editorStore.ts:421` 就位。本項是把它們接起來並證明四種角度都對，不是重寫換算邏輯。

主編把旋轉標為「可進 8 月或 9 月」，實務上排在 9 月：8 月要先把 [A2](./A2_grid_and_port_alignment.md) 的 rotation=0 基準打穩，否則會在錯的基準上驗證旋轉。

## 2. 使用者看得到什麼

拿起中或已放置的設備按旋轉鍵，方塊轉 90 度，長寬互換，埠點跟著轉到正確的邊。

## 3. 現況盤點

| 對象 | 路徑 | 現況 |
|------|------|------|
| 旋轉 action | `editorStore.rotateDevice(uid, rotation)` | 已有，進歷史 |
| 埠換算 | `rotatePortSide`、`rotatePortOffset` | 已有 |
| 型別 | `Rotation`（`0｜1｜2｜3`） | 已有 |
| toby 既有實績 | git 上已做過旋轉相關提交 | 有基礎，但未穩定 |
| 佔格 | `getOccupiedCells` | 需確認是否吃 rotation（[A2](./A2_grid_and_port_alignment.md) 一併驗） |

## 4. 技術決策

### 4.1 rotation 的語意（凍結）

| 值 | 意義 |
|----|------|
| 0 | 原始方向 |
| 1 | 順時針 90 度 |
| 2 | 180 度 |
| 3 | 順時針 270 度 |

`size` 在 rotation 為 1 或 3 時 width／height 互換。**這個互換只在渲染與佔格換算時發生，不寫回資料**——`machine.size` 永遠是原始值。

### 4.2 方案比較：旋轉時機

| 方案 | 作法 | 優點 | 缺點 | 採用 |
|------|------|------|------|------|
| A. 只能已放置後旋轉 | 選取 → 按鍵 → `rotateDevice` | 實作最單純；一定進歷史 | 放歪了要放完再轉，多一步 | 部分 |
| B. 只能拿起時旋轉 | 預覽狀態轉，落子時帶 rotation | 使用者體驗好 | 預覽 rotation 是 L2 local，不進歷史，需小心不寫入 store | 部分 |
| **C. 兩者都做，分兩週** | 9/20 先 A，9/27 補 B | 每週可單獨驗收；符合 ≤2h 切片 | 跨兩週 | **是** |

若工時不足只能擇一，**優先 A**：已放置旋轉一定進歷史，語意乾淨；預覽旋轉是體驗優化。

### 4.3 硬規則

1. 埠換算**只**呼叫 `portUtils`，禁止在容器或元件內自己寫 `switch (side)`
2. 預覽 rotation 可留 L2 local ref；**落子時**經 `placeDevice` 一次帶入，不得先放再偷偷改 node
3. 不得為旋轉新增 `editorStore` action；`rotateDevice` 已足夠

## 5. 檔案計畫

| 動作 | 檔案 | 說明 |
|------|------|------|
| 修改 | `src/editor/canvas/FactoryCanvas.vue` | 綁旋轉鍵，呼叫 `rotateDevice` |
| 修改 | `src/composables/useShortcuts.ts` | 若旋轉鍵走既有快捷鍵機制則在此註冊 |
| 修改 | `src/components/MachineShape.vue` | 依 rotation 換 width／height 與埠位置 |
| 新建 | `src/__tests__/utils/portRotation.test.ts` | 四種 rotation × 四個 side 的換算斷言（aaaaa 提供） |
| 唯讀 | `src/utils/portUtils.ts` | 不改邏輯 |
| **不碰** | 連線、多選旋轉、任意角度 | |

## 6. 週切片

| 週日 | 切片 |
|------|------|
| 09/13 | aaaaa 交 `portRotation.test.ts`（純函式側先釘死） |
| 09/20 | 已放置設備可轉 90 度，方塊長寬互換 |
| 09/27 | 埠點位置跟著轉正確；預覽旋轉（若工時允許） |

## 7. 不做

- 不做任意角度旋轉（只有 4 個離散值）
- 不做多選旋轉
- 不做旋轉時的碰撞檢查（重疊由 11 月的 E001 呈現）
- 不做旋轉動畫

## 8. 依賴與封鎖

| 依賴 | 說明 |
|------|------|
| [A2](./A2_grid_and_port_alignment.md) | rotation=0 的基準必須先正確，否則無法判斷旋轉錯在哪 |
| [B2](./B2_placement_chain.md) | 需先能穩定放下設備 |
| 人力 | 同 [B2](./B2_placement_chain.md)；封鎖解除條件相同 |

## 9. DoD

- [ ] 已放置設備按鍵可轉 90 度，四次回到原狀
- [ ] rotation 為 1／3 時方塊長寬互換，佔格數不變
- [ ] 埠點出現在換算後的正確邊與 offset（抽查 2 台多埠機器）
- [ ] `portRotation.test.ts` 涵蓋四種 rotation × 四個 side 並通過
- [ ] 全域搜尋確認無自寫的 side 換算 switch
- [ ] 旋轉後按 Undo 能還原角度

## 10. 風險與未交頂替

| 風險 | 對策 |
|------|------|
| 埠換算錯得隱蔽（畫面看似正常） | 純函式測試先行（9/13），不靠目視 |
| 在 A2 尚未完成時開工，驗不出對錯 | 排序硬性：A2 → B3 |
| 為了畫面好看而在元件內硬幹換算 | DoD 列入全域搜尋檢查 |

**未交頂替：** 9/27 門檻不綁本項；但**若 9/27 未完成，10/25 連線月的必要條件將失去基礎**（斜向或錯邊的埠無法連線）。因此若 9/27 未交，須在該日會上立即改派或由 aaaaa 在 L1 側補完換算並降級為「只支援 rotation=0 的連線」。

## 11. 開發日誌

### 2026-08-22
- 建檔。確認 `rotatePortSide`／`rotatePortOffset` 已存在，本項為接線而非實作換算
