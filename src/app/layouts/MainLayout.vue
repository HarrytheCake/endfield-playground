<script setup lang="ts">
import { ref } from 'vue';
import Navbar from '@/editor/navbar/Navbar.vue';
import ProjectSidebar from '@/editor/sidebar/ProjectSidebar.vue';
import ToolbarPanel from '@/editor/toolbar/ToolbarPanel.vue';
import LayoutView from '@/editor/layout/LayoutView.vue';
import StatsPanel from '@/app/StatsPanel/Index.vue';
import { useFlowEngine } from '@/composables/useFlowEngine';
import { useValidation } from '@/composables/useValidation';

/** 左側專案選單目前是否展開，預設收合 */
const sidebarOpen = ref(false);

/**
 * 左側設備資訊面板是否顯示。  \
 * 稿上這塊是「選取後才滑出」，但選取資料要等 C1／P1 才有，本週先把槽位留在 DOM 裡、
 * 預設隱藏，讓後續接選取時只需改這個值的來源，不必再動版面。
 */
const devicePanelVisible = ref(false);

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
            <Navbar :sidebar-open="sidebarOpen" @toggle-sidebar="sidebarOpen = !sidebarOpen" />
        </header>

        <div class="area-workspace">
            <ProjectSidebar v-model:open="sidebarOpen" />

            <!-- 畫布與疊在其上的浮層共用同一個定位容器；工具列（#48）以 absolute 貼齊此容器底緣 -->
            <div class="area-stage">
                <div class="area-canvas">
                    <LayoutView />
                </div>
                <aside v-show="devicePanelVisible" class="area-device-panel" />
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
 * isolation 讓內部浮層的 z-index 只在 stage 內比較；否則工具列的 z-index
 * 會蓋過 ProjectSidebar 展開時疊在畫布上的面板。
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

.area-device-panel {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 10;
    width: 280px;
    border-right: 1px solid #27272a;
    background: #111113;
}

/*
 * 現行 ToolbarPanel 以 height: 100% 撐滿父層，故先給固定高度沿用舊底欄的 148px。
 * #48 合入後其根節點自帶 absolute 定位與收合，屆時改為不設高度＋pointer-events: none，
 * 否則收合後此區仍會擋住畫布下緣的點擊。
 */
.area-toolbar-dock {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 20;
    height: 148px;
    border-top: 1px solid #27272a;
}

.area-stats-toggle {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    z-index: 30;
}

.area-stats {
    width: 320px;
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

/* 內容寬度固定，收合動畫期間只裁切、不讓 StatsPanel 跟著重排 */
.area-stats__body {
    width: 320px;
}
</style>
