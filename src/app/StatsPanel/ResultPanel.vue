<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import iconArrowRaw from '@/assets/icon/icon arrow.svg?raw';
import type { PowerData, SingleProductDetail } from './types';
import type { TicketCurrencyRate } from '@/types/flow';

/** 上半部統計與產能估算面板傳入屬性；未提供設備狀態時保留原有預覽行為。 */
const props = withDefaults(
    defineProps<{
        /** 明確為 false 時隱藏上一輪摘要；任何空清單皆顯示空白提示。 */
        hasDevices?: boolean;
        /** 耗電與供電唯讀統計數據 */
        power?: PowerData;
        /** 產能估算產品明細列表 */
        products?: SingleProductDetail[];
        /** 調度券每小時兌換效率（券/hr） */
        exchangeRate?: number;
        /** 各券種兌換效率；提供時分別顯示，優先於單一 exchangeRate。 */
        exchangeRates?: TicketCurrencyRate[];
    }>(),
    { hasDevices: undefined },
);

/** 將展開箭頭 SVG 的填色替換為設計稿指定的灰色（#CFCFCF） */
const iconArrowSvg = iconArrowRaw.replace(/fill="(?!none)[^"]*"/g, 'fill="#CFCFCF"');

/** 本地明細使用逐筆副本，避免操作展開狀態時修改上層傳入的產品物件。 */
const localProducts = ref<SingleProductDetail[]>([]);

/** 資料刷新時按品項 id 保留展開狀態，新增品項才使用其預設狀態。 */
watch(
    () => props.products,
    (newVal) => {
        /** 不依賴陣列索引，排序改變也不會把展開狀態套到另一個品項。 */
        const expandedById = new Map(localProducts.value.map((item) => [item.id, item.isExpanded]));
        localProducts.value = (newVal ?? []).map((item) => ({
            ...item,
            isExpanded: expandedById.get(item.id) ?? item.isExpanded ?? false,
        }));
    },
    { deep: true, immediate: true },
);

/** 無設備時不顯示尚在等待引擎清除的上一輪品項。 */
const visibleProducts = computed(() => (props.hasDevices === false ? [] : localProducts.value));

/** 僅處理展示空值與非法數值；供電加總由引擎完成，沒有資料顯示 0。 */
const powerSupply = computed(() => {
    const total = props.power?.total ?? 0;
    return Number.isFinite(total) && total > 0 ? total : 0;
});

/**
 * 切換本地產品副本的展開狀態，不修改 props。
 * @param index 目前顯示清單中的品項索引
 * @returns 無回傳值
 */
const toggleExpand = (index: number) => {
    if (localProducts.value[index]) {
        localProducts.value[index].isExpanded = !localProducts.value[index].isExpanded;
    }
};

/** 調度券兌換效率顯示上限（6 位） */
const NUMBER_DISPLAY_MAX = 999999;

/**
 * 沿用既有數字格式，讓單一總額與各券種使用相同顯示上限。
 * @param value 每小時券數；未提供時顯示空值符號。
 * @returns 不含券種及時間單位的格式化文字。
 */
function formatExchangeRate(value?: number): string {
    if (value == null) return '-';
    if (value > NUMBER_DISPLAY_MAX) return `${NUMBER_DISPLAY_MAX.toLocaleString('en-US')}+`;
    return value.toLocaleString('en-US');
}

/** 調度券兌換效率顯示文字（不含 /hr），無資料時為「-」 */
const exchangeRateText = computed(() => formatExchangeRate(props.exchangeRate));

/** 所有產耗數字以個/分呈現，固定一位小數並保留千分位。 */
const rateFormatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
});

/**
 * 格式化既有引擎數值，不縮寫或重新計算流量。
 * @param value 每分鐘產出、消耗或淨值
 * @returns 固定一位小數的顯示字串
 */
const formatRate = (value: number) => rateFormatter.format(value);

/**
 * 將既有 profit 欄位以產線淨值呈現，保留明確正負號。
 * @param profit 引擎提供的每分鐘淨值
 * @returns 淨值標籤與一位小數
 */
const profitText = (profit: number) =>
    `淨值${profit >= 0 ? '+' : '-'}${formatRate(Math.abs(profit))}`;

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

        <!-- 全部已擺放設備的額定耗電，由上層傳入引擎結果。 -->
        <div
            data-figma-id="2974:124"
            data-figma-name="power consumption"
            class="relative mt-[16px] ml-[18px] h-[51px] w-[281px] shrink-0"
        >
            <div
                data-figma-id="2302:107"
                class="text-[18px] leading-[21.096px] font-light text-[#cfcfcf]"
            >
                總耗電量/供電量
            </div>
            <div
                data-figma-id="2302:132"
                class="mt-[8px] text-[16px] leading-[18.752px] font-light break-words text-white"
            >
                {{ power ? `${power.used} kW / ${powerSupply} kW` : '-' }}
            </div>
        </div>

        <!-- 產能估算標題 -->
        <div
            data-figma-id="2302:131"
            data-figma-name="Text"
            class="mt-[22px] ml-[18px] h-[23px] shrink-0 text-[20px] leading-[23.44px] font-normal text-white"
        >
            <span>產能估算</span><span class="ml-[3px]">(個/分)</span>
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
            <p v-if="visibleProducts.length === 0" role="status" class="text-sm text-[#cfcfcf]">
                尚未擺放設備
            </p>
            <div
                v-for="(item, index) in visibleProducts"
                :key="item.id"
                data-figma-name="Text"
                class="relative w-full shrink-0"
                :class="item.isExpanded ? 'h-[66px]' : 'h-[24px]'"
            >
                <!-- 名稱與箭頭共用原生按鈕，鍵盤操作與滑鼠使用相同的本地展開狀態 -->
                <button
                    type="button"
                    class="absolute top-0 left-0 flex h-[24px] max-w-[148px] cursor-pointer items-start gap-[5px] text-left text-[18px] leading-[21.096px] font-normal whitespace-nowrap text-[#cfcfcf]"
                    :aria-label="`${item.name}產耗明細`"
                    :aria-expanded="item.isExpanded"
                    :title="item.name"
                    @click="toggleExpand(index)"
                >
                    <span
                        aria-hidden="true"
                        class="mt-[7px] h-[8px] w-[13px] shrink-0 transition-transform select-none [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
                        :class="{ 'rotate-180': !item.isExpanded }"
                        v-html="iconArrowSvg"
                    />
                    <span data-figma-name="product" class="truncate">{{ cutText(item.name) }}</span>
                </button>

                <!-- 固定欄寬內裁切極大淨值，title 保留完整數字與單位 -->
                <div
                    data-figma-name="Text"
                    class="absolute top-[1px] left-[156px] w-[100px] truncate text-[16px] leading-[18.752px] font-light whitespace-nowrap"
                    :class="item.profit >= 0 ? 'text-[#a3fd1c]' : 'text-[#ff6e6e]'"
                    :title="`${profitText(item.profit)} 個/分`"
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
                        <span class="truncate" :title="`${formatRate(item.produce)} 個/分`">{{
                            formatRate(item.produce)
                        }}</span>
                    </div>
                    <div
                        data-figma-name="consume"
                        class="absolute top-[47px] left-[18px] flex w-[125px] justify-between text-[16px] leading-[18.752px] font-light whitespace-nowrap text-[#f5f5f5]"
                    >
                        <span>消耗</span>
                        <span class="truncate" :title="`${formatRate(item.consume)} 個/分`">{{
                            formatRate(item.consume)
                        }}</span>
                    </div>
                </template>
            </div>
        </div>

        <!-- 調度券兌換效率 -->
        <div
            data-figma-id="2974:108"
            data-figma-name="Exchange"
            class="relative mt-[11px] ml-[18px] shrink-0"
            :class="[
                props.exchangeRates?.length ? 'w-[284px]' : 'w-[146px]',
                (props.exchangeRates?.length ?? 0) > 1 ? 'h-[83px]' : 'h-[50px]',
            ]"
        >
            <div
                data-figma-id="2302:110"
                data-figma-name="Text"
                class="absolute top-0 left-0 text-[20px] leading-[23.44px] font-normal whitespace-nowrap text-white"
            >
                調度券兌換效率
            </div>
            <ul
                v-if="props.exchangeRates?.length"
                aria-label="各券種兌換效率"
                class="absolute top-[29px] left-0 m-0 w-full list-none space-y-[8px] p-0 text-[18px] leading-[21.096px] font-light text-[#cfcfcf]"
            >
                <li
                    v-for="item in props.exchangeRates"
                    :key="item.currency"
                    :data-ticket-currency="item.currency"
                    class="flex items-center justify-between gap-2 whitespace-nowrap"
                >
                    <span>{{ item.label }}</span>
                    <span>≈ {{ formatExchangeRate(item.rate) }} /hr</span>
                </li>
            </ul>
            <template v-else>
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
            </template>
        </div>
    </div>
</template>
