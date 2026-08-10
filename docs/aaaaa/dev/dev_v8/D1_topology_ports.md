# V8-D1 — 拓樸依 machineMode ports 顯示

**對應工項：** V8-D1  
**狀態：** 完成  
**依賴：** A1；與 B1 共用埠幾何語意

---

## 1. 目標

改 `/dev/flow-engine`（與當時 `/dev/graph-viz`；**後者 V9-H1-4 已退役**）拓樸視覺化：

- 節點出入口依當前 `machineMode` 的 `ports`（side／offset／media）
- 切換 mode 時更新標籤與埠示意（寫回 JSON `data.machineMode`）
- Mermaid 節點標籤附帶 mode／埠數摘要（匯出格式仍可用）

---

## 2. 實作

| 檔案 | 說明 |
|------|------|
| `src/app/dev/topologyPortUtils.ts` | 埠列表、座標、handle 端點、標籤 |
| `src/app/dev/DevTopologySvg.vue` | 共用 SVG 拓樸（埠色塊＋mode 副標） |
| `FlowEngineTest.vue` | 改用 DevTopologySvg；點節點切 mode |
| `GraphViz.vue` | （歷史）埠示意拓樸；**V9-H1-4 已刪** |
| `topologyPortUtils.test.ts` | 精煉爐 mode 埠數回歸 |

---

## 3. DoD

- [x] 拓樸可看出各節點 in／out 埠數與方位差異
- [x] 切 machineMode 後標籤與埠示意更新
- [x] 不破壞既有 Mermaid／JSON 匯出

---

## 4. 開發日誌

### 2026-08-01

- 初稿
- 完成共用工具與兩頁接線
