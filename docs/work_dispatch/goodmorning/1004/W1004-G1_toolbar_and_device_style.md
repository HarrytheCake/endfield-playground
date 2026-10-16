# W1004-G1｜goodmorning｜#48 必須進 master；再與 shirone 做畫布設備樣

| meta | value |
|------|-------|
| 週次 | 2026-10-04 → 2026-10-11 |
| 等級 | **確定・兩件，有先後** |
| 擋門檻 | 否 |
| 上游 | [#48](https://github.com/dernoson/endfield-playground/pull/48)、上週 [W0921-G1](../0921/W0921-G1_toolbar_pr48_land.md) |
| 畫面｜交哪個檔｜不要碰｜卡住找誰 | 正式工具列是你的視覺＋真機器；畫布上的設備對得上白紙稿｜`ToolbarPanel.vue`／stories；其後 `GridCanvas` **僅設備 `<g>`**｜toby 的視窗／格線、MainLayout 槽位、layoutStore｜dernoson（#48 衝突）、shirone（設備樣）、paper（稿） |

---

## 0. 先後

| # | 件 | 死線 |
|---|----|------|
| **A** | 把 #48 rebase 到現在的 master 並合入 | **本週必須**（已拖過 9/13） |
| **B** | 與 shirone 一起做「已放置設備」樣式 | A 之後；同一套元件，不要各畫各的 |

會議「工具列完工」＝A。B 是同一句後面的合作項。

---

## 1. A：#48（與上週相同，但現在一定衝突）

master 已有 toby 的 `usePlacementIntent`／`arm`。你分支仍是 CONFLICTING。

1. 從**最新 master** 重套你的 `<template>`／`<style>`／stories  
2. 資料來源必須是 `listToolbarMachines`，**禁止**寫死 `equipments = […]` 當正式列表  
3. **不得刪 `arm`**  
4. **舊五顆 `EquipmentType` 按鈕從正式工具列拿掉**（它們只武裝舊 store，點了新畫布沒反應）

合入硬條件仍見 [B1 細項](../../../roadmap/detail/B1_toolbar_real_machines.md)。衝突當天找 dernoson，不要整檔覆蓋。

---

## 2. B：畫布設備樣

白紙稿裡已經放在畫布上的機器長什麼，就做成什麼（圓角、標籤、佔格填色）。  
**只改 `GridCanvas.vue` 裡畫設備的那一組 `<g>`**（T1 合入後再動，避免和無邊界 viewBox 互蓋）。  
和 shirone 約好一個元件或一段 markup，**禁止**兩人各 PR 一套方塊。

未接線管線樣式等 P1，本週不做管線。

---

## 3. 一句話驗收

**A：#48 在 master，真機器 Tab 能點、落子還在、舊五顆消失。**  
**B：畫布上的佔格不再是預設天空藍小方塊，對得上稿。**

---

## 4. DoD

- [ ] #48 合入或可審且無 conflict
- [ ] `listToolbarMachines` 仍是資料源
- [ ] 正式頁無舊五顆
- [ ] （B）設備視覺與 S1 同一套
