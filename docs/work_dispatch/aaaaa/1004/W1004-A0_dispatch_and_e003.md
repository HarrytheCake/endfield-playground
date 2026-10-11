# W1004-A0｜aaaaa｜派工已發；出界列表＋C1 命中判定（10 月緊湊化前置）

| meta | value |
|------|-------|
| 週次 | 2026-10-04 → 2026-10-11 |
| 等級 | **確定・三件**（流程＋兩支純函式） |
| 擋門檻 | 否（但 ③ 是 10/11 C1 的前置） |
| 上游 | [WEEK_20261004](../../WEEK_20261004.md) **v1.2**、[#57](https://github.com/dernoson/endfield-playground/pull/57)、[C1 細項 §4.2](../../../roadmap/detail/C1_port_hit_and_draft.md) |
| 畫面｜交哪個檔｜不要碰｜卡住找誰 | 派工文件在 `docs/work_dispatch/`；兩支純函式在 `src/utils/layout/`（或 `src/utils/`）｜不要改 `GridCanvas`／`MainLayout`／`ToolbarPanel`｜toby（出界顯示）、harry／toby（C1 呼叫端）、dernoson（合入） |

---

## 0. 白話目標

10 月只剩三週就到 M3（10/25＝C1＋C2＋C3＋C5），而 9/27 連假整週空白。**本週你的兩支純函式決定 10/11 與 10/18 能不能立刻開工**，不要等到那兩週才開始想。

| # | 件 | 為什麼現在做 |
|---|----|--------------|
| ① | 派工已發（`WEEK_20261004` 與十張 `1004/` 工單） | 會議交辦，已完成 |
| ② | **出界 id 列表** `devicesOutsideBase` | **改為必做**——toby 本週要「框外 Error」，沒有它他得自己展佔格，日後會變第二套幾何 |
| ③ | **埠命中判定** `findPortAt` | C1 細項 §4.2 已指定由你提供；10/11 的 L2 只該呼叫，不該自己算第三套埠座標 |

---

## 0.1 問卷與會議回寫（2026-10-06）

W0921 週報 **9／10**（MBD 10/05 補填；僅 avery 未填表）。個人檔／git 分析已回寫（`personal_profile` **v3.3**、`gitcommit_analyze` 2026-10-05／06）。

**本週派工按 10/04 會議原句重發：** azure **復工**（Z1：E004／E005／W001 接 dev 驗證頁）、MBD **恢復功能派工**（M1：頂欄四顆按鈕進 Storybook）。原先的 Z0／M0 暫停單作廢——會議有點名，問卷也支持（azure 自報可派工、MBD 自報 3–5h）。**只有 avery 仍整週暫停**（主編裁再放一週、不除名）。

**不回頭改其他人的本週必要範圍。** 產能上修（shirone 6–10h、goodmorning／paper 3–5h）只加深樣式與清 #48。

---

## 1. ② 出界 id 列表（必做）

現有 `isDeviceWithinBaseRegion` 吃的是舊 `FactoryNode`＋`canvasStore` 的基地列舉。新模型要的是一支吃 `PlacedDevice[]` 的列表函式：

```text
devicesOutsideBase(devices, region) → string[]   // 出界的 PlacedDevice id
```

- 純函式、有測試；**不寫 store**
- **不改** `canPlaceDevice` 的拒絕條件——出界只是 Error 視覺，仍要放得下去（spec／#57 S2-2）
- toby 不必等你：他可以先用現有幾何畫框標紅，你合入後他換過去

---

## 2. ③ 埠命中判定（C1 前置）

C1 細項 §4.2 已凍結簽名方向，照它交：

```text
findPortAt(point, devices, getDef) → { deviceUid, portId, side, media } | null
```

- 吃 rotation／mode／格點座標，與 [A2](../../../roadmap/detail/A2_grid_and_port_alignment.md) 的 `rotatePort` 同源；可沿用 `src/app/dev/topologyPortUtils.ts` 的算法
- **熱區半徑 ≥ 半個格子**（C1 §4.3 已凍結，是可用性要求不是美觀）
- 純函式＋測試。**draft 狀態不是你的**——那是 L2 容器的 local ref（C1 §4.1 採方案 C）
- 這支交了，10/11 的 C1 工單就只剩互動與視覺

時數不夠時的優先序：**② ＞ ③**。③ 若只交得出簽名＋測試骨架也有用，請在 PR 寫明缺哪段。

---

## 3. 不要做

- 把重疊改成可放置（#57 S5-1，不是本週會議）
- 修 `LayoutView` 自動載入 fixture（S1-2，會與 T1 搶同一檔的行為）
- **引擎改接 `layoutStore`**（十一月 D1 鏈）
- 自己開 C1 的互動實作（那是 10/11 的 L2 工單）
- 再寫派工長文當主交付（上期 68 筆大半是文件）
- 因問卷產能上修而擴大別人的 W1004 必要項

---

## 4. C5 store——**已裁：採 B（主編 2026-10-06｜PR #59）**

寫入 **`layoutStore`／`PlacedDevice.primaryOutput`**（action 名：`setDevicePrimaryOutput`）。  
**你的後續義務（10/11–10/18）：** 交 action＋測試時，一併定「引擎怎麼讀到這個欄位」的最小接法（可經既有 `toTopology`），並在 10/18 切片落地——這是裁決 B 附帶的一部分 D1 提前量，**不是**整包右側產耗表。

詳見 [C5 §4.1a](../../../roadmap/detail/C5_source_primary_output.md)。

---

## 5. DoD

- [x] `WEEK_20261004` 與十張工單在本分支（Z1／M1 已按會議改派）
- [x] W0921 週報已收並回寫個人檔／gitcommit_analyze（9／10；avery 主編裁再放一週）
- [ ] `devicesOutsideBase` 有測試；`addDevice` 行為不變
- [ ] `findPortAt` 有測試；熱區 ≥ 半格；無 store import
- [x] C5 的 store 歸屬已問到答案並回寫 roadmap —— **R-1＝B**
