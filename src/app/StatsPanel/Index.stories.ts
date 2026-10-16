import type { Meta, StoryObj } from '@storybook/vue3-vite';
import StatsPanel from './Index.vue';

/**
 * 統計面板的組合檢視。
 *
 * 本元件不吃 props，四個子區塊目前以固定的空值渲染，因此只有一個 story ——
 * 沒有可變的輸入就沒有邊界情形可列。各子區塊的邊界請看它們各自的 story。
 */
const meta = {
    title: 'L3/StatsPanel/Index',
    component: StatsPanel,
} satisfies Meta<typeof StatsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 四個子區塊的組合與間距 */
export const Default: Story = {
    name: '組合檢視',
};
