# products.json — 流水線產品與配方

根節點：`Product[]`。

每個產品可有多組「獲得方式」（`recipes`）。配方綁定機器名、型態與環境標籤。

---

## 物件：`Product`

| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `name` | `string` | 是 | 產品名稱，唯一 |
| `form` | `string` | 是 | 物態：`solid`｜`liquid`｜`gas`（預設 `solid`；產品層，非每條配方） |
| `recipes` | `Recipe[]` | 是 | 獲得方式列表；可為空（不建議） |

物態與輸送媒質：`solid` → 僅 `belt`；`liquid`／`gas` → 僅 `pipe`。

---

## 物件：`Recipe`

| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `inputs` | `IOItem[]` | 是 | 非空；投入物 |
| `outputs` | `IOItem[]` | 是 | 非空；產出物（可含副產物） |
| `machine` | `string` | 是 | 對應 `machines[].name` |
| `machine_mode` | `string` | 條件 | 對應該機器 `modes[].id`；單型態可省略由程式補齊，多型態必填 |
| `environment` | `string` | 建議 | 對應 `environments[].id`；缺省視為 `"none"` |
| `time_seconds` | `number`（int） | 是 | 單次作業秒數 ≥1 |

速率換算（單機滿載，某輸出）：

\[
\text{個／分} = \text{output.quantity} \times 60 / \text{time_seconds}
\]

---

## 物件：`IOItem`

| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `name` | `string` | 是 | 物品名（材料、產品或中間品） |
| `quantity` | `number`（int） | 是 | 單次配方數量；正整數 |

`outputs[0]` 在部分 UI／推導中常被視為「主產物」，其餘為副產物；配頻演算法另有主產優先規則。

---

## 範例

```json
{
  "name": "錦草溶液",
  "form": "liquid",
  "recipes": [
    {
      "inputs": [
        { "name": "錦草粉末", "quantity": 1 },
        { "name": "清水", "quantity": 1 }
      ],
      "machine": "反應池",
      "machine_mode": "default",
      "environment": "none",
      "time_seconds": 2,
      "outputs": [
        { "name": "錦草溶液", "quantity": 1 }
      ]
    }
  ]
}
```

---

## 轉換注意

- 匯入前請確認 `machine` + `machine_mode` 在 `machines.json` 存在。
- `environment` 建議先寫入 `environments.json`（至少保留 `none`）。
- 配方 `outputs` 中的名稱不一定等於產品 `name`（例如拆解機同時吐出瓶子與溶液）；產品列仍以「可作為目標物的名稱」建檔。
- 同名物品可同時在 `materials.json`（雙重身分）；兩邊 `form` 必須一致。
- 缺 `form` 時視為 `solid`。
