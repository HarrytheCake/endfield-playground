<template>
    <div class="stats-panel pt-4">
        <h2 class="mb-4 text-lg font-semibold text-white">統計面板</h2>
        <PowerSummary
            :total-demand-kw="0"
            :total-supply-kw="0"
            :device-count="0"
            :device-error-count="0"
            :connection-count="0"
        />
        <ItemSummaryTable :rows="[]" />
        <TicketEstimate :rows="[]" :total-ticket-per-hour="0" />
        <WarehouseEstimate :capacity-cells="0" :rows="[]" />
    </div>
</template>

<script setup lang="ts">
import PowerSummary from './PowerSummary.vue';
import ItemSummaryTable from './ItemSummaryTable.vue';
import TicketEstimate from './TicketEstimate.vue';
import WarehouseEstimate from './WarehouseEstimate.vue';
</script>
