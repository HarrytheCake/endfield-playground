import { computed, ref, shallowRef } from 'vue';
import { defineStore } from 'pinia';
import type { FactoryEdge, FactoryNode } from '@/types/graph';
import type { EquipmentType, ToolMode } from '@/types/editor';
import { plans } from '@/data/plans';
import type { Plan } from '@/types/plan';

const mockNodes: FactoryNode[] = [
    // ═══════════════════════════════════════════════════════════════════
    // 鏈路 A：赤銅零件（武陵 2-step，預期效率 100%）
    //   赤銅礦 + 清水 → 精煉爐 → 赤銅塊(+汙水) → 配件機 → 赤銅零件
    // ═══════════════════════════════════════════════════════════════════
    {
        id: 'src-Cu-A',
        type: 'default',
        position: { x: 80, y: 100 },
        data: { label: '物品輸出口（赤銅礦）', machineType: '物品輸出口', recipeIndex: 2 },
    },
    {
        id: 'src-H2O-A',
        type: 'default',
        position: { x: 80, y: 300 },
        data: { label: '物品輸出口（清水）', machineType: '物品輸出口', recipeIndex: 3 },
    },
    {
        id: 'furnace-A',
        type: 'default',
        position: { x: 380, y: 200 },
        data: { label: '精煉爐', machineType: '精煉爐', recipeIndex: 2 },
    },
    {
        id: 'parts-A',
        type: 'default',
        position: { x: 680, y: 200 },
        data: { label: '配件機', machineType: '配件機', recipeIndex: 0 },
    },
    {
        id: 'sink-Cu-part',
        type: 'default',
        position: { x: 980, y: 200 },
        data: { label: '物品輸入口（赤銅零件）', machineType: '物品輸入口' },
    },
    {
        id: 'sink-sewage-A',
        type: 'default',
        position: { x: 680, y: 40 },
        data: { label: '物品輸入口（汙水）', machineType: '物品輸入口' },
    },
    // ═══════════════════════════════════════════════════════════════════
    // 鏈路 B：赫銅零件（武陵 5-step，提純機 4:1 瓶頸 → 25% 效率）
    //   赤銅礦 → 粉碎機 → 赤銅粉末 ┐
    //   沉積酸 ─────────────────────┤→ 反應池A → 赤銅溶液 → 提純機 → 赫銅溶液
    //   藍鐵礦 → 粉碎機 → 藍鐵粉末 ┐                                   ↓
    //                               └──────────────────────→ 反應池B → 赫銅塊 → 配件機 → 赫銅零件
    // ═══════════════════════════════════════════════════════════════════
    {
        id: 'src-Cu-B',
        type: 'default',
        position: { x: 80, y: 480 },
        data: { label: '物品輸出口（赤銅礦）', machineType: '物品輸出口', recipeIndex: 2 },
    },
    {
        id: 'crusher-B1',
        type: 'default',
        position: { x: 380, y: 480 },
        data: { label: '粉碎機（赤銅粉末）', machineType: '粉碎機', recipeIndex: 3 },
    },
    {
        id: 'src-Acid',
        type: 'default',
        position: { x: 80, y: 660 },
        data: { label: '物品輸出口（沉積酸）', machineType: '物品輸出口', recipeIndex: 4 },
    },
    {
        id: 'react-A',
        type: 'default',
        position: { x: 680, y: 570 },
        data: { label: '反應池（赤銅溶液）', machineType: '反應池', recipeIndex: 0 },
    },
    {
        id: 'purifier',
        type: 'default',
        position: { x: 980, y: 570 },
        data: { label: '提純機', machineType: '提純機', recipeIndex: 0 },
    },
    {
        id: 'src-BF-B',
        type: 'default',
        position: { x: 80, y: 840 },
        data: { label: '物品輸出口（藍鐵礦）', machineType: '物品輸出口', recipeIndex: 1 },
    },
    {
        id: 'crusher-B2',
        type: 'default',
        position: { x: 380, y: 840 },
        data: { label: '粉碎機（藍鐵粉末）', machineType: '粉碎機', recipeIndex: 1 },
    },
    {
        id: 'react-B',
        type: 'default',
        position: { x: 1280, y: 700 },
        data: { label: '反應池（赫銅塊）', machineType: '反應池', recipeIndex: 1 },
    },
    {
        id: 'parts-B',
        type: 'default',
        position: { x: 1580, y: 700 },
        data: { label: '配件機（赫銅零件）', machineType: '配件機', recipeIndex: 1 },
    },
    {
        id: 'sink-HC-part',
        type: 'default',
        position: { x: 1880, y: 700 },
        data: { label: '物品輸入口（赫銅零件）', machineType: '物品輸入口' },
    },
    {
        id: 'sink-sewage-B',
        type: 'default',
        position: { x: 1580, y: 880 },
        data: { label: '物品輸入口（汙水）', machineType: '物品輸入口' },
    },
    // ═══════════════════════════════════════════════════════════════════
    // 孤立節點（無連線 → 應顯示灰色虛線外框 + "非法"）
    // ═══════════════════════════════════════════════════════════════════
    {
        id: 'orphan-1',
        type: 'default',
        position: { x: 1880, y: 480 },
        data: { label: '反應池（孤立）', machineType: '反應池', recipeIndex: 0 },
    },
];

const mockEdges: FactoryEdge[] = [
    // ── 鏈路 A ──────────────────────────────────────────────────────────
    { id: 'e-CuA-furnaceA', source: 'src-Cu-A', target: 'furnace-A', animated: true },
    { id: 'e-H2OA-furnaceA', source: 'src-H2O-A', target: 'furnace-A', animated: true },
    // 精煉爐雙輸出：赤銅塊 edge 必須在汙水 edge 之前（影響品項配對順序）
    { id: 'e-furnaceA-partsA', source: 'furnace-A', target: 'parts-A', animated: true },
    { id: 'e-furnaceA-sewageA', source: 'furnace-A', target: 'sink-sewage-A', animated: true },
    { id: 'e-partsA-sinkCu', source: 'parts-A', target: 'sink-Cu-part', animated: true },
    // ── 鏈路 B ──────────────────────────────────────────────────────────
    { id: 'e-CuB-cB1', source: 'src-Cu-B', target: 'crusher-B1', animated: true },
    { id: 'e-cB1-reactA', source: 'crusher-B1', target: 'react-A', animated: true },
    { id: 'e-Acid-reactA', source: 'src-Acid', target: 'react-A', animated: true },
    { id: 'e-reactA-purifier', source: 'react-A', target: 'purifier', animated: true },
    // 提純機 → 反應池B（赫銅溶液）
    { id: 'e-purifier-reactB', source: 'purifier', target: 'react-B', animated: true },
    { id: 'e-BFB-cB2', source: 'src-BF-B', target: 'crusher-B2', animated: true },
    { id: 'e-cB2-reactB', source: 'crusher-B2', target: 'react-B', animated: true },
    // 反應池B 雙輸出：赫銅塊 edge 必須在汙水 edge 之前
    { id: 'e-reactB-partsB', source: 'react-B', target: 'parts-B', animated: true },
    { id: 'e-reactB-sewageB', source: 'react-B', target: 'sink-sewage-B', animated: true },
    { id: 'e-partsB-sinkHC', source: 'parts-B', target: 'sink-HC-part', animated: true },
];

export const useEditorStore = defineStore('editor', () => {
    const nodes = shallowRef<FactoryNode[]>(mockNodes);
    const edges = shallowRef<FactoryEdge[]>(mockEdges);
    const mapWidth = ref(256);
    const mapHeight = ref(256);
    const snapToGrid = ref(true);
    const activeTool = ref<ToolMode>('select');

    // ── 建造計畫 ──────────────────────────────────────────────────────────
    /** 目前選定的計畫 ID（預設武陵） */
    const currentPlanId = ref<string>('9bdb2f99-531e-416a-8f4c-27c5e8d8957c');

    /** 目前選定的計畫物件 */
    const currentPlan = computed<Plan | undefined>(() =>
        plans.find((p) => p.id === currentPlanId.value),
    );

    /** 每種機器類型的已使用台數（不含物品輸出口 / 物品輸入口） */
    const machineUsedCounts = computed(() => {
        const counts = new Map<string, number>();
        for (const node of nodes.value) {
            const mt = node.data?.machineType;
            if (!mt || mt === '物品輸出口' || mt === '物品輸入口') continue;
            counts.set(mt, (counts.get(mt) ?? 0) + 1);
        }
        return counts;
    });
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
        currentPlanId,
        currentPlan,
        machineUsedCounts,
        setMapSize,
        setSnapToGrid,
        setActiveTool,
        setSelectedEquipment,
        armPlacement,
        disarmPlacement,
        resetCanvas,
    };
});
