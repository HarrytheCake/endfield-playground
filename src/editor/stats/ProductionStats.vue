<script setup lang="ts">
/**
 * 右側產線總覽容器（L2）
 *
 * 從 flowStore／validationStore／layoutStore 取值，轉成 StatsPanel（設計稿 Production Overview，L3）的 props。
 * 版面全部由 StatsPanel 負責；設計稿沒有的區塊（畫布概況、原料供給、計畫產物、機器用量、
 * 兌換率輸入、倉庫容量）已依使用者 2026-10-31 決定移除，等設計稿補上再加回。
 */
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import StatsPanel from '@/app/StatsPanel/Index.vue';
import { useFlowStore } from '@/store/flowStore';
import { useLayoutStore } from '@/store/layoutStore';
import { useValidationStore } from '@/store/validationStore';
import { toStatsPanelProps } from './toStatsPanelProps';

/** FlowEngine 計算結果：電力、品項產耗、自動交付調度券 */
const {
    totalPowerDemand,
    totalPowerSupply,
    itemSummary,
    deliveryTicketTotal,
    deliveryTicketRates,
} = storeToRefs(useFlowStore());

/** 驗證結果：轉成下半部 Tips */
const { alerts } = storeToRefs(useValidationStore());

/** 正式畫布的設備來源，空狀態不依賴引擎是否已有摘要。 */
const layoutStore = useLayoutStore();
/** 供展示層區分無設備與有設備但無摘要；不由 products 長度推定。 */
const hasDevices = computed(() => layoutStore.devices.length > 0);

/** 傳給 StatsPanel 的 props；任一來源變動即重算 */
const statsPanelProps = computed(() =>
    toStatsPanelProps({
        hasDevices: hasDevices.value,
        powerDemand: totalPowerDemand.value,
        powerSupply: totalPowerSupply.value,
        itemSummary: itemSummary.value,
        ticketTotal: deliveryTicketTotal.value,
        ticketRates: deliveryTicketRates.value,
        alerts: alerts.value,
    }),
);
</script>

<template>
    <StatsPanel v-bind="statsPanelProps" />
</template>
