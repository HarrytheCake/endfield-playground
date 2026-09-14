# GUIDE｜W0914-T1 主畫面接入：怎麼做

配 [W0914-T1](./W0914-T1_main_view_integration.md) 看。範圍與驗收看工單。

**開工條件：[#45](https://github.com/dernoson/endfield-playground/pull/45) 已合入 master。** 合入前先讀這份、對好檔案計畫即可，不要先用 fixture 頂替接線。

---

## 1. 先跑起來

```bash
pnpm install
pnpm dev
```

首頁：Navbar、左側專案選單、**中間畫布**、下方工具列、右側產線總覽（StatsPanel）、更右側 Inspector。

**中間那塊**現在是 `FactoryCanvas.vue`，掛在 `MainLayout.vue` 的 `area-canvas`。  
確認 `src/editor/layout/GridCanvas.vue` 已在 master（#46），且 `src/store/layoutStore.ts` 已在 master（#45）。

---

## 2. 容器骨架（合入 #45 後可照抄）

新建 `src/editor/layout/LayoutView.vue`：

```vue
<script setup lang="ts">
import { onMounted } from 'vue';
import GridCanvas from '@/editor/layout/GridCanvas.vue';
import { useLayoutStore } from '@/store/layoutStore';
import { getMockLayoutScenario, toLayoutSnapshot } from '@/data/mockLayout';

const layout = useLayoutStore();

onMounted(() => {
    // 首次進畫面若沒資料，載一組 fixture 當初始內容（僅此一處用 mock）
    if (layout.devices.length === 0) {
        layout.loadSnapshot(toLayoutSnapshot(getMockLayoutScenario('connected')));
    }
});
</script>

<template>
    <div class="relative h-full w-full overflow-auto">
        <GridCanvas :devices="layout.devices" :pipelines="layout.pipelines" />
    </div>
</template>
```

`MainLayout.vue`：

```diff
-import FactoryCanvas from '@/editor/canvas/FactoryCanvas.vue';
+import LayoutView from '@/editor/layout/LayoutView.vue';
```

```diff
 <div class="area-canvas">
-    <FactoryCanvas />
+    <LayoutView />
 </div>
```

**本週不做切換開關。** 舊 `FactoryCanvas` 留在 repo 裡即可，照稿的視角切換器下週另派。

---

## 3. layoutStore 讀取面

| 你要的 | 怎麼拿 |
|--------|--------|
| 設備 | `layout.devices`（readonly） |
| 管線 | `layout.pipelines` |
| 衍生連線 | `layout.connections`（本週可不畫） |
| 初始資料 | `layout.loadSnapshot(...)` |

`readonly` 造成型別不合時**不要 `as any`**——貼型別給 aaaaa。

---

## 4. 接 harry 的平移縮放（可選）

#47 合入後，在 `LayoutView` **import** `useGridViewport`，外層套 transform。需要改 `GridCanvas` 才接得上時——那支檔是你的，你改；請他 Discord 說明要什麼。

---

## 5. 常見錯誤

| 症狀 | 怎麼修 |
|------|--------|
| 畫布空的 | `loadSnapshot` 載初始內容 |
| 只有一格 | `machineType` 查不到；先用 fixture 的 `splitter` |
| type-check 抱怨 readonly | 找 aaaaa，不要硬轉 |
| 不小心做了角落切換鈕 | 本週範圍外；拿掉 |

---

## 6. 自檢

```bash
pnpm type-check
pnpm lint-check
grep -n "store\|vue-flow" src/editor/layout/GridCanvas.vue   # 應無輸出
git diff --stat
```

預期檔：`LayoutView.vue`（新）、`MainLayout.vue`、（若需要）`GridCanvas.vue`。
