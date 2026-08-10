# V6-E1 — 文件同步與跨層協調

**對應工項：** V6-E1  
**狀態：** 未開始  
**依賴：** V6-A2 定案；實作完成後更新對外文件

---

## 1. 背景與動機

V6 變更跨 L1 API 與 L2 Canvas。aaaaa 可更新 `docs/aaaaa/**`；**不得**直接改 `docs/dernoson/`、`docs/harry/`、`docs/toby/`。需準備可轉傳的變更說明。

---

## 2. aaaaa 文件區（自行更新）

| 文件 | 時機 | 內容 |
|------|------|------|
| `docs/aaaaa/L1_API_REFERENCE.md` | B1 完成後 | 新增／修正移動 API |
| `docs/aaaaa/README.md` | 版本推進時 | V6 狀態、連結 todolist_v6 |
| `docs/aaaaa/claude/CLAUDE.md` | 規劃期 | 版本索引加 V6 |
| `docs/aaaaa/AGENT_CONTEXT.md` | 可選 | 若 Agent 需知移動 API 變更 |
| `docs/aaaaa/MILESTONE_0726.md` | 定案／完成後 | 可於文首加「V6 追蹤：todolist_v6」狀態列（保留原文） |

---

## 3. 需協調他人更新（不直接改）

| 對象 | 文件 | 請求內容 |
|------|------|----------|
| 主編 | `docs/dernoson/L2/L2.md` §4.2 | `moveDevices`／新 API 簽名與「拖曳用 commit」說明 |
| 主編 / L2 | `docs/dernoson/L2/harry.md`、`toby.md` | 工作項改為：drag-stop 呼叫新 API；刪除「只傳 delta」過時假設 |
| L2 | `docs/harry/README.md`、`docs/toby/README.md` | 範例改為拖曳接線偽碼 |

### 協調訊息草稿（可複製）

```text
主旨：V6 拖曳移動進歷史 — L1 API 變更預告（待定案）

背景：MILESTONE_0726。Vue Flow v-model 已先改 position，不能再直接 moveDevices(delta)。

建議 API：（填 A2 最終簽名）

請 L2：
1. node-drag-start 拍 before 快照
2. node-drag-stop 呼叫上述 L1 API
3. 不要自行 historyStore.execute

本版不做管線跟隨；請仍把跟隨需求掛在同一 L1 入口的後續 Phase。

詳細：docs/aaaaa/dev/todolist_v6.md
```

---

## 4. 檔案修改計畫

| 檔案 | 動作 |
|------|------|
| 上表 aaaaa 列 | 修改 |
| 他人 docs | 僅發請求／貼草稿，不提交其檔案 |

---

## 5. 驗證標準

- [ ] L1_API_REFERENCE 與實作簽名一致
- [ ] README 可從快速導覽進到 todolist_v6
- [ ] 協調草稿已交負責人發送或貼到討論串

---

## 6. 開發日誌

### 2026-08-01

- 建立協調清單與訊息草稿
