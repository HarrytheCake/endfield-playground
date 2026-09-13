<script setup lang="ts">
/**
 * 機器卡片頂部標題列元件，展示面板名稱底板與標題文字。
 */
</script>

<template>
    <div class="title">
        <div class="plate"></div>
        <div class="text">
            <slot>物件資訊面板</slot>
        </div>
    </div>
</template>

<style scoped>
/* Title */
.title {
    position: absolute;
    left: 3px;
    right: 0px;
    height: 52px;
    top: 0px;
    display: flex;
    align-items: center;
}

/* Plate */
.plate {
    position: absolute;
    inset: 0;

    background: #3d3d3d;
    border-radius: 0px 40px 0px 0px;
}

/* Text */
.text {
    position: relative;
    z-index: 1;
    margin-left: 19px;

    font-style: normal;
    font-weight: 300;
    font-size: 24px;
    line-height: 28px;

    color: #ffffff;
    white-space: nowrap;
}
</style>
