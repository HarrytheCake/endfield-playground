import { computed, ref, shallowRef } from 'vue';
import { defineStore } from 'pinia';
import type { FactoryEdge, FactoryNode } from '@/types/graph';
import type { EquipmentType, ToolMode } from '@/types/editor';

const mockNodes: FactoryNode[] = [
    // ── 鏈路 1：物品輸出口(源礦) → 粉碎機(源石粉末) → 物品輸入口（H1 情境）
    {
        id: 'src-1',
        type: 'default',
        position: { x: 150, y: 150 },
        data: { label: '物品輸出口', machineType: '物品輸出口' },
    },
    {
        id: 'crusher-1',
        type: 'default',
        position: { x: 420, y: 150 },
        data: { label: '粉碎機', machineType: '粉碎機' },
    },
    {
        id: 'sink-1',
        type: 'default',
        position: { x: 700, y: 150 },
        data: { label: '物品輸入口', machineType: '物品輸入口' },
    },
    // ── 孤立節點（H4 情境：無連線，應顯示灰色虛線外框）
    {
        id: 'orphan-1',
        type: 'default',
        position: { x: 420, y: 400 },
        data: { label: '粉碎機（孤立）', machineType: '粉碎機' },
    },
];

const mockEdges: FactoryEdge[] = [
    { id: 'e-src-crusher', source: 'src-1', target: 'crusher-1', animated: true },
    { id: 'e-crusher-sink', source: 'crusher-1', target: 'sink-1', animated: true },
];

export const useEditorStore = defineStore('editor', () => {
    const nodes = shallowRef<FactoryNode[]>(mockNodes);
    const edges = shallowRef<FactoryEdge[]>(mockEdges);
    const mapWidth = ref(256);
    const mapHeight = ref(256);
    const snapToGrid = ref(true);
    const activeTool = ref<ToolMode>('select');
    const selectedEquipment = ref<EquipmentType>('smelter');
    const placementArmed = ref(false);

    const machineCount = computed(() => nodes.value.length);
    const nodeCount = computed(() => nodes.value.length);
    const edgeCount = computed(() => edges.value.length);

    function setMapSize(width: number, height: number) {
        mapWidth.value = Math.max(64, width);
        mapHeight.value = Math.max(64, height);
    }

    function setSnapToGrid(enabled: boolean) {
        snapToGrid.value = enabled;
    }

    function setActiveTool(tool: ToolMode) {
        activeTool.value = tool;
        if (tool !== 'select') {
            placementArmed.value = false;
        }
    }

    function setSelectedEquipment(equipment: EquipmentType) {
        selectedEquipment.value = equipment;
    }

    function armPlacement(equipment: EquipmentType) {
        selectedEquipment.value = equipment;
        placementArmed.value = true;
    }

    function disarmPlacement() {
        placementArmed.value = false;
    }

    function resetCanvas() {
        nodes.value = structuredClone(mockNodes);
        edges.value = structuredClone(mockEdges);
    }

    return {
        nodes,
        edges,
        mapWidth,
        mapHeight,
        snapToGrid,
        activeTool,
        selectedEquipment,
        placementArmed,
        machineCount,
        nodeCount,
        edgeCount,
        setMapSize,
        setSnapToGrid,
        setActiveTool,
        setSelectedEquipment,
        armPlacement,
        disarmPlacement,
        resetCanvas,
    };
});
