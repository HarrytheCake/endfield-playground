import type { StorybookConfig } from '@storybook/vue3-vite';

/**
 * Storybook 主設定
 *
 * 只收 `src/components/` 底下的 story：L1 是純函式與 store、L2 是容器層，
 * 兩者都不是靠 props 渲染的展示元件，收進來只會產生掛不起來的 story。
 *
 * Vite 設定（`@nuxt/ui` 的 `ui()` plugin、`@` 別名、postcss）由 builder 讀取
 * 專案根目錄的 `vite.config.ts` 後合併，此處不重複宣告。
 *
 * Storybook 以自己的埠與原生 URL 提供，不設 base path、不掛進 app 路由。
 */
const config: StorybookConfig = {
    /** story 檔與元件同資料夾，對齊 CLAUDE.md 第 2 節的元件資料夾慣例 */
    stories: ['../src/components/**/*.stories.ts', '../src/app/**/*.stories.ts'],

    /** docs 依 defineProps 的 JSDoc 產生 props 表；a11y 檢查純展示層的可及性 */
    addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],

    framework: {
        name: '@storybook/vue3-vite',
        options: {},
    },
};

export default config;
