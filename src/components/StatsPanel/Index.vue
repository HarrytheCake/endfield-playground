<template>
  <div class="stats-panel">
    <h2>右側統計面板 (StatsPanel)</h2>
    <!-- 掛下面的檔案 -->
    <PowerSummary />
    <ItemSummaryTable />
    <TicketEstimate />
    <WarehouseEstimate />
  </div>
</template>

<script setup>
import PowerSummary from './PowerSummary.vue'
import ItemSummaryTable from './ItemSummaryTable.vue'
import TicketEstimate from './TicketEstimate.vue'
import WarehouseEstimate from './WarehouseEstimate.vue'
</script>
