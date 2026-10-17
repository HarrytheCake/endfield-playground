import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import ToolbarPanel from './ToolbarPanel.vue';
import { usePlacementIntent } from './usePlacementIntent';

/**
 * ToolbarPanel 的視角分頁是受控的：選取狀態由 `selectedView` prop 決定，點擊只 emit `view-click`。
 * 機器卡片的選取則來自共用的落子意圖（`usePlacementIntent`），點卡片會直接武裝／取消。
 * 元件以 absolute 貼齊容器底緣，故以固定尺寸的 relative 外框承載。
 */
const meta = {
    title: 'L3/Editor/ToolbarPanel',
    component: ToolbarPanel,
    decorators: [
        () => ({
            template: '<div class="relative h-[320px] w-[1280px] bg-zinc-900"><story /></div>',
        }),
    ],
    args: {
        /** 將視角點擊印到 Console，方便在 Storybook 觀察事件 */
        'onView-click': (viewId: string) => {
            console.log('[ToolbarPanel] view-click:', viewId);
        },
    },
} satisfies Meta<typeof ToolbarPanel>;

export default meta;

/** ToolbarPanel Story 型別 */
type Story = StoryObj<typeof meta>;

/** 預設狀態：面板展開、佈局視角、尚未拿起任何機器 */
export const Default: Story = {
    name: '預設：未選取機器（佈局視角）',
    args: { selectedView: 'layout' },
    render: (args: Record<string, unknown>) => ({
        components: { ToolbarPanel },
        setup() {
            usePlacementIntent().disarm();
            return { args };
        },
        template: '<ToolbarPanel v-bind="args" />',
    }),
};

/** 已拿起機器：卡片應顯示選取樣式（深色底＋黃線光暈） */
export const Selected: Story = {
    name: '已選取機器（流程視角）',
    args: { selectedView: 'process' },
    render: (args: Record<string, unknown>) => ({
        components: { ToolbarPanel },
        setup() {
            const intent = usePlacementIntent();
            intent.disarm();
            intent.arm('shaping_machine');
            return { args };
        },
        template: '<ToolbarPanel v-bind="args" />',
    }),
};

/** 互動示範：外層以本地 ref 接住 `view-click`，點視角分頁時按鈕背景應立即切換 */
export const Interactive: Story = {
    name: '互動：切換視角（模擬父元件）',
    args: { selectedView: 'layout' },
    render: (args: Record<string, unknown>) => ({
        components: { ToolbarPanel },
        setup() {
            usePlacementIntent().disarm();
            /** 模擬父層持有的目前視角 */
            const currentView = ref((args.selectedView as string | null) ?? 'layout');

            /**
             * 接住視角點擊並更新本地視角。
             * @param viewId 被點擊的視角
             */
            function handleViewClick(viewId: string) {
                currentView.value = viewId;
                (args['onView-click'] as (id: string) => void)?.(viewId);
            }

            return { currentView, handleViewClick };
        },
        template: '<ToolbarPanel :selected-view="currentView" @view-click="handleViewClick" />',
    }),
};
