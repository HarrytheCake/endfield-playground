# V15 TODOLIST — 出界列表＋埠命中（本週 aaaaa｜W1004-A0）

**版本：** V15
**建立日期：** 2026-10-10
**負責人：** aaaaa
**前置：** [V14](./todolist_v14.md) 程式已合 master（[#54](https://github.com/dernoson/endfield-playground/pull/54)／[#55](https://github.com/dernoson/endfield-playground/pull/55)）；文件收斂見 [V15-B1](./dev_v15/B1_v14_residue_close.md)
**正式工單：** [W1004-A0](../../work_dispatch/aaaaa/1004/W1004-A0_dispatch_and_e003.md)（確定・三件；本版實作＝②＋③）
**上游：** [WEEK_20261004](../../work_dispatch/WEEK_20261004.md) v1.2、[ROADMAP_OUTLINE](../../roadmap/ROADMAP_OUTLINE.md) **v1.16**、[AGENT_WEEK_1004](../claude/AGENT_WEEK_1004.md)
**週次：** 2026-10-04 → 2026-10-11（連線月第一週；M2 延後結算＋換殼；**無技術門檻日**）
**開發分支：** `dev/aaaaa1004`
**狀態總覽：** **`[~]`**（2026-10-11；② 在 #60；③ 修正於 `dev/aaaaa1004-hitTestPortAt` 待開後續 PR）
**待確認問題：** [dispatch_private/1004/PENDING_DECISIONS_20261011.md](../collaborator_survey/dispatch_private/1004/PENDING_DECISIONS_20261011.md)

> 標記說明：`[ ]` 未開始 / `[~]` 進行中 / `[x]` 完成 / `[!]` 封鎖中（等待依賴）
>
> **範圍宣告：** 本版＝兩支 L1 純函式。**不發解鎖句**。不碰換殼／畫布／工具列鎖檔。C5 action **不在本版**。
> **執行計畫：** 本檔＋`dev_v15/` **即為**本週 aaaaa 執行計畫檔。

---

## 概述

### 目標

1. **② 出界 id 列表：** `devicesOutsideBase(devices, region) → string[]`；toby 畫框外 Error；**不改** `canPlaceDevice`
2. **③ 埠命中判定：** 供 10/11 C1 呼叫；熱區 ≥ 半格；純函式＋測試（**命名待決**，見 PENDING A-1）
3. **零鎖檔衝突：** 不碰 `GridCanvas`／`MainLayout`／`ToolbarPanel`／Stats／detectors／TopBarButton
4. **V14 文件收斂：** todolist／AGENT_WEEK 狀態對齊「已合 master」

### 已定案（2026-10-10｜開版）

| # | 項 | 結論 |
|---|-----|------|
| 1 | 版本範圍 | **V15＝W1004-A0 ②＋③**；①派工已完成不列實作 |
| 2 | 優先序 | **② ＞ ③**（工單原文） |
| 3 | 出界策略 | Error 視覺；**仍可** `addDevice`（#57 S2-2） |
| 4 | C5 store | **已裁 B**；本版**不做** action／引擎讀取 |
| 5 | 解鎖句 | **不發** |
| 6 | 分支 | **`dev/aaaaa1004`**（已建） |
| 7 | ③ 命名 | **已決**＝`hitTestPortAt`＠`portHitTest.ts`；舊 `findPortAt` 不動 |
| 8 | ③ 座標 | **格點**；像素下限＝L2 |
| 9 | ③ 回傳 | **已決**＝`PortRef`＋`side`＋`media` |

詳見 [A1_scope_decision.md](./dev_v15/A1_scope_decision.md)。

### 非目標（本版不做）

- C1 拉管線互動／draft UI（10/11 L2）
- C5 `setDevicePrimaryOutput`／引擎接 layoutStore（10/11–10/18）
- 改 `canPlaceDevice` 把出界當拒絕條件
- 修 `LayoutView` 自動載入 fixture
- 碰 toby／harry／G／S／azure／MBD 鎖檔
- 旋轉／Delete／選取面架構
- 發解鎖句

### 流程大綱

```text
A 定案 → B V14 收斂（前置）
      → C1 ② devicesOutsideBase（必做）
      → D1 ③ 埠命中（A-1 決後；可骨架先行）
      → E1 驗收＋PR＋交接
```

### 週切片

| 區間 | 切片 | 對應 |
|------|------|------|
| → 10/10 | 定案落檔；V14 收斂；② 開工 | A1、B1、C1 |
| 10/10–11 | （A-1 決後）③ 實作＋測試；開 PR | D1、E1 |
| → 10/11 | 驗收回寫；公開 V10 對照 | E1 |

### 下游消費者（PR 必寫）

```text
下游消費者：
- toby T1：devicesOutsideBase → 框外 Error 視覺（不擋 addDevice）
- R-C1／10/11 L2：埠命中純函式 → draft 命中；不自算埠座標
- L2／L3 換殼鏈：本版零檔案交集
```

### 交付宣告（本版不發解鎖句）

```text
本 PR 交付 devicesOutsideBase（與可選的埠命中熱區函式）。
不改 canPlaceDevice；出界仍可落子。不發解鎖句；C1 UI／C5 action 不在本 PR。
```

---

## V15-A｜範圍與定案

- [x] **V15-A1** 開版決策落版；與 W1004-A0／V14／鎖表邊界（負責人 2026-10-10 照草案定案）
    - 細項：[dev_v15/A1_scope_decision.md](./dev_v15/A1_scope_decision.md)

---

## V15-B｜V14 殘項收斂（前置）

- [x] **V15-B1** 確認 #54／#55 在 master；todolist_v14／相關 meta 指向已合入；無程式殘刀屬本版範圍
    - 細項：[dev_v15/B1_v14_residue_close.md](./dev_v15/B1_v14_residue_close.md)

---

## V15-C｜出界 id 列表（W1004-A0 ②・必做）

- [x] **V15-C1** `devicesOutsideBase`＋測試；不寫 store；不改 `canPlaceDevice`
    - 細項：[dev_v15/C1_devices_outside_base.md](./dev_v15/C1_devices_outside_base.md)
    - 產物：`src/utils/layout/devicesOutsideBase.ts`、`src/__tests__/utils/layout/devicesOutsideBase.test.ts`
    - 對照公開驗收：**V10**（一半）

---

## V15-D｜埠命中判定（W1004-A0 ③・C1 前置）

- [~] **V15-D1** `hitTestPortAt`＋測試；熱區圓心＝埠視覺邊心——**座標已修，後續 PR 交審中**
    - 細項：[dev_v15/D1_port_hit_test.md](./dev_v15/D1_port_hit_test.md)
    - 產物：`src/utils/layout/portHitTest.ts`、`src/__tests__/utils/layout/portHitTest.test.ts`（另匯出 `portPointOnMachine`）
    - 對照公開驗收：**V10**（另一半）；回傳＝PortRef＋side＋media
    - 分支：`dev/aaaaa1004-hitTestPortAt`

---

## V15-E｜驗收、PR、交接

- [~] **V15-E1** 品質閘 `[x]`；PR [#60](https://github.com/dernoson/endfield-playground/pull/60) 拆分後僅含 ②；③ 後續 PR `[ ]`；合入後回寫 `[ ]`
    - 細項：[dev_v15/E1_acceptance_and_handoff.md](./dev_v15/E1_acceptance_and_handoff.md)

---

## 封鎖／待決追蹤

| ID | 原因 | 等待對象 | 阻擋本版？ | 何時決 |
|----|------|----------|------------|--------|
| ~~PENDING A-1~~ | ~~撞名~~ | — | **已決＝hitTestPortAt** | 2026-10-10 |
| PENDING A-2 | C1 L2 owner（T1／H1 皆未派） | 主編 | **否** | 10/11 會 |
| ~~PENDING B-1~~ | ~~回傳形狀~~ | — | **已決＝PortRef＋side＋media** | 2026-10-10 |
| C5 action | 排 10/11–10/18 | — | **否**（非本版） | 下週 |
| — | **不動** 換殼／畫布／toolbar／Stats／detectors 鎖檔 | — | — | 本版硬鎖 |

---

## 完成定義（Definition of Done）

### 主線（對照 [W1004-A0 §5](../../work_dispatch/aaaaa/1004/W1004-A0_dispatch_and_e003.md)）

- [x] 派工①已發（WEEK＋工單在 master）
- [x] `devicesOutsideBase` 有測試；`addDevice`／`canPlaceDevice` 行為不變
- [x] `hitTestPortAt` 有測試；熱區 ≥ 半格且圓心對齊埠視覺位置；無 store import；輸入連續格座標（後續 PR）
- [x] C5 store 歸屬已裁並回寫（R-1＝B；非本版實作）
- [x] `pnpm type-check`／lint-check／format-check／test 綠（906 tests）
- [x] PR 說明下游（toby／C1）與「不改 canPlaceDevice」

### 品質閘

- [x] diff 不含 `src/editor/layout/*`、`MainLayout`、`ToolbarPanel`、detectors、TopBarButton
- [x] diff 不含選取／旋轉／Delete 接線、不含 `editorStore` 簽名變更

---

## 未交頂替

| 工項 | 未交影響 |
|------|----------|
| C1 ② | toby 自造出界幾何；日後第二套佔格風險 |
| D1 ③ | 10/11 C1 須從零想埠命中；工單允許「簽名＋測試骨架」降級 |
| B1 V14 收斂 | 文件狀態漂移；不擋程式 |
| E1 PR | 擋公開 V10 |

---

## 本週工項檢核（對照 W1004-A0）

| 工項 | 工單要求 | V15 狀態 | 備註 |
|------|----------|----------|------|
| ① | 派工已發 | `[x]` | 已在 master |
| ② | `devicesOutsideBase`＋測試 | `[x]` | 2026-10-10 |
| ③ | `hitTestPortAt`＋測試 | `[~]` | 座標已修；後續 PR `dev/aaaaa1004-hitTestPortAt` |
| C5 問答 | store 歸屬 | `[x]` | R-1＝B；實作非本版 |

---

## 開發日誌

### 2026-10-11｜③ 後續 PR：修熱區圓心

- 圓心改 `portPointOnMachine` 埠邊心；四向視覺點測試＋審查反例
- 分支 `dev/aaaaa1004-hitTestPortAt`（叠在 #60 tip 上）

### 2026-10-11｜#60 審查：拆分

- ② `devicesOutsideBase` 審查通過，留在 #60 先合（toby #61 等著接）
- ③ `hitTestPortAt` 阻擋：錨點是整數格索引卻被當連續座標點，熱區圓心偏到格左上角；從 #60 移出，另開後續 PR
- 移出前的原始實作保留在本地分支 `dev/aaaaa1004-porthit`

### 2026-10-10｜V15-E1 驗收＋開 PR

- 品質閘四項全綠（906 tests）；type-check 修 `portHitTest` 漏 import
- 三 commit 開 PR；合入後做回寫

### 2026-10-10｜V15-D1 完成

- `hitTestPortAt`＋10 測綠；共用 `collectPortAnchors`；舊 `findPortAt` 未改
- **下一刀＝E1（驗收／PR）**

### 2026-10-10｜V15-C1 完成

- `devicesOutsideBase`＋8 測綠；回歸 placementCheck／layoutStore 未改
- **下一刀＝D1（`hitTestPortAt`）**

### 2026-10-10｜V15-B1 完成

- `gh`：#54／#55 MERGED；收斂 todolist_v14／closeout／E1／week_report
- **下一刀＝C1（`devicesOutsideBase`）**

### 2026-10-10｜B-1 定案

- 負責人裁回傳＝PortRef＋side＋media；②③ 可開工

### 2026-10-10｜定案

- 負責人：A-1＝`hitTestPortAt`；格點；分支 `dev/aaaaa1004`；A1 照草案
- A-2 查證未定；B-1 影響表＋建議 PortRef 擴充
- 公開回寫 C1／W1004-A0 用詞

### 2026-10-10｜開版

- 對齊 `origin/master`；依 WEEK v1.2／W1004-A0 開 V15
- 決策層 `dispatch_private/1004/`＋`AGENT_WEEK_1004` 同步建立
- ③ 撞名列入 PENDING A-1；② 可立刻開工
