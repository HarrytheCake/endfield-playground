# V14 用法說明 — L2 怎麼接 `canPlaceDevice`／`canConnect`

**對象：** toby（T1 落子鏈）、之後做連線 draft 的 L2、週會聽眾
**對應：** [W0921-A0](../../../work_dispatch/aaaaa/0921/W0921-A0_placement_precheck.md)、[W0921-A1](../../../work_dispatch/aaaaa/0921/W0921-A1_connect_rules.md)
**演示頁：** `http://localhost:5173/dev/placement-connect-check.html`
**最後更新：** 2026-09-27

---

## 0. 三十秒

| 問                  | 答                                                               |
| ------------------- | ---------------------------------------------------------------- |
| 交什麼？            | 兩個**純函式入口**：預檢能不能放、能不能連                       |
| 誰呼叫？            | L2（畫布／意圖層）；**不要**自算 `detectOverlaps` 或另寫錨點命中 |
| 跟 store 什麼關係？ | `addDevice`／`moveDevice` 已改走同一套預檢；預覽呼叫＝真落子答案 |
| 解鎖了什麼？        | **沒有解鎖句**；選取／旋轉／刪除仍鎖                             |

---

## 1. 落子預檢（A0）

```ts
import {
    DRAFT_ID,
    canPlaceDevice,
    canMoveDevice,
    type DeviceDraft,
} from '@/utils/layout/placementCheck';
import { useLayoutStore } from '@/store/layoutStore';

const layout = useLayoutStore();

const draft: DeviceDraft = {
    machineType: selectedMachineId,
    position: { x, y, z: 0 },
    rotation: 0,
    // machineMode 可省略 → modes[0]
};

const result = canPlaceDevice(draft, {
    devices: layout.devices,
    pipelines: layout.pipelines,
});

if (!result.ok) {
    // result.reason: 'overlap' | 'invalid'
    // result.conflicts?: 含 DRAFT_ID（'__draft__'）與既有設備 id
    // → 預覽紅框畫 conflicts；不要自己再跑一遍佔格
}
```

### 規則

| 規則                    | 說明                                           |
| ----------------------- | ---------------------------------------------- |
| 回傳＝`PlacementResult` | 與 `addDevice` 同一 narrowing；L2 不用學第二套 |
| draft **沒有 id**       | 型別擋「拿預檢當落子」                         |
| conflicts 裡的 draft    | 固定字面 `'__draft__'`（`DRAFT_ID`）           |
| 效能                    | 全量檢查；約 >200 台請 debounce（JSDoc 有寫）  |
| 禁止                    | `import { detectOverlaps } …` 自組預覽判定     |

移動拖曳用 `canMoveDevice(id, nextPos, view)`——原位必 `ok: true`。

---

## 2. 連線規則（A1・次優）

```ts
import { canConnect, describeConnectFailure } from '@/utils/layout/connectRules';
import { getMachineById } from '@/data/machines';

const result = canConnect(
    { media: 'belt', waypoints }, // ≥2 點、軸對齊
    { devices: layout.devices, pipelines: layout.pipelines },
    (id) => getMachineById(id),
);

if (!result.ok) {
    // result.reason 給程式分支；文案用 describeConnectFailure(result)
    // ConnectResult **沒有** message 欄位（契約：L3 不組文案）
}
```

### 必記

| 點           | 說明                                                                                      |
| ------------ | ----------------------------------------------------------------------------------------- |
| 錨點         | 與 `resolveConnections` **同一套**（`portAnchorIndex`）；勿另寫「端點碰哪一埠」           |
| 規則 7       | 兩端皆 null → 放行；**單端命中**時命中端仍查方向／媒質／佔用                              |
| store 防線   | `addPipeline` **已**呼叫 `canConnect`；失敗 → `invalid`                                   |
| **已知缺口** | `addDevice`／`moveDevice` 貼埠**不**重跑 `canConnect`（[closeout P7](./V14_closeout.md)） |
| L2 highlight | 仍排 10/18                                                                                |

---

## 3. 呼叫關係（口頭可用）

```text
L2 落子預覽 ──canPlaceDevice──┐
                              ├─→ collectLayoutIssues／assessInvolving
layoutStore.addDevice ────────┘         （同一路徑）

L2 連線 draft ──canConnect──→ portAnchorIndex＋規則表
resolveConnections ─────────→ 同一錨點索引（衍生 connections）
```

---

## 4. 現場演示（約 1 分鐘）

```text
1. pnpm dev
2. 開 http://localhost:5173/dev/placement-connect-check.html
3. A0 分頁：指綠「空地」／紅「重疊」並打開 JSON → 看 __draft__
4. A1 分頁：指綠「合法」與「規則 7」；紅「媒質」「佔用」＋ describe 文案
5. 一句話：這頁不寫 store；真接線時把同樣回傳接到畫布紅／綠即可
```

既有 store 演示（含實際 `addDevice`）仍可用：

`http://localhost:5173/dev/layout-store-preview.html`
