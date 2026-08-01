# environments.json — 配方環境設定標籤

根節點：`Environment[]`。

配方顯示／分類用環境標籤。**不參與**配頻數量計算；僅資料與 UI 綁定。

---

## 物件：`Environment`

| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `id` | `string` | 是 | 唯一；配方 `environment` 引用 |
| `label` | `string` | 是 | 顯示名稱 |
| `builtin` | `boolean` | 建議 | `true`＝內建不可刪（`none`） |

### 內建預設

| id | label | builtin |
|----|-------|---------|
| `none` | 無環境（預設） | `true` |

程式會確保列表中永遠存在 `none`。

---

## 範例

```json
[
  { "id": "none", "label": "無環境（預設）", "builtin": true },
  { "id": "stable", "label": "穩定環境" },
  { "id": "xisang", "label": "息壤環境" }
]
```

---

## 轉換注意

- 刪除或更名 `id` 前，需掃過 `products.recipes[].environment`。
- 目標專案若不需要環境標籤，可將所有配方寫成 `"environment": "none"` 並只保留一筆 `none`。
