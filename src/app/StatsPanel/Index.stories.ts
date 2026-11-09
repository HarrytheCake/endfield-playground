import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { ref } from 'vue';
import TestStatsPanel from './Index.vue';
import type { SingleProductDetail, SingleTip } from './types.ts';

/** 產線總覽統計面板（StatsPanel）Storybook Meta 設定 */
const meta = {
    title: 'L3/StatsPanel/Index',
    component: TestStatsPanel,
    decorators: [
        () => ({
            template: `
                <div style="width: 333px; height: 1024px; position: relative; margin: 20px auto;">
                    <story />
                </div>
            `,
        }),
    ],
} satisfies Meta<typeof TestStatsPanel>;

export default meta;

/** StatsPanel Story 型別定義 */
type Story = StoryObj<typeof meta>;

/** 範例產能估算產品清單 */
const sampleProductions: SingleProductDetail[] = [
    {
        id: '1',
        name: '紫晶纖維',
        produce: 406,
        consume: 0,
        profit: 406,
        isExpanded: true,
    },
    {
        id: '2',
        name: '紫晶纖維',
        produce: 0,
        consume: 799,
        profit: -799,
        isExpanded: true,
    },
];

/** 範例提示與警報清單 */
const sampleTips: SingleTip[] = [
    {
        type: 'error',
        text: '碎紙機單元*1位置重疊',
    },
    {
        type: 'warning',
        text: '貓毛貓範圍總sb超載',
    },
];

/** 一般情形：展示完整欄位與對齊 Figma 設計稿樣式 */
export const Default: Story = {
    name: '一般情形（設計稿樣式）',
    args: {
        power: {
            used: 120,
            total: 180,
        },
        products: sampleProductions,
        exchangeRate: 799325,
        tips: sampleTips,
    },
};

/** 邊界：不傳入 props 時，空清單仍顯示指定提示。 */
export const MinimalProps: Story = {
    name: '邊界：最小 props (無資料狀態)',
    args: {},
    /** 空白提示不依賴 hasDevices 是否有傳入。 */
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('status')).toHaveTextContent('尚未擺放設備');
    },
};

/** 無設備時顯示工單指定文案，不建立零值品項。 */
export const EmptyFactory: Story = {
    name: '空產線：尚未擺放設備',
    args: { hasDevices: false, products: [] },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('status')).toHaveTextContent('尚未擺放設備');
        await expect(canvas.queryByRole('button', { name: /產耗明細/ })).not.toBeInTheDocument();
    },
};

/** 依使用者指定，已有設備但沒有產耗摘要時，也顯示相同的空白提示。 */
export const DevicesWithoutSummary: Story = {
    name: '邊界：有設備但無產耗摘要',
    args: { hasDevices: true, products: [] },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('status')).toHaveTextContent('尚未擺放設備');
    },
};

/** 與接線整合測試對齊的 30/min 產線；中間物淨值為零仍完整保留。 */
const connectedProducts: SingleProductDetail[] = [
    { id: 'ore', name: '源礦', produce: 30, consume: 30, profit: 0, isExpanded: true },
    { id: 'powder', name: '源石粉末', produce: 30, consume: 30, profit: 0, isExpanded: true },
];

/** 正常產線展示與固定一位小數的格式驗證。 */
export const ConnectedProduction: Story = {
    name: '已接線：30 個每分與零淨值中間物',
    args: { hasDevices: true, products: connectedProducts },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getAllByRole('button', { name: /產耗明細/ })).toHaveLength(2);
        await expect(canvas.getAllByText('30.0')).toHaveLength(4);
        await expect(canvas.getAllByText('淨值+0.0')).toHaveLength(2);
        await expect(canvas.getByText('(個/分)')).toBeInTheDocument();
    },
};

/** 清空設備後，即使引擎尚在 debounce 期間，舊摘要也不應繼續顯示。 */
export const EmptyWithStaleProducts: Story = {
    name: '邊界：無設備但仍有上一輪摘要',
    args: { hasDevices: false, products: connectedProducts },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('status')).toHaveTextContent('尚未擺放設備');
        await expect(canvas.queryByRole('button', { name: /產耗明細/ })).not.toBeInTheDocument();
    },
};

/** 小數、千分位與負淨值僅做格式化，不修改傳入的產耗數值。 */
export const DecimalRates: Story = {
    name: '邊界：小數與正負淨值',
    args: {
        hasDevices: true,
        products: [
            {
                id: 'positive',
                name: '紫晶纖維',
                produce: 1234.56,
                consume: 1200,
                profit: 34.56,
                isExpanded: true,
            },
            {
                id: 'negative',
                name: '纖維原料',
                produce: 0.05,
                consume: 0.15,
                profit: -0.1,
                isExpanded: true,
            },
        ],
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('1,234.6')).toBeInTheDocument();
        await expect(canvas.getByText('淨值+34.6')).toHaveClass('text-[#a3fd1c]');
        await expect(canvas.getByText('淨值-0.1')).toHaveClass('text-[#ff6e6e]');
    },
};

/** 刷新與排序後保留同品項的展開狀態，並驗證展開不會改寫 args。 */
export const LiveUpdates: Story = {
    name: '互動：刷新數據保留展開狀態',
    args: {
        hasDevices: true,
        products: connectedProducts.map((item) => ({ ...item, isExpanded: false })),
    },
    render: (args) => ({
        components: { TestStatsPanel },
        setup() {
            /** 初始資料沿用傳入物件，讓 play 可以檢查展示操作是否回寫 props。 */
            const products = ref(args.products ?? []);
            /** 示範產線更新及排序；產耗值由 Story 提供，展示元件不計算流量。 */
            const refreshProducts = () => {
                products.value = products.value
                    .map((item) => ({
                        ...item,
                        produce: 15,
                        consume: 15,
                    }))
                    .reverse();
            };
            return { args, products, refreshProducts };
        },
        template: `
            <div class="h-full">
                <button type="button" class="text-white" @click="refreshProducts">更新產線數據</button>
                <TestStatsPanel v-bind="args" :products="products" />
            </div>
        `,
    }),
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: '源礦產耗明細' }));
        await expect(args.products?.[0].isExpanded).toBe(false);
        await userEvent.click(canvas.getByRole('button', { name: '更新產線數據' }));
        await waitFor(() => expect(canvas.getAllByText('15.0')).toHaveLength(2));
        await expect(canvas.getByRole('button', { name: '源礦產耗明細' })).toHaveAttribute(
            'aria-expanded',
            'true',
        );
        await expect(canvas.getByRole('button', { name: '源石粉末產耗明細' })).toHaveAttribute(
            'aria-expanded',
            'false',
        );
    },
};

/** 邊界：較高耗電仍顯示完整 kW 數值。 */
export const OverloadPower: Story = {
    name: '邊界：高耗電',
    args: {
        power: {
            used: 350,
            total: 180,
        },
        products: sampleProductions,
        exchangeRate: 50000,
        tips: [
            {
                type: 'error',
                text: '設備位置重疊，請調整佈局',
            },
        ],
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('350 kW / 180 kW')).toBeVisible();
        await expect(canvas.getByText('總耗電量/供電量')).toBeVisible();
        await expect(canvas.queryByRole('spinbutton')).not.toBeInTheDocument();
        await expect(canvasElement.querySelector('[data-figma-name="Bar"]')).toBeNull();
    },
};

/** 邊界：零耗電顯示 0 kW。 */
export const ZeroSupplyPower: Story = {
    name: '邊界：零耗電',
    args: {
        power: {
            used: 0,
        },
        products: [],
        exchangeRate: 0,
        tips: [],
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('0 kW / 0 kW')).toBeVisible();
        await expect(canvas.queryByRole('spinbutton')).not.toBeInTheDocument();
    },
};

/** 多筆產能測試資料（用於驗證滾動排版） */
const overflowProductions: SingleProductDetail[] = [
    { id: 'p-1', name: '粗製紫晶', produce: 500, consume: 200, profit: 300, isExpanded: true },
    { id: 'p-2', name: '纖維原料', produce: 300, consume: 450, profit: -150, isExpanded: true },
    { id: 'p-3', name: '高純藍鐵', produce: 120, consume: 80, profit: 40, isExpanded: true },
    { id: 'p-4', name: '超導凝膠', produce: 60, consume: 120, profit: -60, isExpanded: false },
    { id: 'p-5', name: '活性催化劑', produce: 240, consume: 100, profit: 140, isExpanded: true },
    { id: 'p-6', name: '結構基板', produce: 180, consume: 180, profit: 0, isExpanded: false },
    { id: 'p-7', name: '精煉原油', produce: 600, consume: 800, profit: -200, isExpanded: true },
    { id: 'p-8', name: '特級合成樹脂', produce: 90, consume: 30, profit: 60, isExpanded: false },
    { id: 'p-9', name: '超精密電路', produce: 40, consume: 60, profit: -20, isExpanded: true },
    { id: 'p-10', name: '重合聚合物', produce: 150, consume: 90, profit: 60, isExpanded: true },
];

/** 邊界：多筆產能清單，驗證縱向隱藏式滾動與不擠壓調度券兌換效率區塊 */
export const ManyProductionsOverflow: Story = {
    name: '邊界：多筆產能滾動排版',
    args: {
        power: {
            used: 150,
        },
        products: overflowProductions,
        exchangeRate: 1250000,
        tips: sampleTips,
    },
};

/** 多筆提示與警報測試資料（用於驗證滾動排版） */
const overflowTips: SingleTip[] = [
    { type: 'error', text: '碎紙機單元*1位置重疊' },
    { type: 'warning', text: '貓毛貓範圍總sb超載' },
    { type: 'error', text: '高壓變電所負荷過高(120%)' },
    { type: 'warning', text: '主幹傳送帶物料堵塞' },
    { type: 'error', text: '水泵未連接水源管道' },
    { type: 'warning', text: '產能利用率低於 30%' },
    { type: 'error', text: '排汙管道壓力超出臨界值' },
    { type: 'warning', text: '無人機集散中心電池不足' },
];

/** 邊界：多筆警示 Tips，驗證 Attention 下半部區域縱向滾動排版 */
export const ManyTipsOverflow: Story = {
    name: '邊界：多筆警示 Tips 滾動',
    args: {
        power: {
            used: 80,
        },
        products: sampleProductions,
        exchangeRate: 34000,
        tips: overflowTips,
    },
};

/** 邊界：超長文字名稱、巨大數值與超長警示訊息排版 */
export const LongTextOverflow: Story = {
    name: '邊界：超長文字與極大數值',
    args: {
        power: {
            used: 999999,
        },
        products: [
            {
                id: 'long-1',
                name: '又想听那个故事了？真是没办法呀',
                produce: 9999999,
                consume: 8888888,
                profit: 1111111,
                isExpanded: true,
            },
        ],
        exchangeRate: 99999999999,
        tips: [
            {
                type: 'error',
                text: '茈發動前的41秒內，新宿再次響起了五條悟的吟唱。“九綱”“偏光”“烏與聲明”“表裏之間”、宿儺明白自己再也沒有任何機會阻止茈的誕生了，無限制的虛式如同核爆一般在新宿亮起沖天的光芒，魔虛羅的輪盤在茈中灰飛煙滅，廢墟之中，全力護住自己的宿儺無力的靠在殘破的建築上支持身體，他的左手和大腿都被這一擊吞噬殆盡，同樣傷痕累累的五條悟出現在宿儺面前，宿儺立刻強迫自己不再倚靠牆壁，堂堂正正站在五條悟面前，但是在咒力同源的影響下，五條悟所承受的傷害被大大削弱，在反轉術式的治療下五條悟的身體再次恢復，對五條悟來說，決定性的一擊遠距離“茈”只',
            },
        ],
    },
};
