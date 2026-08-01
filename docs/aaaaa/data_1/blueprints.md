# blueprints.json — 藍圖

根節點：`Blueprint[]`。

可重複貼上的機器群組（相對座標）。用於版面編輯加速，不參與配頻演算。

---

## 物件：`Blueprint`

| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `id` | `string`（UUID） | 是 | 唯一 |
| `name` | `string` | 是 | 顯示名稱 |
| `placements` | `BlueprintPlacement[]` | 是 | 相對座標群組 |
| `thumb` | `string` | 可選 | 縮圖；常為 `data:image/png;base64,...` |

藍圖通常**不含** `connections`（貼上後需重拉線）。

---

## 物件：`BlueprintPlacement`

| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `machine` | `string` | 是 | `machines[].name` |
| `x` | `number`（int） | 是 | 相對格座標（群組內） |
| `y` | `number`（int） | 是 | 相對格座標 |
| `rotation` | `number`（int） | 是 | `0`–`3` |
| `machine_mode` | `string` | 建議 | 型態 id；缺省貼上時用 `modes[0]` |
| `source_item` | `string` | 可選 | 若為輸出口機器 |

與 layout `Placement` 的差異：藍圖項**可不含**實例 `id`（放置時再生成 UUID）。

---

## 範例（節錄）

```json
{
  "id": "e63d88fc-6fd2-4d5c-a995-90f575ef6961",
  "name": "456",
  "placements": [
    {
      "machine": "塑型機",
      "x": 0,
      "y": 0,
      "rotation": 3,
      "machine_mode": "base_mode"
    }
  ],
  "thumb": "data:image/png;base64,..."
}
```

---

## 轉換注意

- `thumb` 可很大；若不需要預覽可剝除以縮小傳輸體積。
- 貼上時目標專案需自行：平移座標、生成 placement id、處理碰撞。
- 可整檔略過（不影響配方／配頻轉換）。
