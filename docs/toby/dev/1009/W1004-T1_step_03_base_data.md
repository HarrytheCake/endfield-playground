# W1004-T1 步驟 03：基地與出界資料接線

狀態：已完成並驗證，A0 共用函式接線待上游（2026-10-09）。前置：[步驟 02](./W1004-T1_step_02_viewport.md) 完成。

## 目標與修改檔案

在 `LayoutView.vue` 將基地選擇映射為純尺寸與出界 ID，透過 GridCanvas props 提供資料。必要時使用已交付的上游純函式，不修改 canPlaceDevice 或 layoutStore。

## 執行順序

1. 在 L2 讀 canvasStore.baseRegion 與 canvasSize。null 對應無框與空出界 ID；武陵為 256×256，四號谷地為 192×192。尺寸不得在元件重抄一份常數表。
2. 再查 devicesOutsideBase 是否已合入。若存在，以實際簽章呼叫，核對 readonly／DeepReadonly 支援，避免 any 或可變型別斷言。
3. 若尚未交付，暫在 LayoutView 的單一 computed 路徑使用 getMachineById → deviceSizeFromMachine → toDeviceFootprint → getDeviceOccupiedCells。
4. 以 isWithinBaseRegion 判定各 cell 的 x/y；任一格不在基地內即列出 device.id。基地是 xy 框，z 不改變框線判定；多層格點不可讓設備 ID 重複。
5. 不用舊 isDeviceWithinBaseRegion 強制接 PlacedDevice，不重寫旋轉寬高交換公式。未知 machine 的處理遵守目前渲染與資料有效性契約，不能把未知機器直接當成基地出界。
6. 將基地尺寸與出界 ID 清單／唯讀集合傳入 GridCanvas。computed 應跟隨設備位置、旋轉與基地選擇更新；不回寫設備資料，不產生 history。
7. 保留 canPlaceDevice 與 addDevice 既有預檢。出界與重疊同時存在時，拒絕原因仍是原有重疊規則。
8. 若使用暫時接法，記錄待替換位置與契約；上游合入後以 devicesOutsideBase 替換單一計算接點，避免永久保留兩種判定。

## 驗收

| 輸入                         | 預期                             |
| ---------------------------- | -------------------------------- |
| region=null；設備在任意位置  | 無出界 ID，尺寸為 null           |
| 空設備清單；已選基地         | 出界清單為空，基地尺寸存在       |
| 所有佔格位於 0..w-1、0..h-1  | 不出界                           |
| 佔格含 x=w、y=h 或負值       | 設備 ID 列入清單                 |
| 原點在內，右側／下側部分跨界 | 設備仍列為出界                   |
| 非正方形設備 rotation=1 或 3 | 依旋轉後的實際佔格判定           |
| 多台設備、多個 z 層          | 每台出界設備 ID 僅出現一次       |
| 切換武陵、四號谷地、自由畫布 | 清單與尺寸即時更新               |
| 無重疊的基地外設備落子       | addDevice 成功，Error 為衍生顯示 |

上游函式若已存在但契約與上述結果不符，記錄具體案例並回報，不修改落子規則掩蓋問題。相關幾何與 placementCheck／layoutStore 測試應保持通過。

下一步：[步驟 04](./W1004-T1_step_04_visual_verification.md)。

## 執行證據

LayoutView 讀 canvasStore.canvasSize，傳純基地尺寸與 outsideDeviceIds。本機分支尚無 A0 函式，暫以共用 getDeviceOccupiedCells、toDeviceFootprint、deviceSizeFromMachine 與 isWithinBaseRegion 判定；日後只替換 outsideDeviceIds computed 接點。

pnpm type-check 通過；deviceOccupancy、machineGeometry、placementCheck 共 3 個檔案、387 項測試通過。Chrome 正式首頁完成 17 項斷言，其中 8 項重驗視窗，9 項驗證 null 基地、256×256 尺寸、負座標設備、原點在內但部分跨界、x=200 在武陵內／谷地外、非正方形設備旋轉出界、跨層 ID 唯一及取消基地清空清單。

這一階段只驗證 props 資料，可見框線與 Error 留在步驟 04 驗證。canPlaceDevice 與 layoutStore 未修改。
