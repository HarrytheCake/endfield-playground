<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';
import { onBeforeUnmount, onMounted, ref } from 'vue';

/** 側邊欄目前是否展開，雙向綁定給父層控制 */
const open = defineModel<boolean>('open', { required: true });
/** 目前裝置是否支援「滑鼠 hover 展開」互動（大螢幕 + 有實體滑鼠才啟用，觸控裝置不啟用避免誤觸） */
const canHoverExpand = ref(false);

/** 偵測裝置是否支援 hover 的 media query，於 onMounted 建立、onBeforeUnmount 釋放 */
let mediaQuery: MediaQueryList | null = null;

/**
 * 依目前 mediaQuery 是否匹配，同步 canHoverExpand 狀態。
 * 供初次掛載與螢幕尺寸 / 輸入裝置變化時共用。
 * @example
 * updateHoverCapability()
 */
function updateHoverCapability() {
    if (!mediaQuery) {
        return;
    }

    canHoverExpand.value = mediaQuery.matches;
}

/**
 * 滑鼠移入側邊欄時，若裝置支援 hover 展開則自動展開選單。
 * @example
 * handleMouseEnter()
 */
function handleMouseEnter() {
    if (!canHoverExpand.value) {
        return;
    }

    open.value = true;
}

/**
 * 滑鼠移出側邊欄時，若裝置支援 hover 展開則自動收合選單。
 * @example
 * handleMouseLeave()
 */
function handleMouseLeave() {
    if (!canHoverExpand.value) {
        return;
    }

    open.value = false;
}

/**
 * 觸控裝置沒有穩定的 hover 狀態，需在掛載時才能取得 window 建立 media query，
 * 藉此判斷當下裝置是否適合啟用「hover 展開」互動，並監聽裝置特性變化（如外接滑鼠）即時更新。
 */
onMounted(() => {
    mediaQuery = window.matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine)');
    updateHoverCapability();
    mediaQuery.addEventListener('change', updateHoverCapability);
});

/** 元件卸載時移除 media query 監聽，避免記憶體洩漏 */
onBeforeUnmount(() => {
    if (!mediaQuery) {
        return;
    }

    mediaQuery.removeEventListener('change', updateHoverCapability);
});

/** 頂部「專案」選單的項目清單，各項目對應之後的新建／匯入／匯出流程 */
const projectMenuItems: NavigationMenuItem[] = [
    {
        label: '新建專案',
        icon: 'i-lucide-file-plus-2',
        onSelect: () => {
            // TODO: 之後接實際新建流程
        },
    },
    {
        label: '匯入設計檔',
        icon: 'i-lucide-folder-open',
        onSelect: () => {
            // TODO: 之後接實際匯入流程
        },
    },
    {
        label: '匯出設計檔',
        icon: 'i-lucide-download',
        onSelect: () => {
            // TODO: 之後接實際匯出流程
        },
    },
];
</script>

<template>
    <USidebar
        v-model:open="open"
        collapsible="icon"
        rail
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
        :ui="{
            gap: 'h-[calc(100%-var(--ui-header-height))] w-16!',
            container:
                'absolute top-(--ui-header-height) bottom-0 h-[calc(100%-var(--ui-header-height))] bg-black',
        }"
    >
        <template #default="{ state }">
            <UNavigationMenu
                :items="projectMenuItems"
                orientation="vertical"
                :collapsed="state === 'collapsed'"
                :ui="{
                    link: 'p-1.5 overflow-hidden',
                }"
            />
        </template>
    </USidebar>
</template>
