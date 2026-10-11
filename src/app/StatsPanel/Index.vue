<script lang="ts">
export * from './types.ts';
</script>

<script setup lang="ts">
import { ref } from 'vue';
import { useEventListener } from '@vueuse/core';
import HeaderLabel from './HeaderLabel.vue';
import ResultPanel from './ResultPanel.vue';
import AttentionPanel from './AttentionPanel.vue';
import type { StatsPanelProps } from './types.ts';

/** 統計面板傳入屬性 */
const props = defineProps<StatsPanelProps>();

/** 面板根容器 DOM 參照，用於計算拖曳分割線時的相對高度 */
const containerRef = ref<HTMLElement | null>(null);

/** 上半部統計區域高度（px），預設為 582px */
const topHeight = ref(582);

/** 是否正在拖曳中間分割白線 */
const isDragging = ref(false);

/** 開始拖曳分割線：鎖定文字選取與游標樣式 */
const startDrag = () => {
    isDragging.value = true;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'row-resize';
};

/** 拖曳過程中動態計算並限制上半部統計區域的高度範圍（頂部最少保留 220px，底部最少保留 150px） */
const onDragging = (e: MouseEvent | TouchEvent) => {
    if (!isDragging.value || !containerRef.value) return;
    /** 面板根容器的邊界矩形資訊 */
    const rect = containerRef.value.getBoundingClientRect();
    /** 指標或觸控點的垂直座標 */
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    /** 相對於面板頂部的垂直距離 */
    const relativeY = clientY - rect.top;

    /** 上半部區域最小保留高度（px） */
    const minHeight = 220;
    /** 上半部區域最大可達高度（px），確保底部至少保留 150px */
    const maxHeight = rect.height - 150;

    topHeight.value = Math.max(minHeight, Math.min(maxHeight, relativeY));
};

/** 結束拖曳分割線：還原文字選取與游標樣式 */
const stopDrag = () => {
    if (!isDragging.value) return;
    isDragging.value = false;
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
};

/** 透過 VueUse 註冊全域拖曳與放開事件監聽，元件卸載時自動清理 */
useEventListener(window, 'mousemove', onDragging);
useEventListener(window, 'touchmove', onDragging);
useEventListener(window, 'mouseup', stopDrag);
useEventListener(window, 'touchend', stopDrag);
</script>

<template>
    <div
        ref="containerRef"
        data-figma-id="2302:81"
        data-figma-name="Production Overview"
        class="relative isolate m-0 box-border flex h-full [width:320px] shrink-0 flex-col overflow-hidden border-0 border-solid"
    >
        <!-- 固定頂部名稱與裝飾標籤 -->
        <HeaderLabel />

        <!-- 主體工作區域 (向下延伸、可自適應高度) -->
        <div
            data-figma-id="2302:82"
            data-figma-name="Detail"
            class="relative isolate m-0 box-border flex [width:320px] flex-1 shrink-0 flex-col overflow-hidden border-0 border-solid [background-color:#4e4e4e]"
        >
            <!-- 上半部：整體統計與產能估算 -->
            <ResultPanel
                :power="props.power"
                :products="props.products"
                :exchange-rate="props.exchangeRate"
                :style-height="topHeight"
            />

            <!-- 分割白線（Handle） -->
            <div
                class="relative z-30 -my-[3px] flex h-[6px] w-full cursor-row-resize items-center justify-center bg-transparent transition-colors select-none hover:bg-white/40 active:bg-white/70"
                @mousedown="startDrag"
                @touchstart.passive="startDrag"
                title="上下拖動調整統計與Tips區域高度"
            >
                <div class="pointer-events-none h-[1px] w-full bg-[#dadada]"></div>
            </div>

            <!-- 下半部：Attention 與 Tips 警告清單 -->
            <AttentionPanel :tips="props.tips" />
        </div>
    </div>
</template>
