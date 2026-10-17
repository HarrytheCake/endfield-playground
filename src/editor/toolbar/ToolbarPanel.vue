<script setup lang="ts">
/**
 * 下方工具列：視角分頁＋可收合的真機器選取列（#48 版面）
 *
 * 機器清單取自 `listToolbarMachines`；點選卡片只更新共用的落子意圖（`usePlacementIntent`），
 * 由畫布讀取後落子，本元件不 import Pinia。
 */
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import type { MachineCategory } from '@/types/machine';
import { usePlacementIntent } from '@/editor/toolbar/usePlacementIntent';
import {
    TOOLBAR_MACHINE_TAGS,
    listToolbarMachines,
    type ToolbarMachineRow,
} from '@/editor/toolbar/toolbarMachines';

/** 定義由上層傳入的 Props */
const props = defineProps<{
    /** 目前選取的視角 ID（layout / process / parallel） */
    selectedView?: string | null;
}>();

/** 定義發送給上層的事件 */
const emit = defineEmits<{
    /** 點擊視角分頁；實際切換由上層處理 */
    (e: 'view-click', viewId: string): void;
}>();

/** 真機器的暫態落子意圖；與畫布共用，不寫入藍圖 store */
const { armedMachineId, arm, disarm } = usePlacementIntent();

/** 分類 Tab 的值：「全部」或資料庫分類 */
type CategoryTab = '全部' | MachineCategory;

/** 控制底部設備選取列的開關狀態 */
const bottomBarOpen = ref(true);

/** 記錄目前選取的分類 Tab */
const activeCategory = ref<CategoryTab>('全部');

/** 搜尋關鍵字狀態 */
const searchQuery = ref('');

/** 設備卡片列（可橫向捲動容器）的 DOM 參照 */
const scrollerRef = ref<HTMLElement | null>(null);

/** 物件欄是否還能向左捲動（控制左側 scrolling hint 顯示） */
const canScrollLeft = ref(false);
/** 物件欄是否還能向右捲動（控制右側 scrolling hint 顯示） */
const canScrollRight = ref(false);

/** 切換底部設備選取列的展開／收合 */
function toggleBottomBar() {
    bottomBarOpen.value = !bottomBarOpen.value;
}

/**
 * 無修飾鍵的 `Z` 切換底部選取列；輸入框內與 Ctrl／Meta／Alt 組合鍵不處理。
 * @param event 全域鍵盤事件
 */
function handleKeyDown(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    const isEditable =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
    if (isEditable) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key.toLowerCase() === 'z') {
        toggleBottomBar();
    }
}

/** 依目前捲動位置更新左右 scrolling hint 的顯示狀態 */
function updateScrollHints() {
    const el = scrollerRef.value;
    if (!el) {
        canScrollLeft.value = false;
        canScrollRight.value = false;
        return;
    }
    /** 保留 1px 容差，避免小數點捲動位置造成誤判 */
    canScrollLeft.value = el.scrollLeft > 1;
    canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
}

/**
 * 將垂直滾輪轉為卡片列的水平捲動。
 * @param event 卡片列上的滾輪事件
 */
function handleWheelScroll(event: WheelEvent) {
    const target = event.currentTarget as HTMLElement;
    target.scrollLeft += event.deltaY;
}

/** 監看卡片列尺寸變化以更新捲動提示；元件卸載時中止 */
let resizeObserver: ResizeObserver | null = null;

/** 掛載時註冊 `Z` 鍵監聽並開始監看卡片列尺寸 */
onMounted(() => {
    window.addEventListener('keydown', handleKeyDown);
    updateScrollHints();
    if (scrollerRef.value && typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(updateScrollHints);
        resizeObserver.observe(scrollerRef.value);
    }
});

/** 卸載時移除鍵盤監聽並停止尺寸監看 */
onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown);
    resizeObserver?.disconnect();
});

/** 視角切換分頁清單 */
const viewTabs: Array<{ id: string; label: string }> = [
    { id: 'layout', label: '佈局視角' },
    { id: 'process', label: '流程視角' },
    { id: 'parallel', label: '並列視角' },
];

/** 分類 Tab：「全部」＋資料庫分類（順序同 `TOOLBAR_MACHINE_TAGS`） */
const categoryTabs: readonly CategoryTab[] = ['全部', ...TOOLBAR_MACHINE_TAGS];

/** 依目前分類取出的真機器列；「全部」為各分類合併，同一機型只列一次 */
const categoryMachines = computed<ToolbarMachineRow[]>(() => {
    if (activeCategory.value !== '全部') {
        return listToolbarMachines(activeCategory.value);
    }
    const seen = new Set<string>();
    return TOOLBAR_MACHINE_TAGS.flatMap(listToolbarMachines).filter((row) => {
        if (seen.has(row.id)) return false;
        seen.add(row.id);
        return true;
    });
});

/** 再依搜尋關鍵字過濾（比對中文名稱與機型 id） */
const filteredMachines = computed(() => {
    const query = searchQuery.value.trim().toLowerCase();
    if (!query) return categoryMachines.value;
    return categoryMachines.value.filter(
        (row) => row.name.toLowerCase().includes(query) || row.id.toLowerCase().includes(query),
    );
});

/** 過濾結果改變後，DOM 更新完再重新判斷是否還能捲動 */
watch(
    filteredMachines,
    () => {
        nextTick(updateScrollHints);
    },
    { flush: 'post' },
);

/** 視角按鈕點擊，僅發送事件，實際切換邏輯交由父層處理 */
function handleViewClick(viewId: string) {
    emit('view-click', viewId);
}

/**
 * 切換分類；清單換了，原本拿起的機型可能已不在畫面上，故一併解除落子意圖。
 * @param tab 目標分類
 */
function handleCategoryClick(tab: CategoryTab) {
    activeCategory.value = tab;
    disarm();
}

/**
 * 點選真機器卡片：武裝落子意圖，再點同一台則取消。
 * @param row 被點選的機器列
 */
function handleMachineClick(row: ToolbarMachineRow) {
    arm(row.id);
}
</script>

<template>
    <!-- 永遠釘死在畫布最底端 -->
    <div class="pointer-events-none absolute bottom-0 left-0 z-50 flex w-full flex-col">
        <!-- 懸浮控制層：32px (左上角視角按鈕與收合三角形) -->
        <div class="relative h-[32px] w-full shrink-0">
            <!-- 視角切換分頁：474x32 -->
            <div
                class="pointer-events-auto absolute bottom-0 left-0 flex h-[32px] w-[474px] items-center rounded-tr-[25px] bg-[#4E4E4E] pl-[80px]"
            >
                <!-- 按鈕與分隔線群組：彼此間距各 5px -->
                <div class="flex items-center gap-[5px]">
                    <template v-for="(tab, index) in viewTabs" :key="tab.id">
                        <button
                            type="button"
                            class="flex h-[26px] w-[80px] cursor-pointer items-center justify-center rounded-[8px] text-[16px] leading-none font-light text-white transition-colors duration-300 ease-out"
                            :class="props.selectedView === tab.id ? 'bg-[#3C3C3C]' : 'bg-[#4E4E4E]'"
                            :aria-label="`切換至 ${tab.label}`"
                            :aria-pressed="props.selectedView === tab.id"
                            @mousedown="handleViewClick(tab.id)"
                        >
                            {{ tab.label }}
                        </button>
                        <span
                            v-if="index < viewTabs.length - 1"
                            class="h-[19px] w-0 shrink-0 border-l border-white"
                        ></span>
                    </template>
                </div>

                <p class="ml-2 text-xs font-light text-[#A4A4A4]">(按TAB切換視角)</p>
            </div>

            <!-- 底部設備選取列開關：黃色三角形 -->
            <button
                type="button"
                class="group pointer-events-auto absolute bottom-0 left-1/2 flex h-[32px] w-[64px] -translate-x-1/2 cursor-pointer items-center justify-center"
                :aria-label="bottomBarOpen ? '收合底部設備選取列' : '展開底部設備選取列'"
                :aria-expanded="bottomBarOpen"
                @click="toggleBottomBar"
            >
                <span
                    class="size-0 border-x-[19.5px] border-b-[19.79px] border-x-transparent border-b-[#EEFD1C] opacity-80 transition-transform group-hover:opacity-100"
                    :class="bottomBarOpen ? 'rotate-180' : ''"
                />
            </button>
        </div>

        <!-- 實體面板：CSS Grid 動畫 -->
        <div
            class="pointer-events-auto grid w-full transition-all duration-300 ease-in-out"
            :class="bottomBarOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'"
        >
            <div class="overflow-hidden">
                <!-- 鎖定面板高度為 208px -->
                <div
                    class="flex h-[208px] w-full shrink-0 flex-col bg-[#4e4e4e] px-[80px] pt-[23px]"
                >
                    <!-- 上排：搜尋框 + 分類 Tab -->
                    <div
                        class="mb-[18px] flex h-[43px] w-[1114px] shrink-0 items-center gap-[18px]"
                    >
                        <!-- 搜尋框 -->
                        <label
                            class="flex h-full w-[218px] cursor-text items-center gap-2 rounded-full border border-[#eefd1c] bg-[#3c3c3c] px-[18px]"
                        >
                            <svg
                                width="25"
                                height="25"
                                viewBox="0 0 25 25"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                class="shrink-0"
                            >
                                <path
                                    d="M24.2252 21.2744L18.3035 16.2379C17.6913 15.687 17.0366 15.434 16.5078 15.4584C17.9056 13.821 18.75 11.6968 18.75 9.37502C18.75 4.19732 14.5527 0 9.37501 0C4.19732 0 0 4.19732 0 9.37502C0 14.5527 4.19732 18.75 9.37501 18.75C11.6967 18.75 13.821 17.9057 15.4584 16.5078C15.434 17.0366 15.6869 17.6913 16.2379 18.3035L21.2743 24.2252C22.1367 25.1833 23.5454 25.2641 24.4047 24.4047C25.264 23.5454 25.1833 22.1367 24.2252 21.2744ZM9.37501 15.625C5.92325 15.625 3.125 12.8268 3.125 9.37502C3.125 5.92326 5.92325 3.12501 9.37501 3.12501C12.8268 3.12501 15.625 5.92326 15.625 9.37502C15.625 12.8268 12.8268 15.625 9.37501 15.625Z"
                                    fill="white"
                                />
                            </svg>
                            <input
                                v-model="searchQuery"
                                type="text"
                                placeholder="搜尋設備..."
                                aria-label="搜尋設備"
                                class="w-full bg-transparent text-[20px] leading-none font-[250] tracking-[0.03em] text-white/50 placeholder:text-white/50 focus:outline-none"
                            />
                        </label>

                        <!-- 分類 Tab -->
                        <button
                            v-for="tab in categoryTabs"
                            :key="tab"
                            type="button"
                            @click="handleCategoryClick(tab)"
                            class="h-[43px] w-[110px] cursor-pointer rounded-[15px] text-[20px] leading-none font-light tracking-[0.03em] text-white transition-colors duration-300 ease-out"
                            :class="activeCategory === tab ? 'bg-[#2b2b2b]' : 'bg-[#3c3c3c]'"
                            :aria-label="`切換至 ${tab} 分類`"
                            :aria-pressed="activeCategory === tab"
                        >
                            {{ tab }}
                        </button>
                    </div>

                    <!-- 下排：設備卡片列（外層 relative 容器，用來定位左右 scrolling hint） -->
                    <div class="relative h-[100px] w-[1760px] shrink-0">
                        <!-- 綁定 @wheel.prevent 事件來轉換垂直滾動為水平滾動 -->
                        <div
                            ref="scrollerRef"
                            class="flex h-full w-full items-start gap-[18px] overflow-x-auto [&::-webkit-scrollbar]:hidden"
                            style="scrollbar-width: none"
                            @wheel.prevent="handleWheelScroll"
                            @scroll="updateScrollHints"
                        >
                            <!-- 無搜尋結果提示 -->
                            <div
                                v-if="filteredMachines.length === 0"
                                class="flex h-[100px] w-full items-center justify-center text-[20px] font-light text-white/50"
                            >
                                {{
                                    activeCategory !== '全部'
                                        ? `在「${activeCategory}」分類中`
                                        : ''
                                }}找不到符合「{{ searchQuery }}」的設備
                            </div>

                            <!-- 物件卡片 -->
                            <button
                                v-for="machine in filteredMachines"
                                :key="machine.id"
                                type="button"
                                :title="`${machine.name}（${machine.sizeText}）`"
                                :aria-pressed="armedMachineId === machine.id"
                                @click="handleMachineClick(machine)"
                                class="relative h-[100px] w-[266px] shrink-0 cursor-pointer text-left focus:outline-none"
                            >
                                <!-- 深色背景層 -->
                                <div
                                    class="absolute top-[14px] left-0 h-[78px] w-full rounded-t-[8px] transition-colors duration-300 ease-out"
                                    :class="
                                        armedMachineId === machine.id
                                            ? 'bg-[#1c1c1c]'
                                            : 'bg-[#2b2b2b] active:bg-[#1c1c1c]'
                                    "
                                ></div>

                                <!-- 黃色底線層 -->
                                <div
                                    class="absolute top-[92px] left-0 h-[4px] w-full rounded-b-[8px] bg-[#eefd1c] transition-shadow duration-100"
                                    :class="
                                        armedMachineId === machine.id
                                            ? 'shadow-[0_2px_4px_rgba(238,253,28,0.5)]'
                                            : 'shadow-none'
                                    "
                                ></div>

                                <!-- 圖片容器：100x100 完整紅色中空方框標示範圍 -->
                                <div
                                    class="absolute top-0 left-0 flex h-[100px] w-[100px] items-center justify-center border-[2px] border-red-500 bg-transparent"
                                >
                                    <!-- 之後放置真實圖片的地方 -->
                                </div>

                                <!-- 文字層 -->
                                <span
                                    class="absolute top-[41px] left-[107px] text-[20px] leading-none font-light tracking-[0.03em] text-white"
                                >
                                    {{ machine.name }}
                                </span>
                            </button>
                        </div>

                        <!-- 左側 scrolling hint：20x100，僅在還能向左捲動時顯示 -->
                        <div
                            v-if="canScrollLeft"
                            aria-hidden="true"
                            class="pointer-events-none absolute top-0 left-0 z-10 h-[100px] w-[20px] bg-[linear-gradient(to_right,rgba(60,60,60,1),rgba(71,71,71,0))]"
                        >
                            <!-- 三角形佔位：8x14，上下各 43、左 10、右 2 -->
                            <div class="absolute top-[43px] left-[10px] h-[14px] w-[8px]">
                                <!-- 實際三角形：寬 6.6、高 14，頂點靠左 -->
                                <span
                                    class="block size-0 border-y-[7px] border-r-[6.6px] border-y-transparent border-r-white"
                                ></span>
                            </div>
                        </div>

                        <!-- 右側 scrolling hint：與左側完全水平對稱（整個元件水平翻轉） -->
                        <div
                            v-if="canScrollRight"
                            aria-hidden="true"
                            class="pointer-events-none absolute top-0 right-0 z-10 h-[100px] w-[20px] scale-x-[-1] bg-[linear-gradient(to_right,rgba(60,60,60,1),rgba(71,71,71,0))]"
                        >
                            <div class="absolute top-[43px] left-[10px] h-[14px] w-[8px]">
                                <span
                                    class="block size-0 border-y-[7px] border-r-[6.6px] border-y-transparent border-r-white"
                                ></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
