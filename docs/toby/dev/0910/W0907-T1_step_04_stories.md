# 步驟 4：建立 Story 與靜態驗收

## 目標

建立 `Connected`、`Broken` 兩組 Story args，保留未來 Storybook 收錄時可直接使用的展示契約，
並依 1C 只進行靜態驗收。

## 修改檔案

只新增或修改：

```text
src/editor/layout/GridCanvas.stories.ts
```

## Story 結構

使用：

```ts
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { getMockLayoutScenario } from '@/data/mockLayout';
import GridCanvas from './GridCanvas.vue';
```

設定：

- title：`L2/Layout/GridCanvas`
- component：`GridCanvas`
- `Connected` 使用 `getMockLayoutScenario('connected')`
- `Broken` 使用 `getMockLayoutScenario('broken')`
- 兩組 Story 都傳入 fixture 的 `devices` 與 `pipelines`
- 不自行建立第三組假資料

Story、meta、型別別名及 fixture 變數均依專案規範補上繁體中文 JSDoc。

## 1C 驗收調整

目前 `.storybook/main.ts` 只掃描 `src/components/**/*.stories.ts`，因此本 Story 不會出現在
`pnpm storybook` 的側邊欄。本工單已裁定：

- 不修改 `.storybook/main.ts`。
- 不移動元件或 Story。
- 不把 Storybook 畫面截圖或肉眼渲染列為 DoD。
- 不將 `pnpm build-storybook` 成功視為本 Story 已被編譯；該指令同樣不會收錄此檔案。

## 靜態驗收

確認：

1. Story 檔案可被 `pnpm type-check` 檢查。
2. `Connected` 與 `Broken` 均為具名 export。
3. args 的型別符合 `GridCanvas` props。
4. fixture 直接來自 `src/data/mockLayout.ts`。
5. 不修改 `.storybook/main.ts` 或既有 Story。

## 範圍檢查

使用 `rg` 檢查目標元件：

```powershell
rg -n "store|FactoryCanvas|vue-flow|defineEmits|@click|@pointerdown" src/editor/layout/GridCanvas.vue
```

預期沒有輸出。若文字只存在必要的 JSDoc 或 import 路徑誤判，應人工確認；不要為了規避檢查
而使用不清楚的命名。

## 驗收條件

- 兩個 Story exports 與 fixture args 已建立。
- Story 與元件通過 TypeScript、ESLint、Prettier 的靜態檢查。
- 沒有宣稱 Story 已在目前 Storybook UI 完成肉眼驗收。
- 沒有修改 Storybook 設定。

## 下一步

Story 契約完成後，進入「步驟 5：品質檢查與交付」。

