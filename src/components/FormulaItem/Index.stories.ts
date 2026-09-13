import type { Meta, StoryObj } from '@storybook/vue3-vite';
import FormulaItem from './Index.vue';
import defaultItemImage from './item.png';

const meta = {
    title: 'L3/FormulaItem',
    component: FormulaItem,
} satisfies Meta<typeof FormulaItem>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 一般情形：包含名稱、圖標與數量 */
export const Default: Story = {
    name: '一般物品（完整資訊）',
    args: {
        item: {
            name: '紫晶纖維',
            image: defaultItemImage,
            amount: 2,
        },
    },
};

/** 邊界：未提供自訂圖片，使用預設圖標 fallback */
export const FallbackImage: Story = {
    name: '邊界：預設圖示 fallback',
    args: {
        item: {
            name: '粗製紫晶',
            amount: 1,
        },
    },
};

/** 邊界：無數量標籤（未傳入 amount） */
export const WithoutAmount: Story = {
    name: '邊界：無數量標籤',
    args: {
        item: {
            name: '催化劑',
            image: defaultItemImage,
        },
    },
};

/** 邊界：無物品名稱（僅展示圖示與數量） */
export const WithoutName: Story = {
    name: '邊界：無物品名稱',
    args: {
        item: {
            image: defaultItemImage,
            amount: 5,
        },
    },
};

/** 邊界：僅純圖示（無名稱、無數量） */
export const IconOnly: Story = {
    name: '邊界：僅純圖示',
    args: {
        item: {
            image: defaultItemImage,
        },
    },
};
