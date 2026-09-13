<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import FormulaItem from '@/components/FormulaItem/Index.vue';
import type { Formula } from './types';

/** 單一配方展示元件之屬性定義 */
const props = defineProps<{
    /** 所要呈現的單一配方資料（包含週期、原料與產物） */
    singleformula: Formula;
}>();

const rowRef = ref<HTMLElement | null>(null);
const canScrollLeft = ref(false);
const canScrollRight = ref(false);
const isDragging = ref(false);
const canScroll = computed(() => canScrollLeft.value || canScrollRight.value);

let startX = 0;
let startScrollLeft = 0;
let hasMoved = false;

/** 檢查當前橫向滾動容器狀態，動態決定兩側提示是否顯示 */
function updateScrollHints(): void {
    const el = rowRef.value;
    if (!el) return;
    canScrollLeft.value = el.scrollLeft > 1;
    canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
}

function onScroll(): void {
    updateScrollHints();
}

/** 處理滑鼠按下事件，啟動拖曳滾動監聽 */
function onMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return;
    const el = rowRef.value;
    if (!el || el.scrollWidth <= el.clientWidth) return;

    e.preventDefault();
    isDragging.value = true;
    hasMoved = false;
    startX = e.pageX;
    startScrollLeft = el.scrollLeft;

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
}

/** 處理滑鼠移動事件，依滑鼠位移更新滾動位置 */
function onMouseMove(e: MouseEvent): void {
    if (!isDragging.value) return;
    const el = rowRef.value;
    if (!el) return;

    const dx = e.pageX - startX;
    if (Math.abs(dx) > 3) {
        hasMoved = true;
    }
    el.scrollLeft = startScrollLeft - dx;
}

/** 處理滑鼠放開事件，解除拖曳監聽 */
function onMouseUp(): void {
    if (!isDragging.value) return;
    isDragging.value = false;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
}

/** 若曾發生拖曳行為，阻止點擊冒泡避免誤觸上層卡片點擊事件 */
function onClickCapture(e: MouseEvent): void {
    if (hasMoved) {
        e.stopPropagation();
        hasMoved = false;
    }
}

onMounted(() => {
    nextTick(() => {
        updateScrollHints();
    });
    window.addEventListener('resize', updateScrollHints);
});

onUnmounted(() => {
    window.removeEventListener('resize', updateScrollHints);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
});

watch(
    () => props.singleformula,
    () => {
        nextTick(() => {
            updateScrollHints();
        });
    },
    { deep: true },
);
</script>

<template>
    <div class="single-formula">
        <div class="duration">週期 {{ singleformula.duration }}s</div>

        <div class="formula-row-wrapper">
            <div
                ref="rowRef"
                class="formula-row"
                :class="{ 'can-scroll': canScroll, 'is-dragging': isDragging }"
                @scroll="onScroll"
                @mousedown="onMouseDown"
                @click.capture="onClickCapture"
            >
                <template v-for="(item, index) in singleformula.input" :key="`in-${index}`">
                    <span v-if="index > 0" class="operator plus">+</span>
                    <FormulaItem :item="item" />
                </template>

                <span class="operator arrow">→</span>

                <template v-for="(item, index) in singleformula.output" :key="`out-${index}`">
                    <span v-if="index > 0" class="operator plus">+</span>
                    <FormulaItem :item="item" />
                </template>
            </div>

            <!-- 左側滾動提示 (有左側滾動空間時顯示) -->
            <div v-if="canScrollLeft" class="scroll-hint left">
                <div class="hint-plate" />
                <div class="hint-arrow" />
            </div>

            <!-- 右側滾動提示 (有右側滾動空間時顯示) -->
            <div v-if="canScrollRight" class="scroll-hint right">
                <div class="hint-plate" />
                <div class="hint-arrow" />
            </div>
        </div>
    </div>
</template>

<style scoped>
.single-formula {
    position: relative;
    margin: 10px 7px 0 7px;
    box-sizing: border-box;
    overflow: hidden;
}

.duration {
    font-style: normal;
    font-weight: 400;
    font-size: 18px;
    line-height: 21px;
    color: #cfcfcf;
    margin-bottom: 6px;
    padding-left: 2px;
}

.formula-row-wrapper {
    position: relative;
    width: 100%;
    border-radius: 4px;
    overflow: hidden;
}

.formula-row {
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 10px 14px 8px 14px;
    gap: 3px;
    background: rgba(43, 43, 43, 0.2);
    border-radius: 4px;
    overflow-x: auto;
    overflow-y: hidden;
    color: #cfcfcf;
    user-select: none;
    -webkit-user-select: none;

    /* 隱藏滾動條 */
    scrollbar-width: none;
    -ms-overflow-style: none;
}

.formula-row.can-scroll {
    cursor: grab;
}

.formula-row.is-dragging {
    cursor: grabbing;
}

.formula-row :deep(img) {
    -webkit-user-drag: none;
    user-drag: none;
    pointer-events: none;
}

.formula-row::-webkit-scrollbar {
    display: none;
}

.operator {
    display: flex;
    align-items: center;
    justify-content: center;
    font-style: normal;
    font-weight: 700;
    font-size: 16px;
    line-height: 19px;
    text-align: center;
    color: #cfcfcf;
    user-select: none;
    flex-shrink: 0;
}

.operator.plus {
    width: 10px;
    height: 19px;
}

.operator.arrow {
    width: 35px;
    height: 19px;
}

/* 滾動提示容器 (左右側) */
.scroll-hint {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 14px;
    pointer-events: none;
    z-index: 10;
}

.scroll-hint.left {
    left: 0;
}

.scroll-hint.right {
    right: 0;
}

.scroll-hint.left .hint-plate {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 10px;
    background: linear-gradient(270deg, rgba(71, 71, 71, 0) 0%, #3c3c3c 100%);
}

.scroll-hint.right .hint-plate {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 10px;
    background: linear-gradient(90deg, rgba(71, 71, 71, 0) 0%, #3c3c3c 100%);
}

.scroll-hint.left .hint-arrow {
    position: absolute;
    left: 4.5px;
    top: 50%;
    transform: translateY(-50%);
    width: 6.5px;
    height: 13px;
    background: #ffffff;
    clip-path: polygon(100% 0%, 100% 100%, 0% 50%);
}

.scroll-hint.right .hint-arrow {
    position: absolute;
    right: 4.5px;
    top: 50%;
    transform: translateY(-50%);
    width: 6.5px;
    height: 13px;
    background: #ffffff;
    clip-path: polygon(0% 0%, 0% 100%, 100% 50%);
}
</style>
