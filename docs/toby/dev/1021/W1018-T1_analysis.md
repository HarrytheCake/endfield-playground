# W1018-T1 埠命中與 draft 連線工單分析

分析日期：2026-10-21。負責人：toby，L2 接線。

以下現況為實作前的分析基準。實作後結果與逐步文字驗證見 [驗證紀錄](./W1018-T1_verification.md)。

本工單要讓正式畫布支援「按住設備埠，拖到另一合法埠放開，留下管線」。這是 2026-10-25 M3 必要項目。底層命中、連線規則與管線提交已存在，主要缺口在畫布事件、埠顯示及本地 draft 預覽。

## 依據與閱讀入口

- [專案 README](../../../../README.md)：環境、分層與開發檢查。
- [W1018-T1 工單](../../../work_dispatch/toby/1018/W1018-T1_c1_draft_connect.md)：本次必做與禁止範圍。
- [本週派工](../../../work_dispatch/WEEK_20261018.md)：M3 驗收、檔案鎖與備案。
- [C1 詳細規格](../../../roadmap/detail/C1_port_hit_and_draft.md)：命中、熱區、draft 與互動要求。
- [實作步驟](./W1018-T1_steps.md)：依序執行與驗收清單。

C1 詳細規格部分段落仍保留舊 `FactoryCanvas`、`editorStore.addConnection` 描述。本次應以本週派工及實際程式為準，修改 `LayoutView`／`GridCanvas`，透過 `layoutStore.addPipeline` 提交。

## 專案與資料夾分工

專案使用 Vue 3、TypeScript、Pinia、Vite 與 Vitest。README 指定 Node.js 24；套件管理使用 pnpm，`pnpm dev` 啟動正式畫面，`pnpm storybook` 查看展示元件。

| 位置                       | 用途與本工單關係                              |
| -------------------------- | --------------------------------------------- |
| `src/app`                  | 主畫面組裝及 dev 展示頁，可參考底層 API 接法  |
| `src/editor/layout`        | 本次主要修改區，包含互動容器與畫布            |
| `src/editor/layout/shapes` | 展示用形狀元件，既有 PipelineShape 可選擇掛載 |
| `src/components`           | L3 展示元件，透過 props／events 溝通          |
| `src/store`                | 佈局、歷史、選取等狀態，本次只呼叫既有 action |
| `src/utils/layout`         | 命中、錨點、連線規則、幾何與碰撞，本次只呼叫  |
| `src/__tests__`            | 單元測試                                      |
| `docs/work_dispatch`       | 工單與本週驗收依據                            |

## 程式現況

| 檔案                                                                        | 已有能力                                       | 本次工作                                     |
| --------------------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------- |
| [LayoutView.vue](../../../../src/editor/layout/LayoutView.vue)              | 指標捕捉、設備拖曳、空白平移、點擊落子與選取   | 增加埠手勢、draft local ref、目標命中與提交  |
| [GridCanvas.vue](../../../../src/editor/layout/GridCanvas.vue)              | 接收唯讀 props，畫設備佔格及管線路徑，無 Pinia | 增加埠點、highlight、draft 展示 props 與圖形 |
| [useGridViewport.ts](../../../../src/editor/layout/useGridViewport.ts)      | 視角平移、縮放、整數格換算                     | 參考換算契約；命中埠需保留小數               |
| [portHitTest.ts](../../../../src/utils/layout/portHitTest.ts)               | 連續格座標命中、方向偏好、可設定熱區           | 直接呼叫，不修改本體                         |
| [portAnchorIndex.ts](../../../../src/utils/layout/portAnchorIndex.ts)       | 展開外側錨點，依座標解析埠                     | 以 PortRef 找到提交端點                      |
| [connectRules.ts](../../../../src/utils/layout/connectRules.ts)             | 方向、媒質、佔用、自連與路徑檢查               | 提交前呼叫 canConnect                        |
| [layoutStore.ts](../../../../src/store/layoutStore.ts)                      | addPipeline 會檢查連線、碰撞並寫入歷史         | 只有正常放開且驗證成功才呼叫                 |
| [PipelineShape.vue](../../../../src/editor/layout/shapes/PipelineShape.vue) | 傳送帶／水管素材繪製                           | 掛載屬加分，不修改元件本體                   |

目前正式畫布未接上 `hitTestPortAt`、`canConnect`、`addPipeline` 的拉線流程，也沒有埠點、目標 highlight 與連線 draft。

## 必須遵守的座標與 API 契約

### 連續格座標與整數格分開

目前 `LayoutView.pointerCell()` 呼叫 `screenToCell()`，會將座標取整數，適合設備拖曳與落子。`hitTestPortAt()` 的圓心在設備邊上，輸入必須是連續格座標。

埠命中應先依 SVG 實際矩形換算 viewBox 像素，再以 `(像素座標 - offset) / (cellSize × zoom)` 得到保留小數的格座標。不要將既有設備拖曳全面改成小數格。

熱區至少半格；縮小時，需將選定的 CSS 像素下限換算為格半徑，傳入 `hitRadiusCells`。SVG 顯示尺寸與 viewBox 尺寸不同時也要納入換算。

### 視覺埠點與儲存錨點分開

`hitTestPortAt()` 回傳 PortRef 加上 side／media，不直接回傳管線端點。命中圓心是設備邊上的視覺點，管線 waypoints 則使用設備外側錨點格。

埠點顯示應沿用 `getMachineMode`、`resolveDisplayGrid`、`rotatePort`、`portPointOnMachine` 等既有工具；提交端點可由 `collectPortAnchors` 依 deviceId／portType／portIndex 查得。避免另外實作旋轉或埠定位算法。

### canConnect 通過仍需確認連接對象

`canConnect(draft, layout)` 接受管線 media 與 waypoints，不接受兩個 PortRef。它允許斷線管線，因此 `ok: true` 時 from／to 仍可能是 null。

本工單要求 port 對 port，UI 必須先確認放開命中目標埠，再確認解析結果的 from／to 與使用者選取的兩個埠相符。尤其外側錨點同格多埠時，不能僅以 ok 判定成功。

起拖可傳 `prefer: 'output'`，目標命中可傳 `prefer: 'input'`；prefer 只處理等距優先，並非方向過濾，不能代替規則檢查。

### 提交還有幾何與碰撞檢查

正式 waypoints 至少兩點且每段須軸對齊。直線 draft 可作視覺預覽，但任意兩端的斜線不能直接存入。

`buildPipelinePolyline` 只拆解及檢查既有路徑，不會替兩埠自動規劃路徑。若做最小正交轉折，需明確建立 waypoints；自動繞障不在範圍。

`addPipeline()` 會再次執行連線檢查與碰撞檢查，可能在 canConnect 通過後仍失敗，必須處理回傳結果。管線 z 層應依現有媒質慣例處理，並以既有工具及測試確認。

## 手勢整合原則

保留中鍵或既有 pan 工具的明確平移行為。一般左鍵依「埠命中 → 設備體 → 空白」判斷手勢，按下後固定手勢種類，移動途中不切換成其他操作。

draft 放在 `LayoutView` 的 local ref，僅正常放開時嘗試提交。取消、失去 pointer capture 或元件卸載都要清除預覽，不產生提交。埠手勢須抑制後續 click，避免意外觸發落子或清除選取。

## 範圍限制與降級

不得修改 `layoutStore`、`canConnect`、`hitTestPortAt` 本體、`editorStore` 簽名、`MainLayout` 或他人 shapes。`GridCanvas` 不得 import Pinia，draft 不得進 store 或歷史。

旋轉、Delete、多選與 Ctrl+Z 入口不在本工單。正式管線套用 `buildPipelinePolyline`、掛 `PipelineShape`、掛已交付的 `DeviceShape` 都是加分項。

趕不上完整互動時，工單允許降為「相鄰兩台水平／垂直直線連線」演示；仍需保留合法檢查、非法不寫入與本地 draft 原則。

## 基礎測試紀錄

2026-10-21 已執行以下測試，結果為 5 個測試檔、67 項全部通過：

```powershell
pnpm exec vitest run src/__tests__/utils/layout/portHitTest.test.ts src/__tests__/utils/layout/connectRules.test.ts src/__tests__/store/layoutStore.canConnect.test.ts src/__tests__/utils/layout/portAnchors.test.ts src/__tests__/editor/useGridViewport.test.ts
```

此結果驗證既有底層能力，尚不代表正式頁拉線已完成。瀏覽器互動與完整品質檢查列於實作步驟。
