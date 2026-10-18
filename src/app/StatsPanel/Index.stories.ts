import type { Meta, StoryObj } from '@storybook/vue3-vite';
import TestStatsPanel from './Index.vue';
import type { SingleProductDetail, SingleTip } from './types.ts';

/** 產線總覽統計面板（StatsPanel）Storybook Meta 設定 */
const meta = {
    title: 'L3/StatsPanel',
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

/** 邊界：不傳入 props，驗證無資料時不使用 placeholder，乾淨呈現（或使用子元件預設值） */
export const MinimalProps: Story = {
    name: '邊界：最小 props (無資料狀態)',
    args: {},
};

/** 邊界：電力過載（耗電量大於供電量，進度條滿格不超界） */
export const OverloadPower: Story = {
    name: '邊界：電力過載',
    args: {
        power: {
            used: 350,
            total: 180,
            percent: 100,
        },
        products: sampleProductions,
        exchangeRate: 50000,
        tips: [
            {
                type: 'error',
                text: '電網負載超載，請儘速擴建發電機',
            },
        ],
    },
};

/** 邊界：零供電零耗電狀態（驗證除以零保護） */
export const ZeroSupplyPower: Story = {
    name: '邊界：零供電零耗電',
    args: {
        power: {
            used: 0,
            total: 0,
            percent: 0,
        },
        products: [],
        exchangeRate: 0,
        tips: [],
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
            total: 200,
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
            total: 120,
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
            total: 1200000,
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
