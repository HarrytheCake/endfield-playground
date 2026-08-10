# V9-C2 — WxH 格點拓樸與埠定位

**對應工項：** V9-C2  
**狀態：** ✅ 完成  
**依賴：** B1（modes-only ports）  
**最後更新：** 2026-08-02

---

## 1. 目標

機器預覽與引擎測試頁拓樸示意：

1. 依機器 `width` × `height` 繪製格子（例：灌裝機 **6×4**）  
2. 輸入／輸出口依當前 mode 的 `side`＋`offset` 落在格邊對應位置  
3. 切換 `machineMode` 時埠位置／數量更新（灌裝機 base vs gas_liquid：左側多 pipe 入）

適用：`MachineCatalogPanel`、`DevTopologySvg`／`topologyPortUtils`（`/dev/flow-engine`；原 GraphViz 已退役）。

---

## 2. 定位規則（已寫死於 utils）

| side | 格線意義 |
|------|----------|
| top | 上邊，第 `offset` 格（0-based，沿寬度）中心 |
| bottom | 下邊，第 `offset` 格中心 |
| left | 左邊，第 `offset` 格（沿高度）中心 |
| right | 右邊，第 `offset` 格中心 |

- offset 超出 width／height：**clamp**＋可選 `console.warn`  
- 旋轉：`rotatePortSide`／`rotatePortOffset`；90°／270° 顯示格數寬高對調

核心 API：`portPositionOnGrid`／`portPositionOnRect`／`listGridLines`／`resolveDisplayGrid`（`src/app/dev/topologyPortUtils.ts`）。

---

## 3. 非目標

- 不在本項重畫主編輯 `FactoryCanvas` 全部 UI（`MachineShape` 本已用格點線段）  
- 不做正式美術格線材質

---

## 4. DoD

- [x] 灌裝機 6×4 格可見；埠落點與 modes 資料一致  
- [x] 切 gas_liquid_mode 後左側 pipe 入出現  
- [x] flow-engine 拓樸與機器預覽行為一致（共用 utils）  
- [x] `pnpm type-check` + `pnpm test` 通過

---

## 5. 開發日誌

### 2026-08-02

- 建立細項
- 完成：格點定位 utils、DevTopologySvg／MachineCatalogPanel、測試、本檔標完成
