# 待討論：`canvasStore.zoom` / `offset` 完全沒有消費者

**狀態：** 待與 harry / toby（L2）、dernoson / aaaaa（L1，`canvasStore` owner）對齊，尚未動工
**相關檔案：** `src/store/canvasStore.ts`、`src/editor/canvas/FactoryCanvas.vue`
**相關規則：** 無強制規則衝突，純屬架構取捨問題

---

## 1. 問題是什麼

`canvasStore` 定義了 `zoom`、`offset`（連同對應的 `setZoom()` / `setOffset()`）作為畫布縮放與平移狀態，但**全專案沒有任何 `.vue` 元件讀寫這兩個欄位**。

實際負責畫布縮放平移的是 Vue Flow 元件自己：

```html
<!-- FactoryCanvas.vue -->
<VueFlow :zoom-on-scroll="true" :pan-on-drag="activeTool === 'pan'" ... />
```

Vue Flow 內部維護自己的一份 viewport 狀態（透過 `useVueFlow()` 可以讀寫），跟 `canvasStore.zoom` / `offset` 完全無關、彼此不同步。

這跟同一批被發現的 `gridSize` 問題（已修）不一樣：`gridSize` 是「同一個數值該由誰決定」的單純不一致，已經改成 `canvasStore.gridSize` 單一事實來源；`zoom` / `offset` 則是「這個 store 欄位有沒有存在意義」的問題——現在畫布縮放平移運作正常，`canvasStore` 這兩個欄位純粹是死狀態，改了也不會反映到畫面上。

---

## 2. 為什麼會這樣（推測的設計脈絡）

`docs/dernoson/L2/L2.md` §3 CR-05「視角」條列了：

> 左下角視角切換控項容器、Tab 鍵輪替綁定、**並列視角分隔線拖移、點選一側時聯動另一側的 Pan + Zoom**

「點選一側時聯動另一側的 Pan + Zoom」是關鍵：CR-05 規劃的是**兩個獨立畫布並排顯示**（例如同時看武陵跟山谷4，或是同一個藍圖的兩個視角），使用者操作其中一側時，另一側要跟著同步縮放/平移。

這種情境下，Vue Flow 每個 `<VueFlow>` 元件實例都有自己獨立的內部 viewport 狀態，**兩個實例互相看不到對方**，沒辦法直接同步。這時才需要一個外部、共用的 store 當作「目前縮放/平移到哪」的單一事實來源，兩側各自 watch 這個 store 並呼叫自己的 `useVueFlow().setViewport()` 對齊。

推測 `canvasStore.zoom` / `offset` 就是為了這個未來情境先鋪好的欄位——但 CR-05 目前還沒進入實作階段（`L1.md` 顯示 CR-05 Phase 1 現況只有 `azure9572` 的純演算法，`useViewStore` / `useFlowChartStore` 尚未交付），現在只有單一畫布的 CR-01 MVP，自然沒有「需要跨實例同步」這件事，這兩個欄位也就沒有被接上的理由。

---

## 3. 為什麼不建議現在硬接上

如果現在為了「讓 `canvasStore` 看起來有被用到」而把 `zoom` / `offset` 接到 `FactoryCanvas.vue`（例如 watch Vue Flow 的 viewport 變化寫回 store，或反過來），會製造**兩份 viewport 真相**：

- Vue Flow 內部狀態（實際畫面依據）
- `canvasStore.zoom` / `offset`（外部鏡射狀態）

只要沒有做嚴謹的雙向同步（而且雙向同步本身容易出現循環更新、或使用者滾輪縮放時觸發大量 store mutation 造成效能問題），這兩份狀態遲早會不一致——變成又一個「看起來有接、但其實會飄掉」的 bug 來源，比「完全沒接」更危險，因為表面上看起來正常。

單一畫布的情境下，讓 Vue Flow 自己管理 viewport（現況）是最簡單、最不容易出錯的做法。

---

## 4. 建議處理方式

**現階段（CR-01 單畫布 MVP）：**

- 不接上 `zoom` / `offset`，維持現狀（Vue Flow 自行管理）
- 在 `canvasStore.ts` 的 `zoom` / `offset` 宣告處補一句註解，說明「保留給 CR-05 並列視角跨畫布同步用，CR-01 單畫布現況不消費」——避免之後又有人（或下一次的程式碼健檢）誤以為這是遺漏，重複回報同一個問題

**CR-05 真正啟動時再決定：**

到時候有兩個方向可以選，不一定要延用現在這兩個欄位：

1. **延用 `canvasStore.zoom` / `offset`**：兩個 `<VueFlow>` 實例都 watch 這兩個欄位、互相呼叫 `setViewport()` 同步；使用者操作任一側時，先更新 `canvasStore`，再讓另一側的 watch 把畫面拉過去
2. **另外設計專屬同步機制**：例如只同步「這次操作的 delta」而非「絕對 zoom/offset 值」，或是由 L2 直接持有兩個 `useVueFlow()` 實例的參照互相呼叫，不透過 store——這樣可以避開「viewport 高頻變動導致 store 被塞爆」的效能疑慮

這個決定應該等 CR-05 的 `useViewStore` 設計出來、L2 知道「並列視角」實際上要怎麼呈現（左右分割？分頁切換？）之後再拍板，現在討論太早，**先留著問題、不急著解**。

---

## 5. 待討論的具體問題（CR-05 啟動前可以先想）

1. `canvasStore.zoom` / `offset` 到底要不要留到 CR-05，還是乾脆先移除、等 CR-05 設計出爐時再重新開欄位（避免現在的簽名綁死未來設計）？
2. 如果 CR-05 決定延用 `canvasStore`，「同步」要做成即時（每次滾輪都同步）還是操作結束才同步（例如放開滑鼠才觸發一次）？這會影響效能與使用體感
3. 並列視角是不是一定要兩個縮放/平移完全鎖定一致？還是有「各自獨立瀏覽、只有點擊時才跳轉對齊」這種比較鬆散的同步模式（後者不需要即時雙向 watch，複雜度低很多）
