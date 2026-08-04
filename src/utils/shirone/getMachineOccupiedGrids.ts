import type { Rotation } from '@/types/editor';
import type { Position } from "@/types/euclideanSpace";

export function getOccupiedCells(position: Position, size: Position, rotation: Rotation)
{
  let x = position[0] ?? 0;
  let y = position[1] ?? 0;
  let z = position[2] ?? 0;

  const result: Position[] = [];
  // 根據旋轉決定實際佔據尺寸
  // rotation 1 (90°) 或 3 (270°) 時寬高互換
  const actualsize: Position = (rotation === 1 || rotation === 3)
    ? [size[1], size[0], size[2]]
    : [...size];
  
  // 計算所有佔據的格子
  for (let dx = 0; dx < actualsize[0]; dx++) 
  {
    for (let dy = 0; dy < actualsize[1]; dy++) 
    {
      for (let dz = 0; dz < actualsize[2]; dz++) 
      {
        result.push([x+dx,y+dy,z+dz])
      }
    }
  }

  return result;
}