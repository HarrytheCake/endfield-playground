# W0907-A0｜aaaaa｜佈局 store 契約（`layoutStore`）

| meta | value |
|------|-------|
| 週次 | 2026-09-07 → 2026-09-13 |
| 等級 | **確定・最優先** |
| 擋門檻 | **是**（09/27 門檻前置；本週唯一必要條件） |
| 前置 | [PR #40](https://github.com/dernoson/endfield-playground/pull/40) 已合入（L1 純函式＋型別） |
| 上游 | [WEEK_20260907](../../WEEK_20260907.md)、[ROADMAP_OUTLINE](../../../roadmap/ROADMAP_OUTLINE.md) v1.6 R-B2 |
| 產能參考 | 自報 3–5h |
| 會議介紹 | [INTRO_meeting_layout_store.md](./INTRO_meeting_layout_store.md)（使用／展示／連接） |

---

## 1. 目標

上週解鎖句的尾巴是「**仍待 store 模型另開**」。本週把那句補完：讓 L2 有一個**可依賴的讀寫入口**，不必再各自抱 fixture。

過關的一句話：**別人可以 `useLayoutStore()` 拿到 `devices`／`pipelines`／衍生 `connections`，而且不需要碰 `editorStore`。**

---

## 2. 邊界

| 允許 | 不要 |
|------|------|
| 新建 `src/store/layoutStore.ts`（Pinia，平行落地） | 改 `editorStore` 的既有簽名或欄位 |
| 用既有 `src/utils/layout/*` 純函式組 getter | 在 store 裡重寫幾何／連線演算法 |
| `src/__tests__/store/layoutStore.test.ts` | 資料遷移（藍圖 JSON `nodes`／`edges` → `devices`／`pipelines`） |
| 用 `src/data/mockLayout.ts` 的 fixture 當測試輸入 | 碰 `src/editor/layout/GridCanvas.vue`（toby 本週的檔） |
| 在 PR body 補第二段解鎖句 | 碰 `useGridViewport.ts`／`src/router`（harry 本週的檔） |

**`ToolbarPanel.vue` 本週對全員硬鎖，包含你自己**——上週被 goodmorning 用網頁上傳覆蓋過三次，本週要能一眼看出誰動了它。B1 的下一刀排 9/14。

---

## 3. 契約要點（結論由你定，這裡只列必須有答案的欄位）

1. **`connections` 是 getter，不是 state。** `resolveConnections` 每次重算的約定寫在 `src/types/layout.ts` 開頭，不要在 store 破例。
2. **action 最小集**：載入快照、加／刪設備、移動設備、加／刪管線。放置合法性（重疊）**回傳結果而非 throw**——L2 要靠回傳值決定要不要畫紅框。
3. **給 L2 的讀取面是唯讀的**：toby／harry 拿到的東西不應該可以直接 mutate。
4. **`LayoutSnapshot` 進出對稱**：`loadSnapshot(toLayoutSnapshot(scenario))` 後再匯出，應該等值。

以上四點都要在測試裡釘住；實作形狀（單一 store／store＋composable／要不要 `readonly()`）你決定。

---

## 4. 本週不做（明列，免得被問）

| 項 | 為什麼 |
|----|--------|
| C2 連線契約重訂 | 續壓至 store 契約落地後，避免同週改兩層契約 |
| D4 藍圖格式重訂 | 同上；且會動到既有存檔相容性 |
| 擺放鏈（R-B2） | 需要 GridCanvas 先有殼；排 9/14 整合週 |
| GridCanvas 殼 | 已派給 toby；規則 17／§2.4「上游不要吃下游」 |

---

## 5. DoD

- [ ] `src/store/layoutStore.ts` 在 master 或可審 PR
- [ ] `pnpm test src/__tests__/store/layoutStore.test.ts` 綠，且涵蓋 §3 四點
- [ ] `pnpm test src/__tests__/store/editorStore.test.ts` 原樣綠（未動舊 store）
- [ ] `pnpm type-check` 綠
- [ ] PR body 有一段給 L2 看的**讀取面簽章**（型別即可，不必寫散文）
- [ ] 若可再解鎖，補一句：`layout-store：……；L2 可開 ……`；**不可解鎖就明寫「本週仍只讀」**

---

## 6. 交付後的下游動作

- toby 的 [T1](../../toby/0907/W0907-T1_gridcanvas_readonly.md) 本週吃 **props**，不吃 store——你的 store 完成後**不要**回頭去改他的元件，9/14 整合時再接。
- harry 的 [H1](../../harry/0907/W0907-H1_grid_viewport.md) 純座標換算，與 store 無關。
- 若 §3 第 2 點的回傳形狀變了，在 Discord 貼一行型別即可，不要重寫工單。

---

## 7. 未交頂替

**無頂替。** 本項未達成時 09/27 門檻範圍必須再縮一次（見 [WEEK_20260907](../../WEEK_20260907.md) §0.1），由主編在週會決定縮到哪。
