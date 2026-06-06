# E2 — CR04.agent.md 更新計畫

**對應工項**：V5-E2

---

## 1. 工項目標

更新 **`.github/agents/CR04.agent.md`**（Agent 模式檔案），記錄：

- L1 完成狀態
- V5 版本目標與角色定位
- 更新「完成狀態」與「目前工作」章節
- 更新版本索引

---

## 2. 更新內容

### 2.1 更新「L1 完成狀態」章節

```markdown
## L1 完成狀態（2026-06-01）

**L1 基礎建設層已完成**，包含：
- ✅ CR-04 FlowEngine 核心（V1–V4 完成）
  - 靜態流量分析引擎
  - 拓撲排序 + 環路偵測
  - 效率計算 + 堵塞偵測
  - 電力盈缺統計
- ✅ CR-08 historyStore（Command Pattern）
  - Undo/Redo 機制
  - 8 個高階 actions 自動進歷史
- ✅ CR-01 + CR-02 editorStore（8 個高階 actions）
- ✅ CR-03 validationStore 骨架（detector 註冊機制）
- ✅ Tests（197 個案例）

**目前工作（V5）**：為 L2/L3 與其他 CR 提供開發者支援，包括：
- Dev-only 測試頁面（FlowEngine、圖視覺化、歷史回放）
- 幾何與 utility helpers（geometryUtils、ValidationContext 完整化）
- L1 API 文件（L1_API_REFERENCE.md、FLOW_ENGINE_GUIDE.md）
- 跨 CR 協調追蹤（CR-01 遷移、History format-check、Detector checklist）
```

---

### 2.2 更新「現有版本索引」表格

```markdown
### 現有版本索引

| 版本 | 主題 | 工項清單 | 狀態 |
|------|------|---------|------|
| V1 | Machine 物件動態化重構 | [todolist_v1.md](../../docs/aaaaa/dev/todolist_v1.md) | ✅ 完成 |
| V2 | 調度券兌換效率與倉庫填滿預估 | [todolist_v2.md](../../docs/aaaaa/dev/todolist_v2.md) | ✅ 完成 |
| V3 | 技術債修正 | [todolist_v3.md](../../docs/aaaaa/dev/todolist_v3.md) | ✅ 完成 |
| V4 | 主編 0526 介面設計建議修正 | [todolist_v4.md](../../docs/aaaaa/dev/todolist_v4.md) | ✅ 完成 |
| **V5** | **L1 完成後的開發者支援與測試基礎設施** | [todolist_v5.md](../../docs/aaaaa/dev/todolist_v5.md) | ⚠️ 進行中 |
```

---

### 2.3 更新「你負責的檔案」表格備註

在表格下方新增備註：

```markdown
**V5 新增文件**：
- `docs/L1_API_REFERENCE.md` — L1 層 API 完整文件
- `docs/FLOW_ENGINE_GUIDE.md` — FlowEngine 使用指南
- `docs/aaaaa/dev/dev_v5/` — V5 版本技術文件資料夾（15 份文件）
```

---

### 2.4 更新「開發文件規範」章節

在「現有版本索引」表格後新增一列：

```markdown
| 版本 | 主題 | 工項清單 |
|------|------|---------|
| V1 | Machine 物件動態化重構 | [todolist_v1.md](../../docs/aaaaa/dev/todolist_v1.md) |
| V2 | 調度券兌換效率與倉庫填滿預估 | [todolist_v2.md](../../docs/aaaaa/dev/todolist_v2.md) |
| V3 | 技術債修正 | [todolist_v3.md](../../docs/aaaaa/dev/todolist_v3.md) |
| V4 | 主編 0526 介面設計建議修正 | [todolist_v4.md](../../docs/aaaaa/dev/todolist_v4.md) |
| **V5** | **L1 完成後的開發者支援與測試基礎設施** | [todolist_v5.md](../../docs/aaaaa/dev/todolist_v5.md) |

**V5 特殊說明**：
- V5 版本建立了 `dev/dev_v5/` 子資料夾
- 內含 15 份技術文件，分為 A/B/C/D/E 五個群組
- 每份文件對應 `todolist_v5.md` 中的一個工項
```

---

## 3. 實作步驟

1. 開啟 `.github/agents/CR04.agent.md`
2. 更新「L1 完成狀態」章節為最新內容
3. 更新「現有版本索引」表格，V5 狀態改為「⚠️ 進行中」
4. 新增「V5 新增文件」備註
5. 新增「V5 特殊說明」備註

---

## 4. 驗證標準

| 項目 | 標準 |
|------|------|
| 連結正確 | 所有相對路徑可訪問 |
| 狀態正確 | V1–V4 為「✅ 完成」，V5 為「⚠️ 進行中」 |
| 內容完整 | 包含 L1 完成總結與 V5 目標 |

---

## 5. 完成後檢查

- [ ] 連結到 `todolist_v5.md` 可正常開啟
- [ ] 連結到 `dev/dev_v5/` 資料夾存在
- [ ] L1 完成時間為「2026-06-01」
- [ ] V5 狀態為「⚠️ 進行中」

---

*此文件對應 V5-E2 工項，實作後標記 [x] 於 todolist_v5.md。*
