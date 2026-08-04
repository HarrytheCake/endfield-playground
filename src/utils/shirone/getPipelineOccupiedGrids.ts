/**
 * array of positions (waypoints of a pipeline path)
 * maps to
 * array of positions (every grid cell the pipeline passes through)
 *
 * Assumes no self-intersection
 *
 * @example
 * const waypoints: Position[] = [
 *   [2, 0, 0],
 *   [4, 0, 0],
 *   [4, 3, 0],
 * ];
 *
 * getPipelineOccupiedGrids(waypoints);
 * → [ [2,0,0], [3,0,0], [4,0,0], [4,1,0], [4,2,0], [4,3,0] ]
 */

import type { Position, AxisMove } from "@/types/euclideanSpace";
import { absToRelPath } from "./rewritePipelineStructure";

export function getPipelineOccupiedGrids(waypoints: Position[]): Position[]
{
  // trivial
  if (waypoints.length === 0)
  {
    return [];
  }

  const [startPoint, rawMoves] = absToRelPath(waypoints);

  // Deep copy so we can safely mutate delta while walking.
  const moves: AxisMove[] = (rawMoves as AxisMove[])
    .map(m => ({ ...m }));

  const result: Position[] = [];
  const currentPoint: Position = [...(startPoint as Position)];
  result.push([...currentPoint]);

  while (moves.length > 0)
  {
    // Current segment is exhausted — move on to the next one.
    if (moves[0].delta === 0)
    {
      moves.shift();
      continue;
    }

    const direction = moves[0].delta > 0 ? 1 : -1;
    currentPoint[moves[0].axis] += direction;
    moves[0].delta -= direction;   // counts down toward 0 regardless of sign
    result.push([...currentPoint]);
  }

  return result;
}