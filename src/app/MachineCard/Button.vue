<script setup lang="ts">
/**
 * 機器卡片邊緣操作按鈕元件（僅供 MachineCard 內部使用）。
 * 外層負責卡片邊緣定位（.button），內層為純 CSS 刻出的向左指示三角形（.triangle）。
 */
</script>

<template>
    <div class="button">
        <div class="triangle" />
    </div>
</template>

<style scoped>
/* 按鈕位置定位層（貼附於卡片右側） */
.button {
    position: absolute;
    top: 45%;
    right: -10px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* 三角形本體（純 CSS 刻出，高度 40px） */
.triangle {
    width: 20px;
    height: 40px;
    background-color: #eefd1c;
    clip-path: polygon(100% 0%, 100% 100%, 0% 50%);
}
</style>
