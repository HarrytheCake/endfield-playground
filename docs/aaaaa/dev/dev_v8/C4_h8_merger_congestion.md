# V8-C4 — H8 改為匯流＋堵塞回推

**對應工項：** V8-C4  
**狀態：** 完成  
**依賴：** C1（埠一對一）；匯流器辨識

---

## 1. 問題

舊 H8「雙鏈直接匯入同一 Sink」違反 **單埠單線**。

---

## 2. 修正後語意（合法示範）

```text
SourceA → 粉碎機A ──┐
                     ├─→ 匯流器 ─→ Sink
SourceB → 粉碎機B ──┘
```

兩入邊皆為 belt、上游滿速各 30／min：

- 匯流器 Σ 入 = 60，單條出口 belt 上限 **30**
- `inputRates` 記可接受吞吐量 = 30
- `detectCongestion` 對匯流器同品項多入邊**按比例分攤**需求 → 各約 **15**，並回推上游效率 ≈ 50%

實作要點：

- `propagateFlows`：匯流器 Σ 入後截斷出口
- `detectCongestion`：匯流器比例分攤；每遍用速率**快照**避免同遍干擾

---

## 3. Preset／文件

- `/dev/flow-engine` H8：含匯流器；`e3`→`in-0`、`e4`→`in-1`
- skill `flow-engine-test` 預期已更新
- 自動化：`src/__tests__/flowEngine.v8.h8Merger.test.ts`

---

## 4. DoD

- [x] H8 圖形含匯流器，不再雙線直連同一 Sink 口
- [x] 滿速雙入時出口 ≤30，上游堵塞回推約 15／15
- [x] 自動化與 UI expected 一致

---

## 5. 開發日誌

### 2026-08-01

- 初稿
- 實作匯流器傳播＋比例堵塞；更新 preset／測試／skill
