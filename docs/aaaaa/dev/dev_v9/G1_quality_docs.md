# V9-G1 — 品質與對外文件

**對應工項：** V9-G1  
**狀態：** ✅ 完成  
**依賴：** B–F 主要完成項  
**最後更新：** 2026-08-02

---

## 1. 已更新文件

| 文件 | 內容 |
|------|------|
| `docs/aaaaa/README.md` | V9 實作完成；FlowNode／validateChains／FactoryNodeData 對齊 E1／B2 |
| `docs/aaaaa/AGENT_CONTEXT.md` | 反向鏈路、matchRecipeByInputs、modes-only、關鍵檔案 |
| `docs/aaaaa/FLOW_ENGINE_GUIDE.md` | 計算流程、V9 專節、測試頁說明 |
| `docs/aaaaa/claude/CLAUDE.md` | 版本索引 → V9 完成 |
| `docs/aaaaa/claude/CONTEXT.md` | 基礎材料輸出點、反向鏈、recipe 匹配名詞 |

定案見 [A1_scope_decision.md](./A1_scope_decision.md)。

---

## 2. 測試門檻

```bash
pnpm type-check
pnpm test
```

（資料未改時可不重跑 sync／generate。）

已涵蓋：

- `reverseChain.test.ts`
- `matchRecipeByInputs.test.ts`
- modes／材料源／machines／products 契約測試
- flowEngine H／V7／V8 回歸（含 E1 後 H6 預期）

---

## 3. DoD

- [x] 上表反映實作結果；V6 已解鎖（非鎖定）  
- [x] F2 已落地情境標為完成；未誇大未做項  
- [x] GUIDE 與引擎行為一致  
- [x] type-check＋test 通過  

---

## 4. 開發日誌

### 2026-08-02

- 初稿；開版索引  
- 完成 README／AGENT／GUIDE／CLAUDE／CONTEXT；V9 標完成
