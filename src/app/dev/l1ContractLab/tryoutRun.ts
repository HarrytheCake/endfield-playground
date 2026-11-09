/**
 * V21-C1 試玩執行器。
 *
 * 只呼叫既有 `hitTestPortAt`／`findPortAt`，不改簽名、不寫 store。
 */
import type { PlacedDevice, PortDirection } from '@/types/layout';
import { getMachineById } from '@/data/machines';
import { hitTestPortAt } from '@/utils/layout/portHitTest';
import { collectPortAnchors, findPortAt } from '@/utils/layout/portAnchorIndex';
import type {
    TryoutApiId,
    TryoutFixtureId,
    TryoutPrefer,
} from '@/app/dev/l1ContractLab/contractCatalog';

/** 唯讀錨點表一列 */
export interface TryoutAnchorRow {
    /** 設備 id */
    deviceId: string;
    /** 埠方向 */
    portType: PortDirection;
    /** 埠索引 */
    portIndex: number;
    /** 外側錨點格 x */
    x: number;
    /** 外側錨點格 y */
    y: number;
}

/** 一次試玩請求 */
export interface TryoutRequest {
    /** 白名單 API */
    api: TryoutApiId;
    /** 查詢 x */
    x: number;
    /** 查詢 y */
    y: number;
    /** 空字串表示不傳 prefer */
    prefer: TryoutPrefer;
    /** 固定裝置 */
    fixture: TryoutFixtureId;
    /** 情境說明（可選，原樣放進 JSON） */
    hint?: string;
}

/** 寫進輸出面板的結果 */
export interface TryoutRunResult {
    /** 面板標題 */
    title: string;
    /** JSON 本體 */
    value: unknown;
}

/**
 * 粉碎機放在原點，對齊既有熱區／錨點案例。
 */
export function crusherAtOrigin(): PlacedDevice {
    return {
        id: 'c',
        machineType: 'crusher',
        position: { x: 0, y: 0, z: 0 },
        rotation: 0,
        label: 'c',
    };
}

/**
 * 左右相鄰的兩台分流器。右出與左入的視覺邊心都在 (1, 0.5)。
 */
export function adjacentSplitters(): PlacedDevice[] {
    return [
        {
            id: 'a',
            machineType: 'splitter',
            position: { x: 0, y: 0, z: 0 },
            rotation: 0,
            label: 'a',
        },
        {
            id: 'b',
            machineType: 'splitter',
            position: { x: 1, y: 0, z: 0 },
            rotation: 0,
            label: 'b',
        },
    ];
}

/**
 * 依場景取出固定裝置。
 *
 * @param fixture 場景 id
 */
export function devicesForFixture(fixture: TryoutFixtureId): PlacedDevice[] {
    if (fixture === 'crusher-origin') {
        return [crusherAtOrigin()];
    }
    return adjacentSplitters();
}

/**
 * 展開場景的外側錨點，供試玩頁唯讀表。
 *
 * @param fixture 場景 id
 */
export function anchorsForFixture(fixture: TryoutFixtureId): TryoutAnchorRow[] {
    return collectPortAnchors(devicesForFixture(fixture)).map((entry) => ({
        deviceId: entry.ref.deviceId,
        portType: entry.ref.portType,
        portIndex: entry.ref.portIndex,
        x: entry.x,
        y: entry.y,
    }));
}

/**
 * 場景的人話說明。
 *
 * @param fixture 場景 id
 */
export function fixtureCaption(fixture: TryoutFixtureId): string {
    if (fixture === 'crusher-origin') {
        return '一台粉碎機，代號 c，放在原點，沒有旋轉。頂邊三個是進料口，底邊三個是出料口。';
    }
    return '兩台分流器緊貼著放：a 在左邊、b 在右邊。a 右邊的出料口和 b 左邊的進料口，畫面上是同一個點 (1, 0.5)。';
}

/**
 * 把埠編號說成人話，並保留程式裡的寫法供對照。
 *
 * @param portType 進料或出料
 * @param portIndex 從 0 開始的編號
 */
function describePort(portType: PortDirection, portIndex: number): string {
    const kind = portType === 'input' ? '進料' : '出料';
    return `第 ${portIndex + 1} 個${kind}口（${portType}[${portIndex}]）`;
}

/**
 * 給頁面與 JSON 的第一句答案，不要求讀者先看欄位名。
 *
 * @param api 問的是滑鼠熱區還是端點格
 * @param result 命中的埠；沒有則為 null
 */
function describeResult(
    api: TryoutApiId,
    result: { deviceId: string; portType: PortDirection; portIndex: number } | null,
): string {
    if (!result) {
        if (api === 'hitTestPortAt') {
            return '沒有點到任何埠。這個位置不在任何埠旁邊的圓形範圍裡。';
        }
        return '沒有對上任何接管子的格子。小數點的位置多半是給滑鼠用的，不是整數格。';
    }
    const which = describePort(result.portType, result.portIndex);
    if (api === 'hitTestPortAt') {
        return `有點到。機器 ${result.deviceId} 的${which}。`;
    }
    return `對上了。機器 ${result.deviceId} 的${which}，就在這個整數格上。`;
}

/**
 * 真呼叫白名單 API，回傳可 JSON 化的結果。
 *
 * @param request 表單現值
 */
export function runTryout(request: TryoutRequest): TryoutRunResult {
    const devices = devicesForFixture(request.fixture);
    const prefer = request.prefer === '' ? undefined : request.prefer;
    const point = { x: request.x, y: request.y };
    const deviceBrief = devices.map((device) => ({
        id: device.id,
        machineType: device.machineType,
        position: device.position,
    }));

    if (request.api === 'hitTestPortAt') {
        const result = hitTestPortAt(
            point,
            devices,
            getMachineById,
            prefer ? { prefer } : undefined,
        );
        return {
            title: '試玩 · 滑鼠有沒有點到埠',
            value: {
                plain: describeResult('hitTestPortAt', result),
                api: 'hitTestPortAt',
                point,
                prefer: prefer
                    ? prefer === 'input'
                        ? '進料（input）'
                        : '出料（output）'
                    : '不指定',
                fixture: fixtureCaption(request.fixture),
                devices: deviceBrief,
                hint: request.hint ?? '',
                result,
            },
        };
    }

    const anchors = collectPortAnchors(devices);
    const result = findPortAt(anchors, request.x, request.y, prefer);
    return {
        title: '試玩 · 這個格子能不能接管子',
        value: {
            plain: describeResult('findPortAt', result),
            api: 'findPortAt',
            point,
            prefer: prefer ? (prefer === 'input' ? '進料（input）' : '出料（output）') : '不指定',
            fixture: fixtureCaption(request.fixture),
            devices: deviceBrief,
            hint: request.hint ?? '',
            note: '只有 x、y 和下面表格裡的整數完全一樣才算對上。小數的滑鼠位置通常是空的。',
            result,
        },
    };
}
