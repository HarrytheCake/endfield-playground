# V9-B1 — machines modes-only 埠

**對應工項：** V9-B1  
**狀態：** 未開始  
**依賴：** A1  
**最後更新：** 2026-08-02

---

## 1. 目標

- `docs/aaaaa/data/machines.json`（及同步之 `data/`）**移除外層** `input_ports`／`output_ports`
- 埠**僅**存在於 `modes[].input_ports`／`modes[].output_ports`
- 單形態機器：`modes` 為一元素 list，`id: "default"`（例：配件機）
- 多模態：預設為 `modes[0]`（例：灌裝機 `base_mode` 為首項）
- codegen、型別、`MachineShape`、凡讀外層 ports 處改為 mode-aware

---

## 2. 現況

| 層 | 行為 |
|----|------|
| FlowEngine／DevTopology／MachineCatalog | 已讀 `modes[]` |
| `generate-src-data.mjs` | 無 modes 時從外層合成；外層與 modes[0] 雙寫 |
| `MachineShape.vue` | 仍讀頂層 `input_ports`／`output_ports` |

---

## 3. 實作要點

1. 編輯／腳本清理 `machines.json`：刪外層 ports；確保每機有非空 `modes`
2. codegen：禁止再輸出頂層 ports（或僅作 deprecated 鏡像＝`modes[0]`，**建議直接不產出**）
3. `src/types/machine.ts`：頂層 ports 標 optional／移除；文件註明權威在 mode
4. `MachineShape.vue`：依節點 `machineMode`（缺省 modes[0]）取埠
5. 回歸：灌裝機 base vs gas_liquid 埠數不同；配件機僅 default

---

## 4. 非目標

- 不改 port 的 side／offset／media 語意
- 不在本項做 WxH 格點繪製（見 C2）

---

## 5. DoD

- [ ] `aaaaa/data/machines.json` 無外層 ports
- [ ] `pnpm generate:src-data` 後 `src/data/machines.ts` 一致
- [ ] MachineShape／引擎／預覽皆只依 mode ports
- [ ] type-check／既有測試不因缺頂層 ports 而炸（測試一併改）

---

## 6. 開發日誌

### 2026-08-02

- 建立細項
