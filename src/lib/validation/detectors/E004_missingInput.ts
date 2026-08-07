import type { Alert, Detector, ValidationContext } from '@/types/validation';
import { getRecipesForMachine } from '@/data/products';

/**
 * E004 輸入缺失偵測
 *
 * 觸發條件：設備配方明確要求輸入時，未接入任何輸入管線。
 * (目前實作設備層級，只要有任何一條管線接入即算通過)
 */
export const E004_missingInput: Detector = {
    code: 'E004',
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

            // 若配方不存在或不需要輸入，則略過
            if (!recipe || !recipe.inputs || recipe.inputs.length === 0) {
                continue;
            }

            // 檢查是否有任何管線接入此設備
            const hasIncomingConnection = connections.some((edge) => edge.target === device.id);

            if (!hasIncomingConnection) {
                alerts.push({
                    uid: crypto.randomUUID(),
                    level: 'error',
                    code: 'E004',
                    message: `設備「${def.name}」配方需要輸入材料，但未接入任何管線`,
                    relatedDeviceUids: [device.id],
                    relatedConnectionUids: [],
                });
            }
        }

        return alerts;
    },
};
