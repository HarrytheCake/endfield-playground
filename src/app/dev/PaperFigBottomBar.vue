<script setup lang="ts">
/**
 * PaperFigBottomBar —— Figma 匯出稿（src/app/dev/paperfigbottombar.css）的 Vue 轉換版
 *
 * 僅供設計參考、dev-only。原始 CSS 是「設備選取列」：上排搜尋框＋六顆分類 Tab，
 * 下排可橫向捲動的設備卡片列。原始檔重複了一份 View Select（佈局/流程/並列視角），
 * 但那份已經在 `PaperFigMainField.vue` 出現過，故本次轉換不重複還原，比照
 * `PaperFigMainField.vue` 對 v1 重複區塊的處理方式。
 *
 * 按鈕改用 Nuxt UI `UButton`（`variant="ghost"` 卸掉預設樣式後，用 `:ui` prop 蓋上
 * 設計稿量測到的尺寸與 `#2B2B2B`/`#3C3C3C`/`#EEFD1C` 配色），分類 Tab 與設備卡片皆無
 * 對應的 store/資料模型，維持純視覺、不接 action。設備圖片素材（`image_miner_2.png`
 * 等）不存在於本專案，改用 Lucide 圖示佔位。
 */
interface EquipmentItem {
    id: string;
    label: string;
    icon: string;
}

/** 分類 Tab，對齊 paperfigbottombar.css 的六顆「Botton」文字（加工/種植/電力/物流/儲存/武器） */
const categoryTabs = ['加工', '種植', '電力', '物流', '儲存', '武器'];

/**
 * 設備卡片，依 CSS 內 order 0~6 的圖片檔名（image_miner_2 等）對應猜測的中文名稱、
 * 圖示改用 Lucide 佔位（專案內無對應美術素材）。
 */
const equipmentItems: EquipmentItem[] = [
    { id: 'miner', label: '採礦機', icon: 'i-lucide-pickaxe' },
    { id: 'seedcollector', label: '採種機', icon: 'i-lucide-leaf' },
    { id: 'planter', label: '種植機', icon: 'i-lucide-sprout' },
    { id: 'grinder', label: '磨碎機', icon: 'i-lucide-cog' },
    { id: 'furnance', label: '熔爐', icon: 'i-lucide-flame' },
    { id: 'component_mc_1', label: '組裝機', icon: 'i-lucide-package' },
    { id: 'component_mc_2', label: '組裝機', icon: 'i-lucide-package' },
];
</script>

<template>
    <div class="flex h-57.25 w-full shrink-0 flex-col gap-4 bg-[#4e4e4e] px-20 pt-3">
        <!-- 上排：搜尋框 + 分類 Tab，對齊 CSS 內「Bar Search」與六顆「Botton」 -->
        <div class="flex h-10.75 shrink-0 items-center gap-4">
            <div
                class="flex h-full w-54.5 items-center gap-2 rounded-full border border-[#eefd1c] bg-[#3c3c3c] px-4"
            >
                <UIcon name="i-lucide-search" class="size-5 shrink-0 text-white" />
                <span class="text-sm font-light text-white/50">搜尋</span>
            </div>

            <UButton
                v-for="tab in categoryTabs"
                :key="tab"
                :label="tab"
                color="neutral"
                variant="ghost"
                disabled
                :ui="{
                    base: 'h-10.75 w-27.5 justify-center rounded-[15px] bg-[#3c3c3c] hover:bg-[#3c3c3c] opacity-100 disabled:opacity-100',
                    label: 'text-base font-light text-white',
                }"
                :aria-label="`分類：${tab}（尚未實作）`"
            />
        </div>

        <!-- 下排：可橫向捲動的設備卡片列，對齊 CSS 內「Botton Equipment」/重複的「Botton」 -->
        <div class="flex min-h-0 flex-1 items-center gap-5.5 overflow-x-auto pb-3">
            <UButton
                v-for="item in equipmentItems"
                :key="item.id"
                :icon="item.icon"
                :label="item.label"
                color="neutral"
                variant="ghost"
                disabled
                :ui="{
                    base: 'h-25 w-66.5 shrink-0 justify-start gap-4 rounded-t-lg rounded-b-none border-b-4 border-[#eefd1c] bg-[#2b2b2b] px-0 opacity-100 disabled:opacity-100',
                    leadingIcon: 'size-25 shrink-0 bg-[#1a1a1c] p-6.5 text-[#eefd1c]',
                    label: 'text-xl font-light text-white',
                }"
                :aria-label="`${item.label}（尚未實作）`"
            />
        </div>
    </div>
</template>
