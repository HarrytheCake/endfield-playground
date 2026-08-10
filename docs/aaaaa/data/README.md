# ZMD 資料格式說明（`main/data`）

本目錄存放 ZMD 執行期 JSON 資料。本文件供**其餘專案匯入／轉換**使用，欄位以目前程式與 schema 為準（v3）。

| 檔案 | 說明文件 | 根型別 | 主鍵／識別 |
|------|----------|--------|------------|
| `materials.json` | [materials.md](./materials.md) | `object[]` | `name`（唯一）；含 `form` |
| `machines.json` | [machines.md](./machines.md) | `object[]` | `name`（唯一） |
| `machine_tags.json` | [machine_tags.md](./machine_tags.md) | `string[]` | 字串本身 |
| `products.json` | [products.md](./products.md) | `object[]` | `name`（唯一）；含 `form` |
| `environments.json` | [environments.md](./environments.md) | `object[]` | `id`（唯一） |
| `plans.json` | [plans.md](./plans.md) | `object[]` | `id`（UUID） |
| `layouts.json` | [layouts.md](./layouts.md) | `object[]` | `id`（UUID） |
| `blueprints.json` | [blueprints.md](./blueprints.md) | `object[]` | `id`（UUID） |

編碼：UTF-8。縮排與鍵序無強制要求；建議陣列根節點、JSON 嚴格語法（無註解、無尾逗號）。

---

## 跨檔關聯（轉換時請保留引用一致性）

```text
materials.name  <────────────────────────────────┐
                                                 │
machines.name  ◄── products.recipes[].machine     │
machines.modes[].id  ◄── recipes[].machine_mode   │
environments.id  ◄── recipes[].environment        │
machines.tags[]  ⊆  machine_tags[]（慣例）         │
                                                 │
plans.material_rates[].name  → materials / 物品名  │
plans.machine_limits[].name  → machines.name       │
plans.product_values[].name  → products.name       │
plans.priority_products[].name → products.name     │
plans.transport_items[].name → 物品名               │
                                                 │
layouts.plan_id  → plans.id（可選）                │
layouts.placements[].machine → machines.name       │
layouts.placements[].machine_mode → modes[].id     │
layouts.placements[].source_item → 物品名          │
blueprints.placements[].machine → machines.name    │
```

物品名（材料／產品／中間品）在系統中以**字串名稱**識別，無獨立 UUID。同一名稱可同時出現在 `materials` 與 `products`（雙重身分，如「息壤氣」）。

---

## 共用慣例

### 單位

| 單位 | 使用處 |
|------|--------|
| 個／分 | 計畫材料速率、損耗 `rate_per_min`、配頻內部 |
| 秒 | 配方 `time_seconds` |
| 個／小時 | 計畫 `transport_items[].rate_per_hour`（配頻時 ÷60） |
| 格 | 機器 `width`／`height`、版面座標、連線 `path` |

### 特殊數值

| 值 | 意義 |
|----|------|
| `-1`（速率／上限） | 無上限或不限制 |
| `null`（`loss`） | 該型態無運轉損耗 |
| 缺省欄位 | 多數可由程式補預設；轉換建議寫齊必填欄 |

### 埠與連線媒質

- Port／連線媒質僅允許：`belt`｜`pipe`
- 連線 `type` 必須與兩端 Port 的 `media` 一致
- 物品物態 `form`：`solid`｜`liquid`｜`gas`（預設 `solid`）
  - `solid` → 僅 `belt`；`liquid`／`gas` → 僅 `pipe`
  - 材料與產品同名時兩邊 `form` 必須一致

### 座標與旋轉

- 格子座標：整數，原點在版面左上（或應用慣用之格點）；`x` 向右、`y` 向下
- `rotation`：`0`｜`1`｜`2`｜`3`，表示 0°／90°／180°／270° 順時針
- Port `side`：`top`｜`bottom`｜`left`｜`right`；`offset` 為該邊上從起點數起的格偏移（整數 ≥0）

---

## 建議匯入順序

1. `materials.json`
2. `machine_tags.json`（可選；亦可從機器 tags 推導）
3. `machines.json`
4. `environments.json`（至少保留內建 `id=none`）
5. `products.json`（依賴機器型態與環境 id）
6. `plans.json`
7. `layouts.json`／`blueprints.json`（依賴機器與可選計畫）

---

## 最小可轉換子集（僅配頻／配方，不含版面）

若目標專案只要產線配方與配頻，優先轉換：

- `materials.json`
- `machines.json`（含 `modes`／`loss`）
- `environments.json`
- `products.json`
- `plans.json`（若需要材料上限與優先產品）

可略過：`layouts.json`、`blueprints.json`、`machine_tags.json`。

---

## 版本備註

- **v3**：機器多型態 `modes[]`、埠 `media`、運轉損耗、配方 `machine_mode`／`environment`、layout placement `machine_mode`
- 機器根層 `input_ports`／`output_ports` 與 `modes[0]` 同步，供舊邏輯相容；**權威來源為 `modes`**
- 損耗模型：消耗（個／分）= **台數 × `rate_per_min`**（與產量無關）

Schema 實作參考（本倉庫）：`main/logic/machine_schema.py`、`product_schema.py`、`environment_schema.py`。
