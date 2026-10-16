# V14-D1 — 連線規則純函式（`connectRules`｜W0921-A1・次優）

**對應工項：** V14-D1
**狀態：** `[x]` 完成（2026-09-27）
**日期：** 2026-09-27
**依賴：** [C1](./C1_placement_precheck.md) `[x]`
**正式工單：** [W0921-A1](../../../work_dispatch/aaaaa/0921/W0921-A1_connect_rules.md)
**契約依據：** [roadmap/detail/C2 §4.1／§4.3／§4.4](../../../roadmap/detail/C2_add_connection_contract.md)
**擋門檻：** 否（原排 10/04；未交零影響）
**開發分支：** `dev/aaaaa0921`
**產物：** `portAnchorIndex.ts`、`portMedia.ts`、`connectRules.ts`、測試；重構 `resolveConnections.ts`、`useFlowEngine.ts`（媒質查表共用）

---

## 1. 背景與動機

C2 規則表與 `ConnectResult` 形狀已於 V13／#51 凍結。本項**不做設計**，只把 §4 寫成程式。

排本週的理由：10/04 第一刀是錨點判定提共用（§4.4）——提前一週可降風險。但不得拖住 A0。

---

## 2. 技術決策

| 決定                                         | 理由                                                                 |
| -------------------------------------------- | -------------------------------------------------------------------- |
| **順序：先提共用，再寫 `canConnect`**        | 反過來＝兩份錨點判定                                                 |
| 錨點落點＝`portAnchorIndex.ts`               | `collectPortAnchors`／`findPortAt` 匯出；`resolveConnections` 改呼叫 |
| 埠媒質＝`getMachinePortMedia`                | 與 FlowEngine `resolvePortMedia` 共用；權威＝`PortDef.media`         |
| 回傳＝detail/C2 的 discriminated union       | 與 `PlacementResult` 同形；`message` 不進 union                      |
| `describeConnectFailure` 另出                | L3 不組文案；L2 呼叫描述函式                                         |
| 規則 7 斷線放行必測                          | 最容易被實作者照舊直覺擋掉                                           |
| **本週原計畫不動 `layoutStore.addPipeline`** | 排 10/11；**2026-09-27 已提前接入**（見開發日誌）                    |
| **與 A0 分開 commit／PR**                    | 標題帶 `W0921-A1`                                                    |

### 2.1 本週不做

| 不做                                | 排程        |
| ----------------------------------- | ----------- |
| `addPipeline` 內部呼叫 `canConnect` | 10/11       |
| L2 draft highlight                  | toby／10/18 |
| 環路偵測                            | 明確排除    |
| `createPlacedDevice`                | WEEK §2.1   |

---

## 3. 檔案修改計畫（已落地）

| 動作     | 檔案                                                                     | 說明                                            |
| -------- | ------------------------------------------------------------------------ | ----------------------------------------------- |
| 新建     | `src/utils/layout/portAnchorIndex.ts`                                    | 錨點展開／命中共用                              |
| 新建     | `src/utils/layout/portMedia.ts`                                          | `getMachinePortMedia`                           |
| 重構     | `src/utils/layout/resolveConnections.ts`                                 | 改呼叫共用錨點；對外行為不變                    |
| 重構     | `src/composables/useFlowEngine.ts`                                       | `resolvePortMedia` 改呼叫 `getMachinePortMedia` |
| 新建     | `src/utils/layout/connectRules.ts`                                       | `canConnect`＋`describeConnectFailure`          |
| 新建     | `src/__tests__/utils/layout/connectRules.test.ts`                        | 四條規則各一正一反、斷線放行、`malformed`       |
| **未碰** | `src/store/layoutStore.ts`、`resolveConnections.test.ts`、`src/editor/*` |                                                 |

---

## 4. 測試計畫（已覆蓋）

- 方向／媒質／單埠單線／自連：各一正一反
- 規則 7：`from`／`to` 為 `null` → `ok: true`
- `malformed` waypoints
- `resolveConnections` 既有測試：**未修改**且全綠

---

## 5. 驗證標準（DoD）

對照 [W0921-A1 §4](../../../work_dispatch/aaaaa/0921/W0921-A1_connect_rules.md)：

- [x] 錨點共用已提；`resolveConnections` 測試未改且全綠
- [x] `canConnect` 回傳 union；無 `message` 欄
- [x] 規則 7 專門測試
- [x] 媒質判定與引擎共用（`getMachinePortMedia`）
- [x] 品質閘：type-check／本檔 prettier／eslint／相關 test 綠
- [x] diff 不含 `layoutStore.ts`
- [ ] PR 標題帶 `W0921-A1`（開 PR 時）

---

## 6. 未交頂替

回到原排程 10/04，**零影響**。本項存在意義是提前吃掉 10 月首週風險，不是本週責任。

---

## 7. 開發日誌

### 2026-09-27（審核 #54）

- **修：** 規則 7 不豁免已命中端——單端斷線仍查方向／媒質／單埠單線；補測
- **不修／標缺口：** `addDevice`／`moveDevice` 貼埠繞過（closeout P7）

### 2026-09-27（提前：addPipeline 防線）

- 依預覽誤標回報：`addPipeline` 改呼叫 `canConnect`；失敗 → `invalid`
- 新測 `layoutStore.canConnect.test.ts`；既有 floating／規則 7 路徑仍綠

### 2026-09-27（實作）

- 提 `portAnchorIndex`／`portMedia`；`resolveConnections` 與 FlowEngine 改共用
- `connectRules.ts`：四條有效規則＋規則 7；`describeConnectFailure`
- 測試 14 條全綠；`resolveConnections` 既有 6 條未改且全綠；未動 `layoutStore`（當下）

### 2026-09-27（開版）

- 開版；列為正式次優項；契約指向 detail/C2，不重寫規則表
- 現況：`connectRules.ts` 不存在於 master
