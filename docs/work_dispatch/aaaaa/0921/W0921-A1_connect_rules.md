# W0921-A1｜aaaaa｜C2 連線規則純函式（10/04 提前量）

| meta | value |
|------|-------|
| 週次 | 2026-09-21 → 2026-09-27 |
| 等級 | **次優・可超前**（A0 交完才開；主編不限制超前，交了就審） |
| 擋門檻 | 否（原排 10/04） |
| 前置 | 契約已定案並合入：[#51](https://github.com/dernoson/endfield-playground/pull/51)、[detail/C2 §4](../../../roadmap/detail/C2_add_connection_contract.md) |
| 產能參考 | 只有 A0 之後還有餘裕才做；**沒做不算未交付** |

---

## 0. 白話目標

C2 的規則上週已經逐條判完並凍結，形狀也定好了。**本項不做任何設計，只把 [detail/C2 §4.1／§4.3](../../../roadmap/detail/C2_add_connection_contract.md) 寫成程式。**

排它的理由只有一個：10/04 那週的第一件事是「錨點判定提共用」（§4.4），那不是順手可做的，**能提前一週就少一週風險**。

---

## 1. 一句話驗收

**`canConnect(draft, layout)` 實作四條有效規則＋規則 7 放行斷線，`resolveConnections` 既有測試原樣綠。**

---

## 2. 交哪個檔

| 動作 | 檔案 | 說明 |
|------|------|------|
| 重構 | `src/utils/layout/resolveConnections.ts` | **先做這個。** 把錨點展開與命中判定提為共用；對外行為不變 |
| 新建 | `src/utils/layout/connectRules.ts` | `canConnect`＋`describeConnectFailure` |
| 新建 | `src/__tests__/utils/layout/connectRules.test.ts` | 四條規則各一正一反、斷線放行、`malformed` |
| 本週**不做** | `layoutStore.addPipeline` 內部防線 | 排 10/11；與 A0 的 store 重構同檔，兩刀不要疊在同一週 |
| 本週**不做** | L2 呼叫端 | toby 排 10/18，他本週在 B2 |

**順序不可顛倒。** 先提共用再寫 `canConnect`；反過來寫會變成兩份錨點判定，症狀是「預檢說可以、`resolveConnections` 算出另一條連線」。

---

## 3. 不要碰

| 不要 | 為什麼 |
|------|--------|
| `src/store/layoutStore.ts` | A0 已經在動這個檔，同週第二刀會互相干擾 |
| `editorStore.addConnection` | 新模型不經此路徑（[C2 §3](../../../roadmap/detail/C2_add_connection_contract.md)） |
| 環路偵測 | 明確排除，不是漏掉 |
| `createPlacedDevice` 工廠 | 預設 `label` 屬呈現決策（待決 B-2）；本週由落子端自己填 `machine.name`，工廠等 10 月 |

---

## 4. DoD

- [ ] 錨點展開與命中判定已提為共用；`resolveConnections` 既有測試**未修改**且全綠
- [ ] `canConnect` 回傳 [C2 §4.3](../../../roadmap/detail/C2_add_connection_contract.md) 的 discriminated union，`message` 不在 union 內
- [ ] 規則 7（`from`／`to` 為 `null` 回 `ok: true`）有專門測試——這條最容易被實作者照舊直覺擋掉
- [ ] 媒質判定與 `useFlowEngine` 共用同一函式（review 確認無複製）
- [ ] `pnpm type-check`／`lint-check`／`format-check`／`test` 綠

---

## 5. 交檔

與 A0 **分開 PR**，標題帶 `W0921-A1`。A0 是擋門檻的，不要被本項拖住。

---

## 6. 未交頂替

原排程就是 10/04，未交＝回到原排程，**零影響**。本項存在的意義是把 10 月首週的風險提前吃掉，不是本週的責任。
