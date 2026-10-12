import type { Meta, StoryObj } from '@storybook/vue3-vite';
import WarningIcon from './Index.vue';

const meta = {
    title: 'L3/WarningIcon',
    component: WarningIcon,
} satisfies Meta<typeof WarningIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Yellow: Story = {
    args: {
        size: 28,
    },
};

export const Cyan: Story = {
    args: {
        size: 28,
        color: 'cyan',
    },
};
