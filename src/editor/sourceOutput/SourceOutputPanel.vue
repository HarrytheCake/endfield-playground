<script setup lang="ts">
import { computed } from 'vue';
import type { PlacedDevice } from '@/types/layout';
import { useLayoutStore } from '@/store/layoutStore';
import { getMachineById } from '@/data/machines';
import { sourceMaterialOptions } from './sourceMaterialOptions';

const props = defineProps<{
    /** 目前選中的設備；值由父層從 store 反查，復原後會跟著更新 */
    device: PlacedDevice;
}>();

/** 寫入源產出用；只呼叫高階 action，不直接改 device */
const layoutStore = useLayoutStore();

/**
 * 「無」選項的哨兵值。  \
 * reka-ui 的 SelectItem 不接受空字串作為值，因此不能用 `''` 表示未設定。
 */
const NONE_VALUE = '__none__';

/**
 * 下拉選項：「無」＋該機任一型態送得出去的基礎材料；非源設備為空陣列。  \
 * 不依目前型態過濾：選了液氣後 store 會自行切換型態（W1102-H1）。
 */
const materialItems = computed(() => {
    const machine = getMachineById(props.device.machineType);
    if (!machine) return [];
    const materials = sourceMaterialOptions(machine);
    if (materials.length === 0) return [];
    return [
        { label: '無', value: NONE_VALUE },
        ...materials.map((m) => ({ label: m.name, value: m.name })),
    ];
});

/**
 * 目前選取值，雙向綁定下拉。  \
 * 讀取時以 store 中的 `primaryOutput` 為準；寫入時轉呼叫 `setDevicePrimaryOutput`，
 * 速率省略以沿用預設 30／min。
 */
const selectedValue = computed<string>({
    get: () => props.device.primaryOutput ?? NONE_VALUE,
    set: (value) => {
        layoutStore.setDevicePrimaryOutput(props.device.id, value === NONE_VALUE ? null : value);
    },
});
</script>

<template>
    <!-- 非源設備沒有可選材料，整段不渲染 -->
    <div v-if="materialItems.length > 0" class="flex items-center gap-3 bg-zinc-900 px-4 py-3">
        <span class="shrink-0 text-sm text-zinc-300">產出素材</span>
        <USelect
            v-model="selectedValue"
            :items="materialItems"
            size="sm"
            class="flex-1"
            aria-label="源設備產出素材"
        />
    </div>
</template>
