# materials.json — 基礎材料

根節點：`Material[]`。

基礎原料目錄。物品以 `name` 唯一識別；天然／區域產能由 **計畫** `plans.material_rates` 提供，不在本檔。

---

## 物件：`Material`

| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `name` | `string` | 是 | 材料名稱，全域唯一 |
| `form` | `string` | 是 | 物態：`solid`｜`liquid`｜`gas`（預設 `solid`） |

物態與輸送媒質：`solid` → 僅 `belt`；`liquid`／`gas` → 僅 `pipe`。

### 範例

```json
[
  { "name": "源礦", "form": "solid" },
  { "name": "息壤氣", "form": "gas" }
]
```

---

## 轉換注意

- 歷史文件曾提「生產頻率」，該欄已不在本檔，請改讀 `plans.json` 的 `material_rates`。
- 同名可同時存在於 `products.json`（雙重身分）：兩邊 `form` **必須一致**。
- 匯入時勿擅自把產品名寫進材料表，除非業務上確為基礎原料。
- 缺 `form` 時視為 `solid`。
