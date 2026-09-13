# 步驟 3：呈現設備資訊

## 目標

在 Inspector 現有「未來預留」區塊之前，加入設備資訊與空狀態。

## 修改檔案

只修改：

```text
src/editor/inspector/InspectorPanel.vue
```

## 建議模板

```vue
<div class="mt-2 border-t border-zinc-700 pt-3">
    <h3 class="text-xs tracking-wide text-zinc-400 uppercase">設備資訊</h3>

    <dl v-if="selectedMachine" class="mt-2 space-y-1 text-sm">
        <div class="flex justify-between">
            <dt class="text-zinc-400">名稱</dt>
            <dd class="text-zinc-100">{{ selectedMachine.name }}</dd>
        </div>
        <div class="flex justify-between">
            <dt class="text-zinc-400">佔格</dt>
            <dd class="text-zinc-100">
                {{ selectedMachine.width }}×{{ selectedMachine.height }}
            </dd>
        </div>
        <div class="flex justify-between">
            <dt class="text-zinc-400">耗電</dt>
            <dd class="text-zinc-100">{{ selectedMachine.power }}</dd>
        </div>
    </dl>

    <p v-else class="mt-2 text-sm text-zinc-500">未選取設備</p>
</div>
```

## 顯示規則

| 狀態 | 顯示結果 |
| --- | --- |
| 未選取 | 顯示「未選取設備」 |
| 單選且查得到機器 | 顯示名稱、佔格與耗電 |
| 多選 | 顯示「未選取設備」 |
| 節點不存在 | 顯示「未選取設備」 |
| 缺少 machineType | 顯示「未選取設備」 |
| getMachine 查無資料 | 顯示「未選取設備」 |

## 本切片刻意不處理

- 不加入編輯欄位或按鈕。
- 不加入配方、環境、效率、即時產速或管線資訊。
- 不做多選設備統計。
- 不拆出新元件。
- 不處理完整 B4 的旋轉後尺寸交換。
- 不修改既有地圖設定和產能資訊區塊。

## 驗收條件

- 狀態切換後不殘留上一台設備資料。
- 缺值時不出現 runtime error。
- 顯示值直接來自 Machine 定義。
- 新增模板沒有 store 寫入事件。

## 下一步

畫面完成後，進入「步驟 4：手動驗收與問題分類」。
