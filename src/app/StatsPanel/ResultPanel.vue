<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import bottonIconUrl from '@/assets/icon/icon arrow.svg';
import type { PowerData, SingleProductDetail } from './types';

/** 上半部統計與產能估算面板傳入屬性 */
const props = defineProps<{
    /** 電力消耗與供電統計數據 */
    power?: PowerData;
    /** 產能估算產品明細列表 */
    products?: SingleProductDetail[];
    /** 調度券每小時兌換效率（券/hr） */
    exchangeRate?: number;
    /** 面板區塊高度（px 數值或 CSS 高度字串） */
    styleHeight?: number | string;
}>();

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

/** 計算電力負載百分比（0 ~ 100），包含無資料與分母為零的保護 */
const computedPercent = computed(() => {
    if (!props.power) return 0;
    if (props.power.percent !== undefined) return props.power.percent;
    if (props.power.total <= 0) return 0;
    return (props.power.used / props.power.total) * 100;
});

/** 切換指定索引產品項目的展開與收合狀態 */
const toggleExpand = (index: number) => {
    if (localProducts.value[index]) {
        localProducts.value[index].isExpanded = !localProducts.value[index].isExpanded;
    }
};
</script>

<template>
    <div
        data-figma-id="2302:100"
        data-figma-name="Result"
        class="relative isolate m-0 box-border flex [width:320px] shrink-0 flex-col overflow-hidden border-0 border-solid [background-color:#4e4e4e]"
        :style="{ height: typeof styleHeight === 'number' ? `${styleHeight}px` : styleHeight }"
    >
        <div
            data-figma-id="2302:102"
            data-figma-name="Detail"
            class="relative isolate m-0 [margin-top:100px] [margin-left:18px] box-border flex [width:290px] flex-1 shrink-0 flex-col overflow-hidden border-0 border-solid pr-2 pb-4"
        >
            <!-- 整體統計標題 -->
            <div
                data-figma-id="2302:103"
                data-figma-name="Title"
                class="m-0 mb-4 box-border [height:23px] [width:80px] shrink-0 border-0 border-solid [text-align:left] [font-family:'HarmonyOS_Sans_TC',sans-serif] [font-size:20px] [line-height:23.44px] [font-weight:400] [letter-spacing:0px] [color:#ffffff]"
            >
                整體統計
            </div>

            <!-- 耗電量進度條 -->
            <div
                data-figma-id="2974:124"
                data-figma-name="power consumption"
                class="relative isolate m-0 mb-6 box-border [height:63px] [width:281px] shrink-0 border-0 border-solid"
            >
                <div
                    data-figma-id="2302:107"
                    data-figma-name="Text"
                    class="absolute [top:0px] [left:0px] m-0 box-border [height:21px] [width:133px] shrink-0 border-0 border-solid [text-align:left] [font-family:'HarmonyOS_Sans_TC',sans-serif] [font-size:18px] [line-height:21.096px] [font-weight:300] [color:#cfcfcf]"
                >
                    總耗電量/供電量
                </div>
                <div
                    data-figma-id="2302:104"
                    data-figma-name="Bar"
                    class="absolute [top:28px] [left:0px] m-0 box-border [height:10px] [width:281px] shrink-0 overflow-hidden [border-radius:25px] border-0 border-solid [background-color:#3c3c3c]"
                >
                    <div
                        data-figma-id="2302:106"
                        data-figma-name="Bar"
                        class="h-full [border-radius:25px] [background-color:#eefd1c] transition-all duration-300"
                        :style="{ width: `${Math.min(100, Math.max(0, computedPercent))}%` }"
                    ></div>
                </div>
                <div
                    data-figma-id="2302:132"
                    data-figma-name="Text"
                    class="absolute [top:44px] [left:0px] m-0 box-border [height:19px] [width:105px] shrink-0 border-0 border-solid [text-align:left] [font-family:'HarmonyOS_Sans_TC',sans-serif] [font-size:16px] [line-height:18.752px] [font-weight:300] [color:#a4a4a4]"
                >
                    {{ power ? `${power.used}kW/${power.total}kW` : '-' }}
                </div>
            </div>

            <!-- 產能估算標題 -->
            <div
                data-figma-id="2302:131"
                data-figma-name="Text"
                class="m-0 mb-4 box-border [height:23px] [width:80px] shrink-0 border-0 border-solid [text-align:left] [font-family:'HarmonyOS_Sans_TC',sans-serif] [font-size:20px] [line-height:23.44px] [font-weight:400] [color:#ffffff]"
            >
                產能估算
            </div>

            <!-- 產能產品列表（獨立滾動範圍） -->
            <div
                data-figma-id="2430:348"
                data-figma-name="information"
                class="custom-scrollbar relative isolate m-0 mb-6 box-border flex [width:281px] flex-1 shrink-0 flex-col gap-3 overflow-x-hidden overflow-y-auto border-0 border-solid pr-1"
            >
                <div
                    v-for="(item, index) in localProducts"
                    :key="item.id"
                    class="relative isolate m-0 box-border [width:100%] shrink-0 border-0 border-solid transition-all"
                    :class="item.isExpanded ? '[height:66px]' : '[height:24px]'"
                >
                    <!-- 展開按鈕 -->
                    <div
                        data-figma-name="botton"
                        class="absolute [top:7px] [left:0px] isolate m-0 box-border [height:8px] [width:13px] shrink-0 cursor-pointer border-0 border-solid transition-transform select-none"
                        :class="{ 'rotate-180': !item.isExpanded }"
                        @click="toggleExpand(index)"
                    >
                        <img
                            class="pointer-events-none block h-full w-full object-fill"
                            :src="bottonIconUrl"
                            alt=""
                        />
                    </div>

                    <!-- 產品名稱 -->
                    <div
                        data-figma-name="product"
                        class="absolute [top:0px] [left:18px] isolate m-0 box-border [height:21px] max-w-[130px] shrink-0 cursor-pointer truncate border-0 border-solid [text-align:left] [font-family:'HarmonyOS_Sans_TC',sans-serif] [font-size:18px] [line-height:21.096px] [font-weight:400] whitespace-nowrap [color:#cfcfcf]"
                        :title="item.name"
                        @click="toggleExpand(index)"
                    >
                        {{ item.name }}
                    </div>

                    <!-- 收益 -->
                    <div
                        data-figma-name="Text"
                        class="absolute [top:2px] [right:0px] isolate m-0 box-border [height:19px] [width:122px] shrink-0 border-0 border-solid [text-align:left] [font-family:'HarmonyOS_Sans_TC',sans-serif] [font-size:16px] [line-height:18.752px] [font-weight:300]"
                        :class="item.profit >= 0 ? '[color:#a3fd1c]' : '[color:#ff6e6e]'"
                    >
                        {{ item.profit >= 0 ? `收益+${item.profit}` : `收益${item.profit}` }}
                    </div>

                    <!-- 展開時顯示詳細生產與消耗 -->
                    <template v-if="item.isExpanded">
                        <!-- 生產 -->
                        <div
                            data-figma-name="produce"
                            class="absolute [top:26px] [left:18px] isolate m-0 box-border [height:19px] [width:125px] shrink-0 border-0 border-solid"
                        >
                            <div
                                data-figma-name="Text"
                                class="absolute [top:0px] [left:0px] m-0 box-border [height:19px] [width:32px] shrink-0 border-0 border-solid [text-align:left] [font-family:'HarmonyOS_Sans_TC',sans-serif] [font-size:16px] [line-height:18.752px] [font-weight:300] [color:#f5f5f5]"
                            >
                                生產
                            </div>
                            <div
                                data-figma-name="Text"
                                class="absolute [top:0px] [left:66px] m-0 box-border [height:19px] [width:59px] shrink-0 border-0 border-solid [text-align:right] [font-family:'HarmonyOS_Sans_TC',sans-serif] [font-size:16px] [line-height:18.752px] [font-weight:300] [color:#f5f5f5]"
                            >
                                {{ item.produce }}/min
                            </div>
                        </div>

                        <!-- 消耗 -->
                        <div
                            data-figma-name="consume"
                            class="absolute [top:47px] [left:18px] isolate m-0 box-border [height:19px] [width:125px] shrink-0 border-0 border-solid"
                        >
                            <div
                                data-figma-name="Text"
                                class="absolute [top:0px] [left:0px] m-0 box-border [height:19px] [width:32px] shrink-0 border-0 border-solid [text-align:left] [font-family:'HarmonyOS_Sans_TC',sans-serif] [font-size:16px] [line-height:18.752px] [font-weight:300] [color:#f5f5f5]"
                            >
                                消耗
                            </div>
                            <div
                                data-figma-name="Text"
                                class="absolute [top:0px] [left:66px] m-0 box-border [height:19px] [width:59px] shrink-0 border-0 border-solid [text-align:right] [font-family:'HarmonyOS_Sans_TC',sans-serif] [font-size:16px] [line-height:18.752px] [font-weight:300] [color:#f5f5f5]"
                            >
                                {{ item.consume }}/min
                            </div>
                        </div>
                    </template>
                </div>
            </div>

            <!-- 兌換效率 -->
            <div
                data-figma-id="2974:108"
                data-figma-name="Exchange"
                class="relative isolate m-0 mt-auto box-border [height:50px] [width:146px] shrink-0 border-0 border-solid"
            >
                <div
                    data-figma-id="2302:110"
                    data-figma-name="Text"
                    class="absolute [top:0px] [left:0px] m-0 box-border [height:23px] [width:140px] shrink-0 border-0 border-solid [text-align:left] [font-family:'HarmonyOS_Sans_TC',sans-serif] [font-size:20px] [line-height:23.44px] [font-weight:400] [color:#ffffff]"
                >
                    調度券兌換效率
                </div>
                <div
                    data-figma-id="2302:108"
                    data-figma-name="Text"
                    class="absolute [top:29px] [left:48px] m-0 box-border [height:21px] [width:10px] shrink-0 border-0 border-solid [text-align:left] [font-family:'HarmonyOS_Sans_TC',sans-serif] [font-size:18px] [line-height:21.096px] [font-weight:300] [color:#cfcfcf]"
                >
                    {{ exchangeRate != null ? '≈' : ' ' }}
                </div>
                <div
                    data-figma-id="2302:109"
                    data-figma-name="Text"
                    class="absolute [top:29px] [left:63px] m-0 box-border [height:21px] [width:83px] shrink-0 border-0 border-solid [text-align:right] [font-family:'HarmonyOS_Sans_TC',sans-serif] [font-size:18px] [line-height:21.096px] [font-weight:300] [color:#cfcfcf]"
                >
                    {{ exchangeRate != null ? `${exchangeRate.toLocaleString()}/hr` : '-' }}
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
