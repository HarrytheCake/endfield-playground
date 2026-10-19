# W1018-A0｜aaaaa｜派工已發；M3 引擎讀驗收＋lab（≤2h）

| meta | value |
|------|-------|
| 週次 | 2026-10-18 → 2026-10-25 |
| 等級 | **確定・兩件**（流程＋ L1 驗收） |
| 擋門檻 | **是（C5 讀取鏈可演示）** |
| 上游 | [WEEK_20261018](../../WEEK_20261018.md)、[C5](../../../roadmap/detail/C5_source_primary_output.md) |
| 畫面｜交哪個檔｜不要碰｜卡住找誰 | 派工在 `docs/work_dispatch/`；驗收／lab 在 docs 或 `/dev`｜`GridCanvas`／`LayoutView`（toby）、`MainLayout`｜toby（C1）、dernoson（合入） |
| 時數上限 | **≤2h**（問卷：公司專案壓縮） |

---

## 0. 白話目標

C5 **寫入（#72）**與**引擎讀／機型 id（#74）**已在 master。本週你不做新引擎大改，只做：

| # | 件 | 為什麼 |
|---|----|--------|
| ① | 派工已發（本檔＋WEEK＋各人工單） | M3 週發工 |
| ② | **擇一先交（≤2h）：**（A）M3 彩排用「源素材→拓樸／引擎可測」步驟清單；或（B）`dev/aaaaa1019-l1-lab` 開 PR 合入 | 門檻日要證明讀取鏈；可視化訴求 |

**不做：** 正式頁源素材下拉、整包右側產耗、再寫長篇派工當第二主交付。

---

## 1. ② 驗收／lab（必做其一）

**A. 驗收步驟（建議優先）：** 一份短文（可放 `docs/aaaaa/dev/` 或工單 PR 描述）寫清：

1. 如何放一台源設備並 `setDevicePrimaryOutput`
2. 如何經 `toTopology`／既有 dev 頁看到產出速率（對齊 #74）
3. 失敗時看哪裡

**B. Lab 合入：** 將 L1 contract lab 開 PR 進 master（路由已在分支則直接 PR）。

---

## 2. 不要做

- 改 `LayoutView`／`GridCanvas`（toby C1）
- 改 `editorStore` 簽名
- 擴大 V17 範圍、再開大包引擎重構

---

## 3. DoD

- [x] `WEEK_20261018` 與各人工單在分支
- [ ] ②A 或 ②B 擇一可驗收
- [ ] 未改 C1 鎖檔
