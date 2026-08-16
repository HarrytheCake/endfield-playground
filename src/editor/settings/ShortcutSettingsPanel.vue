<script setup lang="ts">
import { ref } from 'vue';
import { useKeybindingStore, type KeybindingAction } from '@/store/keybindingStore';
import { useKeyCapture } from '@/composables/useKeybinding';
import ShortcutRow from '@/components/ShortcutRow/Index.vue';

/** 快捷鍵配置 store：動作清單、目前鍵位、設定介面開關狀態的唯一來源 */
const keybindingStore = useKeybindingStore();

/** 設定介面的分類分組（依 KeybindingAction.category），依此順序渲染 */
const CATEGORIES: { id: KeybindingAction['category']; label: string }[] = [
    { id: 'history', label: '歷史' },
    { id: 'selection', label: '選取' },
    { id: 'canvas', label: '畫布' },
    { id: 'system', label: '系統' },
];

/** 目前正在錄製新鍵位的動作 id；無錄製中則為 null */
const recordingActionId = ref<string | null>(null);

/** 錄製到新鍵位時寫入 store，並結束錄製狀態 */
const { start: startCapture } = useKeyCapture((combo) => {
    if (recordingActionId.value) {
        keybindingStore.setBinding(recordingActionId.value, combo);
    }
    recordingActionId.value = null;
});

/**
 * 依分類篩選出該分類下的所有動作定義。
 * @param categoryId 分類 id
 */
function actionsInCategory(categoryId: KeybindingAction['category']): readonly KeybindingAction[] {
    return keybindingStore.ACTIONS.filter((action) => action.category === categoryId);
}

/**
 * 開始錄製指定動作的新鍵位。
 * @param actionId 動作 id
 */
function handleStartRebind(actionId: string) {
    recordingActionId.value = actionId;
    startCapture();
}

/**
 * 將指定動作的鍵位重置回預設值。
 * @param actionId 動作 id
 */
function handleReset(actionId: string) {
    keybindingStore.resetBinding(actionId);
}
</script>

<template>
    <UModal
        v-model:open="keybindingStore.isSettingsPanelOpen"
        title="快捷鍵設定"
        description="點擊「設定」後按下想要的按鍵組合即可變更；Escape 用於取消拿起預覽，固定不可變更。"
    >
        <template #body>
            <div v-for="category in CATEGORIES" :key="category.id" class="mb-4 last:mb-0">
                <h3 class="mb-1 text-xs font-semibold text-zinc-500">{{ category.label }}</h3>
                <ShortcutRow
                    v-for="action in actionsInCategory(category.id)"
                    :key="action.id"
                    :label="action.label"
                    :combo="keybindingStore.resolvedCombo(action.id)"
                    :has-conflict="
                        keybindingStore.findConflict(
                            keybindingStore.resolvedCombo(action.id),
                            action.id,
                        ) !== null
                    "
                    :is-recording="recordingActionId === action.id"
                    @start-rebind="handleStartRebind(action.id)"
                    @reset="handleReset(action.id)"
                />
            </div>
        </template>
    </UModal>
</template>
