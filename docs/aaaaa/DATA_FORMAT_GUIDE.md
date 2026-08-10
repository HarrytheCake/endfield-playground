# CR-04 資料格式說明（給協作者）

**最後更新：** 2026-08-02  
**對象：** 改 JSON 資料、接 codegen、或串 FlowEngine 的 L2／L3／資料編輯者  
**工作副本：** [`docs/aaaaa/data/`](./data/)（由 [`data_1/`](./data_1/) 同步）  
**執行期 TypeScript：** `src/data/*`（**勿手改資料區**；改 JSON 後重產）

---

## 1. 資料管線（必做流程）

```text
編輯 docs/aaaaa/data_1/*.json   （權威來源，可選）
        │
        ▼  pnpm sync:aaaaa-data
docs/aaaaa/data/*.json           （工作副本，與 data_1 對齊）
        │
        ▼  pnpm generate:src-data
src/data/machines.ts
src/data/products.ts
src/data/materials.ts
src/data/plans.ts
src/data/environments.ts
        │
        ▼  pnpm type-check && pnpm test
```

| 指令 | 作用 |
|------|------|
| `pnpm sync:aaaaa-data` | `data_1` → `data` 原樣同步 |
| `pnpm generate:src-data` | JSON → `src/data/*.ts`（含物品出入口 stub 機器） |

**V9 起：** codegen **不再**把 materials 做成「物品輸出口假產品」；測試 stub「研製合成粉末方塊」已移除。產品目錄＝`products.json` 全文。

---

## 2. 檔案一覽（約略規模，2026-08-02）

| 檔案 | 筆數（約） | 角色 |
|------|-----------|------|
| `machines.json` | 44 | 機器：尺寸、電力、tags、modes／埠 |
| `products.json` | 94 | 可生產產品＋配方 |
| `materials.json` | 14 | 基礎材料（葉節點；無配方） |
| `machine_tags.json` | 5 類 | 機器分類標籤字串列表 |
| `plans.json` | 2 | 建造計畫約束 |
| `environments.json` | 5 | 環境 id（配方／節點比對） |

另：codegen 會附加執行期機器 stub：**物品輸出口**、**物品輸入口**（不在 JSON 本體亦可出現於 `src/data/machines.ts`）。V9 新建 **基礎材料輸出點** 在 `machines.json`。

---

## 3. 物態 `form` 與線路媒質

| `form` | 含義 | 線路媒質 `PortMedia` | 速率上限 |
|--------|------|----------------------|----------|
| `solid` | 固體 | `belt` | 30／min |
| `liquid` | 液體 | `pipe` | 60／min |
| `gas` | 氣體 | `pipe` | 60／min |

**產品 form 分佈（約）：** solid 78／liquid 9／gas 7。  
**材料：** 多為 solid；液體例：清水、沉積酸；氣體例：惰氣、息壤氣。

規則：

- 品項 `form` 決定應走 belt 或 pipe  
- 埠 `media` 必須與連線兩端一致；belt↔pipe → 引擎標非法  
- 同一品項若同時出現在 materials 與 products（如息壤氣），**反向鏈視為產品**（繼續回推），不當葉材料捷徑

---

## 4. `materials.json` — 基礎材料

```json
{ "name": "源礦", "form": "solid" }
```

| 欄位 | 說明 |
|------|------|
| `name` | 中文名＝執行期 `itemId` |
| `form` | `solid`｜`liquid`｜`gas` |

**沒有 recipes。** 產出請用機器「**基礎材料輸出點**」＋節點 `primaryOutput`（材料名），勿再做成假產品。

---

## 5. `products.json` — 產品與配方

```json
{
  "name": "源石粉末",
  "form": "solid",
  "recipes": [
    {
      "machine": "粉碎機",
      "machine_mode": "default",
      "environment": "none",
      "time_seconds": 2,
      "inputs": [{ "name": "源礦", "quantity": 1 }],
      "outputs": [{ "name": "源石粉末", "quantity": 1 }]
    }
  ]
}
```

| 欄位 | 說明 |
|------|------|
| `name` | 產品中文名 |
| `form` | 物態（見 §3） |
| `recipes[]` | 可有多條替代配方 |

### 配方欄位

| 欄位 | 說明 |
|------|------|
| `machine` | 機器中文名（對應 `machines.json` 的 `name`） |
| `machine_mode` | 對應該機器 `modes[].id`；缺省由引擎以 `modes[0]` 解釋 |
| `environment` | 環境 id；缺省視為 `"none"`；須與節點 `environment` 一致才匹配 |
| `time_seconds` | 單次加工秒數 |
| `inputs`／`outputs` | `{ name, quantity }[]`；速率＝`quantity × 60 / time_seconds`（個／min） |

**V9-E1 匹配：** 實際連入品項**種類集合**須與某配方 `inputs` 種類**完全相同**；多候選取資料順序第一。多輸出時副產不應靠「整包輸出當輸入」；引擎以「每邊一品」候選匹配（見 GUIDE）。

---

## 6. `machines.json` — 機器參數

```json
{
  "name": "粉碎機",
  "width": 3,
  "height": 3,
  "power": 10,
  "tags": ["基礎生產"],
  "is_source": false,
  "is_sink": false,
  "config_signed_off": true,
  "modes": [
    {
      "id": "default",
      "label": "預設",
      "input_ports": [
        { "side": "left", "offset": 1, "media": "belt" }
      ],
      "output_ports": [
        { "side": "right", "offset": 1, "media": "belt" }
      ],
      "loss": null
    }
  ]
}
```

### 機器頂層

| 欄位 | 說明 |
|------|------|
| `name` | 中文名（查詢鍵；與配方 `machine` 對齊） |
| `width`／`height` | 佔格（拓樸 WxH 預覽用） |
| `power` | 耗電（kW；引擎電力統計） |
| `tags` | 分類，須落在 `machine_tags.json` 允許值 |
| `is_source`／`is_sink` | 是否為資源源／交付匯 |
| `config_signed_off` | 資料簽核標記（流程用） |
| `modes` | **唯一**埠定義來源（V9：無外層 ports） |

### `modes[]` 與埠

| 欄位 | 說明 |
|------|------|
| `id` | mode id（節點 `machineMode`） |
| `label` | UI 顯示 |
| `input_ports`／`output_ports` | 埠列表 |
| `side` | `top`｜`bottom`｜`left`｜`right` |
| `offset` | 沿該邊的格索引（0-based） |
| `media` | `belt`｜`pipe` |
| `loss` | 可選損耗描述；**引擎目前不計入 summary** |

**規則：**

- 預設 mode＝`modes[0]`  
- **單埠單線**（同一 handle 最多一條邊）  
- 單形態機器仍用一元素 `modes: [{ id: "default", ... }]`

### 特殊機器（協作者常碰到）

| 名稱 | 用途 |
|------|------|
| 基礎材料輸出點 | 出 materials；mode：`solid_belt`／`fluid_pipe`；節點帶 `primaryOutput` |
| 物品輸出口 | 固體 source（測試／特例）；總產值**不**以此計 |
| 物品輸入口 | Sink；**總產值只計此處交付** |
| 分流器／匯流器（及管道版） | 無配方物流節點 |

---

## 7. `machine_tags.json`

字串陣列，例如：`物流設備`、`倉庫存取`、`基礎生產`、`合成製造`、`電力`。  
Dev 機器目錄依 tag 分頁；機器 `tags` 應使用此清單內字串。

---

## 8. `environments.json` 與節點環境

環境 id（如 `none`、`stable`）出現在：

- 配方 `environment`  
- 節點 `FactoryNode.data.environment`（缺省 `none`）

兩者不一致 → V9-E1 **不匹配**（例：息壤短鏈需 `stable`）。

---

## 9. `plans.json`（建造計畫）

含材料速率、機器上限、產品價值、優先產品等。`-1` 在 TS 面轉成 `null`（無上限）。  
細節見 codegen 註解與 `src/types/plan.ts`；FlowEngine 核心流量不強制讀 plan，供上層規劃用。

---

## 10. 節點上與資料相關的欄位（執行期）

| 欄位 | 說明 |
|------|------|
| `machineType` | 目前多為**中文** `Machine.name`（與 CR-01 id 遷移追蹤分開） |
| `machineMode` | `modes[].id` |
| `recipeIndex` | V9：多為引擎匹配**結果**，勿當唯一真相 |
| `primaryOutput` | Source 材料名；或加工機「主產出」（D1 演示／多輸出出邊優先） |
| `environment` | 見 §8 |
| `sourceRatePerMin` | Source 速率；缺省 30，半速常為 15 |

---

## 11. 改資料時的檢查清單

- [ ] 配方 `machine`／`machine_mode` 存在於 machines  
- [ ] 輸入輸出 `name` 存在於 materials 或 products  
- [ ] 同名品項在 materials／products 的 `form` 一致  
- [ ] 埠 `media` 與物態用途一致（固體 belt、流體 pipe）  
- [ ] 跑過 `pnpm generate:src-data` 與測試  
- [ ] 需要演示時，在 `/dev/flow-engine` 用基礎材料輸出點驗證，而非假產品

---

## 相關文件

- [CR04_FOR_COLLABORATORS.md](./CR04_FOR_COLLABORATORS.md)  
- [FLOW_ENGINE_GUIDE.md](./FLOW_ENGINE_GUIDE.md)  
- [MILESTONE_0802_V6_V9_REPORT.md](./MILESTONE_0802_V6_V9_REPORT.md)  
- 型別：`src/types/flow.ts`、`src/types/machine.ts`
