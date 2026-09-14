# W0914-D0｜dernoson｜守閘：合入四支 PR，放行主畫面接入

| meta | value |
|------|-------|
| 週次 | 2026-09-14 → 2026-09-20 |
| 等級 | **確定**（決策／合入，不兼功能） |
| 擋門檻 | 否（閘門失守會撤回主畫面接入） |
| 上游 | [WEEK_20260914](../../WEEK_20260914.md) **v1.1** |
| 產能參考 | ≤2h，全額給守門 |
| 待審上限 | **≤3** |

---

## 1. 清積壓

合入序：**#45 → #47 → #48（需 paper「過」）→ T1（須 #45 已合）→ S1。**

| PR | 誰 | 你要做的 |
|----|----|----------|
| #45 | aaaaa | **前段合入**；枝節可直接合 |
| #47 | harry | #45 之後 |
| #48 | goodmorning | 技術你審；視覺等 paper |
| T1 | toby | #45 後才審主畫面接入 |
| S1 | shirone | StatsPanel → `src/app/`；不押死線 |

---

## 2. 定案（含 PR #49 勘誤）

| # | 事項 | 結論 |
|---|------|------|
| 1 | 主畫面接入 | 改掛 GridCanvas；FactoryCanvas 保留不刪 |
| 2 | 視角切換器 | **照稿**；本週不做；下週另派人（非 Avery） |
| 3 | 互動範圍 | 只讀＋viewport；**B2／B4 等底層接完**（擴大必要項已撤回） |
| 4 | T1 開工 | **#45 合入後**；fixture 頂替接線＝退回 |
| 5 | L2 切分 | toby＝容器；harry＝viewport；同檔退回後到者 |
| 6 | ToolbarPanel | goodmorning **限視覺**解鎖 |
| 7 | Storybook | L2 不以 SB 驗收；L3 要 story |
| 8 | 9/27 | **硬綁 B1**（恢復原 M2） |
| 9 | 右側面板 | **產線總覽 StatsPanel**（非 B4）；路徑 → `src/app/StatsPanel/` |
| 10 | paper 命名 | 會議已確認 OK；排版＝工程師問 Figma comment；結案 |
| 11 | A0／A1 | 不限制超前；交了就審 |

---

## 3. 閘門判準

| PR 內容 | 處置 |
|---------|------|
| store 收尾、viewport、主畫面接入（只讀）、StatsPanel 遷移、L3 story | 可審 |
| 工具列只改視覺（goodmorning） | 可審 |
| 擺放／選取接線 | **退回** |
| 刪 FactoryCanvas | **退回** |
| T1 在 #45 未合時用 fixture 當正式資料源交差 | **退回**（可標 WIP） |
| GridCanvas 內 store import | **退回** |
| toby／harry 同檔 | **退回後到者** |
| goodmorning 改 ToolbarPanel script 邏輯／a11y | 退回 |
| shirone 改 inspector（當設備資訊做） | 退回 |
| 網頁 Upload／不可見字元 | 退回 |

---

## 4. 仍要處理

| # | 事項 | 期限 |
|---|------|------|
| B | #48 comment：可改視覺、邏輯／a11y 不動 | 盡快 |
| C | T1：確認無 store in GridCanvas、無擅自切換器也能過（本週不要求切換） | 隨 T1 |
| D | 9/20：記錄 #45／T1 進度即可；**不必**為 B2／B4 做降級儀式（已不硬綁） | 9/20 |

---

## 5. 不做（規則 17）

不寫 layout／toolbar／StatsPanel 功能。下游交不出就延壓標 roadmap。

---

## 6. DoD

- [ ] #45 合入
- [ ] #47 合入或明寫卡點
- [ ] #48 技術意見＋paper「過」後合入
- [ ] T1 若開：#45 已合；GridCanvas 無 store
- [ ] S1 若開：路徑在 `src/app/StatsPanel/`，非 inspector
- [ ] 無擺放／選取被放行
- [ ] 待審 ≤3
- [ ] 自己的 diff 不含 layout／toolbar／StatsPanel 實作
