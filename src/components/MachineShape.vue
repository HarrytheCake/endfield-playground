<script lang="ts" setup>
/**
 * MachineShape.vue
 *
 * 依照 machine.ts 中定義的 Machine 物件繪製：
 *   1. 一個實心橘色長方形，尺寸依 width / height 決定，正中央標示 id
 *   2. 當前 machineMode 的 input_ports / output_ports 以線段標示
 *      - input_ports  → 綠色
 *      - output_ports → 紅色
 *
 * 座標系採用「格子單位」乘上 unitSize（像素）換算：
 *   - 矩形左上角為 (0, 0)，右下角為 (width, height) 個格子
 *   - PortDef.side 為 0° 旋轉時的絕對方位（未處理旋轉，旋轉請在傳入前於外部套用
 *     rotatePortSide / rotatePortOffset 後再交給本元件）
 *   - PortDef.offset：
 *       left / right  → 由上往下數 (0 = 最上方格)
 *       top / bottom  → 由左往右數 (0 = 最左方格)
 */
import type { Machine, PortDef } from '@/types/machine';
import { getMachineMode } from '@/types/machine';
import { computed } from 'vue';

const props = defineProps<{
    /**
     * 機器定義；埠取自 modes（見 machineMode）
     */
    machine: Machine;
    /** 每一格代表的像素大小 */
    unitSize: number;
    /** 機器型態 id；缺省為 modes[0] */
    machineMode?: string;
}>();

/** 當前型態（埠權威來源） */
const activeMode = computed(() => getMachineMode(props.machine, props.machineMode));

/** 矩形實際寬度（像素），由格子寬度換算而來，供 SVG viewBox 與 rect 寬度共用 */
const rectWidthPx = computed(() => props.machine.width * props.unitSize);

/** 矩形實際高度（像素），由格子高度換算而來，供 SVG viewBox 與 rect 高度共用 */
const rectHeightPx = computed(() => props.machine.height * props.unitSize);

/**
 * 依 PortDef 的 side / offset 算出該 port 在矩形邊界上的線段座標（起訖點）。
 * 僅處理 0° 旋轉時的絕對方位，旋轉後的 side / offset 需由外部先套用  \
 * rotatePortSide / rotatePortOffset 換算好再傳入，本函式不處理旋轉。
 * @param port 要計算座標的 port 定義
 * @returns 該 port 的線段兩端座標與原始 side / media，供 template 畫 line 使用
 * @example
 * const { x1, y1, x2, y2 } = portLine({ side: 'top', offset: 0, media: 'belt' })
 * // x1, y1, x2, y2 為矩形上緣第 0 格的線段座標
 */
function portLine(port: PortDef) {
    const u = props.unitSize;
    const w = props.machine.width;
    const h = props.machine.height;
    let x1, y1, x2, y2;

    switch (port.side) {
        case 'top':
            x1 = port.offset * u;
            x2 = (port.offset + 1) * u;
            y1 = 0;
            y2 = 0;
            break;
        case 'bottom':
            x1 = port.offset * u;
            x2 = (port.offset + 1) * u;
            y1 = h * u;
            y2 = h * u;
            break;
        case 'left':
            x1 = 0;
            x2 = 0;
            y1 = port.offset * u;
            y2 = (port.offset + 1) * u;
            break;
        case 'right':
            x1 = w * u;
            x2 = w * u;
            y1 = port.offset * u;
            y2 = (port.offset + 1) * u;
            break;
        default:
            x1 = x2 = y1 = y2 = 0;
    }

    return { x1, y1, x2, y2, side: port.side, media: port.media };
}

/** 當前 mode 的 input_ports 線段座標 */
const inputLines = computed(() => activeMode.value.input_ports.map(portLine));

/** 當前 mode 的 output_ports 線段座標 */
const outputLines = computed(() => activeMode.value.output_ports.map(portLine));

/**
 * 顯示 id 用的字級（像素），依矩形較短邊的比例縮放，  \
 * 避免小型機器把字級撐到超出矩形，同時設下限 10px 保持可讀性。
 */
const fontSize = computed(() =>
    Math.max(10, Math.min(rectWidthPx.value, rectHeightPx.value) * 0.16),
);

/**
 * 當估算出的文字寬度超過矩形寬度的 90% 時，回傳一個壓縮後的目標寬度，  \
 * 交給 SVG `textLength` + `lengthAdjust` 自動壓字距與字寬塞進矩形；  \
 * 未超出時回傳 null，代表不需要壓縮，維持文字原始寬度。
 */
const idTextLength = computed(() => {
    const estimatedWidth = String(props.machine.id).length * fontSize.value * 0.62;
    return estimatedWidth > rectWidthPx.value * 0.9 ? rectWidthPx.value * 0.9 : null;
});
</script>

<template>
    <div class="inline-block leading-0">
        <svg
            :width="rectWidthPx"
            :height="rectHeightPx"
            :viewBox="`0 0 ${rectWidthPx} ${rectHeightPx}`"
            xmlns="http://www.w3.org/2000/svg"
        >
            <!-- 機器本體：實心橘色長方形 -->
            <rect
                x="0"
                y="0"
                :width="rectWidthPx"
                :height="rectHeightPx"
                fill="#ff8c1a"
                stroke="#b85e00"
                stroke-width="2"
            />

            <!-- 機器 id 名稱：置中顯示 -->
            <text
                :x="rectWidthPx / 2"
                :y="rectHeightPx / 2"
                text-anchor="middle"
                dominant-baseline="middle"
                :font-size="fontSize"
                :text-length="idTextLength"
                lengthAdjust="spacingAndGlyphs"
                fill="#ffffff"
                font-weight="bold"
                style="
                    paint-order: stroke;
                    stroke: #b85e00;
                    stroke-width: 3px;
                    stroke-linejoin: round;
                "
            >
                {{ machine.id }}
            </text>

            <!-- input_ports：綠色線段，長度 1 單位 -->
            <line
                v-for="(line, idx) in inputLines"
                :key="'input-' + idx"
                :x1="line.x1"
                :y1="line.y1"
                :x2="line.x2"
                :y2="line.y2"
                stroke="#22c55e"
                stroke-width="6"
                stroke-linecap="butt"
            />

            <!-- output_ports：紅色線段，長度 1 單位 -->
            <line
                v-for="(line, idx) in outputLines"
                :key="'output-' + idx"
                :x1="line.x1"
                :y1="line.y1"
                :x2="line.x2"
                :y2="line.y2"
                stroke="#ef4444"
                stroke-width="6"
                stroke-linecap="butt"
            />
        </svg>
    </div>
</template>
