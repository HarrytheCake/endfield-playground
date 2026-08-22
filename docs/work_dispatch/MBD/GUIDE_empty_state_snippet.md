# 教學｜MBD｜空狀態片段與檔內現況（W0823-M1 專用）

| meta | value |
|------|-------|
| 對應工單 | [W0823-M1](./W0823-M1_item_summary_empty_state.md) |
| 唯一要改的檔 | `src/components/StatsPanel/ItemSummaryTable.vue` |
| 目的 | 讓你在零碎時間裡，貼片段就能收工 |

---

## 1. 檔案現況（動手前先知道）

| 現況 | 影響 |
|------|------|
| `defineProps<Props>()`，`rows: ItemSummaryRow[]`，型別就定義在同檔 | 不必動型別，直接判斷 `rows.length` |
| `StatsPanel/Index.vue` 已經傳 `:rows="[]"` | 打開 `pnpm dev` 右側統計就是空狀態情境，不必造假資料 |
| **檔案最後一行 `</template>` 後面有一顆多餘的 `S`** | 同檔順手刪掉即可（見 §3），這是既有殘留，不算你弄壞的 |
| 項目名稱用了 `text-gray-900`，在 `bg-zinc-950` 深底上幾乎看不見 | **本週不要改**；已記入 D1 待辦，改了會擴大 diff |

---

## 2. 空狀態片段（貼進 template）

把 `<div class="overflow-x-auto"> … </div>` 那整塊表格包成「有資料才顯示」，再加一塊空狀態：

```vue
<template>
    <div class="space-y-3 rounded-lg border border-zinc-700 bg-zinc-950 p-4 text-white">
        <h3 class="text-base font-bold text-white">項目統計表格 ItemSummaryTable</h3>

        <!-- 空狀態：尚未有任何產耗資料 -->
        <p v-if="rows.length === 0" class="py-6 text-center text-sm text-zinc-400">
            目前沒有產耗資料——放置設備並連線後會顯示在這裡。
        </p>

        <!-- 有資料時維持原本表格，整段照舊不要改內容 -->
        <div v-else class="overflow-x-auto">
            <!-- ...原本的 <table> 完全不動... -->
        </div>
    </div>
</template>
```

只有兩個動作：**加一個 `v-if` 段落**、**在原本表格外層那個 `div` 加 `v-else`**。表格內部一行都不用碰。

文案可自己調，但要讓人看得懂「不是壞掉，是還沒資料」。

---

## 3. 順手清掉檔尾殘字

目前檔案結尾長這樣：

```text
</template>
S
```

把最後那行的 `S` 刪掉即可。`pnpm format-check` 與 review 都會挑這個。

---

## 4. 驗收（30 秒）

1. `pnpm dev` → 看右側統計面板 → 出現空狀態句子，而不是只有表頭的空白表
2. `pnpm type-check`、`pnpm lint-check`、`pnpm format-check`、`pnpm test` 皆過
3. 截圖丟 Discord

想確認「有資料時表格沒被弄壞」：可以在本機暫時把 `StatsPanel/Index.vue` 的 `:rows="[]"` 改成一筆假資料看一眼，**看完還原**，那個檔不要進 commit。

---

## 5. 交件

```powershell
git checkout -b dev/mbd-empty-state
git add src/components/StatsPanel/ItemSummaryTable.vue
git commit -m "feat(stats): ItemSummaryTable 無資料時顯示空狀態"
git push -u origin dev/mbd-empty-state
```

PR 或 Discord 說明寫三件事：改了哪個檔、空狀態長什麼樣（附截圖）、確認沒碰 store／MainLayout。

---

## 6. 開工前與暫停

- 開工前 Discord 一句：「W0823-M1 我要改 `ItemSummaryTable.vue`」（AI 直推者的先報檔規則）
- 個人事務導致做不動：回一句「本週暫停」即可結案，**不計失敗**，右側維持現況
