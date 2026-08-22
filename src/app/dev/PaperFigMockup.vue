<script setup lang="ts">
/**
 * PaperFigMockup —— Figma 匯出稿（src/paper_fig.css）的 Vue 轉換版
 *
 * 僅供設計參考、dev-only。依 harry 與使用者的討論分階段接上功能：
 * 目前只接上「已有現成 store action」的按鈕（復原／取消復原／縮放／基地切換／快捷鍵設定），
 * 其餘（匯出／匯入、視角切換分頁、設備選取列、分類 Tab、搜尋）維持純視覺，
 * 因為缺對應的 action 或資料模型（詳見對話紀錄／docs/harry）。
 *
 * 轉換時一併清掉原始 Figma 匯出的雜訊：
 *   - 重複出現兩次的「View Select」區塊（僅保留一份）
 *   - 科學記號角度（如 3.5e-15deg）與 alpha=0 的透明邊框（視覺上等於無效果，直接移除）
 *   - 浮點誤差像素值（如 54.999996185302734px）四捨五入成整數
 *   - font-[HarmonyOS_Sans_TC]：專案未註冊此字型，移除後 fallback 回 style.css 的預設字型
 */
import { computed } from 'vue';
import { useHistoryStore } from '@/store/historyStore';
import { useCanvasStore, type BaseRegion } from '@/store/canvasStore';
import { useKeybindingStore } from '@/store/keybindingStore';
import { useValidation } from '@/composables/useValidation';
import { useFlowEngine } from '@/composables/useFlowEngine';
import FactoryCanvas from '@/editor/canvas/FactoryCanvas.vue';

/** 歷史堆疊 store：復原／取消復原按鈕 */
const historyStore = useHistoryStore();
/** 畫布視圖狀態 store：縮放倍率、基地選擇 */
const canvasStore = useCanvasStore();
/** 快捷鍵配置 store：設定按鈕開啟快捷鍵設定介面 */
const keybindingStore = useKeybindingStore();

/**
 * 本頁獨立於 MainLayout.vue 掛載，需要自己啟動 CR-03 驗證與 CR-04 FlowEngine 監聽，
 * 否則中間嵌入的真實 FactoryCanvas 不會有效率／堵塞 overlay。順序需與 MainLayout.vue
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
 * 基地選單選項。`wuling` 目前專案內沒有既定中文譯名（搜尋全專案皆無對應字串），
 * 故直接顯示英文 id，避免自行杜撰名稱。
 */
const baseRegionItems: { label: string; value: BaseRegion }[] = [
    { label: '四號谷地', value: 'valley4' },
    { label: 'wuling', value: 'wuling' },
    { label: '自由畫布', value: null },
];
</script>

<template>
    <div class="paper-fig-mockup flex flex-col gap-4 bg-[#1a1a1c] p-4 text-white">
        <p class="text-xs text-zinc-500">
            設計參考頁（dev-only）——
            僅「復原／取消復原／縮放／基地切換／快捷鍵設定」五顆按鈕為真實功能，其餘為靜態視覺。
        </p>

        <!-- 頂部標題列 -->
        <div
            class="flex h-14 items-center justify-between bg-[#2b2b2b] px-3 shadow-[0px_4px_4px_rgba(0,0,0,0.25)]"
        >
            <div class="flex items-center gap-3">
                <div class="flex h-14 items-stretch">
                    <div class="w-13.25 bg-[#EEFD1C]" />
                    <div class="w-1 bg-[#E3007E]" />
                    <div class="w-1 bg-[#00FFFF]" />
                </div>
                <div>
                    <p class="text-xs font-light text-[#A4A4A4]">ver1.0.0</p>
                    <p class="text-2xl text-white">終末地集成工業模擬器</p>
                </div>
            </div>

            <div class="flex items-center gap-2">
                <!-- 快捷鍵設定：接 keybindingStore.openSettingsPanel() -->
                <UButton
                    icon="i-lucide-settings"
                    color="neutral"
                    variant="soft"
                    aria-label="快捷鍵設定"
                    @click="keybindingStore.openSettingsPanel()"
                />

                <!-- 縮放：接 canvasStore.zoom / setZoom（尚未接回真實畫布 viewport，見下方說明） -->
                <div class="flex w-56 items-center gap-2 bg-[#4E4E4E] px-3 py-2">
                    <UIcon name="i-lucide-zoom-out" class="size-4 shrink-0" />
                    <USlider v-model="zoomInput" :min="0.1" :max="4" :step="0.1" size="sm" />
                    <UIcon name="i-lucide-zoom-in" class="size-4 shrink-0" />
                </div>

                <!-- 取消復原：接 historyStore.redo() -->
                <UButton
                    icon="i-lucide-redo-2"
                    color="neutral"
                    variant="soft"
                    aria-label="取消復原"
                    :disabled="!historyStore.canRedo"
                    @click="historyStore.redo()"
                />
                <!-- 復原：接 historyStore.undo() -->
                <UButton
                    icon="i-lucide-undo-2"
                    color="neutral"
                    variant="soft"
                    aria-label="復原"
                    :disabled="!historyStore.canUndo"
                    @click="historyStore.undo()"
                />

                <!-- 匯出／匯入：尚無對應 action（CR-06 藍圖匯出尚未實作），維持視覺、停用 -->
                <UButton
                    icon="i-lucide-download"
                    color="neutral"
                    variant="soft"
                    disabled
                    aria-label="匯出（尚未實作）"
                />
                <UButton
                    icon="i-lucide-upload"
                    color="neutral"
                    variant="soft"
                    disabled
                    aria-label="匯入（尚未實作）"
                />

                <!-- 基地切換：接 canvasStore.baseRegion / setBaseRegion -->
                <USelect
                    :model-value="canvasStore.baseRegion"
                    :items="baseRegionItems"
                    class="w-32"
                    @update:model-value="(v: BaseRegion) => canvasStore.setBaseRegion(v)"
                />
            </div>
        </div>

        <!-- 視角切換分頁：CR-05「視角」概念目前無對應狀態，維持靜態視覺 -->
        <div class="flex h-8 items-center gap-4 bg-[#4E4E4E] px-3">
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

        <!-- 中間畫面：真實的 FactoryCanvas.vue（非重繪，直接複用正式產線畫布元件），
             用來預覽這份設計稿的頂部工具列跟實際可操作畫布放在一起的樣子 -->
        <div class="relative h-150 w-full overflow-hidden border border-zinc-700">
            <FactoryCanvas />
        </div>

        <!-- 底部設備選取列：mockup 的設備名稱與現有 EquipmentType / Machine.id 對不上，
             需要先決定映射方式才能接 editorStore.armPlacement()，本次維持靜態視覺 -->
        <div class="bg-[#4E4E4E] p-3">
            <div class="mb-2 flex gap-2">
                <button
                    v-for="tag in ['加工', '種植', '電力', '物流', '儲存', '武器', '採集']"
                    :key="tag"
                    class="rounded-[15px] bg-[#3C3C3C] px-3 py-1 text-sm font-light text-white"
                    disabled
                >
                    {{ tag }}
                </button>
            </div>
            <div
                class="mb-2 flex items-center gap-2 border border-[#EEFD1C] bg-[#3C3C3C] px-3 py-2"
            >
                <UIcon name="i-lucide-search" class="size-4" />
                <span class="text-sm font-thin text-white/50">搜尋設備...</span>
            </div>
            <div class="flex flex-wrap gap-3">
                <div
                    v-for="(equip, index) in [
                        '電動採礦平台',
                        '種子採摘單位',
                        '種植單元',
                        '碎紙機設施',
                        '煉油單元',
                        '裝配單元',
                        '裝配單元',
                    ]"
                    :key="`${equip}-${index}`"
                    class="w-32 border-t-4 border-[#EEFD1C] bg-[#2b2b2b] p-2 text-center"
                >
                    <div class="mb-1 h-20 w-full bg-[#3C3C3C]" />
                    <p class="text-sm font-light text-white">{{ equip }}</p>
                </div>
            </div>
        </div>
    </div>
</template>
