# 給協作者：如何使用 CR-04 成果／下一步建議

**最後更新：** 2026-08-02  
**對象：** L2（harry／toby）、L3（UI／面板）、主編、其他 CR  
**前提：** V6～V9 已交付（見 [MILESTONE_0802_V6_V9_REPORT.md](./MILESTONE_0802_V6_V9_REPORT.md)）

---

## A. 該如何使用 CR-04 開發成果

### A1. 你會用到的三件事

| 能力 | 你該做什麼 | 不要做什麼 |
|------|------------|------------|
| **流量結果** | 讀 `flowStore`（效率、邊流量、堵塞、Sink 交付、電力） | 在 L2／L3 重算流量或改寫 flowStore |
| **編輯進歷史** | 走 `editorStore` 高階 action（含 `commitDeviceMove`／`moveDevices`） | L2 自組 Command／直接 `historyStore.execute` |
| **靜態資料** | 查 `src/data/*` 或改 JSON 後 codegen | 手改 `src/data` 資料區當長期來源 |

### A2. 主畫布整合（最小心智模型）

```text
使用者操作
  → editorStore（唯一寫入藍圖）
  → historyStore（Command）
  → useValidation + useFlowEngine（自動、150ms debounce）
  → flowStore / validationStore
  → L3 只讀渲染（效率色、流量標籤、橘邊堵塞…）
```

初始化順序（`MainLayout`）：**先** `useValidation()`，**再** `useFlowEngine()`。

### A3. 拖曳移動（V6）— 你該接的 API

| 情境 | API |
|------|-----|
| 鍵盤微調／程式主動位移 | `moveDevices(uids, delta)` — 套用位移＋進歷史 |
| Vue Flow 拖曳結束（畫面已是最終位置） | `commitDeviceMove(uids, beforeSnapshot)` — **不再**套用位移，只進歷史 |
| 零位移 | 兩 API 皆不進歷史 |

驗證：主畫布 Ctrl+Z，或 `/dev/history-replay` →「一鍵 M1→M4（推薦）」。

### A4. 節點資料約定（V7～V9）

擺設備／連線時請帶齊（或接受缺省）：

| 欄位 | 建議 |
|------|------|
| `machineType` | 機器中文名（與 `machines.json` `name` 一致；id 遷移另案） |
| `machineMode` | `modes[].id`；缺省＝`modes[0]` |
| `environment` | 預設 `none`；息壤短鏈等需 `stable` |
| `primaryOutput` | **基礎材料輸出點**必填材料名；加工機可選（主產出） |
| 邊 handle | 盡量帶 `sourceHandle`／`targetHandle`（`out-0`／`in-1`…），媒質與單埠單線才會驗 |

配方：**不要**假設 UI 預選的 `recipeIndex` 永遠正確；引擎以**實際輸入種類**匹配（V9-E1）。

### A5. 讀取流量結果（L3 範例）

```ts
import { storeToRefs } from 'pinia'
import { useFlowStore } from '@/store/flowStore'

const flowStore = useFlowStore()
const { edgeFlows, nodeEfficiencies, congestedEdges, sinkDeliveries, itemSummary } =
  storeToRefs(flowStore)

// 邊是否堵塞（橘色）
const isCongested = (edgeId: string) => congestedEdges.value.has(edgeId)

// 設備效率 0～1 → 顏色規則見 FLOW_ENGINE_GUIDE
const eff = (uid: string) => nodeEfficiencies.value.get(uid) ?? 0
```

詳見：[FLOW_ENGINE_GUIDE.md](./FLOW_ENGINE_GUIDE.md)、[L1_API_REFERENCE.md](./L1_API_REFERENCE.md)。

### A6. 改遊戲資料

1. 讀 [DATA_FORMAT_GUIDE.md](./DATA_FORMAT_GUIDE.md)  
2. 改 `docs/aaaaa/data/`（或 `data_1` 後 `pnpm sync:aaaaa-data`）  
3. `pnpm generate:src-data`  
4. `/dev/flow-engine` 用 preset 或「產生演示圖」驗證  

材料請用 **基礎材料輸出點**，不要新增「物品輸出口→源礦」類假產品。

### A7. Dev 頁面（僅 DEV build）

| 路由 | 用途 |
|------|------|
| `/dev/flow-engine` | **主戰場**：preset（H／V7／V9）、拓樸、機器／產品分頁、D1 最短鏈套用 |
| `/dev/history-replay` | Undo／Redo＋V6 拖曳驗收 |
| `/dev/validation-test` | Detector／警示 |
| `/dev/graph-viz` | **已退役** → 自動轉到 flow-engine |

操作細節見 GUIDE「Dev 頁面使用說明」。

### A8. 反向最短鏈（給規劃／預覽 UI）

```ts
import { findShortestReverseChain } from '@/utils/reverseChain'

const tree = findShortestReverseChain('息壤') // 或「赫銅零件」等產品名
// tree：配方步數最少、葉為 materials（非雙重列舉產品）
```

Dev：產品分頁預覽，或引擎頁「產生演示圖」。

---

## B. 基於 CR-04 成果的下一步建議

### B1. 建議優先（他 CR／主編）

| 優先 | 項 | 理由 | 建議負責 |
|------|----|------|----------|
| P0 | **CR-02：連線 UI 拒絕**（錯媒質、單埠雙線） | 引擎已標非法；UI 應在連線當下擋下 | CR-02 |
| P0 | **CR-02：移動時管線跟隨** | V6 已定接在 L1 移動入口；使用者體感完整閉環 | CR-02 |
| P1 | **CR-01：`machineType` → `Machine.id`** | 基礎設施已有 `getMachineById`；減少中文鍵耦合 | CR-01 |
| P1 | **L3：效率／堵塞／Sink 交付面板接 flowStore** | 引擎結果已穩定；產品化 UI | L3 |
| P2 | **正式機器／產品圖像** | Dev 仍為 placeholder／格點 | 美術＋L3 |

### B2. 建議 CR-04 後續（可選下一版）

| 項 | 說明 |
|----|------|
| loss 進 summary | 資料面已有；引擎刻意未算 |
| 副產物流建模 | D1 演示未自動接副產 Sink；完整產線需副產處理 |
| 拖曳中降頻重算 | 減少拖曳幀內 FlowEngine 壓力（非功能缺口） |
| M7 跟手 polish | 已知 UX 觀察，不阻擋 V6 關閉 |
| 計畫（plans）驅動約束 | 上層優化／限產與 flowStore 整合 |

### B3. 不建議現在做的事

- 重開第二套 graph-viz preset 維護  
- 在 L2 繞過 `commitDeviceMove` 自寫拖曳歷史  
- 把 materials 再注入 products 當 source  
- 假設 `recipeIndex` UI 預選等於實際運轉配方  

### B4. 驗收對照（合併前可勾）

- [ ] 主畫布拖曳 → Ctrl+Z 還原  
- [ ] `/dev/flow-engine` H1 滿速、H7／H8 堵塞橘邊、H10／G2 非法語意  
- [ ] V9：基礎材料輸出點＋E1 換料／缺料 preset  
- [ ] D1：息壤或赫銅零件「產生演示圖」無整圖誤非法  
- [ ] `pnpm type-check` && `pnpm test`

---

## C. 快速連結

| 文件 | 內容 |
|------|------|
| [MILESTONE_0802_V6_V9_REPORT.md](./MILESTONE_0802_V6_V9_REPORT.md) | V6～V9 彙總＋0726 結案 |
| [DATA_FORMAT_GUIDE.md](./DATA_FORMAT_GUIDE.md) | JSON／物態／機器埠 |
| [FLOW_ENGINE_GUIDE.md](./FLOW_ENGINE_GUIDE.md) | 引擎＋Dev 操作 |
| [README.md](./README.md) | CR-04 入口 |
| [todolist_v9.md](./dev/todolist_v9.md) | 細項與 H1 |

**維護者：** aaaaa（CR-04）
