# W0914-A0｜aaaaa｜`layoutStore` 收尾並合入 master

| meta | value |
|------|-------|
| 週次 | 2026-09-14 → 2026-09-20 |
| 等級 | **確定・最優先**（本週唯一必要條件的前置） |
| 擋門檻 | **是**（T1 開工前置；9/27 硬綁仍只押 B1。B2／B4 擴大必要項已撤回） |
| 對應 PR | [#45](https://github.com/dernoson/endfield-playground/pull/45)（開著；依 review 收尾） |
| 上游 | [WEEK_20260914](../../WEEK_20260914.md) v1.1、[ROADMAP_OUTLINE](../../../roadmap/ROADMAP_OUTLINE.md) v1.9 |
| 產能參考 | 自報 3–5h；本項優先吃滿 |
| 合入序 | **#45 排第一**，其後才是 #47、#48 |

---

## 1. 目標

上週 [A0](../0907/W0907-A0_layout_store_model.md) 的四點契約已經寫完並開了 PR，但**正式樹上還沒有 store**：`origin/master` 目前 `src/store/layoutStore.ts` 不存在。本週的事只有一件——**把它送進 master**。

過關的一句話：**master 上有 `useLayoutStore()`，toby 的容器 import 得到。**

本項是 **T1 開工前置**（主編 09/15：#45 合入後 toby 才開工，不以 fixture 頂替）。

**關於 B2／B4：** PR #45 review 時曾誤以為要提前列 9/27 必要——主編已撤回。M2 恢復**硬綁 B1**；擺放／選取等佈局底層接完再開。你若超前做 A1 草案，**交了就審，不限制速度**。

---

## 2. 本週範圍

| 允許 | 不要 |
|------|------|
| 依 #45 上的 review 意見改 `src/store/layoutStore.ts` | 趁收尾順手擴大 action 集（新需求另開） |
| 補／改 `src/__tests__/store/layoutStore.test.ts` | 改 `editorStore` 既有簽名 |
| 修 `src/types/layout.ts`、`src/utils/layout/*` 的相關缺口 | 碰 `src/app/layouts/MainLayout.vue`、`src/editor/layout/*`（**toby 本週的檔**） |
| 回答 toby／harry 的讀取面問題（Discord 一行型別即可） | 碰 `src/editor/toolbar/ToolbarPanel.vue`（**本週 owner 是 goodmorning**） |
| 決定演示頁要不要一起交（見 §4） | 替 toby 寫容器接線（規則 17：上游不吃下游） |

### `ToolbarPanel.vue` 的鎖本週轉向

上週該檔對全員硬鎖、包含你。**本週改為 goodmorning 專屬（限視覺）**，所以**你也不要動它**。B1 的工具列→落子那一刀**改排 9/21**，理由是本週擺放仍鎖（見 §5）。

---

## 3. 收尾要守住的四點（沿用上週契約，不重新設計）

1. `connections` 是 getter，不是 state
2. action 最小集；放置合法性**回傳結果而非 throw**
3. 給 L2 的讀取面唯讀
4. `LayoutSnapshot` 進出對稱

review 若要求改的是**形狀**（例如某個 action 的參數順序），照改；若要求改的是**上面四點的語意**，先在 PR 回一句再改——那會連帶影響 toby 本週的容器。

---

## 4. 本地那四個未提交的檔

你工作樹上還有沒進版控的東西：

```text
src/app/dev/DevLayout.vue
src/app/dev/LayoutStorePreview.vue
src/app/dev/layoutStorePreviewUtils.ts
src/__tests__/app/layoutStorePreviewUtils.test.ts
```

**要不要隨 #45 一起交由你決定**，但請二選一講清楚：

- 一起交：說明它是 store 的驗收現場（`/dev/layout-store-preview`），dernoson 會一起看
- 不交：在 PR 回一句「演示頁留本地」，避免下週有人以為 master 上有這頁

**不要留在中間狀態**——上週已經發生過「以為有、遠端沒有」的落差。

---

## 5. 本週不做（明列）

| 項 | 為什麼 |
|----|--------|
| 擺放鏈接線（R-B2） | 本週互動仍鎖；容器 owner 是 toby，9/21 才開落子 |
| 選取接線／B4 攤平層 | 同上；shirone 本週只交 L3 呈現元件 |
| B1 工具列→落子 | 依賴 B2；且 `ToolbarPanel.vue` 本週在 goodmorning 手上 |
| C2／D4 | 另開 [A1](./W0914-A1_connection_blueprint_contract.md)，**#45 未收完就延** |

---

## 6. DoD

- [ ] #45 上的 review 意見逐條已回（改或說明不改的理由）
- [ ] `pnpm test src/__tests__/store/layoutStore.test.ts` 綠，涵蓋 §3 四點
- [ ] `pnpm test src/__tests__/store/editorStore.test.ts` 原樣綠
- [ ] `pnpm type-check`、`pnpm lint-check` 綠
- [ ] **#45 已合入 master**（`git cat-file -e origin/master:src/store/layoutStore.ts` 成立）
- [ ] diff 不含 `MainLayout.vue`、`src/editor/layout/*`、`ToolbarPanel.vue`
- [ ] §4 的演示頁去留已在 PR 明寫

---

## 7. 交付後的下游動作

- toby 的 [T1](../../toby/0914/W0914-T1_main_view_integration.md) 會在容器裡 `useLayoutStore()`。**合入後不要回頭改他的容器**；他若用錯讀取面，在 PR comment 指出即可。
- harry 的 [H1](../../harry/0914/W0914-H1_viewport_into_canvas.md) 與 store 無關。
- 讀取面若在收尾中變形，**Discord 貼一行型別**通知 toby，不要改他的工單。

---

## 8. 未交頂替

**無頂替。** 本項未合入時，toby T1 **不得開工**（主編裁）。9/27 硬綁仍是 B1；B2／B4 不因本項未合而自動升格為必要。
