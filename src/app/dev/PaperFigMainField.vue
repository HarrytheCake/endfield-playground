<script setup lang="ts">
/**
 * PaperFigMainField —— Figma 匯出稿（src/app/dev/paperfigv2.css）的 Vue 轉換版
 *
 * 僅供設計參考、dev-only。v2 座標顯示 Panel（工具列）與 View Select 是浮在 Canvas
 * 圖層正上方的絕對定位疊層，不是像 v1 那樣上下堆疊的獨立區塊，故本次重建改用 `absolute`
 * 疊層結構，並把原本的裝飾性 Canvas/Grid/Gradient/DashLine 換成真正可操作的 FactoryCanvas.vue。
 *
 * 工具列本身依 v2 原始量測還原成**單一連續長條**（標題區塊緊接著按鈕區塊，中間不斷開）。
 * 按鈕維持用 Nuxt UI `UButton`/`USlider`（符合 CLAUDE.md §4「優先使用 Nuxt UI」），
 * 但透過 `variant="ghost"` 先卸掉預設底色，再用 `:ui` prop（`base`/`leadingIcon`/`label` 等
 * slot class）蓋上設計稿的 55×55 扁平色塊尺寸與 `#4E4E4E`／`#EEFD1C` 配色——
 * 第一版偷懶只套用 `UButton` 預設外觀（圓角膠囊、預設色）才是跟設計稿長得不像的原因，
 * 不是「不能用 Nuxt UI」。
 *
 * v2 座標稿本身只涵蓋頂部工具列＋視角切換列，不含 v1 那份「底部設備選取列／分類
 * Tab／搜尋框」；該區塊改依 `paperfigbottombar.css` 另外還原為 `PaperFigBottomBar.vue`，
 * 預設收合、按 Z 鍵或畫布下緣的黃色三角形展開（見下方說明），與 v2 稿的頂部區塊分開維護。
 *
 * 只接上「已有現成 store action」的按鈕（復原／取消復原／縮放／基地切換／快捷鍵設定），
 * 其餘（匯出／匯入、視角切換分頁、「botton frame」圖示語意不明）維持純視覺。
 *
 * 底部設備選取列（`PaperFigBottomBar.vue`）預設收合，按 Z 鍵或點擊畫布下緣的黃色三角形
 * 展開/收合。用 flex-col + 條件渲染（非 absolute 疊在畫布上）讓 bottombar 展開時「畫布
 * 讓出空間」而非蓋住，故 bottombar 顯示時畫布本身會變矮，兩者不重疊。
 */
import { computed, ref } from 'vue';
import { useEventListener } from '@vueuse/core';
import { useHistoryStore } from '@/store/historyStore';
import { useCanvasStore, type BaseRegion } from '@/store/canvasStore';
import { useKeybindingStore } from '@/store/keybindingStore';
import { useValidation } from '@/composables/useValidation';
import { useFlowEngine } from '@/composables/useFlowEngine';
import FactoryCanvas from '@/editor/canvas/FactoryCanvas.vue';
import PaperFigBottomBar from '@/app/dev/PaperFigBottomBar.vue';

/** 歷史堆疊 store：復原／取消復原按鈕 */
const historyStore = useHistoryStore();
/** 畫布視圖狀態 store：縮放倍率、基地選擇 */
const canvasStore = useCanvasStore();
/** 快捷鍵配置 store：設定按鈕開啟快捷鍵設定介面 */
const keybindingStore = useKeybindingStore();

/**
 * 本頁獨立於 MainLayout.vue 掛載，需要自己啟動 CR-03 驗證與 CR-04 FlowEngine 監聽，
 * 否則疊層下方的真實 FactoryCanvas 不會有效率／堵塞 overlay。順序需與 MainLayout.vue
 * 一致：validation 必須先於 FlowEngine（FlowEngine 依賴 hasBlockingError 過濾）。
 */
useValidation();
useFlowEngine();

/** 縮放滑桿的 model；讀寫皆透過 canvasStore.zoom / setZoom（會 clamp 至 0.1~4） */
const zoomInput = computed({
    get: () => canvasStore.zoom,
    set: (value: number) => canvasStore.setZoom(value),
});

/**
 * 基地選單選項，依序循環（點擊「四號谷地」按鈕時切換至下一個）。
 * `wuling` 目前專案內沒有既定中文譯名（搜尋全專案皆無對應字串），故直接顯示英文 id。
 */
const baseRegionItems: { label: string; value: BaseRegion }[] = [
    { label: '四號谷地', value: 'valley4' },
    { label: 'wuling', value: 'wuling' },
    { label: '自由畫布', value: null },
];

/** 點擊「四號谷地」按鈕時，依 baseRegionItems 順序切換到下一個基地 */
function cycleBaseRegion() {
    const currentIndex = baseRegionItems.findIndex((item) => item.value === canvasStore.baseRegion);
    const next = baseRegionItems[(currentIndex + 1) % baseRegionItems.length];
    canvasStore.setBaseRegion(next.value);
}

/** 目前基地對應的顯示文字 */
const baseRegionLabel = computed(
    () =>
        baseRegionItems.find((item) => item.value === canvasStore.baseRegion)?.label ?? '自由畫布',
);

/** 底部設備選取列展開狀態，預設收合 */
const bottomBarOpen = ref(false);

function toggleBottomBar() {
    bottomBarOpen.value = !bottomBarOpen.value;
}

/** Z 鍵展開/收合底部設備選取列，固定綁在原生按鍵，本頁僅供設計參考不走 keybindingStore */
useEventListener(window, 'keydown', (event: KeyboardEvent) => {
    if ((event.key === 'z' || event.key === 'Z') && !event.repeat) {
        toggleBottomBar();
    }
});
</script>

<template>
    <div
        class="paper-fig-main-field flex h-screen w-screen flex-col gap-2 bg-[#1a1a1c] p-4 text-white"
    >
        <p class="shrink-0 text-xs text-zinc-500">
            設計參考頁（dev-only，v2）——
            工具列／視角列疊在真實畫布上方，僅「復原／取消復原／縮放／基地切換／快捷鍵設定」五顆按鈕為真實功能。按
            Z 鍵或點畫布下緣的黃色三角形展開/收合底部設備選取列。
        </p>

        <!-- 疊層容器：畫布鋪滿剩餘空間，工具列與視角列絕對定位浮在上方（比照 paperfigv2.css 的疊層結構） -->
        <div class="relative min-h-0 w-full flex-1 overflow-hidden border border-zinc-700">
            <!-- 底層：真實的 FactoryCanvas.vue（非重繪，直接複用正式產線畫布元件） -->
            <FactoryCanvas />

            <!-- 頂部工具列：單一連續長條，比照 paperfigv2.css 的 Panel（標題＋按鈕區塊緊接不斷開） -->
            <div
                class="absolute top-4 left-4 flex h-14 items-stretch overflow-hidden shadow-[0px_4px_4px_rgba(0,0,0,0.25)]"
            >
                <!-- 標題區塊：bg #2B2B2B，內含三色裝飾條 + 版本號 + 標題文字 -->
                <div class="relative flex w-105 items-center gap-4 bg-[#2b2b2b] pr-4">
                    <div class="flex h-14 shrink-0 items-stretch">
                        <div class="w-13.25 bg-[#EEFD1C]" />
                        <div class="flex w-1 flex-col">
                            <div class="h-4 bg-[#E3007E]" />
                            <div class="flex-1 bg-[#00FFFF]" />
                        </div>
                    </div>
                    <div class="flex flex-col gap-1">
                        <p class="text-2xl leading-none text-white">終末地集成工業模擬器</p>
                        <p class="self-end text-xs font-light text-[#A4A4A4]">ver1.0.0</p>
                    </div>
                </div>

                <!-- 按鈕區塊：緊接標題區塊，改用 UButton + :ui 覆寫還原設計稿的扁平色塊樣式，
                     依你確認的實際順序排列：快捷鍵設定/匯出/匯入/基地切換/復原/取消復原/botton frame/縮放 -->
                <div class="flex items-stretch">
                    <!-- 垂直分隔線 -->
                    <div class="my-auto h-13 w-px bg-white" />

                    <!-- 快捷鍵設定：接 keybindingStore.openSettingsPanel() -->
                    <UButton
                        icon="i-lucide-settings"
                        color="neutral"
                        variant="ghost"
                        :ui="{
                            base: 'size-13.75 rounded-lg justify-center bg-[#4E4E4E] hover:bg-[#4E4E4E]',
                            leadingIcon: 'size-6.25 text-white',
                        }"
                        aria-label="快捷鍵設定"
                        @click="keybindingStore.openSettingsPanel()"
                    />

                    <!-- 匯出／匯入：尚無對應 action（CR-06 藍圖匯出尚未實作），維持視覺、停用 -->
                    <UButton
                        icon="i-lucide-download"
                        color="neutral"
                        variant="ghost"
                        disabled
                        :ui="{
                            base: 'size-13.75 rounded-lg justify-center bg-[#4E4E4E] opacity-40',
                            leadingIcon: 'size-6.25 text-white',
                        }"
                        aria-label="匯出（尚未實作）"
                    />
                    <UButton
                        icon="i-lucide-upload"
                        color="neutral"
                        variant="ghost"
                        disabled
                        :ui="{
                            base: 'size-13.75 rounded-lg justify-center bg-[#4E4E4E] opacity-40',
                            leadingIcon: 'size-6.25 text-white',
                        }"
                        aria-label="匯入（尚未實作）"
                    />

                    <!-- 基地切換：接 canvasStore.baseRegion / setBaseRegion，點擊依序循環 -->
                    <UButton
                        :label="baseRegionLabel"
                        leading-icon="i-lucide-map-pin"
                        trailing-icon="i-lucide-chevron-down"
                        color="neutral"
                        variant="ghost"
                        :ui="{
                            base: 'w-56 h-13.75 justify-center rounded-t-lg rounded-b-none border-b-4 border-[#EEFD1C] bg-[#4E4E4E] hover:bg-[#4E4E4E] text-xl font-light',
                            leadingIcon: 'size-5 text-white',
                            trailingIcon: 'size-4 text-white',
                            label: 'text-white',
                        }"
                        @click="cycleBaseRegion"
                    />

                    <!-- 復原：接 historyStore.undo() -->
                    <UButton
                        icon="i-lucide-undo-2"
                        color="neutral"
                        variant="ghost"
                        :disabled="!historyStore.canUndo"
                        :ui="{
                            base: 'size-13.75 rounded-none justify-center bg-[#4E4E4E] hover:bg-[#4E4E4E] disabled:opacity-40',
                            leadingIcon: 'size-6.25 text-[#EEFD1C]',
                        }"
                        aria-label="復原"
                        @click="historyStore.undo()"
                    />
                    <!-- 取消復原：接 historyStore.redo() -->
                    <UButton
                        icon="i-lucide-redo-2"
                        color="neutral"
                        variant="ghost"
                        :disabled="!historyStore.canRedo"
                        :ui="{
                            base: 'size-13.75 rounded-none justify-center bg-[#4E4E4E] hover:bg-[#4E4E4E] disabled:opacity-40',
                            leadingIcon: 'size-6.25 text-[#EEFD1C]',
                        }"
                        aria-label="取消復原"
                        @click="historyStore.redo()"
                    />

                    <!-- 語意不明的圖示按鈕（v1/v2 皆命名為「botton frame」，非填色描邊圖形，無法判斷對應功能）：僅還原視覺，不接 action -->
                    <div class="flex size-13.75 items-center justify-center bg-[#4E4E4E]">
                        <div class="size-6 rotate-45 border-[3px] border-[#EEFD1C]" />
                    </div>

                    <!-- 縮放：接 canvasStore.zoom / setZoom（尚未接回真實畫布 viewport，見下方說明） -->
                    <div class="flex w-71 items-center gap-3 rounded-full bg-[#4E4E4E] px-4">
                        <UIcon name="i-lucide-search" class="size-6 shrink-0 text-white" />
                        <USlider
                            v-model="zoomInput"
                            :min="0.1"
                            :max="4"
                            :step="0.1"
                            size="sm"
                            class="flex-1"
                            :ui="{
                                track: 'bg-[#3C3C3C]',
                                range: 'bg-[#DADADA]',
                                thumb: 'bg-[#DADADA]',
                            }"
                        />
                    </div>
                </div>
            </div>

            <!-- 視角切換分頁：浮在畫布左下角。CR-05「視角」概念目前無對應狀態，維持靜態視覺 -->
            <div
                class="pointer-events-none absolute bottom-0 left-0 flex h-8 items-center gap-4 rounded-tr-[25px] bg-[#4E4E4E] px-3"
            >
                <p class="text-sm font-light text-[#A4A4A4]">(按TAB切換視角)</p>
                <button class="rounded-[5px] px-3 py-1 text-base font-light text-white" disabled>
                    佈局視角
                </button>
                <button class="rounded-[5px] px-3 py-1 text-base font-light text-white" disabled>
                    流程視角
                </button>
                <button class="rounded-[5px] px-3 py-1 text-base font-light text-white" disabled>
                    並列視角
                </button>
            </div>

            <!-- 底部設備選取列開關：黃色三角形，貼齊畫布下緣置中，按 Z 鍵可達到相同效果 -->
            <button
                class="group absolute bottom-0 left-1/2 flex h-4 w-8 -translate-x-1/2 items-end justify-center"
                :aria-label="bottomBarOpen ? '收合底部設備選取列' : '展開底部設備選取列'"
                :aria-expanded="bottomBarOpen"
                @click="toggleBottomBar"
            >
                <span
                    class="size-0 border-x-8 border-b-10 border-x-transparent border-b-[#EEFD1C] opacity-80 transition-transform group-hover:opacity-100"
                    :class="bottomBarOpen ? 'rotate-180' : ''"
                />
            </button>
        </div>

        <!-- 底部設備選取列：flex 排版讓出空間，不疊在畫布上，畫布在其上方 -->
        <PaperFigBottomBar v-if="bottomBarOpen" />
    </div>
</template>
