<template>
    <div ref="rootEl" class="base-region-selector">
        <button
            type="button"
            class="base-region-selector__trigger"
            :aria-expanded="isOpen"
            aria-haspopup="listbox"
            @click="toggleOpen"
        >
            基地選擇
            <span class="base-region-selector__caret" :class="{ 'is-open': isOpen }">▾</span>
        </button>

        <ul
            v-if="isOpen"
            class="base-region-selector__menu"
            role="listbox"
            aria-label="基地選擇選項"
        >
            <li
                v-for="option in options"
                :key="option.value ?? 'free'"
                role="option"
                :aria-selected="option.value === modelValue"
            >
                <button
                    type="button"
                    class="base-region-selector__option"
                    :class="{ 'is-active': option.value === modelValue }"
                    @click="handleSelect(option.value)"
                >
                    {{ option.label }}
                </button>
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
/**
 * BaseRegionSelector/Index.vue
 *
 * 純展示用的基地選擇下拉元件（L3）：
 *   - 提供「武陵地區 / 四號谷地 / 自由畫布」三個選項
 *   - 樣式與互動比照 dev/GoodMorning 分支的原始實作（觸發按鈕 + 下拉清單）
 *   - 目前選中值由外部透過 modelValue 傳入，使用者點擊後僅 emit 事件通知上層，
 *     不持有任何 store 依賴，實際狀態變更交由呼叫端（L2）呼叫
 *     canvasStore.setBaseRegion() 完成
 */
import { ref, onMounted, onBeforeUnmount } from 'vue';
import type { BaseRegion } from '@/store/canvasStore';

/** 選項清單項目結構：顯示文字與對應的基地區域值 */
interface Option {
    label: string;
    value: BaseRegion;
}

defineProps<{
    /** 目前選中的基地區域，null 代表自由畫布（無邊界） */
    modelValue: BaseRegion;
}>();

const emit = defineEmits<{
    /** 使用者點擊某個選項，請求上層將基地區域切換為 value */
    (event: 'update:modelValue', value: BaseRegion): void;
}>();

/** 基地選項清單：對應 canvasStore.BaseRegion 的三種合法值與其顯示文字 */
const options: Option[] = [
    { label: '武陵地區', value: 'wuling' },
    { label: '四號谷地', value: 'valley4' },
    { label: '自由畫布', value: null },
];

/** 下拉選單目前是否展開 */
const isOpen = ref(false);
/** 元件根節點參照，用於判斷點擊是否發生在選單外 */
const rootEl = ref<HTMLElement | null>(null);

/** 切換下拉選單開關狀態 */
function toggleOpen(): void {
    isOpen.value = !isOpen.value;
}

/** 使用者選取某個選項：emit 新值並收合選單 */
function handleSelect(value: BaseRegion): void {
    emit('update:modelValue', value);
    isOpen.value = false;
}

/** 點擊選單外部時自動收合 */
function handleClickOutside(event: MouseEvent): void {
    if (rootEl.value && !rootEl.value.contains(event.target as Node)) {
        isOpen.value = false;
    }
}

/** 按下 Esc 時收合選單 */
function handleEscape(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
        isOpen.value = false;
    }
}

/** 掛載時註冊全域點擊 / 按鍵事件，用於偵測外部點擊與 Esc 收合 */
onMounted(() => {
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
});

/** 卸載時移除全域事件監聽，避免記憶體洩漏 */
onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside);
    document.removeEventListener('keydown', handleEscape);
});
</script>

<style scoped>
.base-region-selector {
    position: relative;
    display: inline-block;
}

.base-region-selector__trigger {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    font-size: 13px;
    border: 1px solid var(--border-default, #d9d9d9);
    border-radius: 6px;
    background: var(--surface-default, #fff);
    color: var(--text-primary, #111);
    cursor: pointer;
}

.base-region-selector__trigger:hover {
    background: var(--surface-hover, #f5f5f5);
}

.base-region-selector__caret {
    font-size: 10px;
    transition: transform 0.15s ease;
}

.base-region-selector__caret.is-open {
    transform: rotate(180deg);
}

.base-region-selector__menu {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    min-width: 100%;
    margin: 0;
    padding: 4px;
    list-style: none;
    border: 1px solid var(--border-default, #d9d9d9);
    border-radius: 8px;
    background: var(--surface-default, #fff);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    z-index: 20;
}

.base-region-selector__option {
    display: block;
    width: 100%;
    padding: 6px 10px;
    font-size: 13px;
    text-align: left;
    white-space: nowrap;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--text-primary, #111);
    cursor: pointer;
}

.base-region-selector__option:hover {
    background: var(--surface-hover, #f5f5f5);
}

.base-region-selector__option.is-active {
    background: var(--surface-active, #eef2ff);
    font-weight: 600;
}
</style>
