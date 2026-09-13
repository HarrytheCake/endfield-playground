import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { getMockLayoutScenario } from '@/data/mockLayout';
import GridCanvas from './GridCanvas.vue';

/** GridCanvas 的 Storybook 元資料 */
const meta = {
    title: 'L2/Layout/GridCanvas',
    component: GridCanvas,
} satisfies Meta<typeof GridCanvas>;

export default meta;

/** GridCanvas story 的型別 */
type Story = StoryObj<typeof meta>;

/** 兩台設備與一條端點對齊的管線 fixture */
const connectedScenario = getMockLayoutScenario('connected');

/** 已連接佈局的唯讀展示資料 */
export const Connected: Story = {
    name: '已連接',
    args: {
        devices: connectedScenario.devices,
        pipelines: connectedScenario.pipelines,
    },
};

/** 兩台設備與一條端點錯位的管線 fixture */
const brokenScenario = getMockLayoutScenario('broken');

/** 斷線佈局的唯讀展示資料 */
export const Broken: Story = {
    name: '斷線',
    args: {
        devices: brokenScenario.devices,
        pipelines: brokenScenario.pipelines,
    },
};
