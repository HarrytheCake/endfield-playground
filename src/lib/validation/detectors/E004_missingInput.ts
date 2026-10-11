import type { Alert, Detector, ValidationContext } from '@/types/validation';
import { getMachine } from '@/data/machines';
import { getRecipesForMachine } from '@/data/products';
import { getMachineMode } from '@/types/machine';

/**
 * E004_missingInput
 *
 * 判定規則（D3 §4.3）：
 * 該機目前 mode 存在需要輸入的配方，但沒有任何入邊。
 * 不套用對象：
 * - `is_source: true` 的源類機器（基礎材料輸出點）
 * - 該型態下無輸入埠（input_ports 為空）之設備
 * - 該型態下無任何需要輸入的配方之設備（如分流器、或是無需材料即可運轉之機器）
 */
export const E004_missingInput: Detector = {
    code: 'E004',
    level: 'error',
    run(ctx: ValidationContext): Alert[] {
        const alerts: Alert[] = [];

        for (const device of ctx.devices) {
            const machineType = device.data?.machineType ?? device.data?.label ?? device.id;
            const machineDef = ctx.getDef
                ? (ctx.getDef(machineType) ?? getMachine(machineType))
                : getMachine(machineType);

            // 若查無設備定義，或是地區資源輸出點（源機），不套用 E004
            if (!machineDef || machineDef.is_source) {
                continue;
            }

            const mode = getMachineMode(machineDef, device.data?.machineMode);
            // 若該型態沒有任何輸入埠，略過
            if (!mode || mode.input_ports.length === 0) {
                continue;
            }

            // 取得該設備在目前 mode 下的所有配方
            const recipes = getRecipesForMachine(machineDef.name, mode.id);
            // 該型態下必須存在「需要輸入」的配方才需檢查入邊
            const hasRecipeRequiringInput = recipes.some((recipe) => recipe.inputs.length > 0);
            if (!hasRecipeRequiringInput) {
                continue;
            }

            // 檢查是否有任何連接至此設備的管線（入邊）
            const inEdges = ctx.connections.filter((c) => c.target === device.id);
            if (inEdges.length === 0) {
                alerts.push({
                    uid: crypto.randomUUID(),
                    code: 'E004',
                    level: 'error',
                    message: `缺少輸入：${machineDef.name} 需要輸入材料但未連接任何輸入管線`,
                    relatedDeviceUids: [device.id],
                    relatedConnectionUids: [],
                });
            }
        }

        return alerts;
    },
};
