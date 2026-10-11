import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { getMockLayoutScenario } from '@/data/mockLayout';
import GridCanvas from './GridCanvas.vue';

/** GridCanvas 的 Storybook 元資料 */
const meta = {
    title: 'L3/Layout/GridCanvas',
    component: GridCanvas,
    decorators: [() => ({ template: '<div class="h-[400px] w-[640px]"><story /></div>' })],
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

/** 空設備與無基地時仍顯示可見視窗格線 */
export const Empty: Story = {
    name: '自由畫布／空資料',
    args: { devices: [], pipelines: [] },
};

/** 武陵基地原點附近的正常設備 */
export const WithinBase: Story = {
    name: '基地內',
    args: { ...Connected.args, baseSize: { w: 256, h: 256 } },
};

/** 真機器在基地右側部分跨界；由上層提供出界識別 */
export const PartialOutside: Story = {
    name: '部分跨界／Error',
    args: {
        devices: [
            {
                id: 'partial',
                machineType: 'shaping_machine',
                position: { x: 255, y: 1, z: 0 },
                rotation: 0,
                label: '塑型機',
            },
        ],
        pipelines: [],
        baseSize: { w: 256, h: 256 },
        outsideDeviceIds: ['partial'],
        offset: { x: -250 * 28, y: 0 },
    },
};

/** 平移後的負座標多台設備均能顯示出界狀態 */
export const MultipleOutside: Story = {
    name: '平移／多台出界',
    args: {
        devices: [
            {
                id: 'negative-x',
                machineType: 'shaping_machine',
                position: { x: -4, y: 2, z: 0 },
                rotation: 0,
                label: '塑型機',
            },
            {
                id: 'negative-y',
                machineType: 'shaping_machine',
                position: { x: 3, y: -3, z: 0 },
                rotation: 1,
                label: '塑型機',
            },
        ],
        pipelines: [],
        baseSize: { w: 192, h: 192 },
        outsideDeviceIds: ['negative-x', 'negative-y'],
        offset: { x: 200, y: 180 },
    },
};
