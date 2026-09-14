# V12-A1 — 範圍與定案

**對應工項：** V12-A1  
**狀態：** `[x]` 定案完成（2026-09-11）  
**日期：** 2026-09-11  
**開發分支：** `dev/aaaaa0907`  
**正式依據：** [W0907-A0](../../../work_dispatch/aaaaa/0907/W0907-A0_layout_store_model.md)、[WEEK_20260907](../../../work_dispatch/WEEK_20260907.md) v1.1、[todolist_v12](../todolist_v12.md)

> **執行計畫：** 本檔所屬之 `todolist_v12`＋`dev_v12/` **即為** layout store 執行計畫檔。

---

## 1. 背景

V11（PR #40）已宣告：

```text
layout-L1：types/layout + resolveConnections + toTopology 可測已推；L2 可開最小 GridCanvas 只讀渲染（仍待 store 模型另開）
```

本週把「仍待 store 模型另開」補完：平行新建 `layoutStore`，讓 L2 之後有可依賴的讀寫入口，不必各自抱 fixture。  
toby／harry 本週薄片仍吃 props／純座標；**本週不解鎖擺放／選取**。

---

## 2. 最終決策（負責人 2026-09-11）

| # | 決策 | 落點 |
|---|------|------|
| 1 | V12＝W0907-A0；無次優功能刀 | 本檔／todolist |
| 2 | **單一 Pinia store** | [C1](./C1_layout_store.md) |
| 3 | return 用 **`readonly()`** | C1 |
| 4 | 放置回傳 `{ ok: true } \| { ok: false; reason: … }`；不 throw | C1 |
| 5 | `/dev` store 演示 **本版必要**（週會） | [D1](./D1_dev_store_preview.md) |
| 6 | 解鎖句不提前開擺放；未到則「本週仍只讀」 | [E1](./E1_acceptance_and_unlock.md) |
| 7 | V11 文件殘項收斂為本版前置 | [B1](./B1_v11_residue_close.md) |
| 8 | 分支 `dev/aaaaa0907` | meta |
| 9 | `ToolbarPanel` 全員硬鎖 | 全工項 |

### 2.1 PlacementResult 初稿

```ts
type PlacementFailReason = 'overlap' | 'invalid';

type PlacementResult =
  | { ok: true }
  | { ok: false; reason: PlacementFailReason };
```

`overlap`＝與既有設備／管線佔格衝突（組既有 `overlapDetection`／佔格純函式）。  
`invalid`＝其餘無法放置（缺機器定義、座標不合法等）。實作時可再細分，但**測試至少釘 `overlap`**。

### 2.2 現況對照

| 規劃 | 現況 | 本版處置 |
|------|------|----------|
| `types/layout.ts` | 已有（V11）；含 `LayoutSnapshot` | 必要時補 `PlacementResult` |
| `utils/layout/*` | 六件齊＋可測 | **只組用，不重寫演算法** |
| `mockLayout.ts`／`toLayoutSnapshot` | 已有 | 測試＋`/dev` 輸入 |
| `layoutStore.ts` | **不存在** | **新建**（C1） |
| `/dev/layout-l1-preview` | 已有（純函式預覽） | 保留；另開 **store** 預覽頁（D1） |
| `editorStore` | 現行藍圖 | **不動簽名** |

---

## 3. 與既有版本／工單邊界

| 對象 | 關係 |
|------|------|
| V11 | 程式已合入；文件殘項本版 B1 收斂後結案 |
| W0907-A0 | 本版唯一主線；對應 WEEK V1 |
| W0907-T1／H1 | 本週不改其檔；store 完成不回頭接線 |
| R-B2 | 仍 `[!]` 至殼可擺放；本版只交 store 契約 |
| FlowEngine | 經既有 `toTopology`；不改引擎 |

---

## 4. 非目標

見 [todolist_v12](../todolist_v12.md)「非目標」。補充：D1 僅 `/dev` 除錯／週會頁，不產品化 GridCanvas。

---

## 5. DoD（本細項）

- [x] 9 項決策表已寫入 todolist 與本檔
- [x] B–E 細項可依本檔開工，無待裁決契約形狀
- [x] 不解鎖擺放、ToolbarPanel 硬鎖已明示

---

## 6. 開發日誌

### 2026-09-11

- 負責人確認 A–E 契約形狀與 `/dev` 必要；建立 todolist_v12＋dev_v12 骨架
