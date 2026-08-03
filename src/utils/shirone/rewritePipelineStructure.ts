/**
 * [ [x0][y0]], [x1][y0],  [x1][y1], [x2][y1],... ] 
 * maps to 
 * [x0][y0] & [ [0, x1-x0], [1, y1-y0], [0, x2-x1], ...]
 * use 0,1,2 instead of x,y,z
 * 
 * @example
 * const points: point[] = [
 *   [10, 20, 0],
 *   [30, 20, 0],
 *   [30, 50, 0],
 * ];
 * 
 * absToRelPath(points);
 * return: [[10, 20, 0], [[0, 20], [2, 30]]]
 */

type point = number[];
type vector = [direction: number, length: number];

export function absToRelPath(originalPoints: point[])
{
  // trivial
  if (originalPoints.length === 0) 
  {
    return [[], []];
  }

  const dimension = originalPoints[0].length;
  const startPoint: point = originalPoints[0];
  const moves: vector[] = [];

  let prev: point = originalPoints[0];

  for (let i = 1; i < originalPoints.length; i++) 
  {
    const curr = originalPoints[i];

    for (let j = 0; j < dimension; j++)
    {
      const delta = curr[j]-prev[j];
      if(delta != 0)
      {
        moves.push([j,delta])
      }
    }

    prev = curr;
  }
  
  console.log('[startPoint, moves]');
  return [startPoint, moves];
}