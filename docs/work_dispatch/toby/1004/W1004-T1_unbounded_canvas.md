# W1004-T1｜toby｜畫布無邊界；基地只畫框線與出界 Error

| meta | value |
|------|-------|
| 週次 | 2026-10-04 → 2026-10-11 |
| 等級 | **確定** |
| 擋門檻 | 否（M3 前置） |
| 教學檔 | [GUIDE_unbounded_canvas.md](./GUIDE_unbounded_canvas.md) |
| 畫面｜交哪個檔｜不要碰｜卡住找誰 | 平移後仍能在 12×8 外落子；選基地有框、框外有 Error｜`GridCanvas.vue`、`LayoutView.vue`（可呼叫 `useGridViewport`）｜`MainLayout.vue`（harry）、工具列視覺、StatsPanel｜aaaaa（出界規則）、harry（視窗數學已在 composable） |

---

## 0. 白話目標

現在 `GridCanvas` 寫死 **12×8**，設備超出就畫不到。會議定案：**基地畫布沒有限制範圍**；使用者選了基地之後，只是多一層框線，超出的設備要能看見 **Error**，但**還是放得下去**。

點擊落子鏈上週已通，本週不要重做落子。

---

## 1. 一句話驗收

**`pnpm dev`：畫面能平移到原來的地圖外面並放下機器；選一個基地後看得到框；框外的機器有 Error 樣、沒有被 `addDevice` 拒絕。**

---

## 2. 怎麼做（約束）

1. **不要再拿 `gridWidth`／`gridHeight` 當世界大小。** 世界是無限格點；螢幕上只畫視窗內的線。W0907 的 `useGridViewport` 已在 master，**本週允許你改 `GridCanvas` 去接它**（上週檔案鎖已過期）。
2. 基地尺寸沿用 `canvasStore` 的 `BASE_REGION_SIZES`（`wuling`／`valley4`）。LayoutView 可以讀 `canvasStore.baseRegion` 再 **以 props 丟進 GridCanvas**；**GridCanvas 本身仍禁止 import Pinia**。
3. Error＝視覺。不要把出界寫進 `canPlaceDevice` 的失敗理由（那會擋落子，違 spec）。
4. **本週不修** 空畫布自動載入 `connected` fixture（已知債，避開行為大改）。
5. 設備方塊的填色／字重留給 G＋S；你只要留穩定的 `data-device-id` 或獨立 `<g>`，並給出界一個 class／prop（例如 `out-of-base`），讓他們好套稿。
6. **出界清單本週由 aaaaa 交純函式**（`devicesOutsideBase(devices, region) → string[]`，[A0 §1](../../aaaaa/1004/W1004-A0_dispatch_and_e003.md) 已改必做）。**你不必等他**——先用現有幾何畫框標紅，他合入後換過去，避免長出第二套出界幾何。

---

## 3. 不要碰

- `MainLayout.vue`（harry 本週全檔）
- `ToolbarPanel` template／style
- 選取／旋轉／刪除（管線變藍是左面板＋H1／後續，不是你這張的主交付）
- 改 `layoutStore.addDevice` 簽章

---

## 4. DoD

- [ ] 正式頁可在原 12×8 外落子並看見佔格
- [ ] 未選基地：無框、無出界 Error
- [ ] 已選基地：框線在；框外有 Error 視覺；仍可放
- [ ] `grep store src/editor/layout/GridCanvas.vue` 無 Pinia
