import type { Alert, Detector, ValidationContext } from '@/types/validation';
import { getRecipesForMachine } from '@/data/products';
import { getMachineMode } from '@/types/machine';

/**
 * E005_missingOutput
 *
 * 判定規則（D3 §4.3、spec/09_recipe_warning.md）：
 * 該機有產出（源類機器、或當前模式下存在會產生輸出的配方），但沒有任何出邊（outgoing connection）。
 * 不套用對象：
 * - `is_sink: true` 的匯出點（如物品輸入口，產線終點不接出邊）
 * - 該型態下無輸出埠（output_ports 為空）之設備
 * - 該型態下無任何產出之設備（例如無產出配方、物流導流設備如分流器）
 * - 查無設備定義之未知節點
 *
 * 查定義一律走 {@link ValidationContext.getDef}（V17／#73；不直接呼叫 getMachine）。
 * 配方查詢鍵一律使用 `machineDef.name`（中文名）。
 */
export const E005_missingOutput: Detector = {
    code: 'E005',
    level: 'error',
    run(ctx: ValidationContext): Alert[] {
        const alerts: Alert[] = [];

        for (const device of ctx.devices) {
            const machineType = device.data?.machineType ?? device.data?.label ?? device.id;
            const machineDef = ctx.getDef(machineType);

            // 若查無設備定義，或是匯出點（is_sink: true），不套用 E005
            if (!machineDef || machineDef.is_sink) {
                continue;
            }

            const mode = getMachineMode(machineDef, device.data?.machineMode);
            // 若該型態沒有任何輸出埠，略過
            if (!mode || mode.output_ports.length === 0) {
                continue;
            }

            // 判斷該機是否有產出：
            // 1. 若為源類機器（is_source: true），天生負責提供產出
            // 2. 若為一般加工機，檢查目前 mode 下是否存在會產生輸出的配方
            const recipes = getRecipesForMachine(machineDef.name, mode.id);
            const hasRecipeWithOutput = recipes.some((recipe) => (recipe.outputs?.length ?? 0) > 0);
            const hasOutput = machineDef.is_source || hasRecipeWithOutput;
            if (!hasOutput) {
                continue;
            }

            // 檢查是否有任何從此設備接出的管線（出邊）
            const outEdges = ctx.connections.filter((c) => c.source === device.id);
            if (outEdges.length === 0) {
                alerts.push({
                    uid: crypto.randomUUID(),
                    code: 'E005',
                    level: 'error',
                    message: `缺少輸出：${machineDef.name} 有產出但未連接任何輸出管線`,
                    relatedDeviceUids: [device.id],
                    relatedConnectionUids: [],
                });
            }
        }

        return alerts;
    },
};
