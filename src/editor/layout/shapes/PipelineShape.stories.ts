import type { Meta, StoryObj } from '@storybook/vue3-vite';
import type { Position } from '@/types/euclideanSpace';
import PipelineShape from './PipelineShape.vue';

/** 以 z = 0 建立格座標，縮短 fixture 寫法 */
const p = (x: number, y: number): Position => ({ x, y, z: 0 });

/**
 * 管線畫布樣式：把轉角點展開成逐格素材（直線／彎道），再依行進方向旋轉或翻轉。
 *
 * 元件根元素是 `<g>`，須放在 `<svg>` 內；此處的 decorator 補上畫布底色與格線。
 * 格子展開由 `pipelineGeometry` 處理，元件只負責畫。
 */
const meta = {
    title: 'L3/Layout/PipelineShape',
    component: PipelineShape,
    decorators: [
        (story) => ({
            components: { story },
            template: `
                <svg width="420" height="280" style="background:#1f1f1f">
                    <defs>
                        <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
                            <path d="M 28 0 L 0 0 0 28" fill="none" stroke="#3a3a3a" stroke-width="1" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                    <story />
                </svg>`,
        }),
    ],
    args: { cellSize: 28 },
} satisfies Meta<typeof PipelineShape>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 傳送帶：直線，由左向右 */
export const BeltStraight: Story = {
    name: '傳送帶｜直線',
    args: { kind: 'belt', waypoints: [p(1, 2), p(8, 2)] },
};

/** 傳送帶：一個轉角 */
export const BeltOneCorner: Story = {
    name: '傳送帶｜一個轉角',
    args: { kind: 'belt', waypoints: [p(1, 1), p(8, 1), p(8, 6)] },
};

/** 傳送帶：兩個轉角（先右轉再左轉，兩種彎向都出現） */
export const BeltTwoCorners: Story = {
    name: '傳送帶｜兩個轉角',
    args: { kind: 'belt', waypoints: [p(1, 1), p(6, 1), p(6, 6), p(12, 6)] },
};

/** 水管：直線，由下向上 */
export const PipeStraight: Story = {
    name: '水管｜直線',
    args: { kind: 'pipe', waypoints: [p(3, 8), p(3, 1)] },
};

/** 水管：一個轉角 */
export const PipeOneCorner: Story = {
    name: '水管｜一個轉角',
    args: { kind: 'pipe', waypoints: [p(1, 7), p(1, 2), p(8, 2)] },
};

/** 水管：兩個轉角 */
export const PipeTwoCorners: Story = {
    name: '水管｜兩個轉角',
    args: { kind: 'pipe', waypoints: [p(1, 1), p(1, 6), p(7, 6), p(7, 2)] },
};

/** 同一條路徑繞一圈，檢查四個方向的彎道旋轉與翻轉 */
export const BeltLoop: Story = {
    name: '傳送帶｜繞一圈',
    args: { kind: 'belt', waypoints: [p(2, 2), p(9, 2), p(9, 7), p(2, 7), p(2, 3)] },
};

/** 斜線不是合法路徑，什麼都不畫 */
export const NotAxisAligned: Story = {
    name: '非軸對齊（不畫）',
    args: { kind: 'belt', waypoints: [p(1, 1), p(5, 4)] },
};
