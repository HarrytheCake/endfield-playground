# V1 TODOLIST — Machine 物件動態化重構

**版本：** V1  
**建立日期：** 2026-05-22  
**負責人：** aaaaa  
**對應開發文件：** [dev_v1.md](./dev_v1.md)

> 標記說明：`[ ]` 未開始 / `[~]` 進行中 / `[x]` 完成 / `[!]` 封鎖中（等待依賴）

---

## V1-A｜型別模組（前置，無依賴）

- [x] **V1-A1** 建立 `src/types/machine.ts`
  - `PortSide`：`'top' | 'right' | 'bottom' | 'left'`
  - `MachineCategory`：`'物流設備' | '倉庫存取' | '基礎生產' | '合成製造' | '電力'`
  - `PortDef`：`{ side: PortSide; offset: number }`
  - `MachineContext`：Phase 1 暫設為 `type MachineContext = unknown`
  - 行為函式型別：`MachineTickFn`、`MachineInputFn`、`MachineOutputFn`、`MachineEfficiencyFn`（Phase 1 均為 `null | ...`）
  - `Machine` 介面：`readonly` 靜態屬性 + 四個行為函式佔位

- [x] **V1-A2** 建立 Port 旋轉工具函式（置於 `src/types/machine.ts` 末尾）
  - `rotatePortSide(side, rotation)` — 方位順時針旋轉
  - `rotatePortOffset(side, offset, width, height, rotation)` — offset 隨旋轉轉換
  - 對照 dev_v1.md §3.3 的轉換規則與表格逐一實作

---

## V1-B｜機器資料轉換（依賴 V1-A1）

- [x] **V1-B1** 建立 `src/data/machines.ts`
  - 對照 `docs/aaaaa/data/machines.json`，轉換全部 35 台機器
  - 每台以具名常數 export（例：`export const 塑型機: Machine = { ... }`）
  - 所有行為函式初始值全設為 `null`
  - 彙整為 `export const MACHINES = new Map<string, Machine>([...])`
  - 提供 `getMachine(name: string): Machine | undefined` 查詢函式

- [x] **V1-B2** 補齊 port 定義（參照 machines.json 完整資料）
  - 修正現有 stub 中 `inputPorts: []` / `outputPorts: []` 的機器（灌裝機、研磨機、反應池、天有洪爐、提純機、拆解機、裝備原件機、封裝機）
  - 倉庫存取 / 電力 / 農業類機器照實轉換（json 中本為空陣列，保持空陣列）
  - 確認 `power` 欄位以 machines.json 實際數值為準（不使用 `-1` stub）

- [x] **V1-B3** 為 `src/data/machines.ts` 所有 `PortDef` 補填 `type` 欄位（**人工操作**）
  - `PortDef.type: PortType` 已定義（`'item' | 'liquid'`），需逐台機器補填
  - 規則：固體輸送帶連接的 port 填 `'item'`；管道連接的 port 填 `'liquid'`
  - 參考 `docs/aaaaa/data/machines.json` 中各機器的 port 說明確認類型
  - 完成後執行 `pnpm type-check` 確認零錯誤
  - ✅ 21 個 liquid port 已由開發者手動確認，pnpm type-check 零錯誤

---

## V1-C｜Flow 型別橋接（依賴 V1-A1）

- [x] **V1-C1** 更新 `src/types/flow.ts`
  - 移除 `flow.ts` 中原有的 `PortSide`、`PortDef`、`MachineDef` 定義
  - 以 re-export 橋接：`export type { Machine as MachineDef, PortDef, PortSide, PortType } from '@/types/machine'`
  - 確保 FlowEngine 使用的型別引用不中斷（編譯零錯誤）
  - ✅ pnpm type-check 零錯誤

---

## V1-D｜devices.ts 委託更新（依賴 V1-B1）

- [x] **V1-D1** 更新 `src/data/devices.ts` 中的 `getMachineDef()`
  - 改為委託：`return getMachine(name)` from `machines.ts`
  - 保留 `getMachineDef()` 函式簽名不變（FlowEngine 與外部呼叫無需修改）
  - 移除 `MACHINE_DEFS` 陣列中的靜態設備定義（由 `machines.ts` 接管）
  - `getAllMachines()` 同步委託至 `getAllMachinesFromStore`
  - ✅ pnpm type-check 零錯誤

---

## V1-E｜品質驗證（依賴 V1-A ~ V1-D）

- [x] **V1-E1** `pnpm type-check` 零錯誤
- [x] **V1-E2** `pnpm test --run` 全數通過（既有 27 條測試不受影響）
- [x] **V1-E3** 確認 FlowEngine H1–H6 情境仍正確運作（手動驗證）
- [x] **V1-E4** `pnpm lint-check` 零警告
- [x] **V1-E5** `pnpm format-check` 通過

---

## 封鎖項目追蹤

| ID | 封鎖原因 | 等待對象 | 預計解除 |
|----|---------|---------|---------|
| V1-D1 | `devices.ts` 為 CR-04 stub，CR-01 接管後需重新對齊 | CR-01 | CR-01 正式建立 devices.ts 後 |
