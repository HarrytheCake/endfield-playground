# GUIDE｜W0914-T1 主畫面接入：怎麼做

配 [W0914-T1](./W0914-T1_main_view_integration.md) 看。這份只講「怎麼做」，範圍與驗收看工單。

---

## 1. 先跑起來，確認你在改的是哪個畫面

```bash
pnpm install
pnpm dev
```

打開首頁。你會看到：上面 Navbar、左邊可收合的專案選單、**中間一大塊畫布**、下面工具列、右邊 Inspector。

**中間那塊就是你要換的東西。** 它現在是 `src/editor/canvas/FactoryCanvas.vue`（Vue Flow 版），掛在 `src/app/layouts/MainLayout.vue` 的 `area-canvas` 裡。

順便確認上週的東西還在：`src/editor/layout/GridCanvas.vue` 已經在 master 上了（[#46](https://github.com/dernoson/endfield-playground/pull/46) 合入）。

---

## 2. 容器骨架（可照抄）

新建 `src/editor/layout/LayoutView.vue`。這是**最小可跑版本**，資料先走 fixture：

```vue
<script setup lang="ts">
import { computed, ref } from 'vue';
import GridCanvas from '@/editor/layout/GridCanvas.vue';
import FactoryCanvas from '@/editor/canvas/FactoryCanvas.vue';
import { getMockLayoutScenario } from '@/data/mockLayout';

/** 是否使用新格點畫布；關閉時退回舊 Vue Flow 畫布 */
const useGridCanvas = ref(true);

// TODO(W0914-T1): #45 合入後改讀 useLayoutStore()
/** 暫時資料來源：L1 預覽 fixture */
const scenario = computed(() => getMockLayoutScenario('connected'));
</script>

<template>
    <div class="relative h-full w-full">
        <GridCanvas
            v-if="useGridCanvas"
            :devices="scenario.devices"
            :pipelines="scenario.pipelines"
        />
        <FactoryCanvas v-else />

        <UButton
            class="absolute top-2 right-2"
            size="xs"
            variant="soft"
            @click="useGridCanvas = !useGridCanvas"
        >
            {{ useGridCanvas ? '切回舊畫布' : '切到新畫布' }}
        </UButton>
    </div>
</template>
```

然後把 `MainLayout.vue` 的那三行換掉：

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

到這裡就已經達成一句話驗收了。剩下的是把資料來源換成真的。

---

## 3. #45 合入後，把資料換成 store

`layoutStore` 的讀取面（合入後可用）：

| 你要的 | 怎麼拿 | 注意 |
|--------|--------|------|
| 設備陣列 | `layout.devices` | `readonly`，不能直接改 |
| 管線陣列 | `layout.pipelines` | 同上 |
| 衍生連線 | `layout.connections` | 是 getter，每次重算；本週不需要 |
| 目前佈局的問題 | `layout.layoutIssues` | 之後畫紅框用；本週不需要 |
| 塞一組初始資料進去 | `layout.loadSnapshot(toLayoutSnapshot(getMockLayoutScenario('connected')))` | 有人手上沒資料時，畫面才不會全空 |

改法：

```ts
import { useLayoutStore } from '@/store/layoutStore';
import { getMockLayoutScenario, toLayoutSnapshot } from '@/data/mockLayout';

const layout = useLayoutStore();

// 首次進畫面若沒有資料，載入一組 fixture 當初始內容
if (layout.devices.length === 0) {
    layout.loadSnapshot(toLayoutSnapshot(getMockLayoutScenario('connected')));
}
```

template 那邊改成 `:devices="layout.devices"`、`:pipelines="layout.pipelines"`。

`readonly` 造成型別不合時**不要用 `as any` 硬轉**——在 PR 或 Discord 貼一行給 aaaaa 看，讀取面的型別是他負責的。

---

## 4. 接 harry 的平移縮放（可選，看 #47 有沒有合入）

`useGridViewport` 是一個 composable，回傳目前的平移／縮放狀態與事件處理。用法看他 PR body 那行說明（他會寫平移用哪個鍵、縮放範圍多少）。

接的方式是**在你的容器外層包一個會動的 `<g>` 或 CSS transform**，不是去改他的檔：

```text
LayoutView.vue（你的）
  ├─ useGridViewport()  ← import 他的 composable，允許
  └─ GridCanvas.vue（你的）  ← 若需要吃 transform，你改這支
```

`GridCanvas` 目前是自己算 `width`／`height` 的固定 SVG。要支援縮放，最省的做法是在外層 `div` 套 CSS `transform: translate(...) scale(...)`，**先不要動 SVG 內部的座標計算**——那會連帶影響上週已經對好的佔格。

---

## 5. 常見錯誤

| 症狀 | 原因 | 怎麼修 |
|------|------|--------|
| 畫布是空的 | store 裡沒資料 | 用 §3 的 `loadSnapshot` 載 fixture |
| 設備方塊只有一格，但機器是 3×3 | `machineType` 在 `src/data/machines.ts` 查不到 | 用 fixture 裡的 `splitter` 先驗證，再換別的機型 |
| 畫布被裁切／看不到全部 | `area-canvas` 的高度是 grid 給的，SVG 比它大 | 容器加 `overflow-auto`（`GridCanvas` 自己已有一層） |
| type-check 抱怨 `readonly` | 把 `readonly` 陣列傳進要求可變陣列的 prop | 貼型別給 aaaaa，不要 `as any` |
| lint 抱怨 import 順序 | 專案有 import 排序規則 | `pnpm lint` 會自動修大部分 |

---

## 6. 自檢

```bash
pnpm type-check
pnpm lint-check
grep -n "store\|vue-flow" src/editor/layout/GridCanvas.vue   # 應該沒有輸出
git diff --stat                                              # 應該只有 3 支檔
```

三支檔＝`LayoutView.vue`（新）、`MainLayout.vue`、（若你改了）`GridCanvas.vue`。
