import type { Position } from '@/types/euclideanSpace';
import type { shironesMachine, shironesPipeline } from '@/types/shironesinterface';
import { getOccupiedCells } from '@/utils/shirone/getMachineOccupiedGrids';
import { getPipelineOccupiedGrids } from '@/utils/shirone/getPipelineOccupiedGrids';


export function detectOverlaps
(
    machineList: shironesMachine[],
    pipelineList: shironesPipeline[]
): string[]
{
    const allgrid: any[] = [];
    
    // 使用 Set 來收集所有發生重疊的物件 ID
    const overlappedIds = new Set<string>();

    let expectedDimension = -1;

    const processPoints = (points: Position[], id: string) => {
        for (const pos of points) {
            if (expectedDimension === -1) {
                expectedDimension = pos.length;
            } else if (pos.length !== expectedDimension) {
                throw new Error(`Dimension mismatch! Expected ${expectedDimension}D, but got ${pos.length}D at object ${id}`);
            }

            let currentLevel = allgrid;
            
            // 透過迴圈動態存取多維陣列
            for (let i = 0; i < pos.length - 1; i++) {
                const coord = pos[i];
                if (!currentLevel[coord]) {
                    currentLevel[coord] = [];
                }
                currentLevel = currentLevel[coord];
            }
            
            const lastCoord = pos[pos.length - 1];
            if (!currentLevel[lastCoord]) {
                currentLevel[lastCoord] = [];
            }
            
            const cell = currentLevel[lastCoord];
            
            // 檢查該格子內是否已經有其他物件的 ID
            for (const existingId of cell) {
                // 將發生重疊的雙方 ID 都加入結果中
                overlappedIds.add(existingId);
                overlappedIds.add(id);
            }
            
            // 將當前的 ID 存入該格子
            cell.push(id);
        }
    };

    // 收集並標記所有設備佔用的空間格子
    for (const machineItem of machineList) {
        const points = getOccupiedCells(machineItem);
        processPoints(points, machineItem.id);
    }

    // 收集並標記所有管線佔用的空間格子
    for (const pipelineItem of pipelineList) {
        const points = getPipelineOccupiedGrids(pipelineItem.waypoints);
        processPoints(points, pipelineItem.id);
    }

    return Array.from(overlappedIds);
}
