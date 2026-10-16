import type { Meta, StoryObj } from '@storybook/vue3-vite';
import TicketEstimate from './TicketEstimate.vue';

const meta = {
    title: 'L3/StatsPanel/TicketEstimate',
    component: TicketEstimate,
} satisfies Meta<typeof TicketEstimate>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 一般情形：多品項各有工單速率，總計為各列之和 */
export const Default: Story = {
    name: '多品項',
    args: {
        rows: [
            { itemId: 'cu_part', name: '赤銅零件', ratePerMin: 15, ticketPerHour: 900 },
            { itemId: 'hc_part', name: '赫銅零件', ratePerMin: 3.75, ticketPerHour: 225 },
        ],
        totalTicketPerHour: 1125,
    },
};

/** 邊界：空藍圖，總計為 0 且沒有任何列 */
export const Empty: Story = {
    name: '邊界：無資料',
    args: { rows: [], totalTicketPerHour: 0 },
};
