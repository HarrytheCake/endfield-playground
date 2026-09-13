# W0831-T1 Inspector 攤平工單分析

分析日期：2026-09-01  
分析目標：`docs/work_dispatch/toby/0831/W0831-T1_inspector_flatten.md`

## 結論

本工單是等待／澄清單，不是 Inspector 實作單。目前不應修改
`src/editor/inspector/InspectorPanel.vue`，也不應修補舊 Vue Flow 畫布的選取問題。

L1 已留下以下解鎖句：

```text
layout-L1：types/layout + resolveConnections + toTopology 可測已推；L2 可開最小 GridCanvas 只讀渲染（仍待 store 模型另開）
```

這個宣告只開放「最小 GridCanvas 只讀渲染」，沒有開放 Inspector 攤平、選取接線或舊畫布
修改。因此雖然「等待 L1 宣告」這個事件已發生，本工單仍未取得 Inspector 開工範圍。

## 範圍判定

| 類別 | 本工單判定 |
| --- | --- |
| 必做 | 確認 SVG 自建路線、L1 優先及 L2 解鎖規則 |
| 可做 | 唯讀理解 GUIDE §0–§1 的「攤平」概念 |
| 不做 | 修改 Inspector、FactoryCanvas、FlowNodeOverlay、store 或選取契約 |
| 不做 | 建立 Inspector PR、補配方、修「點了沒反應」 |
| 外部 DoD | Discord 回覆已理解閘門；此項需由使用者或專案成員完成 |

若要開始程式修改，至少需要新的個人工單，或新的解鎖句明確包含 Inspector／B4 攤平；現有
「L2 可開最小 GridCanvas」不能推論成所有 L2 工作皆已解鎖。

## 現況資料流

`InspectorPanel.vue` 目前同時承擔資料容器與畫面呈現：

```text
selectionStore.selectedNodeIds
        → editorStore.nodes.find(...)
        → node.data.machineType
        → getMachine(machineType)
        → template 直接讀 selectedMachine.name／width／height／power
```

因此 GUIDE 指出的耦合確實存在：template 直接綁定完整 `Machine`，尚未形成 plain view model。
但這是已知技術債，不構成本週越過閘門修改的理由。

## 未來獲准後的實作判斷

GUIDE 提供的 `DeviceInfoView` 四欄可作為最小攤平概念：`name`、`machineId`、`sizeText`、
`powerText`。不過正式 B4 規格要求 `InspectorSidebar.vue` 作為 L2 容器讀取 store 與資料，
`InspectorPanel.vue` 則轉為只接收 plain props 的 L3 呈現元件。未來應以新工單指定的切片為準，
不要逕自在同一檔加入 computed 後就宣稱完整分層完成。

正式實作前仍需裁定以下契約：

1. `sizeText` 是否套用節點旋轉；完整 B4 要求 90°／270° 時交換寬高。
2. `powerText` 應包含單位，並處理 `Machine.power === -1` 代表資料未定義，而非只判斷 null。
3. `machineType` 可能是中文名稱或英文 ID；前者用 `getMachine()`，後者應使用
   `getMachineById()`，不可默認兩種契約相同。
4. 配方屬加分／後續範圍。`RecipeDef` 沒有 `name`，且查詢應考慮 `machineMode`；只取第一筆
   配方只能作為暫時展示，不等於正式 B4 的配方列表。
5. 若新增 view model 型別，型別本身與每個成員都需使用繁體中文 JSDoc，不沿用 GUIDE 範例的
   `//` 行尾註解。

## 文件落差

- 工單是最新執行邊界，明確規定本週只等待；GUIDE 的可貼程式碼是未來參考，不是開工授權。
- `W0831-A0` 已勾選完成並發出解鎖句，但句子只授權 GridCanvas，範圍比「全部 L2」窄。
- roadmap 的完整 B4 要求 Sidebar／Panel 分層；GUIDE 的輕量方案允許暫時留在同一檔。兩者不是
  同一完成標準。
- 現行 Inspector 仍依賴舊 Vue Flow 的選取狀態；專案已決定改用 SVG 自建，因此不應為了驗證
  Inspector 而加深舊選取鏈。

## 建議後續

本單以「已理解閘門、未開 Inspector 或舊畫布 PR」結案。可回覆：

```text
知道 L1 已宣告；目前只開放最小 GridCanvas 只讀渲染，Inspector 攤平等待後續明確切片。
```

收到包含 Inspector／B4 的新工單後，再重新確認當時的新 SVG 選取契約、允許修改檔案及
plain DTO 形狀，接著依「L2 攤平 → L3 props 呈現 → 空選／單選／多選驗收 → 品質門檻」執行。
