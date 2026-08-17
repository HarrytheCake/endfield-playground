<script setup lang="ts">
import { computed } from 'vue';
import { Handle, Position } from '@vue-flow/core';
import type { NodeProps } from '@vue-flow/core';
import { storeToRefs } from 'pinia';
import type { FactoryNodeData } from '@/types/graph';
import type { PortDef, PortSide } from '@/types/machine';
import { useFlowStore } from '@/store/flowStore';
import { getMachine, getMachineMode } from '@/data/machines';

/** Vue Flow 傳入的節點 props，data 為本節點的 FactoryNodeData（機型 / 配方 / 旋轉） */
const props = defineProps<NodeProps<FactoryNodeData>>();

/** FlowEngine 計算結果 store，讀取本節點的效率與是否為非合法鏈路 */
const flowStore = useFlowStore();
const { nodeEfficiencies, invalidChainUids } = storeToRefs(flowStore);

/** 0~1 效率，undefined 表示尚未計算 */
const efficiency = computed(() => nodeEfficiencies.value.get(props.id));

/** 非合法鏈路 → 灰色虛線外框 */
const isInvalid = computed(() => invalidChainUids.value.has(props.id));

/** CR-01 旋轉畫面效果：rotation（0~3）換算成 CSS 旋轉角度；同一變換也順帶讓下方的 Handle 跟著轉到正確方位 */
const rotationDeg = computed(() => (props.data.rotation ?? 0) * 90);

/** 本節點對應的機器定義；找不到（機型未設定或資料缺漏）時為 undefined，不渲染任何埠 Handle */
const machine = computed(() =>
    props.data.machineType ? getMachine(props.data.machineType) : undefined,
);

/** 依 machineMode（缺省回退 modes[0]）決定的當前型態，埠定義的唯一來源 */
const activeMode = computed(() =>
    machine.value ? getMachineMode(machine.value, props.data.machineMode) : undefined,
);

/** Vue Flow Position 對照表：埠的 side 為 0° 旋轉時的絕對方位，實際旋轉交由父層 CSS transform 處理 */
const sideToPosition: Record<PortSide, Position> = {
    top: Position.Top,
    right: Position.Right,
    bottom: Position.Bottom,
    left: Position.Left,
};

/**
 * 依埠清單與其在陣列中的索引，算出每顆 Handle 的顯示位置與 id。
 * 同側有多顆埠時，沿該邊均分排列避免重疊；id 保留原始索引供 useFlowEngine 解析埠媒質。
 *
 * @param ports 埠定義清單（input_ports 或 output_ports）
 * @param idPrefix handle id 前綴，'in' 或 'out'
 * @returns 每顆 Handle 所需的 id / position / 排列樣式
 */
function layoutHandles(ports: readonly PortDef[], idPrefix: 'in' | 'out') {
    const sideCounts = new Map<PortSide, number>();
    for (const port of ports) {
        sideCounts.set(port.side, (sideCounts.get(port.side) ?? 0) + 1);
    }
    const sideSeen = new Map<PortSide, number>();
    return ports.map((port, index) => {
        const total = sideCounts.get(port.side) ?? 1;
        const seen = sideSeen.get(port.side) ?? 0;
        sideSeen.set(port.side, seen + 1);
        const percent = ((seen + 1) / (total + 1)) * 100;
        const isVertical = port.side === 'left' || port.side === 'right';
        return {
            id: `${idPrefix}-${index}`,
            position: sideToPosition[port.side],
            style: isVertical ? { top: `${percent}%` } : { left: `${percent}%` },
        };
    });
}

/** 輸入埠對應的 Handle 清單（target），空機型 / 無輸入埠時為空陣列 */
const inputHandles = computed(() =>
    activeMode.value ? layoutHandles(activeMode.value.input_ports, 'in') : [],
);

/** 輸出埠對應的 Handle 清單（source），空機型 / 無輸出埠時為空陣列 */
const outputHandles = computed(() =>
    activeMode.value ? layoutHandles(activeMode.value.output_ports, 'out') : [],
);

/**
 * 依節點效率高低回傳對應顏色 class。
 * @param eff 效率（0~1 以上，>1 表示超額供給）
 * @returns Tailwind class 字串
 * @example
 * const cls = efficiencyColorClass(0.8)
 */
function efficiencyColorClass(eff: number): string {
    if (eff >= 1) return 'text-green-500';
    if (eff >= 0.5) return 'text-yellow-400';
    if (eff > 0) return 'text-orange-400';
    return 'text-gray-400';
}
</script>

<template>
    <div
        class="relative min-w-25 rounded border bg-zinc-800 px-3 py-2 text-sm text-white"
        :class="isInvalid ? 'border-dashed border-gray-500 opacity-50' : 'border-zinc-600'"
        :style="{ transform: `rotate(${rotationDeg}deg)` }"
    >
        <!-- 輸入埠 Handle：依 machine.modes[].input_ports 動態產生，id 為 in-{埠索引} -->
        <Handle
            v-for="handle in inputHandles"
            :key="handle.id"
            :id="handle.id"
            type="target"
            :position="handle.position"
            :style="handle.style"
        />

        <!-- 節點標籤 -->
        <div class="leading-tight font-medium">
            {{ data.label }}
        </div>

        <!-- 效率標示（合法節點且已計算） -->
        <div
            v-if="efficiency !== undefined && !isInvalid"
            class="mt-0.5 text-xs font-bold"
            :class="efficiencyColorClass(efficiency)"
        >
            {{ Math.round(efficiency * 100) }}%
        </div>

        <!-- 非合法鏈路提示 -->
        <div v-if="isInvalid" class="mt-0.5 text-xs text-gray-500">非法</div>

        <!-- 輸出埠 Handle：依 machine.modes[].output_ports 動態產生，id 為 out-{埠索引} -->
        <Handle
            v-for="handle in outputHandles"
            :key="handle.id"
            :id="handle.id"
            type="source"
            :position="handle.position"
            :style="handle.style"
        />
    </div>
</template>
