<script setup lang="ts">
import { computed } from 'vue'; //

interface Props {
    totalDemandKw: number; // 總耗電
    totalSupplyKw: number; // 總供電
    deviceCount: number;
    deviceErrorCount: number;
    connectionCount: number;
}

const props = defineProps<Props>();

const surplus = computed(() => props.totalSupplyKw - props.totalDemandKw);
</script>

<template>
    <section class="space-y-1 p-3 text-sm">
        <div>總耗電量：{{ totalDemandKw }} kW</div>
        <div>總供電量：{{ totalSupplyKw }} kW</div>
        <div :class="surplus >= 0 ? 'text-green-600' : 'text-red-600'">
            電力狀態：
            <span v-if="surplus >= 0">盈餘 {{ surplus }} kW</span>
            <span v-else>不足 {{ -surplus }} kW</span>
        </div>
        <div>設備數量：{{ deviceCount }} 台（含 {{ deviceErrorCount }} 台有 Error）</div>
        <div>管線數量：{{ connectionCount }} 條</div>
    </section>
</template>
