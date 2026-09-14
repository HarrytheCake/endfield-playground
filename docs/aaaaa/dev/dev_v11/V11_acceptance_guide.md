# V11 驗收指南 — aaaaa 本週交付（A0＋A1）

**週次：** 2026-08-31 → 2026-09-06  
**負責人：** aaaaa  
**最後更新：** 2026-09-11（#43 合入狀態收斂）  
**工單：** [W0831-A0](../../work_dispatch/aaaaa/0831/W0831-A0_layout_l1_foundation.md)、[W0831-A1](../../work_dispatch/aaaaa/0831/W0831-A1_toolbar_real_machines.md)

---

## 0. 交付總覽

| 工項 | 內容 | PR | 分支 |
|------|------|-----|------|
| A0 L1 打底 | types／utils／`/dev` 格點／解鎖句 | [#40](https://github.com/dernoson/endfield-playground/pull/40) **已合入 master** | `dev/aaaaa0831` |
| A1 B1 工具列 | 真實機器列表並存五顆 | [#43](https://github.com/dernoson/endfield-playground/pull/43) **已合入 master**（2026-09-04） | `dev/aaaaa0831-h1` |

V11 執行計畫：[todolist_v11.md](../todolist_v11.md)＋本目錄 `dev_v11/`。

---

## 1. A0（L1 打底）— review_gate 驗收

### 1.1 解鎖句（已發、已合入）

```text
layout-L1：types/layout + resolveConnections + toTopology 可測已推；L2 可開最小 GridCanvas 只讀渲染（仍待 store 模型另開）
```

證據：[evidence/G1_unlock.md](./evidence/G1_unlock.md)

### 1.2 自動化（約 1 分鐘）

```bash
pnpm type-check
pnpm test src/__tests__/utils/layout/ src/__tests__/data/mockLayout.test.ts
```

預期：**8 files／59 tests** 全綠（H1 合入後若含 toolbar 則為 63，見 H1 證據）。

### 1.3 視覺 — `/dev/layout-l1-preview`（約 30 秒）

詳見 [F1 §4.1](./F1_dev_grid_preview.md)：

```text
1. pnpm dev → /dev/layout-l1-preview
2. 預設「已連接」：兩台分流器＋綠線；摘要 from/to 非 null；edges=1
3. 點「斷線」：橙線；from/to null；edges=0
4. 確認頁面未接 editorStore／主畫布
```

### 1.4 硬約束確認

- [ ] 未改 `editorStore` 簽名
- [ ] 未加深 `FactoryCanvas`／`FlowNodeOverlay`
- [ ] Breaking 註記在 `types/layout.ts`（devices／pipelines 目標模型）

---

## 2. A1（B1 工具列）— review_gate 驗收

### 2.1 自動化（約 30 秒）

```bash
pnpm type-check
pnpm test src/__tests__/editor/toolbarMachines.test.ts
```

預期：**4 tests** 全綠。

### 2.2 視覺 — 主編輯器 `/`（約 2 分鐘）

詳見 [evidence/H1_acceptance.md](./evidence/H1_acceptance.md) §2：

```text
1. pnpm dev → http://localhost:5173/
2. 工具列下半：分類 Tab ＋ 機器名＋佔格（如 粉碎機 3×3）
3. 切 Tab 抽查：合成製造→灌裝機 6×4；物流設備→分流器 1×1
4. 點真實機器 → 高亮 ＋ console.info（無 store / no place）
5. 上半五顆仍可點擊落子、拖曳落子
6. 點真實機器後畫布不進入放置模式
```

**無** `/dev` 專頁、**無** Storybook（L2 容器不在 Storybook 範圍）。

### 2.3 硬約束確認

- [ ] 未改 `EquipmentType`／`armPlacement`／`dataTransfer` key
- [ ] L3 未直接 import `src/data/*`
- [ ] `toolbarMachines.ts` 攤平 `ToolbarMachineRow`

---

## 3. 週日會對照（WEEK_20260831 §0.1）

| # | 項 | 過關依據 |
|---|-----|----------|
| V1 | L1 有進度 | PR #40 已合入；59 layout tests 綠 |
| V2 | L1 解鎖句 | §1.1 解鎖句已發且合入 |
| V3 | B1 切片 | §2.2 主 app 工具列截圖可演示 |

---

## 4. 下游消費者（兩 PR 合併後）

| 誰 | 下一步 |
|----|--------|
| toby／harry 等 L2 | 可開**最小 GridCanvas 只讀**；store 模型另開 |
| W0831-S1 shirone | 吃 `ToolbarMachineRow` 做 MachineCard |
| goodmorning G1 | PaperFigBottomBar 視覺，與 B1 列表並行 |
| B2 | 仍封鎖至 store／EquipmentType 解封 |

---

## 5. 相關文件

| 文件 | 用途 |
|------|------|
| [todolist_v11.md](../todolist_v11.md) | 工項狀態總表 |
| [G1_acceptance_and_unlock.md](./G1_acceptance_and_unlock.md) | A0 驗收細項 |
| [H1_toolbar_real_machines.md](./H1_toolbar_real_machines.md) | A1 技術決策 |
| [F1_dev_grid_preview.md](./F1_dev_grid_preview.md) | `/dev` 格點步驟 |
