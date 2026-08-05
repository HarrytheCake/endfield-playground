import { describe, it, expect } from 'vitest';
import { absToRelPath } from "@/utils/shirone/rewritePipelineStructure";

describe('absToRelPath', () => {
  it('情況 1:基本 2D 位移（X 軸、Y 軸交替移動）', () => {
    const points = [
      [1, 2],
      [1, 4],
      [3, 4],
      [3, 0]
    ];

    const result = absToRelPath(points);

    console.log('--- 情況 1:基本 2D 位移 ---');
    console.log(JSON.stringify(result));

    expect(result).toEqual([
      [1, 2],
      [
        { axis: 1, delta: 2 },   // index 1 (Y軸) +2
        { axis: 0, delta: 2 },   // index 0 (X軸) +2
        { axis: 1, delta: -4 }   // index 1 (Y軸) -4
      ]
    ]);
  });

  it('情況 2:包含負向位移與回折 (2D)', () => {
    const points = [
      [5, 5],
      [5, 10],
      [2, 10],
      [2, 0]
    ];

    const result = absToRelPath(points);

    console.log('--- 情況 2:負位移 (2D) ---');
    console.log(JSON.stringify(result));

    expect(result).toEqual([
      [5, 5],
      [
        { axis: 1, delta: 5 },   // Y 軸 +5
        { axis: 0, delta: -3 },  // X 軸 -3
        { axis: 1, delta: -10 }  // Y 軸 -10
      ]
    ]);
  });

  it('情況 3:3D 空間座標移動 (X, Y, Z 軸)', () => {
    const points = [
      [10, 20, 0],
      [30, 20, 0],
      [30, 50, 0],
      [30, 50, 15]
    ];

    const result = absToRelPath(points);

    console.log('--- 情況 3:3D 位移 ---');
    console.log(JSON.stringify(result));

    expect(result).toEqual([
      [10, 20, 0],
      [
        { axis: 0, delta: 20 },  // index 0 (X軸) +20
        { axis: 1, delta: 30 },  // index 1 (Y軸) +30
        { axis: 2, delta: 15 }   // index 2 (Z軸) +15
      ]
    ]);
  });

  it('情況 4:只有一個起點 (單點邊界情況)', () => {
    const points = [
      [10, 20, 5]
    ];

    const result = absToRelPath(points);

    console.log('--- 情況 4:單一點 ---');
    console.log(JSON.stringify(result));

    expect(result).toEqual([
      [10, 20, 5],
      []
    ]);
  });

  it('情況 5:包含連續相同座標點 (無位移點)', () => {
    const points = [
      [1, 2],
      [1, 2], // 原地不變
      [1, 5]
    ];

    const result = absToRelPath(points);

    console.log('--- 情況 5:包含重複座標 ---');
    console.log(JSON.stringify(result));

    expect(result).toEqual([
      [1, 2],
      [
        { axis: 1, delta: 3 }  // 自動忽略 0 位移，僅保留有效移動
      ]
    ]);
  });

  it('情況 6:高維度 4D 座標系移動', () => {
    const points = [
      [0, 0, 0, 0],
      [0, 0, 0, 5],
      [0, 2, 0, 5]
    ];

    const result = absToRelPath(points);

    console.log('--- 情況 6:4D 位移 ---');
    console.log(JSON.stringify(result));

    expect(result).toEqual([
      [0, 0, 0, 0],
      [
        { axis: 3, delta: 5 }, // index 3 +5
        { axis: 1, delta: 2 }  // index 1 +2
      ]
    ]);
  });

  it('情況 7:傳入空陣列 (空邊界情況)', () => {
    const result = absToRelPath([]);
    expect(result).toEqual([[], []]);
  });
});