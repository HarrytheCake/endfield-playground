<script setup lang="ts">
/**
 * 下方工具列：既有五顆 EquipmentType 按鈕（落子）＋真實機器分類列表（V11-H1）
 *
 * 真實機器點選只更新落子意圖；不呼叫舊藍圖的 armPlacement／dataTransfer。
 */
import { computed, ref } from 'vue';
import type { EquipmentType } from '@/types/editor';
import type { MachineCategory } from '@/types/machine';
import { useEditorStore } from '@/store/editorStore';
import { usePlacementIntent } from '@/editor/toolbar/usePlacementIntent';
import {
    DEFAULT_TOOLBAR_MACHINE_TAG,
    listToolbarMachines,
    TOOLBAR_MACHINE_TAGS,
    type ToolbarMachineRow,
} from '@/editor/toolbar/toolbarMachines';

/** 藍圖 store：武裝放置模式與記錄目前選取設備類型（僅舊五顆） */
const editorStore = useEditorStore();

/** 真機器的暫態落子意圖；與新畫布共用，不寫入藍圖 store */
const { armedMachineId, arm, disarm } = usePlacementIntent();

/** 工具列可選擇的設備清單，供點擊武裝放置與拖拉放置共用 */
const equipments: Array<{ id: EquipmentType; label: string }> = [
    { id: 'smelter', label: '精煉爐' },
    { id: 'crusher', label: '粉碎機' },
    { id: 'assembler', label: '組裝台' },
    { id: 'conveyor-node', label: '輸送帶節點' },
    { id: 'power-node', label: '電力節點' },
];

/** 真實機器分類 Tab（本週預設基礎生產） */
const activeTag = ref<MachineCategory>(DEFAULT_TOOLBAR_MACHINE_TAG);

/** 本地選取的真實機器 id（不進 store） */
const selectedRealMachineId = ref<string | null>(null);

/** 當前分類下的真實機器列（唯讀列表；點選不進 store） */
const realMachines = computed(() => listToolbarMachines(activeTag.value));

/**
 * 點擊設備按鈕時武裝放置模式，之後點擊畫布即可放置該設備。
 * 同時清空真實機器本地高亮，避免與 legacy 武裝態同時亮起。
 * @param equipment 選擇的設備類型
 */
function handleEquipClick(equipment: EquipmentType) {
    selectedRealMachineId.value = null;
    disarm();
    editorStore.armPlacement(equipment);
}

/**
 * 開始拖拉設備按鈕時，記錄目前選取設備並將類型寫入 dataTransfer，
 * 供畫布 drop 事件讀取以決定要放置的設備類型。
 * @param event 拖拉開始事件
 * @param equipment 被拖拉的設備類型
 */
function handleEquipDragStart(event: DragEvent, equipment: EquipmentType) {
    selectedRealMachineId.value = null;
    disarm();
    editorStore.setSelectedEquipment(equipment);

    if (!event.dataTransfer) {
        return;
    }

    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('application/x-endfield-equipment', equipment);
}

/**
 * 切換真實機器分類 Tab；清空本地選取，避免切回原 Tab 時殘留高亮。
 * @param tag 目標分類
 */
function handleTagClick(tag: MachineCategory) {
    activeTag.value = tag;
    selectedRealMachineId.value = null;
    disarm();
}

/**
 * 切換真機器落子意圖，並同步本地高亮；同機再點會取消。
 * @param row 攤平列
 */
function handleRealMachineClick(row: ToolbarMachineRow) {
    arm(row.id);
    selectedRealMachineId.value = armedMachineId.value;
}
</script>

<template>
    <div class="panel toolbar-bottom toolbar-panel">
        <!-- 既有五顆：落子／拖曳路徑不變 -->
        <div class="toolbar-row--legacy">
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

        <!-- 真實機器：分類＋列表（不接 store） -->
        <div class="toolbar-real">
            <div class="toolbar-real__tags" role="tablist" aria-label="機器分類">
                <button
                    v-for="tag in TOOLBAR_MACHINE_TAGS"
                    :key="tag"
                    type="button"
                    role="tab"
                    class="toolbar-tag"
                    :class="{ 'toolbar-tag--active': activeTag === tag }"
                    :aria-selected="activeTag === tag"
                    @click="handleTagClick(tag)"
                >
                    {{ tag }}
                </button>
            </div>
            <div class="toolbar-real__list">
                <button
                    v-for="row in realMachines"
                    :key="row.id"
                    type="button"
                    class="toolbar-machine"
                    :class="{ 'toolbar-machine--selected': selectedRealMachineId === row.id }"
                    :title="`${row.name}（${row.id}）`"
                    @click="handleRealMachineClick(row)"
                >
                    <span class="toolbar-machine__name">{{ row.name }}</span>
                    <span class="toolbar-machine__size">{{ row.sizeText }}</span>
                </button>
                <p v-if="realMachines.length === 0" class="toolbar-real__empty">此分類無機器</p>
            </div>
        </div>
    </div>
</template>

<style scoped>
.toolbar-panel {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    min-height: 0;
    padding: 0;
    gap: 0;
}

.toolbar-row--legacy {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    flex: 0 0 auto;
    height: 2.25rem;
    width: 100%;
    gap: 0;
}

.toolbar-button {
    height: 100%;
    border-radius: 0;
}

.toolbar-real {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    min-height: 0;
    border-top: 1px solid rgb(63 63 70);
    background: rgb(24 24 27 / 0.85);
}

.toolbar-real__tags {
    display: flex;
    flex: 0 0 auto;
    gap: 0;
    overflow-x: auto;
    border-bottom: 1px solid rgb(63 63 70);
}

.toolbar-tag {
    flex: 0 0 auto;
    padding: 0.25rem 0.6rem;
    font-size: 0.7rem;
    color: rgb(161 161 170);
    background: transparent;
    border: 0;
    cursor: pointer;
    white-space: nowrap;
}

.toolbar-tag--active {
    color: rgb(244 244 245);
    background: rgb(39 39 42);
    box-shadow: inset 0 -2px 0 rgb(56 189 248);
}

.toolbar-real__list {
    display: flex;
    flex: 1 1 auto;
    gap: 0.35rem;
    min-height: 0;
    padding: 0.35rem;
    overflow-x: auto;
    overflow-y: auto;
    align-items: flex-start;
}

.toolbar-machine {
    display: flex;
    flex: 0 0 auto;
    flex-direction: column;
    justify-content: flex-start;
    gap: 0.15rem;
    min-width: 5.5rem;
    max-width: 8rem;
    min-height: 2.75rem;
    padding: 0.3rem 0.5rem;
    text-align: left;
    color: rgb(228 228 231);
    background: rgb(39 39 42);
    border: 1px solid rgb(82 82 91);
    border-radius: 0.25rem;
    cursor: pointer;
}

.toolbar-machine:hover {
    border-color: rgb(113 113 122);
}

.toolbar-machine--selected {
    border-color: rgb(56 189 248);
    background: rgb(12 74 110 / 0.45);
}

.toolbar-machine__name {
    flex-shrink: 0;
    font-size: 0.75rem;
    font-weight: 600;
    line-height: 1.25;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.toolbar-machine__size {
    flex-shrink: 0;
    font-size: 0.65rem;
    color: rgb(161 161 170);
    font-variant-numeric: tabular-nums;
    line-height: 1.2;
}

.toolbar-real__empty {
    margin: auto;
    font-size: 0.75rem;
    color: rgb(113 113 122);
}
</style>
