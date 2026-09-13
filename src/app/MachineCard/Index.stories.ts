import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MachineCard from './Index.vue';
import type { Formula } from './types';
import defaultItemImage from '@/components/FormulaItem/item.png';

const meta = {
    title: 'L3/MachineCard',
    component: MachineCard,
} satisfies Meta<typeof MachineCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleFormula: Formula = {
    duration: 15,
    input: [
        { name: '粗製紫晶', image: defaultItemImage, amount: 2 },
        { name: '纖維原料', image: defaultItemImage, amount: 1 },
    ],
    output: [{ name: '紫晶纖維', image: defaultItemImage, amount: 1 }],
};

/** 一般情形：展示完整欄位與代表性配方 */
export const Default: Story = {
    name: '一般機器（裝配機）',
    args: {
        id: 'assembler',
        name: '裝配機',
        sizeText: '3×3',
        power: '10kW',
        selectedRecipe: '紫晶纖維(15s)',
        formulas: [sampleFormula],
    },
};

/** 邊界：僅傳入必備 props（id, name, sizeText），其餘欄位採用預設 fallback */
export const MinimalProps: Story = {
    name: '邊界：最小必備 props',
    args: {
        id: 'shaping_machine',
        name: '塑型機',
        sizeText: '2×2',
    },
};

const overflowFormula: Formula = {
    duration: 20,
    input: [
        { name: '粗製紫晶', image: defaultItemImage, amount: 2 },
        { name: '纖維原料', image: defaultItemImage, amount: 1 },
        { name: '高純藍鐵', image: defaultItemImage, amount: 3 },
        { name: '超導凝膠', image: defaultItemImage, amount: 4 },
        { name: '精煉原油', image: defaultItemImage, amount: 2 },
    ],
    output: [
        { name: '紫晶纖維', image: defaultItemImage, amount: 1 },
        { name: '結構基板', image: defaultItemImage, amount: 2 },
        { name: '活性催化劑', image: defaultItemImage, amount: 1 },
    ],
};

/** 邊界：多輸入輸出與多筆配方，驗證橫向與縱向滾動排版 */
export const LongFormulaOverflow: Story = {
    name: '邊界：超長配方與多配方滾動',
    args: {
        id: 'refinery',
        name: '精煉爐',
        sizeText: '3×3',
        power: '25kW',
        selectedRecipe: '結構基板(20s)',
        formulas: [
            overflowFormula,
            overflowFormula,
            overflowFormula,
            overflowFormula,
            overflowFormula,
        ],
    },
};
