<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import iconArrowRaw from '@/assets/icon/icon arrow.svg?raw';
import type { PowerData, SingleProductDetail } from './types';

/** 上半部統計與產能估算面板傳入屬性（高度由父層以 style 指定） */
const props = defineProps<{
    /** 電力消耗與供電統計數據 */
    power?: PowerData;
    /** 產能估算產品明細列表 */
    products?: SingleProductDetail[];
    /** 調度券每小時兌換效率（券/hr） */
    exchangeRate?: number;
}>();

/** 將展開箭頭 SVG 的填色替換為設計稿指定的灰色（#CFCFCF） */
const iconArrowSvg = iconArrowRaw.replace(/fill="(?!none)[^"]*"/g, 'fill="#CFCFCF"');

/** 本地產品明細清單副本，用於獨立控制各產品項目的展開與收合狀態 */
const localProducts = ref(props.products ? [...props.products] : []);

/** 監聽外部傳入的 products 變化並同步更新本地清單副本 */
watch(
    () => props.products,
    (newVal) => {
        localProducts.value = newVal ? [...newVal] : [];
    },
    { deep: true },
);

/** 切換指定索引產品項目的展開與收合狀態 */
const toggleExpand = (index: number) => {
    if (localProducts.value[index]) {
        localProducts.value[index].isExpanded = !localProducts.value[index].isExpanded;
    }
};

/** 計算電力負載百分比（0 ~ 100），包含無資料與分母為零的保護 */
const computedPercent = computed(() => {
    if (!props.power) return 0;
    if (props.power.percent !== undefined) return props.power.percent;
    if (props.power.total <= 0) return 0;
    return (props.power.used / props.power.total) * 100;
});

/** 調度券兌換效率顯示上限（6 位） */
const NUMBER_DISPLAY_MAX = 999999;

/** 調度券兌換效率顯示文字（不含 /hr），無資料時為「-」 */
const exchangeRateText = computed(() => {
    if (props.exchangeRate == null) return '-';
    if (props.exchangeRate > NUMBER_DISPLAY_MAX) return `${NUMBER_DISPLAY_MAX}+`;
    return `${props.exchangeRate}`;
});

/** 數值縮寫：超過 6 位以 K 表示、超過 9 位以 M 表示（無條件捨去） */
const abbreviate = (value: number) => {
    const abs = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    if (abs >= 1e9) return `${sign}${Math.trunc(abs / 1e6)}M`;
    if (abs >= 1e6) return `${sign}${Math.trunc(abs / 1e3)}K`;
    return `${value}`;
};

/** 收益顯示文字：「收益」＋正負號＋縮寫數值 */
const profitText = (profit: number) =>
    `收益${profit >= 0 ? '+' : '-'}${abbreviate(Math.abs(profit))}`;

/** 產品名稱的顯示字數上限，超過時截斷並補上「...」 */
const TEXT_MAX_LENGTH = 6;

/** 依字數上限截斷文字（以字元計，不切開 emoji 等代理對） */
const cutText = (text: string) => {
    const chars = [...text];
    return chars.length > TEXT_MAX_LENGTH ? `${chars.slice(0, TEXT_MAX_LENGTH).join('')}...` : text;
};
</script>

<template>
    <!-- 間距依設計稿 1080 高時的座標換算；只有 information 隨高度伸縮 -->
    <div
        data-figma-id="2302:100"
        data-figma-name="Result"
        class="flex w-[320px] shrink-0 flex-col overflow-hidden pt-[100px] pb-[17px]"
    >
        <!-- 整體統計標題 -->
        <div
            data-figma-id="2302:103"
            data-figma-name="Title"
            class="ml-[18px] h-[23px] shrink-0 text-[20px] leading-[23.44px] font-normal text-white"
        >
            整體統計
        </div>

        <!-- 耗電量進度條 -->
        <div
            data-figma-id="2974:124"
            data-figma-name="power consumption"
            class="relative mt-[16px] ml-[18px] h-[63px] w-[281px] shrink-0"
        >
            <div
                data-figma-id="2302:107"
                data-figma-name="Text"
                class="absolute top-0 left-0 text-[18px] leading-[21.096px] font-light whitespace-nowrap text-[#cfcfcf]"
            >
                總耗電量/供電量
            </div>
            <div
                data-figma-id="2302:104"
                data-figma-name="Bar"
                class="absolute top-[28px] left-0 h-[10px] w-[281px] overflow-hidden rounded-[25px] bg-[#3c3c3c]"
            >
                <div
                    data-figma-id="2302:106"
                    data-figma-name="Bar"
                    class="h-full rounded-[25px] bg-[#eefd1c] transition-all duration-300"
                    :style="{ width: `${Math.min(100, Math.max(0, computedPercent))}%` }"
                />
            </div>
            <div
                data-figma-id="2302:132"
                data-figma-name="Text"
                class="absolute top-[44px] left-0 text-[16px] leading-[18.752px] font-light whitespace-nowrap text-[#a4a4a4]"
            >
                {{ power ? `${power.used}kW/${power.total}kW` : '-' }}
            </div>
        </div>

        <!-- 產能估算標題 -->
        <div
            data-figma-id="2302:131"
            data-figma-name="Text"
            class="mt-[22px] ml-[18px] h-[23px] shrink-0 text-[20px] leading-[23.44px] font-normal text-white"
        >
            產能估算(min)
        </div>

        <!--
            產能產品列表：滾動範圍即設計稿 information（x=21、寬 256），
            右側 13px 間距後接 9px 捲軸，故容器寬 256 + 13 + 9 = 278。
        -->
        <div
            data-figma-id="2430:348"
            data-figma-name="information"
            class="stats-panel-scrollbar mt-[16px] ml-[21px] flex min-h-0 w-[278px] flex-1 flex-col gap-[9px] overflow-x-hidden overflow-y-auto pr-[13px] [scrollbar-gutter:stable]"
        >
            <div
                v-for="(item, index) in localProducts"
                :key="item.id"
                data-figma-name="Text"
                class="relative w-full shrink-0"
                :class="item.isExpanded ? 'h-[66px]' : 'h-[24px]'"
            >
                <!-- 展開按鈕 -->
                <div
                    data-figma-name="botton"
                    class="absolute top-[7px] left-0 h-[8px] w-[13px] cursor-pointer transition-transform select-none [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
                    :class="{ 'rotate-180': !item.isExpanded }"
                    @click="toggleExpand(index)"
                    v-html="iconArrowSvg"
                />

                <!-- 產品名稱（自動寬、不換行；超過 TEXT_MAX_LENGTH 字截斷補「...」） -->
                <div
                    data-figma-name="product"
                    class="absolute top-0 left-[18px] cursor-pointer text-[18px] leading-[21.096px] font-normal whitespace-nowrap text-[#cfcfcf]"
                    :title="item.name"
                    @click="toggleExpand(index)"
                >
                    {{ cutText(item.name) }}
                </div>

                <!-- 收益（固定寬 100，不換行；數值超過 6 位用 K、超過 9 位用 M） -->
                <div
                    data-figma-name="Text"
                    class="absolute top-[1px] left-[156px] w-[100px] text-[16px] leading-[18.752px] font-light whitespace-nowrap"
                    :class="item.profit >= 0 ? 'text-[#a3fd1c]' : 'text-[#ff6e6e]'"
                >
                    {{ profitText(item.profit) }}
                </div>

                <!-- 展開時顯示生產與消耗明細 -->
                <template v-if="item.isExpanded">
                    <div
                        data-figma-name="produce"
                        class="absolute top-[26px] left-[18px] flex w-[125px] justify-between text-[16px] leading-[18.752px] font-light whitespace-nowrap text-[#f5f5f5]"
                    >
                        <span>生產</span>
                        <span>{{ abbreviate(item.produce) }}</span>
                    </div>
                    <div
                        data-figma-name="consume"
                        class="absolute top-[47px] left-[18px] flex w-[125px] justify-between text-[16px] leading-[18.752px] font-light whitespace-nowrap text-[#f5f5f5]"
                    >
                        <span>消耗</span>
                        <span>{{ abbreviate(item.consume) }}</span>
                    </div>
                </template>
            </div>
        </div>

        <!-- 調度券兌換效率 -->
        <div
            data-figma-id="2974:108"
            data-figma-name="Exchange"
            class="relative mt-[11px] ml-[18px] h-[50px] w-[146px] shrink-0"
        >
            <div
                data-figma-id="2302:110"
                data-figma-name="Text"
                class="absolute top-0 left-0 text-[20px] leading-[23.44px] font-normal whitespace-nowrap text-white"
            >
                調度券兌換效率
            </div>
            <div
                v-if="exchangeRate != null"
                data-figma-id="2302:108"
                data-figma-name="Text"
                class="absolute top-[29px] left-[31px] text-[18px] leading-[21.096px] font-light whitespace-nowrap text-[#cfcfcf]"
            >
                ≈
            </div>
            <!-- 數值裁切框：x=46、寬 76，內容靠右，超出裁切 -->
            <div
                data-figma-id="3476:169"
                data-figma-name="Clip"
                class="absolute top-[29px] left-[46px] flex w-[76px] justify-end overflow-hidden"
            >
                <div
                    data-figma-id="2302:109"
                    data-figma-name="Text"
                    class="shrink-0 text-right text-[18px] leading-[21.096px] font-light whitespace-nowrap text-[#cfcfcf]"
                >
                    {{ exchangeRateText }}
                </div>
            </div>
            <div
                data-figma-id="3476:160"
                data-figma-name="Text"
                class="absolute top-[29px] left-[122px] w-[24px] text-right text-[18px] leading-[21.096px] font-light whitespace-nowrap text-[#cfcfcf]"
            >
                /hr
            </div>
        </div>
    </div>
</template>
