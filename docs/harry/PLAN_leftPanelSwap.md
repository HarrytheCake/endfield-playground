# PLAN：刪舊左側面板，接上 `MachineCard`（W1011-H2）

**工單：** [W1011-H2_left_panel_swap.md](../work_dispatch/harry/1011/W1011-H2_left_panel_swap.md)｜**週總表：** [WEEK_20261011.md](../work_dispatch/WEEK_20261011.md) v1.2（A-3、A-4 已裁）
**基準：** `dev/cake` ＝ `upstream/master` `c5af7fc`（2026-10-18）

---

## 1. 範疇判定

| 檔案 | 層 | 動作 |
|------|----|------|
| `src/app/layouts/MainLayout.vue` | L2 | 拿掉 `ProjectSidebar`／`sidebarOpen`；新增 `selectedDeviceId` 與轉接 computed；左槽掛 `MachineCard` |
| `src/editor/navbar/Navbar.vue` | L2 | 拿掉 ☰ 按鈕、`sidebarOpen` prop、`toggle-sidebar` emit（使用者 10/18 裁：一併移除） |
| `src/editor/sidebar/ProjectSidebar.vue` | L2 | **連檔刪除**（主編裁 A-4）；同目錄無其他檔，資料夾一併消失 |

不碰：`src/app/MachineCard/*`（shirone 鎖）、`LayoutView`／`GridCanvas`（toby 鎖）、`StatsPanel`、`ToolbarPanel`。

## 2. 既有介面盤點

- **`LayoutView`**：T2（`0ecda95`）已在 master，`emit('select-device', id | null)`——點設備未拖動給 id、點空白給 `null`。工單「先寫死選第一台」的過渡步驟**不需要**。
- **`MachineCardProps`**（`src/app/MachineCard/types.ts`）：必填 `id`／`name`／`sizeText`；選填 `iconUrl`／`power`／`selectedRecipe`／`formulas`。根節點固定 **451×686px**。
- **`PlacedDevice`**（`src/types/layout.ts`）：`id`、`machineType`（＝`Machine.id`）、`rotation` 等。
- **`getMachineById`**（`src/data/machines.ts`）：`name`、`width`、`height`、`power`（`-1`＝資料未定義）。

## 3. 設計

### 3.1 選中狀態（A-3）

MainLayout `const selectedDeviceId = ref<string | null>(null)`，接 `<LayoutView @select-device="selectedDeviceId = $event" />`。**不進 store。**

### 3.2 轉接（L2，MainLayout 內 computed）

```
selectedMachineCard = computed<MachineCardProps | null>:
  device  = layoutStore.devices.find(id === selectedDeviceId)   ← 找不到（被復原刪掉）→ null
  machine = getMachineById(device.machineType)                  ← 找不到 → null
  return { id: device.id, name: machine.name,
           sizeText: `${width}×${height}`,
           power: machine.power >= 0 ? `${power}kW` : undefined }
```

- 面板顯示條件＝`selectedMachineCard !== null`；取代舊 `devicePanelVisible`。
- 用 computed 從 store 反查而非存快照：設備被 Ctrl+Z 移除時面板自動收起，不留殘影。
- `sizeText` 用 0° 靜態尺寸：旋轉本週仍凍結。
- `formulas`／`selectedRecipe`／`iconUrl`：**本週不給**（使用者 10/18 裁：只做必填＋power），`MachineCard` 自帶 fallback。

### 3.3 槽位尺寸

`.area-device-panel` 寬度 280px → **451px**（＝`MachineCard` 設計寬，使用者 10/18 裁），仍 absolute 疊在畫布左緣、不推擠畫布；內容超高時 `overflow-y: auto`。

### 3.4 連帶清理

- `.area-stage` 的 `isolation` 註解原本以 `ProjectSidebar` 為理由，改寫成通用理由（浮層 z-index 不外溢到 stage 外）。
- Navbar ☰ 拿掉後 `#left` 只剩標題文字。

## 4. 明確排除

- 改 `MachineCard` 內部、`pick` 事件的用途
- 右側（#62）／下方（#48）面板接線、頂欄按鈕
- 選中設備的畫布高亮、Esc 取消選取、多選（未來再開 store）
- `formulas` 轉接（配方資料＋物品圖示查表，下週或另派）

## 5. 驗收

- 四項驗證：`pnpm type-check`／`lint-check`／`format-check`／`test`
- `pnpm dev` 無頭 Edge：正式頁無舊側欄、Navbar 無 ☰；放一台設備 → 點它 → 左側顯示 `MachineCard`，名稱／尺寸正確；點空白 → 面板隱藏；console 無錯誤
- `git diff --stat src/app/MachineCard` 為空
