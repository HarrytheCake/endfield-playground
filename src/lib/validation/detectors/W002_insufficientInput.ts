import type { Alert, Detector, ValidationContext } from '@/types/validation';
import { getRecipesForMachine } from '@/data/products';

export const W002_insufficientInput: Detector = {
    code: 'W002',
    level: 'warning',
    run(ctx: ValidationContext): Alert[] {
        const alerts: Alert[] = [];

        // 若流量資料尚未計算，則無法判定輸入是否不足，直接回傳
        if (!ctx.edgeFlows) {
            return alerts;
        }

        const edgeFlows = ctx.edgeFlows;

        for (const device of ctx.devices) {
            if (!device.data || !device.data.machineType) continue;

            const machineDef = ctx.getDef(device.data.machineType);
            if (!machineDef) continue;

            const recipes = getRecipesForMachine(device.data.machineType);
            // 處理 recipeIndex 為 undefined 的情況，預設為 0
            const recipe = recipes[device.data.recipeIndex ?? 0];
            if (!recipe || !recipe.inputs || recipe.inputs.length === 0) {
                continue;
            }

            for (const input of recipe.inputs) {
                // 理論需求速率：每個配方週期消耗量 * 每分鐘週期數
                const demandRate = input.quantity * (60 / recipe.timeSeconds);

                // 計算實際流入該設備且為該品項的總速率
                let actualSupplyRate = 0;
                for (const connection of ctx.connections) {
                    if (connection.target === device.id) {
                        const edgeFlow = edgeFlows.get(connection.id);
                        if (edgeFlow && edgeFlow.itemId === input.itemId) {
                            actualSupplyRate += edgeFlow.rate;
                        }
                    }
                }

                // 判斷是否不足 (考量浮點數誤差)
                if (actualSupplyRate < demandRate - 0.001) {
                    alerts.push({
                        uid: crypto.randomUUID(),
                        level: 'warning',
                        code: 'W002',
                        message: `設備 [${machineDef.name}] 的輸入品項 [${input.itemId}] 供給不足 (需求: ${demandRate.toFixed(2)}/min, 實際: ${actualSupplyRate.toFixed(2)}/min)`,
                        relatedDeviceUids: [device.id],
                        relatedConnectionUids: [],
                    });
                }
            }
        }

        return alerts;
    },
};
