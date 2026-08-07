<script setup lang="ts">
import { ref } from 'vue';
import { VueFlow, useVueFlow, type NodeTypesObject } from '@vue-flow/core';

// 1. 引入 5 種節點元件
import MaterialNode from './MaterialNode.vue';
import DeviceNode from './DeviceNode.vue';
import ProductNode from './ProductNode.vue';
import WarehouseNode from './WarehouseNode.vue';
import PendingImportNode from './PendingImportNode.vue';

// 2. 引入連線元件
import FlowEdge from './FlowEdge.vue';

// 3. 註冊 Vue Flow 框架辨識
const nodeTypes: NodeTypesObject = {
    material: MaterialNode,
    device: DeviceNode,
    product: ProductNode,
    warehouse: WarehouseNode,
    pendingImport: PendingImportNode,
};

const edgeTypes = {
    customEdge: FlowEdge,
};

// 4. 初始化節點資料 (對應 3.8 規格書的 5 種節點)
const nodes = ref([
    {
        id: 'node-1',
        type: 'material',
        position: { x: 50, y: 150 },
        data: { label: '鐵礦砂', ratePerMin: 60 },
    },
    {
        id: 'node-2',
        type: 'device',
        position: { x: 300, y: 150 },
        data: { label: '電弧爐', efficiency: 0.85, iconUrl: '⚡', recipeName: '鐵錠配方' },
    },
    {
        id: 'node-3',
        type: 'product',
        position: { x: 600, y: 80 },
        data: { label: '鐵錠', iconUrl: '🪙', ratePerMin: 30 },
    },
    {
        id: 'node-4',
        type: 'warehouse',
        position: { x: 600, y: 240 },
        data: { label: '主要倉庫', iconUrl: '📦', itemName: '鐵錠' },
    },
    {
        id: 'node-5',
        type: 'pendingImport',
        position: { x: 300, y: 350 },
        data: { label: '高爐', iconUrl: '🔥' },
    },
]);

// 5. 初始化連線資料 (傳入的 data 必須符合上一張圖的 Props 結構)
const edges = ref([
    {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        type: 'customEdge',
        data: { itemName: '鐵礦砂', ratePerMin: 60, highlighted: false },
    },
    {
        id: 'edge-2',
        source: 'node-2',
        target: 'node-3',
        type: 'customEdge',
        data: { itemName: '鐵錠', ratePerMin: 30, highlighted: false },
    },
]);

// 6. 實作「聯動高亮」邏輯
// 當點擊某個節點時，自動把與它相連的線段變藍高亮；點擊畫布空白處則取消高亮
const { onNodeClick, onPaneClick } = useVueFlow();

// 點擊節點時觸發
onNodeClick(({ node }) => {
    edges.value = edges.value.map((edge) => {
        // 如果這條線的起點或終點是目前被點擊的節點，就將 highlighted 設為 true
        const isConnected = edge.source === node.id || edge.target === node.id;
        return {
            ...edge,
            data: {
                ...edge.data,
                highlighted: isConnected,
            },
        };
    });
});

// 點擊背景畫布空白處時觸發，清除所有高亮
onPaneClick(() => {
    edges.value = edges.value.map((edge) => ({
        ...edge,
        data: {
            ...edge.data,
            highlighted: false,
        },
    }));
});
</script>

<template>
    <!-- 
    
  -->
    <div
        class="h-[600] w-full overflow-hidden rounded-xl border border-gray-200 bg-slate-50 shadow-inner"
    >
        <VueFlow
            v-model:nodes="nodes"
            v-model:edges="edges"
            :node-types="nodeTypes"
            :edge-types="edgeTypes"
            :fit-view-on-init="true"
            class="production-flow-chart"
        />
    </div>
</template>

<style>
/* 引入 Vue Flow 的核心與預設主題樣式 */
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';

/* 自訂遮罩或畫布網格微調 (選填) */
.production-flow-chart {
    --vf-node-bg: transparent;
    --vf-node-text: inherit;
    --vf-box-shadow: none;
}
</style>
