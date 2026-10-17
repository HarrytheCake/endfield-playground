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

/**
 * 下半部 Tips 區最少保留高度（px）：拖曳時的下限，也是縱向壓縮時上半部的讓位基準，
 * 總高 >= 400 時上半部至少剩 250、下半部至少 150，兩區都不會被擠到消失。
 */
const MIN_BOTTOM_HEIGHT = 150;

/** 主體工作區（Detail）DOM 參照，拖曳分割線時以它的頂端為基準 */
const detailRef = ref<HTMLElement | null>(null);

/** 上半部統計區域高度（px），預設為設計稿的 582px；寬度固定，視窗加高時由下半部 Tips 向下延伸 */
const topHeight = ref(582);

/** 是否正在拖曳中間分割白線 */
const isDragging = ref(false);

/** 開始拖曳分割線：鎖定文字選取與游標樣式 */
const startDrag = () => {
    isDragging.value = true;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'row-resize';
};

/** 拖曳過程中依指標位置更新上半部高度（頂部無最小高度，底部最少保留 MIN_BOTTOM_HEIGHT） */
const onDragging = (e: MouseEvent | TouchEvent) => {
    if (!isDragging.value || !detailRef.value) return;
    /** 主體工作區的邊界矩形資訊 */
    const rect = detailRef.value.getBoundingClientRect();
    /** 指標或觸控點的垂直座標 */
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    topHeight.value = Math.max(0, Math.min(rect.height - MIN_BOTTOM_HEIGHT, clientY - rect.top));
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
        data-figma-id="2302:81"
        data-figma-name="Production Overview"
        class="relative isolate flex h-full w-[333px] shrink-0 flex-col overflow-hidden [font-family:'HarmonyOS_Sans_TC',sans-serif]"
    >
        <!-- 固定頂部名稱標籤（左凸 13px，故外框寬 333） -->
        <HeaderLabel />

        <!-- 主體工作區域：寬 320 固定，高度隨容器向下延伸 -->
        <div
            ref="detailRef"
            data-figma-id="2302:82"
            data-figma-name="Detail"
            class="ml-[13px] flex min-h-0 w-[320px] flex-1 flex-col bg-[#4e4e4e]"
        >
            <!-- 上半部：整體統計與產能估算 -->
            <ResultPanel
                :power="props.power"
                :products="props.products"
                :exchange-rate="props.exchangeRate"
                :style="{
                    height: `${topHeight}px`,
                    maxHeight: `calc(100% - ${MIN_BOTTOM_HEIGHT}px)`,
                }"
            />

            <!-- 分割白線（y=580，高 1px，與下半部頂端相距 1px）；6px 熱區，上下拖動調整兩區高度 -->
            <div
                data-figma-id="3312:114"
                data-figma-name="bar"
                class="relative z-10 -mt-[5px] -mb-[1px] h-[6px] w-full shrink-0 cursor-row-resize select-none"
                title="上下拖動調整統計與Tips區域高度"
                @mousedown="startDrag"
                @touchstart.passive="startDrag"
            >
                <div
                    class="pointer-events-none absolute top-[3px] left-0 h-px w-full bg-[#dadada]"
                />
            </div>

            <!-- 下半部：Tips 提示與警報清單 -->
            <AttentionPanel :tips="props.tips" />
        </div>
    </div>
</template>

<style>
/*
 * 面板內兩個捲動區共用的捲軸（設計稿 scrolling bar）：寬 9，上下各 11px 留給箭頭，
 * 軌道與滑塊左右各內縮 1px 成 7px 寬。
 * 不可加 scrollbar-color / scrollbar-width：Chrome 121+ 有這兩個屬性時會忽略下列偽元素。
 */
.stats-panel-scrollbar::-webkit-scrollbar {
    width: 9px;
}
.stats-panel-scrollbar::-webkit-scrollbar-track {
    border: solid transparent;
    border-width: 0 1px;
    border-radius: 25px;
    background: #3c3c3c padding-box;
}
.stats-panel-scrollbar::-webkit-scrollbar-thumb {
    border: solid transparent;
    border-width: 0 1px;
    border-radius: 25px;
    background: #ffffff padding-box;
}
.stats-panel-scrollbar::-webkit-scrollbar-button:single-button:vertical:decrement {
    height: 11px;
    width: 9px;
    background: transparent no-repeat center top / 9px 5px
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 9 5' width='9' height='5'%3E%3Cpath d='M9 5L0 5L4.5 0L9 5Z' fill='%23FFFFFF'/%3E%3C/svg%3E");
}
.stats-panel-scrollbar::-webkit-scrollbar-button:single-button:vertical:increment {
    height: 11px;
    width: 9px;
    background: transparent no-repeat center bottom / 9px 5px
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 9 5' width='9' height='5'%3E%3Cpath d='M0 0L9 0L4.5 5L0 0Z' fill='%23FFFFFF'/%3E%3C/svg%3E");
}
</style>
