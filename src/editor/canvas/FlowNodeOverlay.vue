<script setup lang="ts">
import { computed, nextTick, watch } from 'vue';
import { Handle, Position, useVueFlow } from '@vue-flow/core';
import type { NodeProps } from '@vue-flow/core';
import { storeToRefs } from 'pinia';
import type { FactoryNodeData } from '@/types/graph';
import type { PortDef, PortSide } from '@/types/machine';
import { useFlowStore } from '@/store/flowStore';
import { useCanvasStore } from '@/store/canvasStore';
import { getMachine, getMachineMode } from '@/data/machines';
import { rotatePortSide } from '@/utils/portUtils';

/** Vue Flow 傳入的節點 props，data 為本節點的 FactoryNodeData（機型 / 配方 / 旋轉） */
const props = defineProps<NodeProps<FactoryNodeData>>();

/** FlowEngine 計算結果 store，讀取本節點的效率與是否為非合法鏈路 */
const flowStore = useFlowStore();
const { nodeEfficiencies, invalidChainUids } = storeToRefs(flowStore);

/** 畫布視圖狀態 store：格線像素大小，供節點外框佔格尺寸換算使用 */
const canvasStore = useCanvasStore();
const { gridSize } = storeToRefs(canvasStore);

/** 0~1 效率，undefined 表示尚未計算 */
const efficiency = computed(() => nodeEfficiencies.value.get(props.id));

/** 非合法鏈路 → 灰色虛線外框 */
const isInvalid = computed(() => invalidChainUids.value.has(props.id));

/** 目前旋轉步數（0~3），埠邊換算的唯一依據 */
const rotation = computed(() => (props.data.rotation ?? 0) as 0 | 1 | 2 | 3);

/**
 * CR-01 旋轉畫面效果：rotation（0~3）換算成 CSS 旋轉角度，套在根節點上。  \
 * 這個 CSS transform 是「機器視覺方塊會轉」的唯一依據
 * （toby 的 W0823-T1 footprint 尺寸也建立在這個 transform 繼續存在的假設上，
 * 見 `docs/work_dispatch/toby/GUIDE_node_footprint_notes.md` §1），**不得移除**。
 */
const rotationDeg = computed(() => rotation.value * 90);

/**
 * 旋轉變化時強制 Vue Flow 重新量測本節點的 Handle 幾何位置。
 *
 * CSS `transform: rotate()` 不會改變元素的版面尺寸（layout box），Vue Flow 內建的
 * `ResizeObserver` 只在版面尺寸變動時才會重新量測 Handle 座標並更新連線端點——
 * 純旋轉不會觸發它。若不手動呼叫 `updateNodeInternals`，連線會停在旋轉前的
 * 座標，看起來像是「管線沒有跟著埠一起轉」。`nextTick` 確保量測發生在
 * `rotationDeg` 的新 CSS 值真的套用到 DOM 之後。
 */
const { updateNodeInternals } = useVueFlow();
watch(rotation, () => {
    nextTick(() => updateNodeInternals([props.id]));
});

/** 本節點對應的機器定義；找不到（機型未設定或資料缺漏）時為 undefined，不渲染任何埠 Handle */
const machine = computed(() =>
    props.data.machineType ? getMachine(props.data.machineType) : undefined,
);

/** 依 machineMode（缺省回退 modes[0]）決定的當前型態，埠定義的唯一來源 */
const activeMode = computed(() =>
    machine.value ? getMachineMode(machine.value, props.data.machineMode) : undefined,
);

/**
 * 節點外框像素尺寸：機器原始 width／height × gridSize。  \
 * 找不到機型時（機型未設定或資料缺漏）不設定尺寸，退回瀏覽器依內容自動撐開。  \
 * 永遠用原始（未依 rotation 交換）尺寸——旋轉後的視覺寬高互換已由 `rootStyle`
 * 的 `transform: rotate()` 處理，這裡若也交換等於交換兩次，會轉回錯的方向
 * （見 `docs/work_dispatch/toby/GUIDE_node_footprint_notes.md` §1）。
 */
const footprintStyle = computed(() => {
    if (!machine.value) return {};
    return {
        width: `${machine.value.width * gridSize.value}px`,
        height: `${machine.value.height * gridSize.value}px`,
    };
});

/** 根節點合併後的 style：外框佔格尺寸 + 既有的旋轉 transform，避免兩個 :style 互踩 */
const rootStyle = computed(() => ({
    ...footprintStyle.value,
    transform: `rotate(${rotationDeg.value}deg)`,
}));

/** Vue Flow Position 對照表：key 為旋轉換算後的方位，只餵給 `<Handle position>` 做連線方向判斷用 */
const sideToPosition: Record<PortSide, Position> = {
    top: Position.Top,
    right: Position.Right,
    bottom: Position.Bottom,
    left: Position.Left,
};

/**
 * 複製 Vue Flow 內建 `.vue-flow__handle-{side}` class 的絕對定位樣式，
 * 但鍵在**未旋轉的原始 side**上（而非 `<Handle position>` 傳入的旋轉後 side），
 * 且沿邊座標改用 `port.offset` 對到的實際格子中心點（像素），不再是同側埠數量的均分百分比。
 *
 * 背景：根節點仍套用 `transform: rotate(${rotationDeg}deg)`（見上方 `rotationDeg`，
 * 不可移除），會把整張卡片（含 Handle）一起轉到正確的畫面位置——這部分視覺表現
 * 本來就是對的。真正的問題只在於 `<Handle :position>` 這個 prop 同時也是 Vue Flow
 * 判斷「連線曲線該往哪個方向出去」的依據；若餵它未旋轉的 side，方向會算錯。
 *
 * 但只要一改用旋轉後的 side 當 `position`，Vue Flow 就會套用該 side 對應的
 * 內建 class（例如 `.vue-flow__handle-right` 會自帶 `right: 0`），這組樣式是
 * 用「未旋轉的座標系」算的錨點，如果再疊加父層的旋轉 transform 就等於轉了兩次，
 * 位置會跑掉。因此這裡完全手動複製四個方位各自的定位樣式，用**原始 side** 決定
 * 視覺座標（維持既有、已經正確的視覺表現，交給父層 transform 帶去正確的最終方位），
 * 藉此徹底蓋掉 Vue Flow 依旋轉後 `position` 值自動套用的 class 樣式。
 *
 * 沿邊座標算法與 `MachineShape.vue` 的 `portLine()` 一致：`offset` 是「該埠在第幾格」
 * （top／bottom 由左往右數，left／right 由上往下數，0 為第一格），乘上 `gridSize`
 * 取得該格左上角像素，加 0.5 格取中心點——W0823-T1 footprint 尺寸讓方塊已是真實
 * `machine.width/height × gridSize`，這裡才有意義用像素而非百分比對齊格子中心。
 *
 * @param port 要算樣式的埠定義（含原始 side／offset）
 * @param gridSize 格線像素大小
 */
function visualStyleForOriginalSide(
    port: PortDef,
    gridSize: number,
): Record<'top' | 'left' | 'right' | 'bottom' | 'transform', string> {
    const base = { top: 'auto', left: 'auto', right: 'auto', bottom: 'auto' };
    const center = `${(port.offset + 0.5) * gridSize}px`;
    switch (port.side) {
        case 'top':
            return { ...base, top: '0', left: center, transform: 'translate(-50%, -50%)' };
        case 'bottom':
            return { ...base, bottom: '0', left: center, transform: 'translate(-50%, 50%)' };
        case 'left':
            return { ...base, left: '0', top: center, transform: 'translate(-50%, -50%)' };
        case 'right':
            return { ...base, right: '0', top: center, transform: 'translate(50%, -50%)' };
    }
}

/**
 * 依埠清單與其在陣列中的索引，算出每顆 Handle 的顯示位置與 id。
 *
 * `position` prop 用 `rotatePortSide` 換算後的方位，只給 Vue Flow 判斷連線方向；
 * 實際視覺座標（`style`）維持用**原始未旋轉的 side／offset** 計算，兩者刻意不同，
 * 原因見 `visualStyleForOriginalSide` 的說明。id 保留原始索引供 useFlowEngine 解析埠媒質。
 *
 * @param ports 埠定義清單（input_ports 或 output_ports）
 * @param idPrefix handle id 前綴，'in' 或 'out'
 * @returns 每顆 Handle 所需的 id / position / 排列樣式
 */
function layoutHandles(ports: readonly PortDef[], idPrefix: 'in' | 'out') {
    return ports.map((port, index) => ({
        id: `${idPrefix}-${index}`,
        position: sideToPosition[rotatePortSide(port.side, rotation.value)],
        style: visualStyleForOriginalSide(port, gridSize.value),
    }));
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
        class="relative rounded border bg-zinc-800 px-3 py-2 text-sm text-white"
        :class="isInvalid ? 'border-dashed border-gray-500 opacity-50' : 'border-zinc-600'"
        :style="rootStyle"
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
