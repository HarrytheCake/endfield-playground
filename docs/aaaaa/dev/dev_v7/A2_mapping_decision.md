# V7-A2 — 欄位對映與遷移策略定案

**對應工項：** V7-A2  
**狀態：** 已定案（2026-08-01）  
**依賴：** [A1_diff_analysis.md](./A1_diff_analysis.md)

---

## 1. 最終決策

| 決策項 | 結論 | 日期 |
|--------|------|------|
| Q1 data 輸出 | **原樣複製 `data_1` → `docs/aaaaa/data/`**（JSON + md + README） | 2026-08-01 |
| Q2 Port 命名 | **TS 改為 `belt` \| `pipe`**（與 data_1 `media` 一致） | 2026-08-01 |
| Q3 是否含 src+引擎 | **同版本做完** `src/types` + `src/data` + FlowEngine **最小支援**（mode／媒質） | 2026-08-01 |
| Q4 machineMode | **節點 data 新增 `machineMode: string`**；缺省 `modes[0].id` | 2026-08-01 |
| Q5 loss | **只進資料／型別；計算延後**（不納入 itemSummary） | 2026-08-01 |
| Q6 腳本語言 | **Node**，放在 `docs/aaaaa/scripts/` | 2026-08-01 |

---

## 2. 凍結規格摘要

### 2.1 資料流

```text
docs/aaaaa/data_1/*  ──(Node 腳本原樣複製)──►  docs/aaaaa/data/*
                                              │
                                              ▼
                                    src/types + src/data（對齊 v3）
                                              │
                                              ▼
                         FlowEngine 最小：machineMode + belt/pipe 媒質檢查
                         （loss 不計算）
```

### 2.2 Port

```typescript
export type PortMedia = 'belt' | 'pipe'

export interface PortDef {
  side: PortSide
  offset: number
  media: PortMedia
}
```

- 廢止執行期依賴 `item`｜`liquid` 作為權威值（遷移時全面改名）
- 語意：`belt`＝輸送帶（固體）；`pipe`＝管線（液體／氣體）

### 2.3 machineMode

- `FactoryNode.data.machineMode?: string`
- `FlowNode` 同步可帶 `machineMode`
- 缺省：該機器 `modes[0].id`
- 配方篩選：`machine` + `machineMode`（再以 recipeIndex 選清單項，或改為在 mode 過濾後的列表上取 index——實作見 E1）

### 2.4 loss

- `MachineMode.loss` 進入型別與 `src/data`
- FlowEngine **不**把 loss 算進 summary（後續版本）

### 2.5 腳本

- 路徑草案：`docs/aaaaa/scripts/sync-data-from-v1.mjs`
- 行為：建立／覆寫 `docs/aaaaa/data/`；支援 `--dry-run`；複製後 `JSON.parse` 驗證

---

## 3. 已否決／不採

| 方案 | 原因 |
|------|------|
| 轉成舊 playground 形狀再寫入 data/ | 喪失 v3 權威、後續還要再遷 |
| 維持 PortType item\|liquid | 與 data_1 長期不一致 |
| V7 只建 data/ 不動 src | 與「同版做完」決策不符 |
| V7 實作 loss 配頻 | 明確延後 |

---

## 4. 驗證標準

- [x] 決策表六列已填
- [x] B1／D1／D2／E1 依本文件凍結規格更新

---

## 5. 開發日誌

### 2026-08-01

- 負責人確認 Q1–Q6；解除 A2 封鎖
