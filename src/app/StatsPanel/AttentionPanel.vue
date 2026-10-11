<!-- Generated from Figma JSON. Regenerate through the converter instead of moving generated nodes manually. -->
<script setup lang="ts">
import { computed } from 'vue';
import iconErrorRaw from '@/assets/icon/icon error.svg?raw';
import iconWarningRaw from '@/assets/icon/icon warning.svg?raw';
import type { SingleTip } from './types';

/** 將錯誤圖示 SVG 的填色替換為設計稿指定的紅色（#FF6E6E） */
const iconErrorSvg = computed(() =>
    iconErrorRaw.replace(/fill="(?!none)[^"]*"/g, 'fill="#FF6E6E"'),
);

/** 將警告圖示 SVG 的填色替換為設計稿指定的黃色（#F7D945） */
const iconWarningSvg = computed(() =>
    iconWarningRaw.replace(/fill="(?!none)[^"]*"/g, 'fill="#F7D945"'),
);

/** 下半部提示與警報面板傳入屬性 */
defineProps<{
    /** 提示與警報訊息列表 */
    tips?: SingleTip[];
}>();
</script>

<template>
    <div
        data-figma-id="2302:83"
        data-figma-name="Attention"
        class="relative isolate m-0 box-border flex [width:320px] flex-1 shrink-0 flex-col overflow-hidden border-0 border-solid [background-color:#4e4e4e]"
    >
        <div class="flex shrink-0 items-center justify-between p-[18px] pb-2">
            <div
                data-figma-id="2302:94"
                data-figma-name="Title"
                class="m-0 box-border [height:23px] [width:38px] shrink-0 border-0 border-solid [text-align:left] [font-family:'HarmonyOS_Sans_TC',sans-serif] [font-size:20px] [line-height:23.44px] [font-weight:400] [color:#ffffff]"
            >
                Tips
            </div>
        </div>

        <!-- 提示與警報列表（純 CSS 捲軸） -->
        <div
            data-figma-id="2430:347"
            data-figma-name="tips"
            class="custom-scrollbar m-0 box-border flex flex-1 shrink-0 flex-col gap-[9px] overflow-x-hidden overflow-y-auto border-0 border-solid pr-[12px] pb-4 pl-[21px]"
        >
            <div
                v-for="(item, index) in tips"
                :key="index"
                class="relative isolate m-0 box-border flex min-h-[31px] w-full shrink-0 items-center overflow-hidden rounded border-0 border-solid py-[5px] pr-2"
                :class="
                    item.type === 'error'
                        ? '[background-color:rgba(255,_110,_110,_0.1)]'
                        : '[background-color:rgba(247,_217,_69,_0.1)]'
                "
            >
                <div
                    class="m-0 ml-[7px] box-border flex h-[23px] w-[24px] shrink-0 items-center justify-center self-center border-0"
                >
                    <div
                        class="h-full w-full [&>svg]:h-full [&>svg]:w-full"
                        v-html="item.type === 'error' ? iconErrorSvg : iconWarningSvg"
                    ></div>
                </div>
                <div
                    class="m-0 ml-[11px] box-border min-w-0 flex-1 border-0 [font-family:'HarmonyOS_Sans_TC',sans-serif] [font-size:18px] [line-height:21px] [font-weight:400] break-words"
                    :class="item.type === 'error' ? '[color:#ff6e6e]' : '[color:#f7d945]'"
                >
                    {{ item.text }}
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 9px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: #3c3c3c;
    border-radius: 25px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #ffffff;
    border-radius: 25px;
}
/* 向上箭頭按鈕：總高 11px，5px 箭頭置頂，下方自然留 6px (5~6px) 空隙 */
.custom-scrollbar::-webkit-scrollbar-button:single-button:vertical:decrement {
    height: 11px;
    width: 9px;
    background-color: transparent;
    background-repeat: no-repeat;
    background-position: center top;
    background-size: 9px 5px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 9 5' width='9' height='5'%3E%3Cpath d='M9 5L0 5L4.5 0L9 5Z' fill='%23FFFFFF'/%3E%3C/svg%3E");
}
/* 向下箭頭按鈕：總高 11px，5px 箭頭置底，上方自然留 6px (5~6px) 空隙 */
.custom-scrollbar::-webkit-scrollbar-button:single-button:vertical:increment {
    height: 11px;
    width: 9px;
    background-color: transparent;
    background-repeat: no-repeat;
    background-position: center bottom;
    background-size: 9px 5px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 9 5' width='9' height='5'%3E%3Cpath d='M0 0L9 0L4.5 5L0 0Z' fill='%23FFFFFF'/%3E%3C/svg%3E");
}
</style>
