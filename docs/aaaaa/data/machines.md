# machines.json — 生產機器

根節點：`Machine[]`。

定義設備尺寸、標籤、輸出口／接收口標記、**多型態**埠布局與運轉損耗。配方與版面透過機器 `name` 與型態 `modes[].id` 引用。

---

## 物件：`Machine`

| 欄位 | 型別 | 必填 | 預設／說明 |
|------|------|------|------------|
| `name` | `string` | 是 | 機器名稱，唯一 |
| `width` | `number`（int） | 是 | 佔用寬（格）≥1 |
| `height` | `number`（int） | 是 | 佔用高（格）≥1 |
| `power` | `number` | 建議 | 電量；`-1` 表示未設定／不限 |
| `tags` | `string[]` | 建議 | 分類標籤；宜落在 `machine_tags.json` |
| `is_source` | `boolean` | 建議 | `true`＝純物品輸出口（可設 placement `source_item`） |
| `is_sink` | `boolean` | 建議 | `true`＝純物品接收口 |
| `config_signed_off` | `boolean` | 建議 | 設定已簽核；本專案 UI 未簽核禁存 |
| `modes` | `Mode[]` | 是 | **非空**；型態定義（權威埠／損耗來源） |
| `input_ports` | `Port[]` | 相容 | 與 `modes[0].input_ports` 同步 |
| `output_ports` | `Port[]` | 相容 | 與 `modes[0].output_ports` 同步 |

轉換時請以 `modes` 為準，並可選擇同步寫入頂層 ports。

---

## 物件：`Mode`

| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `id` | `string` | 是 | 型態 id，機器內唯一；配方 `machine_mode` 引用 |
| `label` | `string` | 是 | 顯示名稱（可與 id 不同） |
| `input_ports` | `Port[]` | 是 | 可為空陣列（如純輸出機） |
| `output_ports` | `Port[]` | 是 | 可為空陣列（如純接收機） |
| `loss` | `Loss \| null` | 是 | 無損耗時為 `null` |

遷移舊資料時：若無 `modes`，可建單一型態 `id="default"`、`label="預設"`，埠由頂層 ports 填入，`loss=null`。

---

## 物件：`Port`

| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `side` | `string` | 是 | `top` \| `bottom` \| `left` \| `right` |
| `offset` | `number`（int） | 是 | 該邊上的格偏移 ≥0；須落在對應邊長範圍內 |
| `media` | `string` | 是 | `belt`（輸送帶）\| `pipe`（管線）；缺省時程式當 `belt` |

`port_idx`（見 layout 連線）為對應陣列（input 或 output）的 **0-based 索引**。

---

## 物件：`Loss`

| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `item` | `string` | 是 | 損耗物品名（材料或產品名） |
| `rate_per_min` | `number` | 是 | 每台機器每分鐘消耗量；≥0 |

**配頻語意**：總消耗（個／分）= `機器台數 × rate_per_min`（固定，與產量無關）。

---

## 範例（節錄）

```json
{
  "name": "液氣轉化機",
  "width": 3,
  "height": 5,
  "power": 20,
  "tags": ["基礎生產"],
  "is_source": false,
  "is_sink": false,
  "config_signed_off": true,
  "modes": [
    {
      "id": "liquid_mode",
      "label": "液體產出",
      "input_ports": [
        { "side": "top", "offset": 2, "media": "pipe" }
      ],
      "output_ports": [
        { "side": "right", "offset": 1, "media": "pipe" }
      ],
      "loss": { "item": "液化息壤", "rate_per_min": 6.0 }
    }
  ],
  "input_ports": [],
  "output_ports": []
}
```

（實檔中頂層 ports 會與 `modes[0]` 同步填寫。）

---

## 轉換注意

- `modes[].id` 變更會破壞 `products`／`layouts` 引用，需一併遷移。
- `is_source`／`is_sink` 機器通常無生產配方用途；配頻常排除名稱為「拆解機」的機器路徑。
- 多型態機器配方**必須**指定存在的 `machine_mode`。
