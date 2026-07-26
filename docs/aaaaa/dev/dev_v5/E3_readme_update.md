# E3 — README.md 更新計畫

**對應工項**：V5-E3

---

## 1. 工項目標

更新 **`docs/aaaaa/README.md`**（CR-04 主頁），記錄：

- L1 完成狀態
- V5 版本成果
- 新增文件連結
- 後續工作方向

---

## 2. 更新內容

### 2.1 更新「專案狀態」章節

```markdown
## 專案狀態

### L1 基礎建設層（✅ 完成，2026-06-01）

**完成項目**：
- ✅ FlowEngine 核心引擎（V1–V4）
- ✅ historyStore（Command Pattern，Undo/Redo）
- ✅ editorStore 高階 actions（8 個）
- ✅ validationStore 骨架
- ✅ 測試覆蓋（197 個案例）

**文件輸出**：
- [L1 PR 總結](./L1_PR.md)
- [L1 API Reference](../../L1_API_REFERENCE.md)
- [FlowEngine Guide](../../FLOW_ENGINE_GUIDE.md)

---

### V5 開發者支援與測試基礎設施（⚠️ 進行中，2026-06-06）

**目標**：為 L2/L3 開發者提供完整的開發輔助工具與文件

**完成項目**：
- ✅ Dev-only 測試頁面（FlowEngine、圖視覺化、歷史回放）
- ✅ geometryUtils 實作指南
- ✅ ValidationContext 完整化
- ✅ L1 API 完整文件
- ✅ 跨 CR 協調追蹤文件

**詳細清單**：[todolist_v5.md](./dev/todolist_v5.md)

**技術文件**：[dev_v5/](./dev/dev_v5/) 資料夾（15 份文件）
```

---

### 2.2 新增「開發者文件索引」章節

在「專案狀態」章節後新增：

```markdown
## 開發者文件索引

### L1 層 API 文件（必讀）
- **[L1 API Reference](../../L1_API_REFERENCE.md)**  
  完整的 L1 層 API 文件，涵蓋 6 個 stores（editorStore、historyStore、flowStore、validationStore、canvasStore、selectionStore）的所有 State / Actions / Getters。

- **[FlowEngine Guide](../../FLOW_ENGINE_GUIDE.md)**  
  FlowEngine 流量計算引擎使用指南，包含觸發時機、計算流程、效率顏色規則、L3 消費範例。

---

### V5 開發者支援文件

#### A 群組：Dev-Only 測試頁面
| 文件 | 說明 |
|------|------|
| [A2_flow_engine_test.md](./dev/dev_v5/A2_flow_engine_test.md) | FlowEngine 手動測試頁面規格 |
| [A3_graph_viz.md](./dev/dev_v5/A3_graph_viz.md) | 圖結構視覺化頁面規格 |
| [A4_history_replay.md](./dev/dev_v5/A4_history_replay.md) | 歷史回放頁面規格 |

#### B 群組：幾何與驗證工具
| 文件 | 說明 |
|------|------|
| [B1_geometry_utils.md](./dev/dev_v5/B1_geometry_utils.md) | 幾何工具函式實作指南 |
| [B2_validation_context.md](./dev/dev_v5/B2_validation_context.md) | ValidationContext 完整性檢查 |
| [B3_e001_example.md](./dev/dev_v5/B3_e001_example.md) | E001 Detector 開發範例 |

#### C 群組：開發者文件與 API 說明
| 文件 | 說明 |
|------|------|
| [C1_api_reference.md](./dev/dev_v5/C1_api_reference.md) | L1 API Reference 建立計畫 |
| [C2_flow_engine_guide.md](./dev/dev_v5/C2_flow_engine_guide.md) | FlowEngine Guide 建立計畫 |
| [C3_l2_readme_update.md](./dev/dev_v5/C3_l2_readme_update.md) | L2 README 更新計畫 |

#### D 群組：跨 CR 協調追蹤
| 文件 | 說明 |
|------|------|
| [D1_cr01_migration_tracking.md](./dev/dev_v5/D1_cr01_migration_tracking.md) | CR-01 machineType 遷移追蹤 |
| [D2_history_format_tracking.md](./dev/dev_v5/D2_history_format_tracking.md) | History format-check 追蹤 |
| [D3_detector_checklist.md](./dev/dev_v5/D3_detector_checklist.md) | Detector 開發 Checklist（給 shirone） |

#### E 群組：Agent 文件更新
| 文件 | 說明 |
|------|------|
| [E1_agent_context_update.md](./dev/dev_v5/E1_agent_context_update.md) | AGENT_CONTEXT.md 更新計畫 |
| [E2_agent_md_update.md](./dev/dev_v5/E2_agent_md_update.md) | CR04.agent.md 更新計畫 |
| [E3_readme_update.md](./dev/dev_v5/E3_readme_update.md) | README.md 更新計畫（本文件） |

---
```

---

### 2.3 更新「版本歷史」章節

```markdown
## 版本歷史

| 版本 | 主題 | 狀態 | 完成時間 |
|------|------|------|----------|
| V1 | Machine 物件動態化重構 | ✅ 完成 | 2026-05-15 |
| V2 | 調度券兌換效率與倉庫填滿預估 | ✅ 完成 | 2026-05-20 |
| V3 | 技術債修正 | ✅ 完成 | 2026-05-25 |
| V4 | 主編 0526 介面設計建議修正 | ✅ 完成 | 2026-05-30 |
| **V5** | **L1 完成後的開發者支援與測試基礎設施** | ⚠️ **進行中** | **2026-06-06（預計）** |

**V5 特點**：
- 首次建立獨立技術文件資料夾 `dev/dev_v5/`
- 15 份技術文件，分為 A/B/C/D/E 五個群組
- 完整的 L1 API 文件輸出
```

---

### 2.4 更新「快速導覽」章節

在 README 開頭新增：

```markdown
## 快速導覽

**我是 L2/L3 開發者，我想：**
- 📖 查詢 L1 API → [L1 API Reference](../../L1_API_REFERENCE.md)
- 🔧 使用 FlowEngine → [FlowEngine Guide](../../FLOW_ENGINE_GUIDE.md)
- 📝 查看工項進度 → [todolist_v5.md](./dev/todolist_v5.md)
- 📂 瀏覽技術文件 → [dev_v5/](./dev/dev_v5/)

**我是 CR-04 開發者，我想：**
- 🗂️ 查看開發計畫 → [AGENT_CONTEXT.md](./AGENT_CONTEXT.md)
- 📊 查看 L1 PR 總結 → [L1_PR.md](./L1_PR.md)
- 🔍 追蹤跨 CR 協調 → [D1](./dev/dev_v5/D1_cr01_migration_tracking.md) / [D2](./dev/dev_v5/D2_history_format_tracking.md) / [D3](./dev/dev_v5/D3_detector_checklist.md)
```

---

## 3. 實作步驟

1. 開啟 `docs/aaaaa/README.md`
2. 在開頭新增「快速導覽」章節
3. 更新「專案狀態」章節，新增 V5 內容
4. 新增「開發者文件索引」章節，包含所有 V5 技術文件
5. 更新「版本歷史」表格，新增 V5 列

---

## 4. 驗證標準

| 項目 | 標準 |
|------|------|
| 連結正確 | 所有相對路徑可訪問 |
| 結構清晰 | 快速導覽 → 專案狀態 → 文件索引 → 版本歷史 |
| 內容完整 | 包含所有 15 份 V5 技術文件連結 |

---

## 5. 完成後檢查

- [ ] 連結到 `L1_API_REFERENCE.md` 可正常開啟
- [ ] 連結到 `FLOW_ENGINE_GUIDE.md` 可正常開啟
- [ ] 連結到 `dev/dev_v5/` 資料夾可正常瀏覽
- [ ] 所有技術文件連結可正常開啟
- [ ] 快速導覽章節位於 README 開頭

---

*此文件對應 V5-E3 工項，實作後標記 [x] 於 todolist_v5.md。*
