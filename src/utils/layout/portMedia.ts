/**
 * 機器埠媒質查表（與 FlowEngine 共用）
 *
 * 權威來源＝該 mode 下 {@link PortDef.media}，不另寫一套 belt／pipe 推斷。
 */

import type { PortDirection } from '@/types/layout';
import type { PortMedia } from '@/types/machine';
import { getMachineMode } from '@/types/machine';
import type { GetMachineFn } from '@/utils/layout/portAnchorIndex';
import { defaultGetMachine } from '@/utils/layout/portAnchorIndex';

/**
 * 取得機器指定埠的傳輸媒質。
 *
 * @returns 無機器／索引越界時 `null`
 */
export function getMachinePortMedia(
    machineType: string,
    machineMode: string | undefined,
    portType: PortDirection,
    portIndex: number,
    getMachine: GetMachineFn = defaultGetMachine,
): PortMedia | null {
    const machine = getMachine(machineType);
    if (!machine) return null;
    const mode = getMachineMode(machine, machineMode);
    const ports = portType === 'input' ? mode.input_ports : mode.output_ports;
    return ports[portIndex]?.media ?? null;
}
