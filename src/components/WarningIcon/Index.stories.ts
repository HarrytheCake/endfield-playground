import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import WarningIcon from './Index.vue';

/** 警告圖示元件的 Storybook 設定。 */
const meta = {
    title: 'L3/WarningIcon',
    component: WarningIcon,
} satisfies Meta<typeof WarningIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 展示預設黃色的警告圖示。 */
export const Yellow: Story = {
    args: {
        size: 28,
    },
};

/** 展示青色的警告圖示。 */
export const Cyan: Story = {
    args: {
        size: 28,
        color: 'cyan',
    },
};

/** 展示圖示在 SVG 畫布中的指定位置。 */
export const PositionedInSvg: Story = {
    args: {
        size: 28,
        x: 40,
        y: 30,
    },
    render: (args) => ({
        components: { WarningIcon },
        setup() {
            return { args };
        },
        template: `
            <svg width="160" height="100" viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg">
                <rect width="160" height="100" fill="#1f2937" />
                <WarningIcon v-bind="args" />
            </svg>
        `,
    }),
};

/** 按下圖示以切換傳送帶故障與管線故障的顏色。 */
export const PressToToggleFaultType: Story = {
    args: {
        size: 28,
        x: 40,
        y: 30,
    },
    render: (args) => ({
        components: { WarningIcon },
        setup() {
            const color = ref<'yellow' | 'cyan'>('yellow');
            const toggleFaultType = () => {
                color.value = color.value === 'yellow' ? 'cyan' : 'yellow';
            };

            return { args, color, toggleFaultType };
        },
        template: `
            <svg width="160" height="100" viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg">
                <rect width="160" height="100" fill="#1f2937" />
                <g @click="toggleFaultType" style="cursor: pointer">
                    <WarningIcon v-bind="args" :color="color" />
                </g>
            </svg>
        `,
    }),
};
