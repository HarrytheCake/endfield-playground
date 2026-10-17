# V15-A1 — 範圍與定案

**對應工項：** V15-A1
**狀態：** `[x]` 完成（2026-10-10｜負責人照草案定案）
**日期：** 2026-10-10
**開發分支：** `dev/aaaaa1004`
**正式依據：** [W1004-A0](../../../work_dispatch/aaaaa/1004/W1004-A0_dispatch_and_e003.md)、[WEEK_20261004](../../../work_dispatch/WEEK_20261004.md) v1.2、[todolist_v15](../todolist_v15.md)

> **執行計畫：** 本檔所屬之 `todolist_v15`＋`dev_v15/` **即為**本週 aaaaa 執行計畫檔。

---

## 1. 背景

### 1.1 連線月第一週與關鍵路徑

本週全隊主戲＝正式換殼＋無邊界畫布（harry／toby／G／S）。aaaaa **不在**換殼寬度上。

因 9/27 連假空白、M3＝10/25 不動，WEEK 把兩支 L1 提前到本週：出界列表（toby 本週用）、埠命中（10/11 C1 用）。

### 1.2 為什麼是 V15 不是續掛 V14

V14（預檢＋canConnect）已合 master。本週是新工單 W1004-A0，性質仍是 L1 純函式，但消費者與簽章不同 → 新版本號。

---

## 2. 最終決策（負責人 2026-10-10 定案）

| # | 決策 | 落點 |
|---|------|------|
| 1 | V15＝W1004-A0 ②＋③ | 本檔／todolist |
| 2 | 優先序 ②＞③ | C1／D1 |
| 3 | 出界不擋落子；不改 `canPlaceDevice` | [C1](./C1_devices_outside_base.md) |
| 4 | ③＝**`hitTestPortAt`**＠`portHitTest.ts`；舊 `findPortAt` 不動 | [D1](./D1_port_hit_test.md)、PENDING A-1 |
| 5 | ③ 輸入＝**格點座標**；像素下限＝L2 | D1／PENDING B-2 |
| 6 | ③ 回傳 **已決**＝`PortRef`＋`side`＋`media` | PENDING B-1／D1 |
| 7 | C5 已裁 B；**本版不做** action | todolist 非目標 |
| 8 | **不發**解鎖句 | [E1](./E1_acceptance_and_handoff.md) |
| 9 | 不碰換殼／畫布／toolbar／Stats／detectors／TopBarButton | AGENT_WEEK 禁止表 |
| 10 | 分支 **`dev/aaaaa1004`** | meta |

### 2.1 為什麼本版不做 C5

工單 §4：後續義務在 10/11–10/18。本週產能給 ②③；混進 store action 會與「純函式週」衝突且擴大 review 面。

### 2.2 為什麼不發解鎖句

本版無新互動解鎖。管線點選已由 10/04 會議放行，與本版無關。

### 2.3 C1 L2 owner（非本版範圍，查證結果）

[W1004-T1](../../../work_dispatch/toby/1004/W1004-T1_unbounded_canvas.md)／[H1](../../../work_dispatch/harry/1004/W1004-H1_chrome_land.md) **皆未派 C1**；WEEK／D0 寫「週日會定」。建議偏 toby（見 PENDING A-2）。**不擋 V15。**

---

## 3. 與既有版本／工單邊界

| 對象 | 關係 |
|------|------|
| V14 | 已合 master；本版 B1 收斂文件狀態 |
| W1004-A0 | 本版 C1＋D1＝其實作 DoD；①已完成 |
| W1004-T1（toby） | 消費 ②；**零檔案交集**（他改 GridCanvas） |
| W1004-H1／G1／S1 | 零交集 |
| R-C1 | 本版交 `hitTestPortAt`；互動仍是 10/11 L2 |
| R-C5 | store 已裁；實作非本版 |

---

## 4. 非目標

見 [todolist_v15](../todolist_v15.md)「非目標」。

---

## 5. DoD（本細項）

- [x] §2 決策與 todolist 概述一致
- [x] §3 邊界表含 T1／換殼鏈／R-C1／R-C5
- [x] 明文「不發解鎖句」與 A-1／格點已決

---

## 6. 開發日誌

### 2026-10-10｜B-1

- 回傳釘死 PortRef＋side＋media

### 2026-10-10｜定案

- 負責人確認照草案；補 A-1／格點／分支／B-1 建議

### 2026-10-10

- 開版草案
