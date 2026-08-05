import { describe, it, expect } from 'vitest';
import { detectCollisions } from '@/lib/validation/detectors/collisionDetector';
import type { shironesMachine, shironesPipeline } from '@/types/shironesinterface';

describe('collisionDetector', () => {
    it('should return empty array when there are no collisions', () => {
        const machines: shironesMachine[] = [
            { id: 'm1', position: [0, 0, 0], rotation: 0, size: [2, 2, 1] },
            { id: 'm2', position: [3, 0, 0], rotation: 0, size: [2, 2, 1] },
        ];
        const pipelines: shironesPipeline[] = [
            { id: 'p1', waypoints: [[0, 3, 0], [5, 3, 0]] }
        ];

        const result = detectCollisions(machines, pipelines);
        expect(result).toEqual([]);
    });

    it('should detect collision between two overlapping machines', () => {
        const machines: shironesMachine[] = [
            { id: 'm1', position: [0, 0, 0], rotation: 0, size: [2, 2, 1] },
            // m2 overlaps at [1, 0, 0] and [1, 1, 0]
            { id: 'm2', position: [1, 0, 0], rotation: 0, size: [2, 2, 1] }, 
        ];

        const result = detectCollisions(machines, []);
        expect(result.sort()).toEqual(['m1', 'm2'].sort());
    });

    it('should consider rotation when detecting collisions', () => {
        // m_rot 原始 size 是 1x4x1, 旋轉 90 度 (rotation 1) 後變成 4x1x1
        // 會佔據 x: 0..3, y: 2, z: 0
        const m_test: shironesMachine[] = [
            { id: 'm_rot', position: [0, 2, 0], rotation: 1, size: [1, 4, 1] },
            // m_block 放置在 x: 3, y: 2，剛好與旋轉後的 m_rot 發生碰撞
            { id: 'm_block', position: [3, 2, 0], rotation: 0, size: [1, 1, 1] }
        ];

        const result = detectCollisions(m_test, []);
        expect(result.sort()).toEqual(['m_block', 'm_rot'].sort());
        
        // 確保如果不旋轉的話，不會發生碰撞
        const m_test_no_rot: shironesMachine[] = [
            { id: 'm_no_rot', position: [0, 2, 0], rotation: 0, size: [1, 4, 1] }, // 佔據 x: 0, y: 2..5
            { id: 'm_block', position: [3, 2, 0], rotation: 0, size: [1, 1, 1] } // 佔據 x: 3, y: 2
        ];
        expect(detectCollisions(m_test_no_rot, [])).toEqual([]);
    });

    it('should detect collision between machine and pipeline', () => {
        const machines: shironesMachine[] = [
            { id: 'm1', position: [2, 2, 0], rotation: 0, size: [2, 2, 1] },
        ];
        const pipelines: shironesPipeline[] = [
            // 路徑經過 [0,2,0], [1,2,0], [2,2,0], [3,2,0], 會在 [2,2,0] 與設備相撞
            { id: 'p1', waypoints: [[0, 2, 0], [4, 2, 0]] }
        ];

        const result = detectCollisions(machines, pipelines);
        expect(result.sort()).toEqual(['m1', 'p1'].sort());
    });

    it('should detect collision between multiple pipelines', () => {
        const pipelines: shironesPipeline[] = [
            { id: 'p1', waypoints: [[0, 2, 0], [4, 2, 0]] },
            { id: 'p2', waypoints: [[2, 0, 0], [2, 4, 0]] } // 兩條管線在 [2, 2, 0] 交叉相撞
        ];

        const result = detectCollisions([], pipelines);
        expect(result.sort()).toEqual(['p1', 'p2'].sort());
    });
    
    it('should handle 3D intersections correctly', () => {
        const machines: shironesMachine[] = [
            // m_ground 在地面 (z=0)
            { id: 'm_ground', position: [0, 0, 0], rotation: 0, size: [2, 2, 1] },
            // m_air 在空中 (z=1)，與 m_ground x,y 座標重疊但 z 不同
            { id: 'm_air', position: [0, 0, 1], rotation: 0, size: [2, 2, 1] },
        ];
        
        // 因為 Z 軸不同，不應該有碰撞
        expect(detectCollisions(machines, [])).toEqual([]);
        
        // 新增一條走在空中的管線，與空中的設備碰撞
        const pipelines: shironesPipeline[] = [
            { id: 'p_air', waypoints: [[0, 0, 1], [5, 0, 1]] }
        ];
        
        expect(detectCollisions(machines, pipelines).sort()).toEqual(['m_air', 'p_air'].sort());
    });

    it('should NOT detect collision for objects exactly touching edges (boundary test)', () => {
        const machines: shironesMachine[] = [
            // m1 佔用 x:0,1, y:0,1
            { id: 'm1', position: [0, 0, 0], rotation: 0, size: [2, 2, 1] },
            // m2 佔用 x:2,3, y:0,1 (在 x=2 的邊界與 m1 接觸，但不重疊)
            { id: 'm2', position: [2, 0, 0], rotation: 0, size: [2, 2, 1] },
            // m3 佔用 x:0,1, y:2,3 (在 y=2 的邊界與 m1 接觸)
            { id: 'm3', position: [0, 2, 0], rotation: 0, size: [2, 2, 1] },
        ];
        
        const pipelines: shironesPipeline[] = [
            // 管線穿過 x=2, y=2..4 的區域，剛好貼在 m2 和 m3 的邊緣
            { id: 'p1', waypoints: [[2, 2, 0], [2, 5, 0]] } 
        ];

        expect(detectCollisions(machines, pipelines)).toEqual([]);
    });

    it('should detect collision when a pipeline self-intersects', () => {
        const pipelines: shironesPipeline[] = [
            // 一條像貪吃蛇一樣繞一圈撞到自己的管線
            // 起點 [0,0,0]，終點回到 [0,0,0]
            { id: 'snake_pipe', waypoints: [[0, 0, 0], [2, 0, 0], [2, 2, 0], [0, 2, 0], [0, 0, 0]] }
        ];

        // 在 [0,0,0] 時會發現自己已經佔用該格子，因此回傳包含自己的 ID
        const result = detectCollisions([], pipelines);
        expect(result).toEqual(['snake_pipe']);
    });

    it('should handle complex multi-layer (3D) factory setups correctly', () => {
        const machines: shironesMachine[] = [
            // 高塔設備，高度為 2 (z=0, z=1 都佔用)
            { id: 'tall_machine', position: [1, 1, 0], rotation: 0, size: [2, 2, 2] },
            // 一般設備，高度為 1 (只佔用 z=0)
            { id: 'ground_machine', position: [4, 1, 0], rotation: 0, size: [2, 2, 1] },
        ];
        
        const pipelines: shironesPipeline[] = [
            // p_safe 從 z=1 跨過 ground_machine，因為 ground_machine 只有 z=0，所以安全
            { id: 'p_safe', waypoints: [[4, 1, 1], [5, 1, 1]] },
            
            // p_collide 從 z=1 跨過 tall_machine，因為 tall_machine 高度佔用至 z=1，發生碰撞
            { id: 'p_collide', waypoints: [[1, 1, 1], [2, 1, 1]] },
            
            // p_underground 走地下層 z=-1 (假設陣列支援負值或轉譯)，安全
            { id: 'p_underground', waypoints: [[0, 1, -1], [5, 1, -1]] }
        ];

        const result = detectCollisions(machines, pipelines);
        expect(result.sort()).toEqual(['p_collide', 'tall_machine'].sort());
    });

    it('should gracefully handle zero-size machines or empty pipelines without crashing', () => {
        const machines: shironesMachine[] = [
            // 體積為 0 的幽靈設備
            { id: 'ghost_machine', position: [0, 0, 0], rotation: 0, size: [0, 0, 0] },
        ];
        const pipelines: shironesPipeline[] = [
            // 沒有路徑點的管線
            { id: 'empty_pipe', waypoints: [] }
        ];

        expect(detectCollisions(machines, pipelines)).toEqual([]);
    });

    it('should throw an error if input dimensions are mixed', () => {
        const pipelines: shironesPipeline[] = [
            // 3D管線
            { id: '3d_pipe', waypoints: [[1, 2, 3]] },
            // 2D管線混在一起
            { id: '2d_pipe', waypoints: [[1, 2]] }
        ];

        // 預期它會因為維度不一致而拋出 Error
        expect(() => detectCollisions([], pipelines)).toThrowError(/Dimension mismatch! Expected 3D, but got 2D/);
    });

    it('should support n-dimensional space (e.g., 4D, 5D, 1D) as long as they are consistent per run', () => {
        // 4D 測試
        const pipelines4D: shironesPipeline[] = [
            { id: '4d_pipe1', waypoints: [[1, 2, 3, 4]] },
            { id: '4d_pipe2', waypoints: [[1, 2, 3, 4]] },
            { id: '4d_safe', waypoints: [[1, 2, 3, 5]] }
        ];
        const result4D = detectCollisions([], pipelines4D);
        expect(result4D.sort()).toEqual(['4d_pipe1', '4d_pipe2'].sort());

        // 1D 測試 (分開執行，避免觸發維度不一致錯誤)
        const pipelines1D: shironesPipeline[] = [
            { id: '1d_pipe1', waypoints: [[99]] },
            { id: '1d_pipe2', waypoints: [[99]] },
        ];
        const result1D = detectCollisions([], pipelines1D);
        expect(result1D.sort()).toEqual(['1d_pipe1', '1d_pipe2'].sort());
    });

    it('should handle large amount of objects efficiently (stress test)', () => {
        const machines: shironesMachine[] = [];
        const TOTAL = 20000;
        
        // 隨機產生 2 萬個完全不重疊的設備 (每個佔 2x2，間隔為 3)
        // 100 x 200 的網格排佈
        for (let i = 0; i < TOTAL; i++) {
            machines.push({
                id: `m_${i}`,
                position: [(i % 100) * 3, Math.floor(i / 100) * 3, 0],
                rotation: 0,
                size: [2, 2, 1]
            });
        }
        
        // 故意在遙遠的地方放兩個會重疊的設備
        machines.push({ id: 'collide1', position: [50000, 50000, 0], rotation: 0, size: [1, 1, 1] });
        machines.push({ id: 'collide2', position: [50000, 50000, 0], rotation: 0, size: [1, 1, 1] });

        const start = Date.now();
        const result = detectCollisions(machines, []);
        const duration = Date.now() - start;

        // 必須能正確在 2 萬個物件中找出唯一的重疊對
        expect(result.sort()).toEqual(['collide1', 'collide2'].sort());
        
        // 確保效能合乎標準，2 萬個設備 (等於 8 萬個座標點) 建立陣列的耗時不應超過 1000ms
        expect(duration).toBeLessThan(1000);
        console.log(`Stress test with ${TOTAL} objects completed in ${duration}ms`);
    });
});
