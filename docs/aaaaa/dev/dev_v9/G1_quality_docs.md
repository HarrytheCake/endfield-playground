# V9-G1 — 品質與對外文件

**對應工項：** V9-G1  
**狀態：** 未開始（開版時僅掛索引；實作完成後再補 GUIDE）  
**依賴：** B–F 主要完成項  
**最後更新：** 2026-08-02

---

## 1. 應更新文件

| 文件 | 內容 |
|------|------|
| `docs/aaaaa/README.md` | V9 進行中／完成、預覽能力、基礎材料輸出點 |
| `docs/aaaaa/AGENT_CONTEXT.md` | 反向鏈路、輸入匹配配方、modes-only |
| `docs/aaaaa/FLOW_ENGINE_GUIDE.md` | 配方匹配流程、Source 種類、速率 |
| `docs/aaaaa/claude/CLAUDE.md` | 版本索引 |
| `docs/aaaaa/claude/CONTEXT.md` | 基礎材料輸出點、反向鏈路、recipe 匹配名詞 |

定案見 [A1_scope_decision.md](./A1_scope_decision.md)。

---

## 2. 測試門檻

```bash
pnpm sync:aaaaa-data
pnpm generate:src-data
pnpm type-check
pnpm test
```

建議新增／更新：

- reverseChain 單元測試  
- 輸入匹配配方（粉碎／精煉）  
- modes-only／基礎材料輸出點相關  
- 遷移後的 preset 煙測（若有）

---

## 3. DoD

- [ ] 上表反映實作結果；V6 仍鎖定  
- [ ] 不把 F2 未做情境標成已完成  
- [ ] GUIDE 與引擎行為一致

---

## 4. 開發日誌

### 2026-08-02

- 初稿；開版索引於 README／AGENT／CLAUDE 掛 V9
