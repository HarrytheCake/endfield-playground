# 技術註記｜shirone｜E001 的座標陷阱與最小測試骨架（W0823-S1 專用）

| meta | value |
|------|-------|
| 對應工單 | [W0823-S1](./W0823-S1_e001_device_overlap.md) |
| 為什麼有這份 | 官方 `getOccupiedCells` 與真實 `ValidationContext` **座標系不一致**；不先講清楚，你會在「測試過了但畫面上抓不到重疊」之間耗掉整週 |
| 另含 | 可直接抄的測試 fixture、以及第一次開 PR 的步驟 |

---

## 1. 座標陷阱（本週最重要的一段）

`useValidation.buildContext()` 把 store 的節點原封不動塞進 context：

```47:54:src/composables/useValidation.ts
    function buildContext(): ValidationContext {
        return {
            devices: editorStore.nodes,
            connections: editorStore.edges,
            getDef: getMachine,
            baseRegion: canvasStore.baseRegion,
        };
    }
```

而 `FactoryNode.position` 是 **Vue Flow 的像素座標**（吸附成 `gridSize`＝20 的倍數，見 `src/types/graph.ts` 註解）。但官方幾何工具是這樣寫的：

```26:31:src/utils/geometryUtils.ts
export function getOccupiedCells(device: FactoryNode, def: Machine): Set<string> {
    const cells = new Set<string>();

    // 取得設備位置（格子座標，假設 position 已經是格子座標）
    const x = Math.floor(device.position.x);
    const y = Math.floor(device.position.y);
```

結果：畫面上相鄰 20px 的兩台設備，在 detector 眼裡座標差 20 格，**永遠不重疊**。

**本週怎麼處理：**

| 做 | 不要做 |
|----|--------|
| detector 照官方 `getOccupiedCells(device, def)` 寫，**不做任何座標換算** | 不要在 detector 裡除以 `gridSize`——`ValidationContext` 根本沒有 gridSize，硬取就會 import store，違反純函式 |
| 測試 fixture 用**格子座標**（`position: { x: 0, y: 0 }`、`{ x: 1, y: 0 }`） | 不要為了「畫面上要抓得到」去改 `buildContext` 或 store |
| PR 描述加一段「已知落差：ctx.devices 的 position 為像素，與 getOccupiedCells 的格子假設不一致，屬 CR-04 幾何域，未在本 PR 處理」 | 不要自己新增 `gridX`／`gridY` 欄位到 `FactoryNodeData` |

這樣你的 PR 邏輯是對的、可 review、可合入；換算歸屬由 aaaaa（A2／幾何域）決定，不會變成你的鍋。

---

## 2. 現況再確認

- 正式樹目前**只有** `src/lib/validation/detectors/overlapDetector.ts`（吃 `shironesMachine`，非官方契約），`E001_deviceOverlap.ts` 確實不存在 → 本週是**新建**
- `validationStore.registerDetector()` 已存在且可用，但本週**不要**動正式註冊組裝（registry 排 11/1）
- 官方型別在 `src/types/validation.ts`：`Detector = { code, level, run(ctx) }`，`Alert` 需要 `uid`／`level`／`code`／`message`／`relatedDeviceUids`／`relatedConnectionUids`

---

## 3. 測試 fixture 骨架（抄了改）

```ts
import { describe, it, expect } from 'vitest';
import type { FactoryNode } from '@/types/graph';
import type { Machine } from '@/types/machine';
import type { ValidationContext } from '@/types/validation';
import { E001_deviceOverlap } from '@/lib/validation/detectors/E001_deviceOverlap';

/** 造一台最小可用的機器定義；只有幾何欄位是本測試在意的 */
function makeDef(name: string, width: number, height: number): Machine {
    return { name, width, height, modes: [] } as unknown as Machine;
}

/** 造一顆最小節點；position 用「格子座標」，與 getOccupiedCells 的假設一致 */
function makeNode(id: string, machineType: string, x: number, y: number, rotation = 0): FactoryNode {
    return {
        id,
        position: { x, y },
        data: { label: machineType, machineType, rotation },
    } as FactoryNode;
}

/** 組出最小 ValidationContext：不啟動 Vue、不碰 store */
function makeCtx(devices: FactoryNode[], defs: Record<string, Machine>): ValidationContext {
    return {
        devices,
        connections: [],
        getDef: (type: string) => defs[type],
        baseRegion: null,
    };
}

describe('E001_deviceOverlap', () => {
    const defs = { 粉碎機: makeDef('粉碎機', 3, 2), 塑型機: makeDef('塑型機', 2, 2) };

    it('兩台分開時不產生警示', () => {
        const ctx = makeCtx([makeNode('a', '粉碎機', 0, 0), makeNode('b', '塑型機', 10, 10)], defs);
        expect(E001_deviceOverlap.run(ctx)).toEqual([]);
    });

    it('兩台重疊時只產生一條 E001', () => {
        const ctx = makeCtx([makeNode('a', '粉碎機', 0, 0), makeNode('b', '塑型機', 1, 0)], defs);
        const alerts = E001_deviceOverlap.run(ctx);
        expect(alerts).toHaveLength(1);
        expect(alerts[0].code).toBe('E001');
        expect(alerts[0].relatedDeviceUids).toEqual(expect.arrayContaining(['a', 'b']));
    });
});
```

再補兩個案例就達到工單 DoD：**rotation 造成重疊／不重疊各一例**（3×2 轉 90° 變 2×3）、**`getDef` 回 undefined 時該對 skip 不炸**。

`as unknown as Machine` 是為了不用填滿整個 `Machine` 介面；只在測試裡這樣用，正式碼不要。

---

## 4. Alert 的兩個細節

- **同一對只報一條**：兩兩比較時用 `for (let i = 0; i < devices.length; i++) for (let j = i + 1; ...)`，不要雙層全掃
- **訊息用機器名**：`ctx.getDef(...)?.name`，不要只丟 uid（右側面板 11 月要直接顯示這句）

---

## 5. 第一次開 PR 的步驟

```powershell
git checkout -b dev/shirone-e001
# 寫 detector 與測試
pnpm type-check
pnpm lint-check
pnpm format-check
pnpm test
git add src/lib/validation/detectors/E001_deviceOverlap.ts src/__tests__/lib/validation/detectors/E001_deviceOverlap.test.ts
git commit -m "feat(validation): E001 device overlap detector + tests"
git push -u origin dev/shirone-e001
```

到 GitHub 開 PR，描述四行：

1. 做了什麼
2. 怎麼測（`pnpm test`）
3. **未接 UI、未改 registry**
4. §1 的已知座標落差

`format-check` 沒過就跑 `pnpm format` 再 commit。dernoson 幫你順格式是預期內的事，不是失敗。

---

## 6. 一票否決（review 直接退）

- 提交 `opus.ts`／`sonnet.ts` 之類 AI dump 檔進正式樹
- detector 內 `import` 了 `vue`／`pinia`／`.vue`
- 把 `overlapDetector`／`shironesMachine` 那套接成正式 E001
- 順手做 E002、右側列表、點擊導覽
