<script setup lang="ts">
// 1. 定義資料結構
interface WarehouseRow {
    itemId: string;
    name: string;
    hoursToFull: number | null;
}

interface Props {
    capacityCells: number;
    rows: WarehouseRow[];
}

// 2. 宣告 Props 與 Emits
const props = defineProps<Props>();

// 定義符合圖片規範的 emit
const emit = defineEmits<{
    (e: 'update:capacityCells', v: number): void;
}>();

// 3. 當使用者在輸入框修改數值時觸發的函式
function handleCapacityChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const newValue = Number(target.value);

    // 發射 update:capacityCells 事件，把新數值送回父元件
    emit('update:capacityCells', newValue);
}
</script>

<template>
    <div class="warehouse-estimate rounded-lg border border-zinc-700 bg-zinc-950 p-4 text-white">
        <h3 class="text-white">倉庫預估 WarehouseEstimate</h3>

        <!-- 容量輸入框：綁定 value，並在輸入時發射 emit -->
        <div class="my-3">
            <label>倉庫容量格數：</label>
            <input
                type="number"
                :value="capacityCells"
                @input="handleCapacityChange"
                class="rounded border px-2 py-1"
            />
        </div>

        <!-- 列表呈現 -->
        <table class="mt-2 w-full text-left">
            <thead>
                <tr>
                    <th>品項名稱</th>
                    <th>預估滿載時間</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="item in rows" :key="item.itemId">
                    <td>{{ item.name }}</td>
                    <td>
                        <span v-if="item.hoursToFull !== null">
                            {{ item.hoursToFull }} 小時後滿載
                        </span>
                        <span v-else class="text-gray-400">（產出為負，不會滿載）</span>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>
