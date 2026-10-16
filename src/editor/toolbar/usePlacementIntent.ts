import { readonly, ref } from 'vue';

/** 跨工具列與畫布共享的真機器落子意圖；在模組存續期間保留，直到解除武裝 */
const armedMachineId = ref<string | null>(null);

/**
 * 提供真機器落子意圖；工具列寫入，畫布讀取，不改動藍圖 store。
 *
 * @returns 唯讀的機器 id 與武裝、解除武裝操作
 */
export function usePlacementIntent() {
    return {
        /** 目前準備放置的真機器 id；null 表示未武裝 */
        armedMachineId: readonly(armedMachineId),
        /**
         * 武裝指定機器；再次選同一台時解除武裝。
         *
         * @param machineId 真機器定義的 id
         */
        arm(machineId: string): void {
            armedMachineId.value = armedMachineId.value === machineId ? null : machineId;
        },
        /** 解除目前的真機器落子意圖 */
        disarm(): void {
            armedMachineId.value = null;
        },
    };
}
