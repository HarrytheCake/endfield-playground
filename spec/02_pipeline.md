# Feature Spec：管線連接
# CR-02

**所屬階段：** Phase 1（基礎）/ Phase 3（自動路徑規劃）
**依賴：** CR-01（設備擺放，提供接口位置與 type 定義；接口 type 定義於 `devices.ts`）
**文件版本：** v0.3

---

## 1. 功能定位

管線連接模組負責在設備之間建立傳送帶與水管的連線關係，是產線邏輯成立的必要條件。管線的連接狀態是 CR-03（警示）、CR-04（流量估算）的計算基礎。

---

## 2. 功能詳細描述

### 2.1 管線模式切換

- 透過工具列控項或快捷鍵（預設 `P`）切換進入 / 離開管線模式
- 進入管線模式後：
  - 所有設備的接口（Port）自動高亮顯示
  - 所有現有管線自動高亮顯示
  - 游標樣式切換為管線工具樣式

### 2.2 管線 Type 自動判斷

每個設備接口在 `devices.ts` 中定義 `type`（`conveyor` 或 `pipe`）。拉管線時，系統依**起點接口的 type** 決定本次拉的是傳送帶或水管，視覺樣式與連接規則對應切換。不同 type 的接口無法互連（觸發 Error，見 CR-03）。

### 2.3 管線繪製流程（Phase 1：手動彎折點）

**新部署管線：**
1. 在管線模式下，點選設備接口作為起點
2. 移動滑鼠，畫布顯示管線預覽路徑
3. 點選中途空格可新增彎折點（手動決定路徑走向）
4. 移動至目標接口，自動吸附
5. 點選目標接口確認放置；或按 Escape 取消

**已放置管線：**
- Phase 1 不支援編輯已放置管線的彎折點
- 若需調整路徑，須刪除管線後重新建構

**彎折點 90 度限制：**
- 所有相鄰節點（起點、彎折點、終點）之間的線段必須為純水平或純垂直
- 若當前彎折點位置導致任一線段出現斜線，該彎折點顯示紅色警示，且**無法確認放置**，直到所有線段均為 90 度轉角為止
- 系統在預覽時即時偵測並標示違規線段

> **Phase 3 升級：** 改為自動路徑規劃，系統依當前空間自動生成合法彎折點，並支援放置後調整彎折點。

### 2.4 自動吸附

- 管線端點接近接口時，自動吸附至最近的合法接口
- 吸附範圍：接口中心點周圍 1 格以內
- 吸附時顯示高亮確認提示

### 2.5 特殊節點生成

以下三種情境在管線繪製時處理，無需使用者手動放置設備：

#### 分流器（Splitter）
**觸發：** 從現有管線的中途點拉出新管線
**預設行為：** 自動插入分流器，原管線在該點一分為二，新管線從分流器接出
**使用者可切換：** 點選預示生成的分流器圖示，切換為「截斷模式」
- 截斷模式：原管線在該中途點截斷，截斷點之後的路徑繼續保留，新管線從截斷點接出取代原起點

#### 匯流器（Merger）
**觸發：** 將管線的終點拉至現有管線的中途點
**預設行為：** 自動插入匯流器，兩條管線在該點合流後繼續
**使用者可切換：** 點選預示生成的匯流器圖示，切換為「截斷模式」
- 截斷模式：原管線在該中途點截斷，截斷點之前的起源路徑被捨棄，換由新拉的管線接入後繼續往下

#### 物流橋（Bridge）
**觸發：** 管線路徑規劃時，判斷路徑必須跨越現有管線
**行為：** 強制自動插入物流橋，不提供切換選項，兩條管線立體交叉互不干擾

> 所有自動生成的設備均計入設備清單，可被選取、刪除，刪除時管線恢復相應原狀並重新驗證。

### 2.6 管線刪除

- 點選管線後按 Delete 刪除
- 所有管線操作（新增、刪除、修改彎折點）均透過 `useHistoryStore.execute()` 提交，支援 Ctrl+Z / Ctrl+Y 復原（詳見 CR-08）
- 刪除後自動觸發 CR-04 流量重新估算
- 警示重新計算以**設備接口狀態**為準：管線刪除本身不直接產生警示，而是觸發對受影響設備的重新評估（例如某接口因此失去輸入來源，才會產生 W001 輸入缺失）；若管線兩端接口原本就未連接任何有效路徑，則刪除後不產生新警示

---

## 3. 狀態管理（Pinia Store）

### `usePipelineStore`

```typescript
{
  connections: Connection[],
  isPipelineMode: boolean,
  draftConnection: DraftConnection | null   // 正在繪製中的管線
}

// Connection
{
  uid: string,
  type: 'conveyor' | 'pipe',
  from: {
    deviceUid: string,
    portId: string
  },
  to: {
    deviceUid: string,
    portId: string
  },
  waypoints: { x: number, y: number }[],  // 彎折點格子座標（不含起終點）
  autoNodes: AutoNode[]                   // 自動生成的分流器 / 匯流器 / 物流橋
}

// DraftConnection（繪製中狀態）
{
  type: 'conveyor' | 'pipe',
  fromDeviceUid: string,
  fromPortId: string,
  waypoints: { x: number, y: number }[],
  cursorPos: { x: number, y: number },
  hasInvalidSegment: boolean             // true 表示存在斜線，無法確認放置
}

// AutoNode
{
  kind: 'splitter' | 'merger' | 'bridge',
  gridPos: { x: number, y: number },
  deviceUid: string,                     // 對應自動插入的 PlacedDevice uid
  mode: 'auto' | 'cut'                   // 'cut' 為使用者切換的截斷模式（僅 splitter / merger）
}
```

---

## 4. 路徑規劃規則（Phase 1）

Phase 1 路徑由使用者透過點選彎折點決定，系統負責：

- **強制 90 度轉角**：所有線段必須為純水平或純垂直，即時偵測並標示違規線段；存在斜線時封鎖確認 / 退出
- **物流橋強制插入**：路徑跨越現有管線時自動插入，無法關閉
- **分流器 / 匯流器預設插入**：可由使用者切換為截斷模式（見 2.5）

---

## 5. UI 規格

### 5.1 管線視覺樣式

| 狀態 | 傳送帶 | 水管 |
|------|--------|------|
| 一般 | 橘色實線＋方向箭頭 | 藍色實線＋方向箭頭 |
| 高亮（管線模式） | 亮橘色加粗 | 亮藍色加粗 |
| 有 Error | 紅色閃爍邊框 | 紅色閃爍邊框 |
| 有 Warning | 黃色邊框 | 黃色邊框 |
| 懸停 | 顯示流量 tooltip | 顯示流量 tooltip |

### 5.2 接口視覺樣式

| 狀態 | 樣式 |
|------|------|
| 一般 | 灰色小圓點 |
| 管線模式高亮 | 白色圓點＋脈衝動畫 |
| 可吸附（接近中） | 綠色放大圓點 |
| 已連接 | 對應 type 顏色實心點 |

### 5.3 快捷鍵彙整

| 快捷鍵 | 功能 |
|--------|------|
| P | 切換管線模式 |
| Escape | 取消當前管線繪製 |
| Delete | 刪除選取管線 |
| 點選空格（繪製中） | 新增彎折點 |

---

## 6. 實作範例

### 6.1 管線模式切換

```typescript
// usePipelineStore
const togglePipelineMode = () => {
  isPipelineMode.value = !isPipelineMode.value
  if (!isPipelineMode.value) {
    draftConnection.value = null  // 取消進行中的繪製
  }
}

// vueUse 快捷鍵
const { p } = useMagicKeys()
watch(p, () => togglePipelineMode())
```

### 6.2 起點選取與 type 判斷

```typescript
const startConnection = (deviceUid: string, portId: string) => {
  const device = placedDeviceStore.getDevice(deviceUid)
  const portDef = deviceStore.getPort(device.deviceId, portId)

  draftConnection.value = {
    type: portDef.type,  // 從接口定義取得 'conveyor' | 'pipe'
    fromDeviceUid: deviceUid,
    fromPortId: portId,
    waypoints: [],
    cursorPos: getPortAbsolutePos(device, portDef)
  }
}
```

### 6.3 90 度轉角驗證（繪製中即時偵測）

```typescript
// 驗證所有線段是否為純水平或垂直
const validateAllSegments = (
  points: { x: number, y: number }[]  // 含起終點的完整節點列表
): { valid: boolean, invalidIndices: number[] } => {
  const invalidIndices: number[] = []
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x
    const dy = points[i + 1].y - points[i].y
    if (dx !== 0 && dy !== 0) {
      invalidIndices.push(i)  // 斜線：dx 與 dy 同時非零
    }
  }
  return { valid: invalidIndices.length === 0, invalidIndices }
}

// 繪製中即時更新 hasInvalidSegment
watch(() => draftConnection.value?.waypoints, () => {
  if (!draftConnection.value) return
  const allPoints = [startPoint, ...draftConnection.value.waypoints, cursorPoint]
  const { valid } = validateAllSegments(allPoints)
  draftConnection.value.hasInvalidSegment = !valid
}, { deep: true })
```

### 6.4 分流器截斷模式切換

```typescript
// 使用者點選預示生成的分流器圖示，切換 mode
const toggleSplitterMode = (connectionUid: string, autoNodeIndex: number) => {
  const conn = pipelineStore.connections.find(c => c.uid === connectionUid)
  if (!conn) return
  const node = conn.autoNodes[autoNodeIndex]
  if (node.kind === 'bridge') return  // 物流橋不可切換

  const newMode = node.mode === 'auto' ? 'cut' : 'auto'

  historyStore.execute({
    label: `切換${node.kind === 'splitter' ? '分流器' : '匯流器'}模式`,
    execute: () => { node.mode = newMode },
    undo: () => { node.mode = node.mode === 'auto' ? 'cut' : 'auto' }
  })

  // 依新模式重新計算管線結構
  rebuildConnectionsAroundNode(connectionUid, autoNodeIndex)
}
```

### 6.5 分流器生成偵測

```typescript
const checkMidpointTarget = (
  targetPos: { x: number, y: number },
  connections: Connection[]
): { connection: Connection, segmentIndex: number } | null => {
  for (const conn of connections) {
    const segments = getSegments(conn)
    for (let i = 0; i < segments.length; i++) {
      if (isPointOnSegment(targetPos, segments[i])) {
        return { connection: conn, segmentIndex: i }
      }
    }
  }
  return null
}

// 確認放置時，若起點為管線中途，插入分流器
const finalizeConnection = (draft: DraftConnection, targetPort: Port) => {
  const midSource = checkMidpointTarget(draft.startPos, pipelineStore.connections)
  if (midSource) {
    insertSplitter(midSource.connection, midSource.segmentIndex, draft)
  } else {
    addConnection(draft, targetPort)
  }
}
```

### 6.6 物流橋自動插入

```typescript
// 路徑確認時，掃描每個線段是否與現有管線交叉
const insertBridgesAlongPath = (
  waypoints: { x: number, y: number }[],
  existing: Connection[]
) => {
  const segments = waypointsToSegments(waypoints)
  for (const segment of segments) {
    for (const conn of existing) {
      const crossing = findCrossing(segment, conn)
      if (crossing) {
        insertBridge(crossing.pos, segment, conn)
      }
    }
  }
}
```

---

## 7. 驗證方式

| 驗證項目 | 方法 |
|----------|------|
| 管線模式切換 | 按 P 鍵確認接口與管線高亮出現 / 消失 |
| Type 自動判斷 | 從 conveyor 接口拉線，確認為傳送帶樣式；從 pipe 接口拉線，確認為水管樣式 |
| 不同 type 無法互連 | 嘗試將傳送帶接至水管接口，確認出現 Error |
| 吸附至接口 | 拖曳管線終點接近接口，確認自動吸附 |
| 手動彎折點 | 繪製時點選中途空格，確認彎折點產生，路徑正確轉折 |
| 斜線鎖定確認 | 放置彎折點使線段出現斜線，確認彎折點變紅且無法確認放置 |
| 斜線修正後解鎖 | 修正彎折點至合法位置，確認可正常確認放置 |
| 已放置管線不可編輯 | 點選已放置管線，確認彎折點無法拖動，僅可刪除 |
| 分流器預設自動生成 | 從管線中途拉出新管線，確認預設插入分流器，原管線一分為二 |
| 分流器切換截斷模式 | 點選預示分流器圖示切換，確認改為截斷，原管線起源段保留，新管線接出 |
| 匯流器預設自動生成 | 將管線終點拉至現有管線中途，確認預設插入匯流器 |
| 匯流器切換截斷模式 | 點選預示匯流器圖示切換，確認改為截斷，原管線起源被新管線取代 |
| 物流橋強制插入 | 規劃跨越現有管線的路徑，確認自動插入物流橋且無切換選項 |
| 管線刪除觸發流量重算 | 刪除管線後確認流量估算即時更新 |
| 管線刪除警示以設備為主 | 刪除原本兩端均未接有效設備的管線，確認不新增警示 |
| 管線刪除產生設備警示 | 刪除後某設備失去輸入來源，確認對應設備出現 W001 |

---

*本文件為 CR-02 Feature Spec，系統整體架構見 `00_top_spec.md`。*
