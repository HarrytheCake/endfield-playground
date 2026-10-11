<script setup lang="ts">
import { onMounted } from 'vue';
import { getMachineById } from '@/data/machines';
import { getMockLayoutScenario, toLayoutSnapshot } from '@/data/mockLayout';
import GridCanvas from '@/editor/layout/GridCanvas.vue';
import { usePlacementIntent } from '@/editor/toolbar/usePlacementIntent';
import { useLayoutStore } from '@/store/layoutStore';
import type { Position } from '@/types/euclideanSpace';
import { canPlaceDevice } from '@/utils/layout/placementCheck';

/** 提供主畫面唯讀佈局資料及高階快照載入操作 */
const layoutStore = useLayoutStore();

/** 工具列與畫布共享的真機器落子意圖 */
const { armedMachineId } = usePlacementIntent();

/**
 * 格點點擊時先預檢，再以高階 action 新增真機器；成功後保留意圖供連續落子。
 *
 * @param position 由 GridCanvas 換算的格點座標
 */
function handleCellClick(position: Position): void {
    const machineType = armedMachineId.value;
    if (!machineType) return;

    const machine = getMachineById(machineType);
    if (!machine) return;

    const precheck = canPlaceDevice(
        { machineType, position, rotation: 0 },
        { devices: layoutStore.devices, pipelines: layoutStore.pipelines },
    );
    if (!precheck.ok) return;

    const placement = layoutStore.addDevice({
        id: crypto.randomUUID(),
        machineType,
        position,
        rotation: 0,
        label: machine.name,
    });
    if (!placement.ok) return;
}

/**
 * 首次進入主畫面且尚無設備時載入示範快照，避免空白畫布無法驗收。
 * 既有資料會完整保留，不會因元件重新掛載而被 fixture 覆寫。
 */
onMounted(() => {
    if (layoutStore.devices.length === 0) {
        layoutStore.loadSnapshot(toLayoutSnapshot(getMockLayoutScenario('connected')));
    }
});
</script>

<template>
    <div class="relative h-full w-full overflow-auto">
        <GridCanvas
            :devices="layoutStore.devices"
            :pipelines="layoutStore.pipelines"
            @cell-click="handleCellClick"
        />
    </div>
</template>
