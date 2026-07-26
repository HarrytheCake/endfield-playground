# E1 — AGENT_CONTEXT.md 更新計畫

**對應工項**：V5-E1

---

## 1. 工項目標

更新 **`docs/aaaaa/AGENT_CONTEXT.md`**，記錄 L1 完成狀態與 V5 開發者支援基礎設施：

- L1 完成時間與成果
- V5 版本目標與完成項目
- 新增的開發者文件連結
- 後續工作方向（L2/L3 支援）

---

## 2. 更新內容

### 2.1 在「專案進度」章節新增

```markdown
## 專案進度

### L1 基礎建設層（已完成 ✅）

**完成時間**：2026-06-01  
**主要成果**：

- ✅ CR-04 FlowEngine 核心（V1–V4 完成）
  - 靜態流量分析引擎
  - 拓撲排序 + 環路偵測
  - 效率計算 + 堵塞偵測
  - 電力盈缺統計
- ✅ CR-08 historyStore（Command Pattern）
  - Undo/Redo 機制
  - 8 個高階 actions（place/move/rotate/remove/setRecipe/paste/addConnection/removeConnection）
- ✅ CR-01 + CR-02 editorStore
  - 8 個高階 actions 自動進歷史
  - 畫布狀態管理
- ✅ CR-03 validationStore 骨架
  - Detector 註冊機制
  - `hasBlockingError(uid)` 介面
- ✅ Tests（197 個案例）
  - FlowEngine：126 個
  - historyStore：41 個
  - editorStore：18 個
  - validationStore：12 個

**文件輸出**：
- [L1 PR 總結](./L1_PR.md)
- [L1 API Reference](../../L1_API_REFERENCE.md)
- [FlowEngine Guide](../../FLOW_ENGINE_GUIDE.md)

---

### V5 開發者支援與測試基礎設施（進行中 ⚠️）

**目標**：為 L2/L3 開發者提供完整的開發輔助工具與文件

**完成時間**：2026-06-06  
**主要成果**：

#### A 群組：Dev-Only 測試頁面
- ✅ [A2 — FlowEngine 測試頁面](./dev/dev_v5/A2_flow_engine_test.md)
- ✅ [A3 — 圖結構視覺化頁面](./dev/dev_v5/A3_graph_viz.md)
- ✅ [A4 — 歷史回放頁面](./dev/dev_v5/A4_history_replay.md)

#### B 群組：幾何與驗證工具
- ✅ [B1 — geometryUtils 實作](./dev/dev_v5/B1_geometry_utils.md)
- ✅ [B2 — ValidationContext 完整性](./dev/dev_v5/B2_validation_context.md)
- ✅ [B3 — E001 Detector 範例](./dev/dev_v5/B3_e001_example.md)

#### C 群組：開發者文件與 API 說明
- ✅ [C1 — L1 API Reference](./dev/dev_v5/C1_api_reference.md)
- ✅ [C2 — FlowEngine 使用指南](./dev/dev_v5/C2_flow_engine_guide.md)
- ✅ [C3 — L2 README 更新計畫](./dev/dev_v5/C3_l2_readme_update.md)

#### D 群組：跨 CR 協調追蹤
- ✅ [D1 — CR-01 machineType 遷移追蹤](./dev/dev_v5/D1_cr01_migration_tracking.md)
- ✅ [D2 — History format-check 追蹤](./dev/dev_v5/D2_history_format_tracking.md)
- ✅ [D3 — Detector 開發 Checklist](./dev/dev_v5/D3_detector_checklist.md)

#### E 群組：Agent 文件更新
- ✅ [E1 — AGENT_CONTEXT.md 更新](./dev/dev_v5/E1_agent_context_update.md)
- ✅ [E2 — CR04.agent.md 更新](./dev/dev_v5/E2_agent_md_update.md)
- ✅ [E3 — README.md 更新](./dev/dev_v5/E3_readme_update.md)

---
```

---

### 2.2 在「關鍵型別」章節新增 ValidationContext

```markdown
### ValidationContext（V5-B2 完整）

```typescript
interface ValidationContext {
  devices: PlacedDevice[];
  connections: Connection[];
  deviceDefs: Map<string, DeviceDef>;
  baseRegion: BaseRegion;  // V5-B2 新增
}
```

**組裝位置**：`src/composables/useValidation.ts`  
**消費者**：所有 Detectors（E001–E006）
```

---

### 2.3 在「開發文件索引」章節更新

```markdown
## 開發文件索引

### L1 層文件
- [L1 API Reference](../../L1_API_REFERENCE.md) — 6 個 stores 完整 API
- [FlowEngine Guide](../../FLOW_ENGINE_GUIDE.md) — 流量引擎使用指南
- [L1 PR 總結](./L1_PR.md) — L1 層完成總結

### V5 開發者支援文件
- [V5 總覽](./dev/todolist_v5.md) — V5 工項清單
- [V5 開發文件資料夾](./dev/dev_v5/) — 15 份技術文件

### 版本歷史
- [V1 — Machine 物件動態化](./dev/dev_v1.md)
- [V2 — 調度券與倉庫預估](./dev/dev_v2.md)
- [V3 — 技術債修正](./dev/dev_v3.md)
- [V4 — 主編介面建議修正](./dev/dev_v4.md)
- [V5 — 開發者支援基礎設施](./dev/todolist_v5.md)
```

---

## 3. 實作步驟

1. 開啟 `docs/aaaaa/AGENT_CONTEXT.md`
2. 在「專案進度」章節後插入 L1 完成總結與 V5 進度
3. 在「關鍵型別」章節新增 ValidationContext
4. 更新「開發文件索引」章節

---

## 4. 驗證標準

| 項目 | 標準 |
|------|------|
| 連結正確 | 所有相對路徑可訪問 |
| 時間正確 | 完成時間與實際一致 |
| 內容完整 | 包含所有 V5 工項群組 |

---

*此文件對應 V5-E1 工項，實作後標記 [x] 於 todolist_v5.md。*
