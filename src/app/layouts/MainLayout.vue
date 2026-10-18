<script setup lang="ts">
import { computed, ref } from 'vue';
import Navbar from '@/editor/navbar/Navbar.vue';
import ToolbarPanel from '@/editor/toolbar/ToolbarPanel.vue';
import LayoutView from '@/editor/layout/LayoutView.vue';
import StatsPanel from '@/app/StatsPanel/Index.vue';
import MachineCard, { type MachineCardProps } from '@/app/MachineCard/Index.vue';
import { useLayoutStore } from '@/store/layoutStore';
import { getMachineById } from '@/data/machines';
import { useFlowEngine } from '@/composables/useFlowEngine';
import { useValidation } from '@/composables/useValidation';

/** 讀取已放置設備，供左側面板由選中 id 反查設備實例 */
const layoutStore = useLayoutStore();

/**
 * 目前選中的設備實例 id，`null` 表示未選取。  \
 * 只有左側面板消費，依主編裁決 A-3 暫放本地；多重選取需要跨元件共用時再搬進 store。
 */
const selectedDeviceId = ref<string | null>(null);

/**
 * 選中設備轉成 MachineCard 的 props；找不到設備或機器定義時為 `null`，面板隨之隱藏。  \
 * 每次從 store 反查而非保存快照：設備被復原移除後面板自動收起，不會顯示已不存在的設備。
 * 尺寸取 0° 靜態值，因為旋轉尚未開放；配方清單本週不轉接，交給 MachineCard 的預設呈現。
 */
const selectedMachineCard = computed<MachineCardProps | null>(() => {
    const device = layoutStore.devices.find((d) => d.id === selectedDeviceId.value);
    if (!device) return null;
    const machine = getMachineById(device.machineType);
    if (!machine) return null;
    return {
        id: device.id,
        name: machine.name,
        sizeText: `${machine.width}×${machine.height}`,
        /** 負值（含 -1 資料未定義）不是耗電量，留給卡片顯示佔位符號 */
        power: machine.power >= 0 ? `${machine.power}kW` : undefined,
    };
});

/**
 * 右側產線總覽是否展開，預設展開。  \
 * 收合只把欄寬歸零、不卸載 StatsPanel，避免面板內的輸入（如倉庫容量）在開合之間被重置。
 */
const statsOpen = ref(true);

/**
 * 啟動 CR-03 驗證監聽（藍圖變動時 sync 重跑所有 detector）。  \
 * 必須在 useFlowEngine() 之前呼叫，FlowEngine 才能讀到最新的 alerts。
 */
useValidation();

/** 啟動 CR-04 FlowEngine 監聽（watch + debounce 150ms） */
useFlowEngine();
</script>

<template>
    <div class="editor-layout">
        <header class="area-navbar">
            <Navbar />
        </header>

        <div class="area-workspace">
            <!-- 畫布與疊在其上的浮層共用同一個定位容器；工具列（#48）以 absolute 貼齊此容器底緣 -->
            <div class="area-stage">
                <div class="area-canvas">
                    <LayoutView @select-device="selectedDeviceId = $event" />
                </div>
                <aside v-if="selectedMachineCard" class="area-device-panel">
                    <MachineCard v-bind="selectedMachineCard" />
                </aside>
                <section class="area-toolbar-dock">
                    <ToolbarPanel />
                </section>
                <!--
                    放在 stage 內而非 aside 內：收合後 aside 寬度為 0，按鈕仍需留在畫面上。
                    外包一層 div 承接定位：scoped style 的 data-v 屬性傳不進 UButton 的根節點。
                -->
                <div class="area-stats-toggle">
                    <UButton
                        size="sm"
                        color="neutral"
                        variant="soft"
                        :icon="
                            statsOpen ? 'i-lucide-panel-right-close' : 'i-lucide-panel-right-open'
                        "
                        :aria-label="statsOpen ? '收合產線總覽' : '展開產線總覽'"
                        :aria-expanded="statsOpen"
                        aria-controls="area-stats"
                        @click="statsOpen = !statsOpen"
                    />
                </div>
            </div>

            <aside id="area-stats" class="area-stats" :class="{ 'is-collapsed': !statsOpen }">
                <div class="area-stats__body">
                    <StatsPanel />
                </div>
            </aside>
        </div>
    </div>
</template>

<style scoped>
.editor-layout {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background: #09090b;
}

.area-navbar {
    height: 56px;
    flex-shrink: 0;
    border-bottom: 1px solid #27272a;
}

.area-workspace {
    display: flex;
    flex: 1;
    min-height: 0;
    min-width: 0;
}

/*
 * isolation 讓內部浮層的 z-index 只在 stage 內比較，
 * 不與 stage 以外的頂欄、右側欄互相覆蓋。
 */
.area-stage {
    position: relative;
    isolation: isolate;
    flex: 1;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
}

.area-canvas {
    position: absolute;
    inset: 0;
}

/*
 * 寬度＝MachineCard 設計寬 451px；卡片自帶底板，本槽不另鋪底色。
 * 高度隨卡片而不撐滿：卡片下方留給畫布接點擊。畫面比卡片矮時改由本槽捲動。
 */
.area-device-panel {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 10;
    width: 451px;
    max-height: 100%;
    overflow-y: auto;
}

/*
 * ToolbarPanel 根節點自帶 absolute 貼底定位與收合，本區只提供定位基準，不設高度。
 * pointer-events: none 讓工具列以外（含收合後）的區域把點擊交還畫布；
 * 工具列自己的可點元件以 pointer-events-auto 接收事件。
 */
.area-toolbar-dock {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 20;
    pointer-events: none;
}

.area-stats-toggle {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    z-index: 30;
}

/* 寬度＝StatsPanel 設計寬 333px（主體 320＋標籤左凸 13）＋左邊框 1px */
.area-stats {
    width: 334px;
    flex-shrink: 0;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
    border-left: 1px solid #27272a;
    transition: width 150ms ease;
}

.area-stats.is-collapsed {
    width: 0;
    border-left-width: 0;
}

/*
 * 內容寬度固定，收合動畫期間只裁切、不讓 StatsPanel 跟著重排。
 * 高度撐滿欄位：StatsPanel 根節點是 h-full，這層沒有高度時會退回內容高度。
 */
.area-stats__body {
    width: 333px;
    height: 100%;
}
</style>
