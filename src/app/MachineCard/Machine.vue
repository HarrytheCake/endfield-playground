<script setup lang="ts">
import testImage from './image.png';

/** 機器圖片展示元件之屬性定義 */
defineProps<{
    /** 機器圖片的網址或資源路徑，未提供時使用預設圖片 */
    src?: string;
}>();
</script>

<template>
    <div class="machine">
        <img :src="src || testImage" alt="machine" class="machine-image" />
    </div>
</template>

<style scoped>
/* image */
.machine {
    position: absolute;
    right: 10px;
    top: 30px;
}

.machine-image {
    display: block;
}
</style>
