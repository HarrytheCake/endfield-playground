<script setup lang="ts">
import SingleFormula from './SingleFormula.vue';
import type { Formula } from './types';

/** 可用配方清單區塊之屬性定義 */
const props = defineProps<{
    /** 機器支援的可用配方清單 */
    formulas?: Formula[];
}>();
</script>

<template>
    <div class="formula-list">
        <!-- Text 標題 -->
        <div class="title-text">可用配方一覽</div>

        <!-- 配方內容容器 -->
        <div class="list-container">
            <slot>
                <!-- formula 項目 -->
                <SingleFormula
                    v-for="(formula, index) in props.formulas"
                    :key="index"
                    :singleformula="formula"
                />
            </slot>
        </div>
    </div>
</template>

<style scoped>
/* frame / formula-list 容器 (含頂部細線) */
.formula-list {
    box-sizing: border-box;

    position: absolute;
    left: 0px;
    right: 0px;
    top: 140px;
    bottom: 14px;
    display: flex;
    flex-direction: column;

    border-top: 1px solid #dadada;
}

/* Text */
.title-text {
    padding: 16px 0 11px 13px;
    flex-shrink: 0;

    font-style: normal;
    font-weight: 400;
    font-size: 20px;
    line-height: 23px;

    color: #ffffff;
    white-space: nowrap;
}

/* 配方內容容器 */
.list-container {
    flex: 1;
    min-height: 0;
    width: 100%;

    /* 超出高度自動滾動，橫向嚴格裁切 */
    overflow-y: auto;
    overflow-x: hidden;

    /* 隱藏滾動條 */
    scrollbar-width: none;
    -ms-overflow-style: none;
}

.list-container::-webkit-scrollbar {
    display: none;
}
</style>
