<script setup lang="ts">
import type { FormulaItemProps } from './types';
import defaultItemImage from './item.png';

/** 配方物品圖示標籤元件（純展示 L3 元件）之屬性定義 */
defineProps<FormulaItemProps>();
</script>

<template>
    <div class="item">
        <div class="plate">
            <img :src="item.image || defaultItemImage" class="item-image" alt="item" />

            <div v-if="item.amount !== undefined" class="num">
                <span class="num-text">{{ item.amount }}</span>
            </div>
        </div>

        <span v-if="item.name" class="item-name">{{ item.name }}</span>
    </div>
</template>

<style scoped>
/* item */
.item {
    font-family: 'HarmonyOS Sans TC', sans-serif;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    width: 71px;
    flex-shrink: 0;
    box-sizing: border-box;
}

/* item-name */
.item-name {
    width: 71px;
    min-height: 18px;
    font-style: normal;
    font-weight: 400;
    font-size: 16px;
    line-height: 19px;
    text-align: center;
    color: #cfcfcf;
    white-space: nowrap;
}

/* plate */
.plate {
    box-sizing: border-box;
    position: relative;
    width: 55px;
    height: 55px;
    background: #2b2b2b;
    border: 3px solid #eefd1c;
    border-radius: 50%;
    box-shadow:
        0px 4px 4px rgba(0, 0, 0, 0.25),
        inset 0px 4px 4px rgba(0, 0, 0, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
}

/* image */
.item-image {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 55px;
    height: 55px;
    display: block;
    z-index: 1;
}

/* num (數量標籤) */
.num {
    position: absolute;
    right: -5px;
    bottom: -2px;
    width: 19px;
    height: 20px;
    background: #eefd1c;
    border-radius: 50%;
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
}

.num-text {
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    line-height: 19px;
    text-align: center;
    color: #2b2b2b;
}
</style>
