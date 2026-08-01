# V7-D1 — src/types 更新

**對應工項：** V7-D1  
**狀態：** 完成  
**定案：** Port = `belt`\|`pipe`；含 modes／loss 型別；Recipe 含 machineMode／environment；loss 不算進引擎

---

## 1. 凍結型別

### Port

```typescript
export type PortMedia = 'belt' | 'pipe'

export interface PortDef {
  side: PortSide
  offset: number
  /** belt=輸送帶（固體）；pipe=管線（液體／氣體） */
  media: PortMedia
}
```

移除權威用途的 `PortType = 'item' | 'liquid'`；保留 `PortType` 為 `PortMedia` 的 deprecated 別名。

### MachineMode / Loss / Machine

```typescript
export interface MachineLoss {
  item: string
  rate_per_min: number
}

export interface MachineMode {
  id: string
  label: string
  input_ports: PortDef[]
  output_ports: PortDef[]
  loss: MachineLoss | null
}

export interface Machine {
  id: string
  name: string
  width: number
  height: number
  power: number
  tags: MachineCategory[]
  is_source: boolean
  is_sink: boolean
  config_signed_off?: boolean
  modes: MachineMode[]
  input_ports: PortDef[]
  output_ports: PortDef[]
  // 既有行為函式佔位可保留
}
```

另提供 `getMachineMode(machine, modeId?)`：找不到或缺省時回退 `modes[0]`。

### RecipeDef（flow.ts）

```typescript
export interface RecipeDef {
  id: string
  inputs: RecipeItem[]
  outputs: RecipeItem[]
  machine: string
  machineMode?: string
  environment?: string
  timeSeconds: number
}
```

### Environment（新建 environment.ts）

```typescript
export interface Environment {
  id: string
  label: string
  builtin?: boolean
}
```

### 節點 data / FlowNode

- `FactoryNode.data.machineMode?: string`
- `FlowNode.machineMode?: string`
- 缺省語意：`modes[0].id`

### Plan

- 新增可選 `transport_items?: TransportItem[]`（`name` + `rate_per_hour`）

### FactoryEdgeData

- `portType` 欄位名保留（相容既有邊資料）；型別改為 `PortMedia`

---

## 2. 檔案修改計畫

| 檔案 | 動作 | 結果 |
|------|------|------|
| `src/types/machine.ts` | PortMedia、modes、loss、getMachineMode | 完成 |
| `src/types/flow.ts` | RecipeDef、FlowNode.machineMode | 完成 |
| `src/types/graph.ts` | machineMode；portType→PortMedia | 完成 |
| `src/types/environment.ts` | 新建 | 完成 |
| `src/types/plan.ts` | transport_items | 完成 |
| `src/data/machines.ts` | D1 過渡：`item`→`belt`、`liquid`→`pipe` + `attachDefaultModes` | 完成（D2 覆寫） |
| `src/components/MachineShape.vue` | `port.type`→`port.media` | 完成 |

---

## 3. 驗證標準

- [x] 全專案無必填的舊 `type: 'item'|'liquid'`（或僅過渡 alias）
- [x] `pnpm type-check` 通過（D1 過渡補 modes；D2 再對齊完整 JSON）

---

## 4. 開發日誌

### 2026-08-01

- 凍結 belt/pipe 與 machineMode／loss 資料面
- 實作 types；`machines.ts` 過渡遷移（media + base_mode）；type-check 通過
