# L1 契約實驗室（V14–V17）— 串接／呼叫端說明

| meta | value |
|------|-------|
| 頁面 | `http://localhost:5173/dev/l1-contract-lab` |
| 對象 | 畫布 L2、驗證、引擎、週會聽眾、**較少開發經驗的協作者** |
| 對應 | [todolist_v14](./todolist_v14.md)～[todolist_v21](./todolist_v21.md)（V19 Hub；V20 catalog；V21＝**輕量試玩草案**） |
| 最後更新 | 2026-11-03 |
| 簡易教學（建議先跟做） | [tutorial/l1-contract-lab/usage.md](../../../tutorial/l1-contract-lab/usage.md) |
| 公開長文 | [LAB_l1_contract_guide](../../work_dispatch/aaaaa/1018/LAB_l1_contract_guide.md)（詞彙表＋各函式用途／串接） |

---

## 0. 為什麼有這頁

近幾版 PR（#54／#55／#60／#65／#72／#74／#76／#78／#79）多半是**底層純函式或 store 契約**，畫面上不容易「看出來」。  
本頁（V19 起當 **L1 Hub**）做成：

1. **入門**（最短路徑：怎麼開、正式頁能做什麼）
2. **詞彙**（專有名詞白話）
3. **目錄**（長期 API inventory：已列／待列）
4. **定義表**（符號／模組／誰呼叫／不要做什麼）
5. **一鍵案例**（呼叫真實 API，JSON 輸出）
6. （規劃中／V21）**輕量可調參試玩**——少數 API 可改參數再執行；**不是**完整 Swagger（見 [V20-F1](./dev_v20/F1_tryout_not_swagger.md)、[A0 牌程](./dev_v21/A0_tryout_panel_plan.md)）

方便其他串接者對照與自測，而不必只讀 diff。  
**最短跟做**先看 [tutorial](../../../tutorial/l1-contract-lab/usage.md)；頁內「入門」分頁也有 5 步。完整長文見 [LAB 指南](../../work_dispatch/aaaaa/1018/LAB_l1_contract_guide.md)。

---

## 1. 怎麼開

逐步截圖式說明見 **[tutorial／L1 契約實驗室](../../../tutorial/l1-contract-lab/usage.md)**。精簡版：

```bash
pnpm dev
# 左側 Dev 導覽 →「L1 契約實驗室」
# 或直接：http://localhost:5173/dev/l1-contract-lab
```

| 分頁 | 內容 |
|------|------|
| **入門** | 給無經驗者的 5 步最短路徑＋**維運規則摘要**（建議先看） |
| **詞彙** | 專有名詞白話（精簡；完整見 LAB §2） |
| **目錄** | layout utils／layoutStore／可選驗證・引擎：已列／待列 |
| 總覽 | 四版一句話＋誤用對照 |
| V14 | `canPlaceDevice`／`canMoveDevice`／`canConnect` |
| V15 | 出界／熱區／waypoints／**gap**／**findPortAt 對照**／**resolveConnections**（V20） |
| V16 | `toTopology`；store 寫入（⚠）含 **addPipeline／removePipeline**（V20-D1） |
| V17 | `resolveMachineDef`、配方鍵、引擎 30/min、history 情境 |

深鏈專頁（更完整視覺卡）：

- V14 綠／紅卡：`/dev/placement-connect-check.html`
- layoutStore：`/dev/layout-store-preview.html`
- FlowEngine：`/dev/flow-engine`

---

## 2. 契約金句（務必記住）

| 主題 | 正確 | 錯誤 |
|------|------|------|
| 機型鍵（新模型） | 英文 `id`（`crusher`） | 以為引擎／驗證只認中文名 |
| 查定義 | `resolveMachineDef` | 新碼直接 `getMachine` 當權威 |
| 查配方 | `getRecipesForMachine(def.name, mode)` | `getRecipesForMachine('crusher')` |
| 落子預覽 | `canPlaceDevice` 回傳 | 自算 `detectOverlaps` |
| 埠熱區 | `hitTestPortAt`（連續格） | 用 `findPortAt` 當滑鼠熱區 |
| 規則錨點／衍生連線 | `findPortAt`／`resolveConnections`（整數外側錨） | 用熱區座標當管線端點 |
| 間隙路徑 | `buildGapConnectionWaypoints`（中央通道） | 當通用繞障搜尋或略過 `canConnect` |
| 管線寫入 | `layoutStore.addPipeline`（內含 canConnect） | 自寫第二套連線防線 |
| 源素材 | `layoutStore.setDevicePrimaryOutput` | 雙寫 `editorStore` |
| 引擎讀 | `toTopology` → 建圖 | 以為引擎直接 watch layoutStore |
| 正式頁開頁 | 空白（#58／H1） | 依賴自動 `connected` fixture |

---

## 3. 目錄資料來源

頁面文案集中在：

`src/app/dev/l1ContractLab/contractCatalog.ts`

改契約說明時優先改此檔，避免 Vue 模板散落。

**V20 已交（可點測）：** `findPortAt`／`resolveConnections`；`buildGapConnectionWaypoints`；`addPipeline`／`removePipeline`。  
**V21 規劃：** 輕量可調參（先 `hitTestPortAt`／`findPortAt`／`canConnect`）——[todolist_v21](./todolist_v21.md)；**開工前提＝V19＋V20 合 master**。  
其餘 inventory `todo`（佔格／snapshot／detectors…）與試玩**脫鉤**另牌——見 [F0 §2.3](./dev_v19/F0_next_catalog_batch.md)。
