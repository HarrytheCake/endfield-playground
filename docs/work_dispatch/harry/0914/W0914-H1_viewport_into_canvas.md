# W0914-H1｜harry｜viewport 收尾，並交出「給容器用的接面」

| meta | value |
|------|-------|
| 週次 | 2026-09-14 → 2026-09-20 |
| 等級 | **確定**（L2；上週那塊的收尾＋交接） |
| 擋門檻 | 否（是 [T1](../../toby/0914/W0914-T1_main_view_integration.md) 的支撐塊，不列 9/27 必要條件） |
| 對應 PR | [#47](https://github.com/dernoson/endfield-playground/pull/47)（開著；依 review 收尾） |
| 你的檔 | `src/editor/layout/useGridViewport.ts`、`src/app/dev/GridViewportDemo.vue`、`src/router/index.ts`、`src/__tests__/editor/useGridViewport.test.ts` |
| 產能參考 | 自報 3–5h；**無硬 deadline**，推到分支即算交付 |
| 合入序 | #45 之後、#48 之前 |
    10|
---

## 1. 目標

上週的平移縮放已經有 PR，但**還有 review 意見沒收**。本週兩件事：

1. **把 #47 收乾淨並合入**——它排在本週合入序第二位。
2. **交出「別人怎麼把它包上去」的說明**。主編 9/13 已裁定：L2 的核心任務是把東西接進主畫面，而**主畫面容器這週由 toby 一個人動**。所以你不去改他的檔，改成讓他接得動。

一句話：**#47 進 master，而且 toby 看你 PR body 那段就知道怎麼在容器裡用。**

---

## 2. 為什麼不是你去接主畫面

不是能力問題，是**同檔衝突**。本週主畫面容器（`LayoutView.vue`、`MainLayout.vue`）只允許一個人動，主編指定 toby；規則是「同週兩人改同一檔，退回後到者」。

你和他的分界：

```text
LayoutView.vue（toby）
  ├─ import { useGridViewport } from ...（他 import 你的東西）
  └─ GridCanvas.vue（toby）
useGridViewport.ts（你）
GridViewportDemo.vue（你）
```

**import 你的檔不算改你的檔**，反之也一樣。會議紀錄寫的「與托比討論後接入主畫面」，執行接入的那一刀是他下。

---

## 3. 本週要有答案的三件事

1. **座標換算來回一致**：`screenToCell(cellToScreen(c)) === c`。這條是唯一會被別人依賴的契約，測試要釘死（上週已列，本週確認 review 後仍成立）。
2. **接面說明**：在 #47 的 PR body 補一段，至少交代——平移用哪個鍵、縮放上下限、`useGridViewport` 回傳什麼（transform 值？CSS style？事件處理器？），以及**容器要把 transform 套在哪一層**。三五行就好，不用散文。
3. **demo 頁要不要改成包真的 `GridCanvas`**：允許，但只能 **import** 它、不能改它。這樣 toby 可以直接照你的 demo 抄包法，是最省溝通的做法。**不做也不擋交付。**

---

## 4. 邊界

| 允許 | 不要 |
|------|------|
| 改 `useGridViewport.ts` 與其測試 | 碰 `src/editor/layout/LayoutView.vue`、`GridCanvas.vue`、`src/app/layouts/MainLayout.vue`（**toby 本週的檔**） |
| 改 `src/app/dev/GridViewportDemo.vue`，可 import `GridCanvas.vue` | 碰任何 Pinia store（`must_not` 沿用） |
| 改 `src/router/index.ts`（**本週 router 仍歸你**） | 做選取／擺放（本週仍鎖） |
| 鍵盤平移／縮放快捷鍵（同檔延伸，餘力才做） | 加深 `FactoryCanvas`／Vue Flow |
| — | 碰 `ToolbarPanel.vue`（本週歸 goodmorning）、`src/editor/inspector/*` |

`KEYBINDING_ACTIONS` 註冊表**本週仍不動**，維持寫死在 composable 裡（沿用 W0823-H1 的裁示）。

---

## 5. DoD

- [ ] #47 上的 review 意見逐條已回（改或說明不改的理由）
- [ ] `pnpm test src/__tests__/editor/useGridViewport.test.ts` 綠，含來回一致
- [ ] `pnpm dev` → `/dev/grid-viewport` 可拖曳平移、滾輪縮放，縮放有上下限且以游標為錨點
- [ ] `pnpm type-check`、`pnpm lint-check` 綠
- [ ] PR body 有 §3-2 那段接面說明
- [ ] diff 不含 `LayoutView.vue`、`GridCanvas.vue`、`MainLayout.vue`、`src/store/*`
- [ ] **#47 已合入 master**

---

## 6. 排程與同步

**不綁任何時間。** 週日會出席不是交付前提，缺席不視為未交付。

與 toby 的對齊走非同步即可：PR body 那段說明就是交接文件，**不需要開會**。他若問到你的檔怎麼用，Discord 回一段文字或短語音。

---

## 7. 未交頂替

不計失敗。**未交時 toby 的新畫布先不支援平移縮放**，固定尺寸也能過 T1 的驗收，所以本項不擋門檻、不擋他。

下週（9/21）若擺放解鎖，`screenToCell` 會變成落子的必要輸入——屆時本項會升級為必要路徑，本週先把契約與測試釘穩就好。
