<script setup lang="ts">
import iconErrorRaw from '@/assets/icon/icon error.svg?raw';
import iconWarningRaw from '@/assets/icon/icon warning.svg?raw';
import type { SingleTip } from './types';

/** 下半部提示與警報面板傳入屬性 */
defineProps<{
    /** 提示與警報訊息列表 */
    tips?: SingleTip[];
}>();

/** 將錯誤圖示 SVG 的填色替換為設計稿指定的紅色（#FF6E6E） */
const iconErrorSvg = iconErrorRaw.replace(/fill="(?!none)[^"]*"/g, 'fill="#FF6E6E"');

/** 將警告圖示 SVG 的填色替換為設計稿指定的黃色（#F7D945） */
const iconWarningSvg = iconWarningRaw.replace(/fill="(?!none)[^"]*"/g, 'fill="#F7D945"');
</script>

<template>
    <!-- 間距依設計稿 1080 高時的座標換算；tips 列表吃下所有剩餘高度 -->
    <div
        data-figma-id="2302:83"
        data-figma-name="Attention"
        class="flex min-h-0 w-[320px] flex-1 flex-col pt-[18px] pb-[22px]"
    >
        <div
            data-figma-id="2302:94"
            data-figma-name="Title"
            class="ml-[18px] h-[23px] shrink-0 text-[20px] leading-[23.44px] font-normal text-white"
        >
            Tips
        </div>

        <!-- 提示與警報列表：寬 256 + 13 間距 + 9 捲軸 = 278 -->
        <div
            data-figma-id="2430:347"
            data-figma-name="tips"
            class="stats-panel-scrollbar mt-[15px] ml-[21px] flex min-h-0 w-[278px] flex-1 flex-col gap-[9px] overflow-x-hidden overflow-y-auto pr-[13px] [scrollbar-gutter:stable]"
        >
            <!-- 內距 5/6px；文字固定寬 207，過長換行 -->
            <div
                v-for="(item, index) in tips"
                :key="index"
                :data-figma-name="item.type === 'error' ? 'Error' : 'Warning'"
                class="flex w-full shrink-0 items-center gap-[6px] px-[6px] py-[5px]"
                :class="
                    item.type === 'error'
                        ? 'bg-[#ff6e6e]/10 text-[#ff6e6e]'
                        : 'bg-[#f7d945]/10 text-[#f7d945]'
                "
            >
                <span
                    data-figma-name="Icon"
                    class="block h-[23px] shrink-0 [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
                    :class="item.type === 'error' ? 'w-[23px]' : 'w-[26px]'"
                    v-html="item.type === 'error' ? iconErrorSvg : iconWarningSvg"
                />
                <span
                    data-figma-name="Text"
                    class="w-[207px] shrink-0 text-[18px] leading-[21.096px] font-normal break-words"
                >
                    {{ item.text }}
                </span>
            </div>
        </div>
    </div>
</template>
