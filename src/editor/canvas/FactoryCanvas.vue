<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import { MiniMap } from '@vue-flow/minimap';
import { VueFlow, EdgeLabelRenderer, useVueFlow } from '@vue-flow/core';
import type { EquipmentType } from '@/types/editor';
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

function edgeLabelClass(edgeId: string): string {
    return congestedEdges.value.has(edgeId)
        ? 'bg-orange-400/90 text-black'
        : 'bg-zinc-700/90 text-white';
}

const equipmentLabelMap: Record<EquipmentType, string> = {
    smelter: '精煉爐',
    crusher: '粉碎機',
    assembler: '組裝台',
    'conveyor-node': '輸送帶節點',
    'power-node': '電力節點',
};
const equipmentTypes = Object.keys(equipmentLabelMap) as EquipmentType[];

function handleSelectionChange(selection: { nodes?: Array<{ id: string }> }) {
    selectionStore.setSelection((selection.nodes ?? []).map((node) => node.id));
}

function buildFactoryNode(equipment: EquipmentType, clientX: number, clientY: number): FactoryNode {
    const position = screenToFlowCoordinate({ x: clientX, y: clientY });

    return {
        id: `node-${equipment}-${Date.now()}-${Math.round(Math.random() * 10000)}`,
        type: 'default',
        position,
        data: {
            label: equipmentLabelMap[equipment],
            machineType: equipment,
        },
    };
}

function placeNodeAtPointer(equipment: EquipmentType, clientX: number, clientY: number) {
    addNodes([buildFactoryNode(equipment, clientX, clientY)]);
}

function isEquipmentType(value: string): value is EquipmentType {
    return equipmentTypes.includes(value as EquipmentType);
}

function handlePaneClick(event: MouseEvent) {
    if (!placementArmed.value || activeTool.value !== 'select') {
        return;
    }

    placeNodeAtPointer(selectedEquipment.value, event.clientX, event.clientY);
    editorStore.disarmPlacement();
}

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
            class="factory-flow"
            @selection-change="handleSelectionChange"
            @pane-click="handlePaneClick"
        >
            <Background :size="1.2" pattern-color="#3f3f46" />
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
