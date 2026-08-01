# plans.json — 區域建造計畫

根節點：`Plan[]`。

定義某區域可用的材料供給速率、機器數量上限、產品定價、優先生產目標與超傳輸流入。智慧配頻以計畫為輸入。

---

## 物件：`Plan`

| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `id` | `string`（UUID） | 是 | 唯一；`layouts.plan_id` 可引用 |
| `name` | `string` | 是 | 顯示名稱（實務上亦應唯一） |
| `material_rates` | `MaterialRate[]` | 是 | 可空陣列 |
| `machine_limits` | `MachineLimit[]` | 是 | 可空；**按機器名**共用上限（不拆型態） |
| `product_values` | `ProductValue[]` | 是 | 可空；Phase2 定價 |
| `priority_products` | `PriorityProduct[]` | 是 | 可空；Phase1 優先順序（陣列序） |
| `transport_items` | `TransportItem[]` | 建議 | 可空或缺省；計畫外額外流入 |

---

## 子物件

### `MaterialRate`

| 欄位 | 型別 | 說明 |
|------|------|------|
| `name` | `string` | 物品名（通常為材料） |
| `rate` | `number`（int） | 可用供給（個／分）；`-1`＝無限 |

### `MachineLimit`

| 欄位 | 型別 | 說明 |
|------|------|------|
| `name` | `string` | `machines[].name` |
| `limit` | `number`（int） | 最大台數；`-1`＝不限 |

### `ProductValue`

| 欄位 | 型別 | 說明 |
|------|------|------|
| `name` | `string` | `products[].name` |
| `price` | `number` | 單位產值權重（本專案常存 int） |

### `PriorityProduct`

| 欄位 | 型別 | 說明 |
|------|------|------|
| `name` | `string` | 優先生產的產品名 |
| `max_rate` | `number`（int） | 目標上限（個／分）；`-1`＝盡量滿足至資源上限 |

### `TransportItem`

| 欄位 | 型別 | 說明 |
|------|------|------|
| `name` | `string` | 額外流入物品名 |
| `rate_per_hour` | `number` | 個／小時；配頻內換算為 ÷60 → 個／分 |

---

## 範例（節錄）

```json
{
  "id": "7dd94e87-a806-4035-9644-63eb99f76f75",
  "name": "四號谷地",
  "material_rates": [
    { "name": "源礦", "rate": 560 },
    { "name": "蕎花", "rate": -1 }
  ],
  "machine_limits": [
    { "name": "精煉爐", "limit": -1 }
  ],
  "product_values": [
    { "name": "高容量谷地電池", "price": 70 }
  ],
  "priority_products": [
    { "name": "高容量谷地電池", "max_rate": -1 }
  ],
  "transport_items": []
}
```

---

## 轉換注意

- 未列出的材料／機器在配頻中可能視為 0 或未限制（依演算法讀取方式）；建議明確寫入需要約束的項目。
- `priority_products` 順序即 Phase1 嘗試順序。
- 版面透過 `plan_id` 連結；刪除計畫前先清 layout 引用。
