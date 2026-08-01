# V8-C2 — 速率上限 belt 30／pipe 60

**對應工項：** V8-C2  
**狀態：** 完成  
**依賴：** A1；與 E1／C3 的 `form` 對齊

---

## 1. 常數

```typescript
export const BELT_RATE_LIMIT = 30  // 個/min
export const PIPE_RATE_LIMIT = 60  // 個/min
```

- 邊為 **belt** → 截斷至 30
- 邊為 **pipe** → 截斷至 60
- 廢止「pipe 暫用 BELT_RATE_LIMIT」

輔助：`rateLimitForMedia(media)`（`src/types/flow.ts`）

---

## 2. 媒質判定順序（`edgeRateLimit`）

| 優先 | 條件 | 上限 |
|------|------|------|
| 1 | 埠可解析 `PortMedia`（source out／target in） | belt→30／pipe→60 |
| 2 | 已知邊上 `itemId` | 依 `form`：solid→30，liquid／gas→60 |
| 3 | 皆未知 | **保守 30**（`BELT_RATE_LIMIT`） |

套用位置：`propagateFlows`（source／分流／一般設備出邊）。堵塞路徑只縮流量，不再另套常數。

---

## 3. DoD

- [x] `PIPE_RATE_LIMIT` 匯出並於 propagate 使用
- [x] belt／pipe 分別截斷測試（`flowEngine.v8.rateLimits.test.ts` R1／R2）
- [x] GUIDE／CONTEXT 常數說明更新

---

## 4. 開發日誌

### 2026-08-01

- 初稿；定案 30／60
- 匯出常數；propagate 依邊媒質套用
- 補 form 回退；完成 R1／R2 測試與文件
