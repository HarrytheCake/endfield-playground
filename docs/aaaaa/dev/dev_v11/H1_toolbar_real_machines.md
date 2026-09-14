# V11-H1 — 工具列接真實機器（R-B1｜次優）

**對應工項：** V11-H1  
**狀態：** `[x]` 完成（2026-09-01）  
**依賴：** 無硬依賴 A0  
**最後更新：** 2026-09-01  
**正式依據：** [W0831-A1](../../../work_dispatch/aaaaa/0831/W0831-A1_toolbar_real_machines.md)  
**驗收集：** [V11_acceptance_guide.md](./V11_acceptance_guide.md) §2｜[evidence/H1_acceptance.md](./evidence/H1_acceptance.md)

---

## 1. 背景

工具列現綁封閉 `EquipmentType` 五值；真實機器 id 不在聯集內。本週**不得**擴張落子鏈。定案：新增真實機器分類列表與五顆按鈕**並存**；點選＝本地態＋`console`。

---

## 2. 技術決策（已落地）

| 做 | 不做 |
|----|------|
| 全 `MACHINE_TAGS` Tab；預設「基礎生產」 | 刪改既有五顆 |
| `listToolbarMachines` → `getMachinesByTag` | 新查詢 API |
| 佔格 `` `${width}×${height}` `` | 文檔舊稱 `size` |
| 本地選取＋`console.info` | `armPlacement`／`dataTransfer`／store 簽名 |
| `toolbarMachines.ts` 攤平 `id`／`name`／`sizeText` | L3 卡片讀 `src/data` |

### 點選下一步（PR 註明）

真實機器 click → `selectedRealMachineId` highlight ＋  
`console.info('[toolbar] real machine selected (no store / no place)', …)`。  
**不**接 B2 落子；等 store／`EquipmentType` 解封另開。

---

## 3. 檔案計畫（已落地）

| 動作 | 檔案 |
|------|------|
| 新建 | `src/editor/toolbar/toolbarMachines.ts` |
| 修改 | `src/editor/toolbar/ToolbarPanel.vue` |
| 新建 | `src/__tests__/editor/toolbarMachines.test.ts` |
| 不碰 | `FactoryCanvas`／`FlowNodeOverlay`／`EquipmentType`／detector |

---

## 4. 驗證標準

- [x] ≥1 分類真實機器名＋佔格（預設基礎生產；可切全 tag）
- [x] 抽查粉碎機 3×3、塑型機 3×3、灌裝機 6×4、分流器 1×1（測試）
- [x] 點選本地態＋console；未呼叫 store 落子
- [x] 既有五顆路徑未改
- [x] L3 未讀 `src/data`（selector 在 editor／toolbar）
- [x] type-check／toolbar 測 4 綠

### 4.1 手動驗收（主 app `/`）

本項**無** `/dev` 專頁、**無** Storybook。review_gate 依下列步驟驗收（詳 [evidence/H1_acceptance.md](./evidence/H1_acceptance.md)）：

```text
1. pnpm dev → http://localhost:5173/
2. 工具列下半：分類 Tab ＋ 機器名＋佔格
3. 切 Tab 抽查灌裝機 6×4、分流器 1×1
4. 點真實機器 → 高亮 ＋ console.info（no store / no place）
5. 上半五顆仍可落子／拖曳；點真實機器不觸發放置模式
```

### 下游消費者（合入／續 PR 用）

| 誰 | 怎麼用 |
|----|--------|
| 9/6 演示 | 截工具列真實機器名＋佔格 |
| W0831-S1 | 吃 `ToolbarMachineRow` 的 id／name／sizeText |
| B2 | 本週不接落子 |
| goodmorning G1 | 視覺分開，互不擋 |

---

## 5. 開發日誌

### 2026-09-01

- 落地 selector＋ToolbarPanel 並存列表；測試 4 綠
- 驗收指南與 evidence 落檔；PR [#43](https://github.com/dernoson/endfield-playground/pull/43) **已合入 master**（2026-09-04；V12-B1 收斂回寫）

### 2026-09-04

- 依主編 review 修正：拿掉 list／listitem role、補 `realMachines` JSDoc、移除殘留 `toolbar-row` class、點 legacy／拖曳／切 Tab 時清空真實機器本地高亮
