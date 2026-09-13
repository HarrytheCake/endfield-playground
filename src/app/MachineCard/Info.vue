<script setup lang="ts">
/** 機器狀態與規格資訊區塊之屬性定義 */
defineProps<{
    /** 目前已選取的機器名稱，未傳入時顯示佔位符號 */
    selectedMachine: string;
    /** 機器佔地尺寸文字（例如「3×3」），未傳入時顯示佔位符號 */
    sizeText: string;
    /** 機器運作耗電量文字（例如「10kW」），未傳入時顯示佔位符號 */
    power?: string;
    /** 當前設定的配方名稱與耗時，未傳入時顯示佔位符號 */
    selectedRecipe?: string;
}>();
</script>

<template>
    <div class="info">
        <!-- 1. selectedmachine -->
        <div class="selected-machine">已選取：{{ selectedMachine }}</div>

        <!-- 2. 3組資訊列表 (置左 a:  b 置右) -->
        <div class="info-list">
            <!-- size -->
            <div class="info-row size">
                <span class="label">尺寸</span>
                <span class="value">{{ sizeText }}</span>
            </div>

            <!-- power -->
            <div class="info-row power">
                <span class="label">耗電量</span>
                <span class="value">{{ power || '—' }}</span>
            </div>

            <!-- selectedrecipe -->
            <div class="info-row selected-recipe">
                <span class="label">目前配方</span>
                <span class="value">{{ selectedRecipe || '—' }}</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* information 容器 */
.info {
    position: absolute;
    width: 250px;
    height: 125px;
    left: 0px;
    top: 10px;
}

/* selected-machine */
.selected-machine {
    position: absolute;
    left: 13px;
    top: 3px;
    width: 190px;
    height: 23px;

    font-style: normal;
    font-weight: 400;
    font-size: 20px;
    line-height: 23px;

    color: #ffffff;
    white-space: nowrap;
}

/* 3組 text 容器 ({some div}) */
.info-list {
    position: absolute;
    left: 20px;
    top: 40px;
    width: 230px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.info-row {
    width: 100%;
    height: 18px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    font-style: normal;
    font-weight: 300;
    font-size: 18px;
    line-height: 18px;
    color: #cfcfcf;
}

.info-row .label {
    white-space: nowrap;
}

.info-row .value {
    white-space: nowrap;
}
</style>
