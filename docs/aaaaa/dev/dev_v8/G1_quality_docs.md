# V8-G1 — 品質與對外文件

**對應工項：** V8-G1  
**狀態：** 完成  
**依賴：** B–F 主要完成項  
**最後更新：** 2026-08-02

---

## 1. 應更新文件

| 文件 | 內容 | 狀態 |
|------|------|------|
| `docs/aaaaa/README.md` | V8 進度、dev 分頁、速率常數、剩餘非目標 | 已更新 |
| `docs/aaaaa/AGENT_CONTEXT.md` | 埠一對一、PIPE_RATE_LIMIT、`form`（非 matterState） | 已更新 |
| `docs/aaaaa/FLOW_ENGINE_GUIDE.md` | 驗證規則、H8、30／60、form | 已更新 |
| `docs/aaaaa/claude/CLAUDE.md` | 版本索引（form） | 已更新 |
| `docs/aaaaa/claude/CONTEXT.md` | form、埠基數、pipe 60 | 已對齊 |
| `docs/aaaaa/dev/todolist_v6.md` | 鎖定＋剩餘手動驗收 | 已更新 |
| `docs/aaaaa/dev/todolist_v8.md` | A–G 完成＋非目標清單 | 已更新 |

定案見 [A1_scope_decision.md](./A1_scope_decision.md)。

---

## 2. DoD

- [x] 上表反映實作結果；V6 仍鎖定
- [x] 不夾帶未做功能為「已完成」（CR-02／圖像／loss summary 仍標非目標）

---

## 3. 開發日誌

### 2026-08-01

- 初稿；開版時已先更新版本索引（見同日 README／CLAUDE）

### 2026-08-02

- 全量對齊實作狀態；修正 matterState→form；列出 V6／V8 剩餘項
