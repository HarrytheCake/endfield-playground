# V9-B1 — machines modes-only 埠

**對應工項：** V9-B1  
**狀態：** 完成  
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

## 2. 現況（實作後）

| 層 | 行為 |
|----|------|
| `data`／`data_1` machines.json | 無外層 ports |
| `generate-src-data.mjs` | 不產出頂層 ports；stub 亦 modes-only |
| `Machine` 型別 | 無 `input_ports`／`output_ports` |
| `MachineShape.vue` | `getMachineMode(machine, machineMode?)` |
| FlowEngine／DevTopology／MachineCatalog | 早已讀 `modes[]` |

---

## 3. 實作摘要

1. 清理 `data/machines.json` 與 `data_1/machines.json`（43 台剝除外層 ports）
2. codegen／SOURCE_SINK_STUBS modes-only
3. `Machine` 介面移除頂層 ports；文件註明權威在 mode
4. `MachineShape` 新增 optional `machineMode`
5. 測試：無頂層 ports；灌裝機 base vs gas_liquid；配件機 default

---

## 4. 非目標

- 不改 port 的 side／offset／media 語意
- 不在本項做 WxH 格點繪製（見 C2）

---

## 5. DoD

- [x] `aaaaa/data/machines.json` 無外層 ports
- [x] `pnpm generate:src-data` 後 `src/data/machines.ts` 一致
- [x] MachineShape／引擎／預覽皆只依 mode ports
- [x] type-check／既有測試通過（252）

---

## 6. 開發日誌

### 2026-08-02

- 建立細項
- V6 解鎖後標為進行中；準備實作
- 完成 JSON 清理、codegen、型別、MachineShape、回歸測試
