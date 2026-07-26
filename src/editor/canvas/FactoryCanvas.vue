<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useMagicKeys } from '@vueuse/core';
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import { MiniMap } from '@vue-flow/minimap';
import { VueFlow, EdgeLabelRenderer, useVueFlow } from '@vue-flow/core';
import type { NodeMouseEvent } from '@vue-flow/core';
import type { EquipmentType, Rotation } from '@/types/editor';
import type { FactoryNode } from '@/types/graph';
import { useEditorStore } from '@/store/editorStore';
import { useSelectionStore } from '@/store/selectionStore';
import { useFlowStore } from '@/store/flowStore';
import FlowNodeOverlay from './FlowNodeOverlay.vue';

/** 自訂節點型別：覆寫 default，加入效率 overlay */
const nodeTypes = { default: FlowNodeOverlay };

const editorStore = useEditorStore();
const selectionStore = useSelectionStore();
const flowStore = useFlowStore();
const { nodes, edges, snapToGrid, activeTool, selectedEquipment, placementArmed } =
    storeToRefs(editorStore);
const { edgeFlows, congestedEdges } = storeToRefs(flowStore);
const { screenToFlowCoordinate, addNodes, edges: vfEdges } = useVueFlow();

/** 需要顯示流量標籤的管線（rate > 0 且已計算） */
const labeledEdges = computed(() => vfEdges.value.filter((e) => edgeFlows.value.has(e.id)));

/**
 * 依管線是否堵塞，回傳流量標籤要套用的顏色 class。
 * @param edgeId 管線 id
 * @returns Tailwind class 字串
 * @example
 * const cls = edgeLabelClass('edge-1')
 */
function edgeLabelClass(edgeId: string): string {
    return congestedEdges.value.has(edgeId)
        ? 'bg-orange-400/90 text-black'
        : 'bg-zinc-700/90 text-white';
}

/** 各設備類型對應的中文顯示名稱，供節點標籤與工具列共用 */
const equipmentLabelMap: Record<EquipmentType, string> = {
    smelter: '精煉爐',
    crusher: '粉碎機',
    assembler: '組裝台',
    'conveyor-node': '輸送帶節點',
    'power-node': '電力節點',
};

/** 所有合法設備類型清單，由 equipmentLabelMap 的 key 推導，供 isEquipmentType 型別守衛使用 */
const equipmentTypes = Object.keys(equipmentLabelMap) as EquipmentType[];

/**
 * VueFlow 選取範圍變化時，同步選取的節點 id 到 selectionStore。
 * @param selection VueFlow 提供的選取變化事件內容
 * @example
 * handleSelectionChange({ nodes: [{ id: 'node-1' }] })
 */
function handleSelectionChange(selection: { nodes?: Array<{ id: string }> }) {
    selectionStore.setSelection((selection.nodes ?? []).map((node) => node.id));
}

const GRID_SIZE = 20;

/** CR-01 拿起預覽中的旋轉狀態，僅存在於 placementArmed 期間，放置後隨即由 disarm 重置 */
const previewRotation = ref<Rotation>(0);

/**
 * 目前點選、可用 R 鍵旋轉的已放置設備 uid。
 *
 * 未使用 selectionStore，是因為 Vue Flow 單純點擊節點時並不會觸發 selection-change
 * （該事件僅在框選拖曳時才會發出），無法反映單點選取狀態，故改由 handleNodeClick 直接記錄。
 */
const rotateTargetUid = ref<string | null>(null);

/** 監聽鍵盤按鍵狀態，供下方 R 鍵旋轉、Esc 取消放置的 watch 讀取 */
const keys = useMagicKeys();

/** 拿起狀態結束（放置或取消）時，重置預覽旋轉為 0，避免殘留到下一次拿起 */
watch(placementArmed, (armed) => {
    if (!armed) previewRotation.value = 0;
});

/**
 * R 鍵：依序循環 0° → 90° → 180° → 270° → 0°。
 * - 拿起預覽中：旋轉 previewRotation（放置時套用）
 * - 非拿起狀態且畫布上有點選中的已放置設備：呼叫 editorStore.rotateDevice 直接旋轉該設備（自動進歷史）
 */
watch(
    () => keys.r.value,
    (pressed) => {
        if (!pressed) return;

        if (placementArmed.value) {
            previewRotation.value = ((previewRotation.value + 1) % 4) as Rotation;
            return;
        }

        if (!rotateTargetUid.value) return;
        const target = nodes.value.find((n) => n.id === rotateTargetUid.value);
        if (!target) return;
        const current = (target.data?.rotation ?? 0) as Rotation;
        editorStore.rotateDevice(target.id, ((current + 1) % 4) as Rotation);
    },
);

/** Esc 鍵：拿起預覽中按下時取消本次拿起 */
watch(
    () => keys.escape.value,
    (pressed) => {
        if (!pressed || !placementArmed.value) return;
        editorStore.disarmPlacement();
    },
);

/**
 * 依螢幕座標與設備類型，組出一個可加入畫布的 FactoryNode。
 * @param equipment 要放置的設備類型
 * @param clientX 螢幕座標 X
 * @param clientY 螢幕座標 Y
 * @returns 可直接加入 VueFlow 的節點資料
 * @example
 * const node = buildFactoryNode('smelter', 100, 200)
 */
function buildFactoryNode(equipment: EquipmentType, clientX: number, clientY: number): FactoryNode {
    const raw = screenToFlowCoordinate({ x: clientX, y: clientY });
    const position = snapToGrid.value
        ? {
              x: Math.round(raw.x / GRID_SIZE) * GRID_SIZE,
              y: Math.round(raw.y / GRID_SIZE) * GRID_SIZE,
          }
        : raw;

    return {
        id: `node-${equipment}-${Date.now()}-${Math.round(Math.random() * 10000)}`,
        type: 'default',
        position,
        data: {
            label: equipmentLabelMap[equipment],
            machineType: equipment,
            rotation: previewRotation.value,
        },
    };
}

/**
 * 依指定螢幕座標，將設備節點放置到畫布上。
 * @param equipment 要放置的設備類型
 * @param clientX 螢幕座標 X
 * @param clientY 螢幕座標 Y
 * @example
 * placeNodeAtPointer('crusher', 100, 200)
 */
function placeNodeAtPointer(equipment: EquipmentType, clientX: number, clientY: number) {
    addNodes([buildFactoryNode(equipment, clientX, clientY)]);
}

/**
 * 型別守衛：判斷字串是否為合法的 EquipmentType，用於過濾拖拉事件帶入的資料。
 * @param value 待檢查的字串
 * @returns 是否為合法設備類型
 * @example
 * if (isEquipmentType(raw)) { placeNodeAtPointer(raw, x, y) }
 */
function isEquipmentType(value: string): value is EquipmentType {
    return equipmentTypes.includes(value as EquipmentType);
}

/**
 * 畫布點擊時，若已透過工具列武裝了放置模式，則在點擊處放置設備並解除武裝。
 * @param event 滑鼠點擊事件
 * @example
 * handlePaneClick(mouseEvent)
 */
function handlePaneClick(event: MouseEvent) {
    rotateTargetUid.value = null;

    if (!placementArmed.value || activeTool.value !== 'select') {
        return;
    }

    placeNodeAtPointer(selectedEquipment.value, event.clientX, event.clientY);
    editorStore.disarmPlacement();
}

/**
 * 記錄被點擊的節點為目前 R 鍵旋轉的目標，讓 R 鍵 watch 知道要旋轉哪個已放置設備。
 * @param event VueFlow 節點點擊事件，僅取用其中的 node
 * @example
 * handleNodeClick({ node, event: mouseEvent } as NodeMouseEvent)
 */
function handleNodeClick({ node }: NodeMouseEvent) {
    rotateTargetUid.value = node.id;
}

/**
 * 處理從工具列拖拉設備到畫布放開的事件，於放開處放置對應設備。
 * @param event 拖放事件
 * @example
 * handleCanvasDrop(dragEvent)
 */
function handleCanvasDrop(event: DragEvent) {
    const droppedEquipment = event.dataTransfer?.getData('application/x-endfield-equipment') ?? '';
    if (!isEquipmentType(droppedEquipment)) {
        return;
    }

    event.preventDefault();
    placeNodeAtPointer(droppedEquipment, event.clientX, event.clientY);
    editorStore.disarmPlacement();
}
</script>

<template>
    <div class="panel h-full overflow-hidden" @dragover.prevent @drop="handleCanvasDrop">
        <VueFlow
            v-model:nodes="nodes"
            v-model:edges="edges"
            :node-types="nodeTypes"
            :fit-view-on-init="true"
            :nodes-draggable="true"
            :zoom-on-scroll="true"
            :pan-on-drag="activeTool === 'pan'"
            :selection-on-drag="activeTool === 'box-select'"
            :snap-to-grid="snapToGrid"
            :snap-grid="[20, 20]"
            class="factory-flow"
            @selection-change="handleSelectionChange"
            @node-click="handleNodeClick"
            @pane-click="handlePaneClick"
        >
            <Background variant="lines" :gap="20" :size="1" pattern-color="#3f3f46" />
            <Controls />
            <MiniMap />

            <!-- F2：管線流量速率標籤 overlay -->
            <EdgeLabelRenderer>
                <div
                    v-for="edge in labeledEdges"
                    :key="edge.id"
                    class="pointer-events-none absolute rounded px-1.5 py-0.5 text-xs font-semibold"
                    :class="edgeLabelClass(edge.id)"
                    :style="{
                        transform: `translate(-50%, -50%) translate(${(edge.sourceX + edge.targetX) / 2}px,${(edge.sourceY + edge.targetY) / 2}px)`,
                    }"
                >
                    {{ edgeFlows.get(edge.id)!.rate.toFixed(1) }}/min
                </div>
            </EdgeLabelRenderer>
        </VueFlow>
    </div>
</template>
