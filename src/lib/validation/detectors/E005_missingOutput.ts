import type { Alert, Detector, ValidationContext } from '@/types/validation';
import { getRecipesForMachine } from '@/data/products';

/**
 * E005 輸出缺失偵測
 *
 * 觸發條件：設備配方明確產生輸出時，未接出任何輸出管線。
 * (目前實作設備層級，只要有任何一條管線接出即算通過)
 */
export const E005_missingOutput: Detector = {
    code: 'E005',
    level: 'error',
    run(ctx: ValidationContext): Alert[] {
        const alerts: Alert[] = [];
        const { devices, connections, getDef } = ctx;

        for (const device of devices) {
            const machineType = device.data?.machineType;
            if (!machineType) continue;

            const def = getDef(machineType);
            if (!def) continue;

            const recipeIndex = device.data?.recipeIndex ?? 0;
            const recipes = getRecipesForMachine(machineType);
            const recipe = recipes[recipeIndex];

            // 若配方不存在或不產生輸出，則略過
            if (!recipe || !recipe.outputs || recipe.outputs.length === 0) {
                continue;
            }

            // 檢查是否有任何管線從此設備接出
            const hasOutgoingConnection = connections.some((edge) => edge.source === device.id);

            if (!hasOutgoingConnection) {
                alerts.push({
                    uid: crypto.randomUUID(),
                    level: 'error',
                    code: 'E005',
                    message: `設備「${def.name}」配方會產生輸出，但未接出任何管線`,
                    relatedDeviceUids: [device.id],
                    relatedConnectionUids: [],
                });
            }
        }

        return alerts;
    },
};
