<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import { MiniMap } from '@vue-flow/minimap';
import { VueFlow, useVueFlow } from '@vue-flow/core';
import type { EquipmentType } from '@/types/editor';
import type { FactoryNode } from '@/types/graph';
import { useEditorStore } from '@/store/editorStore';
import { useSelectionStore } from '@/store/selectionStore';

const editorStore = useEditorStore();
const selectionStore = useSelectionStore();
const { nodes, edges, snapToGrid, activeTool, selectedEquipment, placementArmed } =
    storeToRefs(editorStore);
const { screenToFlowCoordinate, addNodes } = useVueFlow();

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

const GRID_SIZE = 20;

function buildFactoryNode(equipment: EquipmentType, clientX: number, clientY: number): FactoryNode {
    const raw = screenToFlowCoordinate({ x: clientX, y: clientY });
    const position = snapToGrid.value
        ? { x: Math.round(raw.x / GRID_SIZE) * GRID_SIZE, y: Math.round(raw.y / GRID_SIZE) * GRID_SIZE }
        : raw;

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
            :fit-view-on-init="true"
            :nodes-draggable="true"
            :zoom-on-scroll="true"
            :pan-on-drag="activeTool === 'pan'"
            :selection-on-drag="activeTool === 'box-select'"
            :snap-to-grid="snapToGrid"
            :snap-grid="[20, 20]"
            class="factory-flow"
            @selection-change="handleSelectionChange"
            @pane-click="handlePaneClick"
        >
            <Background variant="lines" :gap="20" :size="1" pattern-color="#3f3f46" />
            <Controls />
            <MiniMap />
        </VueFlow>
    </div>
</template>
