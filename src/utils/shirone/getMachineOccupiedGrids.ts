import type { Position } from '@/types/euclideanSpace';
import type { shironesMachine } from '@/types/shironesinterface';

export function getOccupiedCells(machine: shironesMachine) {
    const x = machine.position[0] ?? 0;
    const y = machine.position[1] ?? 0;
    const z = machine.position[2] ?? 0;

    const result: Position[] = [];
    // 根據旋轉決定實際佔據尺寸
    // rotation 1 (90°) 或 3 (270°) 時寬高互換
    const actualsize: Position =
        machine.rotation === 1 || machine.rotation === 3
            ? [machine.size[1], machine.size[0], machine.size[2]]
            : [...machine.size];

    // 計算所有佔據的格子
    for (let dx = 0; dx < actualsize[0]; dx++) {
        for (let dy = 0; dy < actualsize[1]; dy++) {
            for (let dz = 0; dz < actualsize[2]; dz++) {
                result.push([x + dx, y + dy, z + dz]);
            }
        }
    }

    return result;
}
