# W0914-A1｜aaaaa｜C2 連線契約／D4 藍圖格式：重訂草案

| meta | value |
|------|-------|
| 週次 | 2026-09-14 → 2026-09-20 |
| 等級 | **次優先**（[A0](./W0914-A0_layout_store_land.md) 沒收完也可開——主編：不限制超前，交了就審） |
| 擋門檻 | 否（C2 屬 10/25、D4 屬 11/29，但兩者**純函式最遲 10/04**） |
| 交付形式 | **文件＋型別草案**；本週不落實作、不接容器 |
| 上游 | [C2](../../../roadmap/detail/C2_add_connection_contract.md)、[D4](../../../roadmap/detail/D4_blueprint_json_io.md) 皆為 `[!]` 待重訂 |
| 產能參考 | A0 之後的餘裕，約 1–2h |

---

## 1. 為什麼是這兩項

兩份 detail 從 8/25 佈局自建裁決起就標 `[!]`，理由相同：**原契約建立在 `FactoryNode`／`FactoryEdge` 上，而新模型是 `PlacedDevice`／`Pipeline`**。它們已被順延兩次（9/07 的理由是「同週不改兩層契約」）。本週 store 收尾正好是重訂的時機——**你手上剛好有最新的模型定義**。

**本週只要答案，不要實作。**

---

## 2. C2 要回答的三件事

1. **連線前檢查的簽章長怎樣**：例如 `canConnect(draft, layout): ConnectResult`，回傳「可／不可＋理由碼」，而不是 boolean。理由碼要能讓 L2 直接顯示。
2. **[C2 §4.1 的六條規則](../../../roadmap/detail/C2_add_connection_contract.md)在新模型下哪幾條還成立**：`PortMedia`／單埠單線／不可自連仍然成立；但「handle 必帶」在 `Pipeline`（走 waypoints）下是否還是同一個意思，要重新寫一句。
3. **規則放哪一層**：延續 C2 §4.2 的結論（純函式＋action 內部雙保險），確認在 `layoutStore` 上的落點。

---

## 3. D4 要回答的兩件事

1. **`BlueprintFile` 的新形狀**：`nodes`／`edges` 改成 `devices`／`pipelines` 後，`version` 要跳到 `2` 還是維持 `1`。
2. **舊檔要不要讀**：明確二選一——「不讀舊檔、匯入舊格式直接拒絕」或「提供一次性轉換」。**選前者是允許的**，但要寫在文件裡，免得 11 月被當成缺陷。

---

## 4. 邊界

| 允許 | 不要 |
|------|------|
| 改 `docs/roadmap/detail/C2_add_connection_contract.md`、`D4_blueprint_json_io.md` 的 §4 與開發日誌 | 寫 `canConnect` 實作、寫匯出／匯入 |
| 在 `src/types/layout.ts` 落型別草案（型別可以，邏輯不行） | 碰 `editorStore.addConnection` |
| 在 PR body 或 Discord 貼一段結論摘要 | 碰 `src/editor/*`、`Navbar.vue` |

---

## 5. DoD

- [ ] C2 §4 已改寫為新模型版本，六條規則逐條標「成立／改寫／作廢」
- [ ] D4 §4.1 的 schema 已改為 `devices`／`pipelines`，版本號與舊檔政策各一句話
- [ ] 兩份 detail 的狀態欄從 `[!]` 改為 `[ ]`（已定義、待實作）並補開發日誌一則
- [ ] `pnpm type-check` 綠（若動了 `src/types/layout.ts`）
- [ ] diff 不含任何 `src/editor/*`、不含 `addConnection` 實作

---

## 6. 未交頂替

**續順延至 10 月首週。** C2 純函式最遲 10/04，本項延一週仍在安全範圍；但**不可再延第三次**——10/25 的連線月要靠它。
