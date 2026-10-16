import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ItemSummaryTable from './ItemSummaryTable.vue';

/** 佔位圖示：避免 story 因為抓不到真實圖檔而出現破圖 */
const ICON =
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="16" height="16"%3E%3Crect width="16" height="16" fill="%2371717a"/%3E%3C/svg%3E';

const meta = {
    title: 'L3/StatsPanel/ItemSummaryTable',
    component: ItemSummaryTable,
} satisfies Meta<typeof ItemSummaryTable>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 一般情形：效率分布橫跨綠、黃、紅三段，驗證 getEfficiencyBg 的分色 */
export const Default: Story = {
    name: '效率橫跨三段',
    args: {
        rows: [
            {
                itemId: 'cu_ingot',
                name: '赤銅塊',
                iconUrl: ICON,
                produced: 60,
                consumed: 45,
                net: 15,
                efficiency: 1,
            },
            {
                itemId: 'cu_powder',
                name: '赤銅粉末',
                iconUrl: ICON,
                produced: 30,
                consumed: 30,
                net: 0,
                efficiency: 0.62,
            },
            {
                itemId: 'hc_solution',
                name: '赫銅溶液',
                iconUrl: ICON,
                produced: 7.5,
                consumed: 30,
                net: -22.5,
                efficiency: 0.25,
            },
        ],
    },
};

/** 邊界：空藍圖沒有任何品項 */
export const Empty: Story = {
    name: '邊界：無資料',
    args: { rows: [] },
};
