<script setup lang="ts">
import type { EquipmentType } from '@/types/editor';
import { useEditorStore } from '@/store/editorStore';

/** 藍圖 store：武裝放置模式與記錄目前選取設備類型 */
const editorStore = useEditorStore();

/** 工具列可選擇的設備清單，供點擊武裝放置與拖拉放置共用 */
const equipments: Array<{ id: EquipmentType; label: string }> = [
    { id: 'smelter', label: '精煉爐' },
    { id: 'crusher', label: '粉碎機' },
    { id: 'assembler', label: '組裝台' },
    { id: 'conveyor-node', label: '輸送帶節點' },
    { id: 'power-node', label: '電力節點' },
];

/**
 * 點擊設備按鈕時武裝放置模式，之後點擊畫布即可放置該設備。
 * @param equipment 選擇的設備類型
 * @example
 * handleEquipClick('smelter')
 */
function handleEquipClick(equipment: EquipmentType) {
    editorStore.armPlacement(equipment);
}

/**
 * 開始拖拉設備按鈕時，記錄目前選取設備並將類型寫入 dataTransfer，
 * 供畫布 drop 事件讀取以決定要放置的設備類型。
 * @param event 拖拉開始事件
 * @param equipment 被拖拉的設備類型
 * @example
 * handleEquipDragStart(dragEvent, 'crusher')
 */
function handleEquipDragStart(event: DragEvent, equipment: EquipmentType) {
    editorStore.setSelectedEquipment(equipment);

    if (!event.dataTransfer) {
        return;
    }

    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('application/x-endfield-equipment', equipment);
}
</script>

<template>
    <div class="panel toolbar-bottom toolbar-panel">
        <div class="toolbar-row">
            <UButton
                v-for="equipment in equipments"
                :key="equipment.id"
                color="neutral"
                :variant="editorStore.selectedEquipment === equipment.id ? 'solid' : 'soft'"
                :label="equipment.label"
                class="toolbar-button"
                draggable="true"
                @click="handleEquipClick(equipment.id)"
                @dragstart="handleEquipDragStart($event, equipment.id)"
            />
        </div>
    </div>
</template>

<style scoped>
.toolbar-panel {
    width: 100%;
    height: 100%;
    padding: 0;
}

.toolbar-row {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    width: 100%;
    height: 100%;
    gap: 0;
}

.toolbar-button {
    height: 100%;
    border-radius: 0;
}
</style>
