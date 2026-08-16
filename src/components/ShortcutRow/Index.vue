<script setup lang="ts">
import { computed } from 'vue';

/**
 * 單一快捷鍵設定列（純展示元件）。
 * L3 元件不得 import Pinia store，目前鍵位、是否衝突、是否正在錄製皆由父層（L2）以 props 傳入，
 * 使用者操作（點擊設定 / 重置）一律透過 emits 通知父層處理。
 */
const props = defineProps<{
    /** 動作顯示名稱（中文） */
    label: string;
    /** 目前生效的鍵位字串，例如 'Ctrl+Z' */
    combo: string;
    /** 此鍵位是否與其他動作衝突 */
    hasConflict: boolean;
    /** 是否正在錄製這一列的新鍵位 */
    isRecording: boolean;
}>();

/** 通知父層：使用者要開始錄製新鍵位 / 要重置回預設鍵位 */
const emit = defineEmits<{
    'start-rebind': [];
    reset: [];
}>();

/** 將鍵位字串（如 'Ctrl+Z'）拆成個別按鍵，供逐一渲染 UKbd 徽章 */
const comboParts = computed(() => props.combo.split('+').filter(Boolean));
</script>

<template>
    <div class="flex items-center justify-between gap-3 border-b border-zinc-800 px-2 py-2 text-sm">
        <span class="text-zinc-200">{{ label }}</span>

        <div class="flex items-center gap-2">
            <span v-if="hasConflict" class="text-xs text-orange-400">鍵位衝突</span>

            <span v-if="isRecording" class="text-xs text-blue-400">請按下新按鍵…</span>
            <template v-else>
                <UKbd v-for="part in comboParts" :key="part" :value="part" />
            </template>

            <UButton
                size="xs"
                variant="soft"
                :color="isRecording ? 'primary' : 'neutral'"
                @click="emit('start-rebind')"
            >
                設定
            </UButton>
            <UButton size="xs" variant="ghost" color="neutral" @click="emit('reset')">
                重置
            </UButton>
        </div>
    </div>
</template>
