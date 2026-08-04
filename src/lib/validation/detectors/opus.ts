/**
 * CR-03 碰撞偵測器 (E001 + E002)
 *
 * 以全局 3D 陣列空間索引一次掃描所有設備與管線的佔用格子，
 * 輸出發生碰撞的配對後，由各 Detector 依物件類型分類為 E001 或 E002。
 *
 * 高度層規則（spec §2.2.1）：
 *   occupiedLayers(obj) = h === 1 ? {0, 1} : {z}
 *
 * 各物件預設值：
 *   - 一般設備（大部分設備）        z=0 h=1 → {0, 1}
 *   - 傳送帶本體（portType='item'） z=0 h=0 → {0}
 *   - 水管本體（portType='liquid'） z=1 h=0 → {1}
 *
 * 偵測器本身不判斷是 E001 或 E002，分類交由下方兩個 Detector 物件處理。
 */

import type { Detector, Alert, ValidationContext } from '@/types/validation';
import type { FactoryNode, FactoryEdge } from '@/types/graph';
import type { Position } from '@/types/euclideanSpace';

import { getOccupiedCells }         from '@/utils/shirone/getMachineOccupiedGrids';
import { getPipelineOccupiedGrids } from '@/utils/shirone/getPipelineOccupiedGrids';

// ─── 常數 ────────────────────────────────────────────────────────────────────

/** 格子像素大小（與 canvasStore 一致，用於將像素座標換算成格座標） */
const GRID_SIZE = 50;

// ─── 高度層輔助型別 ───────────────────────────────────────────────────────────

interface HeightProfile {
  /** 物理層：0 = 地面，1 = 空中 */
  z: 0 | 1;
  /** 貫穿旗標：1 = 同時佔用 z=0 與 z=1 */
  h: 0 | 1;
}

// ─── 實體描述（供 3D 索引使用） ───────────────────────────────────────────────

/** 標記一個實體是「設備」還是「管線」 */
type EntityKind = 'device' | 'connection';

interface Entity {
  id: string;
  kind: EntityKind;
  grids: Position[];  // 每個格子已換算完成（整數格座標，z 為高度層 0|1）
  profile: HeightProfile;
}

// ─── 碰撞核心 ─────────────────────────────────────────────────────────────────

/**
 * 判斷兩個高度 profile 是否有層高交集。
 *
 * occupiedLayers(p) = p.h === 1 ? {0, 1} : {p.z}
 * 交集非空 → 真正衝突
 */
function hasLayerConflict(a: HeightProfile, b: HeightProfile): boolean {
  const layersA: Set<number> = a.h === 1 ? new Set([0, 1]) : new Set([a.z]);
  const layersB: Set<number> = b.h === 1 ? new Set([0, 1]) : new Set([b.z]);
  for (const l of layersA) {
    if (layersB.has(l)) return true;
  }
  return false;
}

/**
 * 碰撞結果配對
 *
 * 不區分 E001 / E002，交由上層 Detector 決定。
 */
interface CollisionPair {
  id1: string;
  kind1: EntityKind;
  id2: string;
  kind2: EntityKind;
}

/**
 * 核心偵測函式：
 * 1. 將所有設備與管線描述為 Entity（含佔用格子與高度 profile）。
 * 2. 填入 3D 陣列，發現已有其他 ID 時比對層高，有交集則記錄碰撞配對。
 * 3. 回傳所有碰撞配對（不含重複）。
 */
function detectCollisions(ctx: ValidationContext): CollisionPair[] {
  const entities: Entity[] = [];

  // ── 1. 收集設備 ───────────────────────────────────────────────────────────
  for (const device of ctx.devices) {
    const def = ctx.getDef(device.data.machineType ?? '');
    if (!def) continue;

    const rotation = device.data.rotation ?? 0;

    // 將像素座標轉換為格座標（整數）
    const gridX = Math.round(device.position.x / GRID_SIZE);
    const gridY = Math.round(device.position.y / GRID_SIZE);

    // getOccupiedCells 輸出的 z 維度為設備本身的高度層數（size[2]）
    // 一般設備的 size[2] 在此系統中未使用，以 h=1 覆蓋兩層
    const rawGrids = getOccupiedCells(
      [gridX, gridY, 0],
      [def.width, def.height, 1],
      rotation,
    );

    // 一般設備：h=1，佔用 {0,1}
    const profile: HeightProfile = { z: 0, h: 1 };

    entities.push({ id: device.id, kind: 'device', grids: rawGrids, profile });
  }

  // ── 2. 收集管線 ───────────────────────────────────────────────────────────
  for (const conn of ctx.connections) {
    const portType = conn.data?.portType;
    const bendPoints = conn.data?.bendPoints ?? [];

    // 從 bendPoints 建構 waypoints（畫素座標 → 格座標整數）
    // source / target 節點的格座標須從 FactoryNode 中查找
    // 這裡使用 bendPoints 作為路徑折點；若無折點則為空管線，略過
    if (bendPoints.length < 2) continue;

    const waypoints: Position[] = bendPoints.map(bp => [
      Math.round(bp.x / GRID_SIZE),
      Math.round(bp.y / GRID_SIZE),
      0, // 管線本體 z 由 profile 控制，路徑格統一填 0
    ]);

    const grids = getPipelineOccupiedGrids(waypoints);

    // 高度 profile（spec §2.2.1）
    const profile: HeightProfile =
      portType === 'liquid'
        ? { z: 1, h: 0 }   // 水管本體 → {1}
        : { z: 0, h: 0 };  // 傳送帶本體 → {0}

    entities.push({ id: conn.id, kind: 'connection', grids, profile });
  }

  // ── 3. 3D 陣列碰撞掃描 ────────────────────────────────────────────────────
  // allgrid[x][y][z] = [{ id, profileRef }]
  // 注意：z 軸索引只用作區分「哪個格子」，層高交集由 hasLayerConflict 判斷
  interface CellEntry { id: string; kind: EntityKind; profile: HeightProfile }
  const allgrid: CellEntry[][][][] = [];

  // 使用字串 key 避免重複記錄同一對
  const seen = new Set<string>();
  const collisions: CollisionPair[] = [];

  for (const entity of entities) {
    for (const [gx, gy, gz] of entity.grids) {
      // 動態初始化陣列維度（CR03_PLAN §2 規定）
      allgrid[gx]         ??= [];
      allgrid[gx][gy]     ??= [];
      allgrid[gx][gy][gz] ??= [];

      const cell = allgrid[gx][gy][gz];

      for (const existing of cell) {
        // 同一實體的格子不自撞
        if (existing.id === entity.id) continue;

        // 比對層高：交集為空 → 允許重疊，不算衝突
        if (!hasLayerConflict(existing.profile, entity.profile)) continue;

        // 去重：同一對只記錄一次
        const pairKey =
          existing.id < entity.id
            ? `${existing.id}|${entity.id}`
            : `${entity.id}|${existing.id}`;

        if (!seen.has(pairKey)) {
          seen.add(pairKey);
          collisions.push({
            id1:   existing.id,
            kind1: existing.kind,
            id2:   entity.id,
            kind2: entity.kind,
          });
        }
      }

      cell.push({ id: entity.id, kind: entity.kind, profile: entity.profile });
    }
  }

  return collisions;
}

// ─── 輔助：查詢設備顯示名稱 ──────────────────────────────────────────────────

function deviceLabel(device: FactoryNode, ctx: ValidationContext): string {
  return (
    device.data.label ||
    ctx.getDef(device.data.machineType ?? '')?.name ||
    device.id
  );
}

function connectionLabel(conn: FactoryEdge): string {
  return `管線 #${conn.id}`;
}

// ─── E001 設備重疊 Detector ───────────────────────────────────────────────────

/**
 * E001：設備重疊
 *
 * 碰撞配對中，雙方均為「device」者觸發 E001。
 */
export const E001_deviceOverlap: Detector = {
  code:  'E001',
  level: 'error',

  run(ctx: ValidationContext): Alert[] {
    const collisions = detectCollisions(ctx);
    const alerts: Alert[] = [];

    // 建立 id → FactoryNode 查找表
    const deviceMap = new Map<string, FactoryNode>(
      ctx.devices.map(d => [d.id, d]),
    );

    for (const pair of collisions) {
      // E001：設備 ↔ 設備
      if (pair.kind1 !== 'device' || pair.kind2 !== 'device') continue;

      const dev1 = deviceMap.get(pair.id1);
      const dev2 = deviceMap.get(pair.id2);
      if (!dev1 || !dev2) continue;

      alerts.push({
        uid:                    crypto.randomUUID(),
        level:                  'error',
        code:                   'E001',
        message:                `設備重疊：${deviceLabel(dev1, ctx)} 與 ${deviceLabel(dev2, ctx)}`,
        relatedDeviceUids:      [pair.id1, pair.id2],
        relatedConnectionUids:  [],
      });
    }

    return alerts;
  },
};

// ─── E002 佈線違法 Detector ───────────────────────────────────────────────────

/**
 * E002：佈線違法
 *
 * 碰撞配對中，只要有一方為「connection」（管線）、
 * 另一方為「device」（設備）者觸發 E002。
 *
 * 純管線 ↔ 管線碰撞依規格不屬於 E002，不在此處理。
 */
export const E002_illegalWiring: Detector = {
  code:  'E002',
  level: 'error',

  run(ctx: ValidationContext): Alert[] {
    const collisions = detectCollisions(ctx);
    const alerts: Alert[] = [];

    const deviceMap = new Map<string, FactoryNode>(
      ctx.devices.map(d => [d.id, d]),
    );
    const connMap = new Map<string, FactoryEdge>(
      ctx.connections.map(c => [c.id, c]),
    );

    for (const pair of collisions) {
      // E002：connection ↔ device（任意順序）
      let connId: string | null   = null;
      let deviceId: string | null = null;

      if (pair.kind1 === 'connection' && pair.kind2 === 'device') {
        connId   = pair.id1;
        deviceId = pair.id2;
      } else if (pair.kind1 === 'device' && pair.kind2 === 'connection') {
        connId   = pair.id2;
        deviceId = pair.id1;
      } else {
        continue; // device-device → E001；connection-connection → 不處理
      }

      const conn   = connMap.get(connId);
      const device = deviceMap.get(deviceId);
      if (!conn || !device) continue;

      alerts.push({
        uid:                    crypto.randomUUID(),
        level:                  'error',
        code:                   'E002',
        message:                `佈線違法：${connectionLabel(conn)} 穿越 ${deviceLabel(device, ctx)}`,
        relatedDeviceUids:      [deviceId],
        relatedConnectionUids:  [connId],
      });
    }

    return alerts;
  },
};
