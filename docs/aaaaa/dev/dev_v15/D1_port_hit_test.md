# V15-D1 — 埠命中判定（`hitTestPortAt`｜W1004-A0 ③）

**對應工項：** V15-D1
**狀態：** `[~]` [#65](https://github.com/dernoson/endfield-playground/pull/65) 交審中（見 §8／§9）
**日期：** 2026-10-10
**依賴：** [A1](./A1_scope_decision.md) `[x]`、[B1](./B1_v14_residue_close.md) `[x]`
**正式工單：** [W1004-A0 §2](../../../work_dispatch/aaaaa/1004/W1004-A0_dispatch_and_e003.md)、[C1 §4.2–4.3](../../../roadmap/detail/C1_port_hit_and_draft.md)
**對照公開驗收：** WEEK §0.2 **V10**
**開發分支：** `dev/aaaaa1004`
**產物：** `src/utils/layout/portHitTest.ts`、`src/__tests__/utils/layout/portHitTest.test.ts`

---

## 1. 背景與動機

C1 要「按埠拖線」。命中判定必須吃 rotation／mode／格點，與 A2／`rotatePort` 同源。放在 L2 容器會變成第三套埠算法。

**本版只交純函式。** draft 狀態＝L2 local ref（C1 §4.1 方案 C），不是本項。

---

## 2. 與既有 `findPortAt` 的關係

| API | 位置 | 語意 |
|-----|------|------|
| **既有** `findPortAt(anchors, x, y, prefer?)` | `portAnchorIndex.ts` | 格點**精確匹配**；供 `resolveConnections`／`canConnect` |
| **本項** `hitTestPortAt` | `portHitTest.ts` | 滑鼠／點的**熱區**命中（半徑 ≥ 半格） |

**已決（A-1＝A）：** 兩支並存；舊函式不動。

---

## 3. 技術決策

| 決定 | 狀態 | 說明 |
|------|------|------|
| 函式名／檔 | **已決** | `hitTestPortAt`＠`src/utils/layout/portHitTest.ts` |
| 熱區半徑 ≥ 半格 | **已凍結** | 預設 `DEFAULT_HIT_RADIUS_CELLS = 0.5` |
| 輸入座標 | **已決＝連續格座標** | 原點＝格左上角；像素換算由 L2 |
| 熱區圓心 | **埠視覺邊心** | `portPointOnMachine`；**不是**外側錨點格 |
| 回傳 | **PortRef＋side＋media** | `PortHitResult`；展開時帶出，不事後重算 |
| 多埠 | 最近距離；並列→掃描序較前 | JSDoc 已釘 |

### 3.1 簽章（已決／已實作）

```text
hitTestPortAt(
  point: { x: number; y: number },
  devices: readonly PlacedDevice[],
  getMachine?: GetMachineFn,
  options?: { hitRadiusCells?: number }
) → PortHitResult | null
// PortHitResult = PortRef & { side, media }
```

---

## 4. 檔案

| 動作 | 檔案 |
|------|------|
| 新建 | `src/utils/layout/portHitTest.ts` |
| 新建 | `src/__tests__/utils/layout/portHitTest.test.ts` |
| **不碰** | `portAnchorIndex.findPortAt`、`GridCanvas`、C1 UI、`layoutStore` |

---

## 5. 測試

| # | 案例 | 狀態 |
|---|------|------|
| 1 | 點在埠**視覺邊心** → 命中 | `[x]` |
| 2 | 審查案例：(10,10.5) → input 0，不誤中鄰埠 | `[x]` |
| 3 | 錨點格左上角 (9,10) → null（反例） | `[x]` |
| 4 | 熱區邊緣（距離＝0.5）→ 命中 | `[x]` |
| 5 | 熱區外 → null | `[x]` |
| 6 | 四種 rotation：視覺點命中該埠、不命中鄰埠 | `[x]` |
| 7 | 多埠取最近；等距取掃描序 | `[x]` |
| 8 | 無 store import（讀檔斷言） | `[x]` |

回歸：`connectRules`／`devicesOutsideBase` 同跑綠。

---

## 6. 驗證標準（DoD）

- [x] B-1＝PortRef 擴充
- [x] 匯出 `hitTestPortAt`＋測試；熱區 ≥ 半格且**圓心對齊埠視覺位置**；輸入連續格座標；回傳 PortRef＋side＋media
- [x] 四種 rotation 各至少一則「點擊埠視覺位置 → 命中該埠、不命中鄰埠」
- [x] JSDoc 寫明輸入慣例：連續格座標，原點＝格左上角
- [x] 共用 `portPointOnMachine`／`rotatePort`；side／media 於展開時帶出，不事後重算
- [x] `PortHitResult` 成員逐一註解（含 `media`）
- [x] 無 Pinia import；未實作 draft UI
- [x] 相關 vitest／eslint／prettier 綠（911 tests）
- [x] 給 C1 L2 一句（見下）

### 6.1 給 C1 L2（PR／USAGE）

```text
hitTestPortAt(point, devices) → PortHitResult | null
point＝連續格座標（原點＝格左上角；非整數可）；預設熱區 0.5 格。
熱區圓心＝設備邊上埠邊心（非外側錨點格）。
命中後用 deviceId/portType/portIndex 組 PortRef；side/media 已附帶。
放開連線仍走 waypoints → canConnect（精確 findPortAt）；本函式只負責「點中哪一埠」。
```

---

## 7. 開發日誌

### 2026-10-11｜後續 PR：修正熱區圓心

- 匯出 `portPointOnMachine`；`hitTestPortAt` 以埠視覺邊心為圓心；side／media 展開時帶出
- 補四向 rotation 視覺點測試＋審查反例；分支 `dev/aaaaa1004-hitTestPortAt`

### 2026-10-11｜#60 審查退回

- 從 #60 移出 `portHitTest.ts`／測試；原實作保留於本地分支 `dev/aaaaa1004-porthit`
- 修正要求見 §8；另開後續 PR

### 2026-10-10｜完成（已撤回）

- 實作＋10 測綠；舊 `findPortAt` 未改
- 下一刀＝V15-E1（驗收／PR）

### 2026-10-10｜B-1 定案

- 負責人裁回傳＝PortRef＋side＋media；簽章釘死

### 2026-10-10

- 建檔

---

## 8. #60 審查阻擋與後續 PR 修正要求

**缺陷：** `collectPortAnchors` 回傳的錨點是設備外側相鄰格的**整數格索引**（`resolvePortAnchorCell`）。原實作把它當連續座標上的點、以半徑 0.5 算距離，熱區圓心落在錨點格**左上角**，不在埠上。

實測（`splitter`＠`(10,10)`、rotation 0；左埠 input 0 錨點＝`(9,10)`）：

| 點擊位置 | 座標 | 結果 |
|---|---|---|
| 左埠視覺位置（設備左邊中點） | `(10, 10.5)` | 命中 output 2（bottom），**錯埠** |
| 左錨點格格心 | `(9.5, 10.5)` | `null` |
| 錨點格左上角 | `(9, 10)` | 命中 input 0 |

L2 換算兩條路都錯：`px / cellSize` 會偏半格並誤中鄰埠；`Math.floor` 會讓 0.5 半徑退化成精確匹配，違反 C1 §4.3。原測試以錨點本身當點擊點，只驗自洽。

**後續 PR 必做：**

1. 熱區圓心＝設備邊上的埠邊心（與 `portUtils.portPointOnMachine` 同一套幾何）；只把錨點 `+0.5` 改成格心不夠（視覺點到格心剛好 0.5，落在邊界，鄰埠區分度不足）
2. JSDoc 寫明輸入慣例：連續格座標，原點為格左上角
3. 四種 rotation 下各至少一則「點擊埠視覺位置 → 命中該埠、不命中鄰埠」

**順手：** `PortHitResult.media` 補成員註解；side／media 於錨點展開時帶出，移除 `enrichPortHit` 重算；「無 store 依賴」regex 測試可留。

---

## 9. 後續 PR 修正摘要

| 項 | 作法 |
|----|------|
| 圓心 | `device.position`＋`portPointOnMachine(rotated.side, rotated.offset, displayW, displayH)` |
| 展開 | 自建 `collectPortHitTargets`（掃描序同 `collectPortAnchors`）；帶 side／media，無 `enrichPortHit` |
| 匯出 | `portUtils.portPointOnMachine` 改 export（與 `rotatePort` 同源） |
| 測試 | 審查案例＋四向視覺點＋錨點左上角反例 |
