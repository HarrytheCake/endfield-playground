# V9-C2 — WxH 格點拓樸與埠定位

**對應工項：** V9-C2  
**狀態：** 未開始  
**依賴：** B1（modes-only ports）  
**最後更新：** 2026-08-02

---

## 1. 目標

機器預覽與引擎測試頁拓樸示意：

1. 依機器 `width` × `height` 繪製格子（例：灌裝機 **6×4**）  
2. 輸入／輸出口依當前 mode 的 `side`＋`offset` 落在格邊對應位置  
3. 切換 `machineMode` 時埠位置／數量更新（灌裝機 base vs gas_liquid：左側多 pipe 入）

適用：`MachineCatalogPanel`、`DevTopologySvg`／`topologyPortUtils`（及 graph-viz 若共用）。

---

## 2. 定位規則（建議寫死於 utils）

| side | 格線意義 |
|------|----------|
| top | 上邊，第 `offset` 格（0-based，沿寬度） |
| bottom | 下邊，第 `offset` 格 |
| left | 左邊，第 `offset` 格（沿高度） |
| right | 右邊，第 `offset` 格 |

- offset 超出 width／height 時：clamp 或標資料錯誤（建議 clamp＋dev 警告）  
- 旋轉：若節點有 rotation，格點埠需套與畫布一致的旋轉（與 `portUtils` 對齊）

---

## 3. 非目標

- 不在本項重畫主編輯 `FactoryCanvas` 全部 UI（若 MachineShape 可順便對齊格點則加分）  
- 不做正式美術格線材質

---

## 4. DoD

- [ ] 灌裝機 6×4 格可見；埠落點與 modes 資料一致  
- [ ] 切 gas_liquid_mode 後左側 pipe 入出現  
- [ ] flow-engine 拓樸與機器預覽行為一致

---

## 5. 開發日誌

### 2026-08-02

- 建立細項
