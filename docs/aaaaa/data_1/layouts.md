# layouts.json — 基建版面

根節點：`Layout[]`。

格子地圖上的機器放置、傳送帶／管線連線，以及可選的區域資源與建造計畫綁定。

---

## 物件：`Layout`

| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `id` | `string`（UUID） | 是 | 唯一 |
| `name` | `string` | 是 | 顯示名稱 |
| `grid_width` | `number`（int） | 是 | 地圖寬（格） |
| `grid_height` | `number`（int） | 是 | 地圖高（格） |
| `placements` | `Placement[]` | 是 | 已放機器實例 |
| `connections` | `Connection[]` | 建議 | 缺省可視為 `[]` |
| `plan_id` | `string \| null` | 可選 | 對應 `plans[].id` |
| `region_resources` | `RegionResource[]` | 可選 | 區域額外資源；缺省 `[]` |

---

## 物件：`Placement`

| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `id` | `string`（UUID） | 是 | 實例 id；連線端點引用 |
| `machine` | `string` | 是 | `machines[].name` |
| `x` | `number`（int） | 是 | 佔用區左上角格座標 |
| `y` | `number`（int） | 是 | 同上 |
| `rotation` | `number`（int） | 是 | `0`–`3`（90°CW 倍數） |
| `machine_mode` | `string` | 建議 | 對應該機器 `modes[].id`；缺省時 UI 補 `modes[0].id` |
| `source_item` | `string` | 條件 | `is_source` 機器的輸出物品名 |

佔用矩形：未旋轉時為 `[x, x+width)` × `[y, y+height)`；旋轉 90°／270° 時寬高對調（與本專案 Canvas 邏輯一致）。

---

## 物件：`Connection`

| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `id` | `string`（UUID） | 是 | 連線唯一 id |
| `type` | `string` | 是 | `belt` \| `pipe` |
| `from` | `PortRef` | 是 | 起點（輸出埠） |
| `to` | `PortRef` | 是 | 終點（輸入埠） |
| `path` | `GridPoint[]` | 是 | 路徑格點序列（含轉折）；Manhattan 直角 |

### `PortRef`

| 欄位 | 型別 | 說明 |
|------|------|------|
| `placement_id` | `string` | `placements[].id` |
| `port_type` | `string` | `input` \| `output` |
| `port_idx` | `number`（int） | 對應當前型態 ports 陣列的 0-based 索引 |

**重要**：`port_idx` 相對於 placement 的 **`machine_mode` 對應埠列表**；切換型態後舊連線可能失效，需重拉。

### `GridPoint`

| 欄位 | 型別 | 說明 |
|------|------|------|
| `x` | `number`（int） | 格座標 |
| `y` | `number`（int） | 格座標 |

`belt` 與 `pipe` 可佔用同一格；路徑應避開機器佔用格（本專案放置／拉線時檢查）。

---

## 物件：`RegionResource`

| 欄位 | 型別 | 說明 |
|------|------|------|
| `item` | `string` | 物品名 |
| `rate` | `number` | 區域提供速率（個／分），供資源面板追蹤 |

---

## 範例（節錄）

```json
{
  "id": "e5c534e6-6fbd-4597-a6e1-7bcb7059bc88",
  "name": "主基地",
  "grid_width": 20,
  "grid_height": 15,
  "plan_id": "7dd94e87-a806-4035-9644-63eb99f76f75",
  "region_resources": [],
  "placements": [
    {
      "id": "c9339318-98b7-412c-adb5-df0c4d6823b0",
      "machine": "物品輸出口",
      "x": 7,
      "y": 3,
      "rotation": 0,
      "source_item": "源礦",
      "machine_mode": "default"
    }
  ],
  "connections": [
    {
      "id": "14d41206-e293-473e-b076-89bd2a700680",
      "type": "belt",
      "from": {
        "placement_id": "c9339318-98b7-412c-adb5-df0c4d6823b0",
        "port_type": "output",
        "port_idx": 0
      },
      "to": {
        "placement_id": "5cdd5da0-cc25-464f-b4f8-a4098ddeb636",
        "port_type": "input",
        "port_idx": 0
      },
      "path": [
        { "x": 8, "y": 4 },
        { "x": 9, "y": 4 },
        { "x": 10, "y": 4 }
      ]
    }
  ]
}
```

---

## 轉換注意

- 舊 layout 可能缺少 `machine_mode`／`connections`／`region_resources`；匯入時可對 placement 補 `modes[0].id`。
- 轉換埠索引時必須使用**同一套** mode 埠順序，否則連線會錯接。
- 僅需配方／配頻的專案可整檔略過。
