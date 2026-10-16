import type { Meta, StoryObj } from '@storybook/vue3-vite';
import PowerSummary from './PowerSummary.vue';

const meta = {
    title: 'L3/StatsPanel/PowerSummary',
    component: PowerSummary,
} satisfies Meta<typeof PowerSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 供電充足：盈餘以綠色呈現 */
export const Surplus: Story = {
    name: '供電盈餘',
    args: {
        totalDemandKw: 320,
        totalSupplyKw: 500,
        deviceCount: 18,
        deviceErrorCount: 0,
        connectionCount: 16,
    },
};

/** 邊界：供電不足，盈餘轉負時文案與顏色都要換 */
export const Deficit: Story = {
    name: '邊界：供電不足',
    args: {
        totalDemandKw: 720,
        totalSupplyKw: 500,
        deviceCount: 24,
        deviceErrorCount: 3,
        connectionCount: 21,
    },
};

/** 邊界：空藍圖，所有數值為零時盈餘恰為 0，走的是「盈餘」那一支 */
export const Empty: Story = {
    name: '邊界：空藍圖',
    args: {
        totalDemandKw: 0,
        totalSupplyKw: 0,
        deviceCount: 0,
        deviceErrorCount: 0,
        connectionCount: 0,
    },
};
