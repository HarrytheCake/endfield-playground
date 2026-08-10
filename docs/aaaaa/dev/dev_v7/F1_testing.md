# V7-F1 — 測試計畫

**對應工項：** V7-F1  
**狀態：** 完成  
**依賴：** D2、E1  
**定案對齊：** mode／媒質必測；loss 不測計算行為

---

## 1. 自動化

```bash
pnpm format
pnpm lint
pnpm type-check
pnpm test
```

| 測試檔 | 覆蓋 |
|--------|------|
| `src/__tests__/flowEngine.v7.modeMedia.test.ts` | G1／G2／G3／L1 |
| `src/__tests__/data/products.test.ts` | gas／solid／gas_liquid mode 配方 |
| `src/__tests__/data/v7Scripts.smoke.test.ts` | sync／generate dry-run |
| 既有 flowEngine／useFlowEngine | R1–R6 回歸（預設 mode） |

---

## 2. 手動（`/dev/flow-engine`）

| ID | 情境 | 預期 | 狀態 |
|----|------|------|------|
| G1 | 氣態配方 + 正確 solid_mode（息壤氣→息壤） | 可算；抽象邊略過媒質 | preset 已加 |
| G2 | 錯誤 machineMode（base + liquid index） | 非法鏈 | preset 已加 |
| G3 | belt↔pipe 錯接（帶 handle） | 非法 | preset 已加 |
| L1 | 有 loss 的固氣轉化機 | summary **不含** loss 扣減 | preset 已加 |
| R1–R6 | 既有基礎鏈（H1–H11） | 不回退 | 既有 |

---

## 3. 腳本

- [x] sync dry-run／generate dry-run 煙霧測試

---

## 4. 開發日誌

### 2026-08-01

- 依定案更新測試焦點
- 新增 `flowEngine.v7.modeMedia.test.ts`、V7 preset 群組、腳本 smoke
