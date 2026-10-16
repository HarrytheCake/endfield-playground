import type { Meta, StoryObj } from '@storybook/vue3-vite';
import WarehouseEstimate from './WarehouseEstimate.vue';

const meta = {
    title: 'L3/StatsPanel/WarehouseEstimate',
    component: WarehouseEstimate,
} satisfies Meta<typeof WarehouseEstimate>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 一般情形：容量可編輯，各品項有各自的填滿時數 */
export const Default: Story = {
    name: '有容量與品項',
    args: {
        capacityCells: 240,
        rows: [
            { itemId: 'cu_ingot', name: '赤銅塊', hoursToFull: 4.5 },
            { itemId: 'hc_ingot', name: '赫銅塊', hoursToFull: 18 },
        ],
    },
};

/** 邊界：hoursToFull 為 null 代表淨產出非正，永遠不會填滿 */
export const NeverFull: Story = {
    name: '邊界：永不填滿（null）',
    args: {
        capacityCells: 240,
        rows: [{ itemId: 'sewage', name: '汙水', hoursToFull: null }],
    },
};

/** 邊界：容量為 0 且無品項 */
export const Empty: Story = {
    name: '邊界：無容量無資料',
    args: { capacityCells: 0, rows: [] },
};
