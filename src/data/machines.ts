/**
 * 機器靜態定義資料
 *
 * 對齊 docs/aaaaa/data/machines.json（共 39 台機器）。
 * 每台以具名常數 export，行為函式 Phase 1 全為 null。
 *
 * 另附 FlowEngine 專用節點：物品輸出口（is_source）、物品輸入口（is_sink）。
 */

import type { Machine } from '@/types/machine';

// ─── 基礎生產類 ───────────────────────────────────────────────────────────────

export const 塑型機: Machine = {
    id: 'shaping_machine',
    name: '塑型機',
    width: 3,
    height: 3,
    input_ports: [
        { side: 'top', offset: 0, type: 'item' },
        { side: 'top', offset: 1, type: 'item' },
        { side: 'top', offset: 2, type: 'item' },
    ],
    output_ports: [
        { side: 'bottom', offset: 0, type: 'item' },
        { side: 'bottom', offset: 1, type: 'item' },
        { side: 'bottom', offset: 2, type: 'item' },
    ],
    power: 10,
    tags: ['基礎生產'],
    is_source: false,
    is_sink: false,
    onTick: null,
    onInput: null,
    onOutput: null,
    calcEfficiency: null,
};

export const 精煉爐: Machine = {
    id: 'refinery',
    name: '精煉爐',
    width: 3,
    height: 3,
    input_ports: [
        { side: 'left', offset: 0, type: 'item' },
        { side: 'left', offset: 1, type: 'item' },
        { side: 'left', offset: 2, type: 'item' },
        { side: 'bottom', offset: 1, type: 'liquid' },
    ],
    output_ports: [
        { side: 'top', offset: 1, type: 'liquid' },
        { side: 'right', offset: 0, type: 'item' },
        { side: 'right', offset: 1, type: 'item' },
        { side: 'right', offset: 2, type: 'item' },
    ],
    power: 5,
    tags: ['基礎生產'],
    is_source: false,
    is_sink: false,
    onTick: null,
    onInput: null,
    onOutput: null,
    calcEfficiency: null,
};

export const 粉碎機: Machine = {
    id: 'crusher',
    name: '粉碎機',
    width: 3,
    height: 3,
    input_ports: [
        { side: 'top', offset: 0, type: 'item' },
        { side: 'top', offset: 1, type: 'item' },
        { side: 'top', offset: 2, type: 'item' },
    ],
    output_ports: [
        { side: 'bottom', offset: 0, type: 'item' },
        { side: 'bottom', offset: 1, type: 'item' },
        { side: 'bottom', offset: 2, type: 'item' },
    ],
    power: 5,
    tags: ['基礎生產'],
    is_source: false,
    is_sink: false,
    onTick: null,
    onInput: null,
    onOutput: null,
    calcEfficiency: null,
};

export const 配件機: Machine = {
    id: 'parts_machine',
    name: '配件機',
    width: 3,
    height: 3,
    input_ports: [
        { side: 'top', offset: 0, type: 'item' },
        { side: 'top', offset: 1, type: 'item' },
        { side: 'top', offset: 2, type: 'item' },
    ],
    output_ports: [
        { side: 'bottom', offset: 0, type: 'item' },
        { side: 'bottom', offset: 1, type: 'item' },
        { side: 'bottom', offset: 2, type: 'item' },
    ],
    power: 20,
    tags: ['基礎生產'],
    is_source: false,
    is_sink: false,
    onTick: null,
    onInput: null,
    onOutput: null,
    calcEfficiency: null,
};

export const 採種機: Machine = {
    id: 'seed_harvester',
    name: '採種機',
    width: 5,
    height: 5,
    input_ports: [
        { side: 'top', offset: 0, type: 'item' },
        { side: 'top', offset: 1, type: 'item' },
        { side: 'top', offset: 2, type: 'item' },
        { side: 'top', offset: 3, type: 'item' },
        { side: 'top', offset: 4, type: 'item' },
    ],
    output_ports: [
        { side: 'bottom', offset: 0, type: 'item' },
        { side: 'bottom', offset: 1, type: 'item' },
        { side: 'bottom', offset: 2, type: 'item' },
        { side: 'bottom', offset: 3, type: 'item' },
        { side: 'bottom', offset: 4, type: 'item' },
    ],
    power: 10,
    tags: ['基礎生產'],
    is_source: false,
    is_sink: false,
    onTick: null,
    onInput: null,
    onOutput: null,
    calcEfficiency: null,
};

export const 種植機: Machine = {
    id: 'planter',
    name: '種植機',
    width: 5,
    height: 5,
    input_ports: [
        { side: 'top', offset: 0, type: 'item' },
        { side: 'top', offset: 1, type: 'item' },
        { side: 'top', offset: 2, type: 'item' },
        { side: 'top', offset: 3, type: 'item' },
        { side: 'top', offset: 4, type: 'item' },
        { side: 'left', offset: 2, type: 'liquid' },
    ],
    output_ports: [
        { side: 'bottom', offset: 0, type: 'item' },
        { side: 'bottom', offset: 1, type: 'item' },
        { side: 'bottom', offset: 2, type: 'item' },
        { side: 'bottom', offset: 3, type: 'item' },
        { side: 'bottom', offset: 4, type: 'item' },
    ],
    power: 20,
    tags: ['基礎生產'],
    is_source: false,
    is_sink: false,
    onTick: null,
    onInput: null,
    onOutput: null,
    calcEfficiency: null,
};

export const 廢水處理機: Machine = {
    id: 'wastewater_processor',
    name: '廢水處理機',
    width: 3,
    height: 3,
    input_ports: [{ side: 'left', offset: 1, type: 'liquid' }],
    output_ports: [],
    power: 50,
    tags: ['基礎生產'],
    is_source: false,
    is_sink: false,
    onTick: null,
    onInput: null,
    onOutput: null,
    calcEfficiency: null,
};

// ─── 合成製造類 ───────────────────────────────────────────────────────────────

export const 灌裝機: Machine = {
    id: 'filling_machine',
    name: '灌裝機',
    width: 6,
    height: 4,
    input_ports: [
        { side: 'top', offset: 0, type: 'item' },
        { side: 'top', offset: 1, type: 'item' },
        { side: 'top', offset: 2, type: 'item' },
        { side: 'top', offset: 3, type: 'item' },
        { side: 'top', offset: 4, type: 'item' },
        { side: 'top', offset: 5, type: 'item' },
        { side: 'left', offset: 1, type: 'liquid' },
    ],
    output_ports: [
        { side: 'bottom', offset: 0, type: 'item' },
        { side: 'bottom', offset: 1, type: 'item' },
        { side: 'bottom', offset: 2, type: 'item' },
        { side: 'bottom', offset: 3, type: 'item' },
        { side: 'bottom', offset: 4, type: 'item' },
        { side: 'bottom', offset: 5, type: 'item' },
    ],
    power: 20,
    tags: ['合成製造'],
    is_source: false,
    is_sink: false,
    onTick: null,
    onInput: null,
    onOutput: null,
    calcEfficiency: null,
};

export const 裝備原件機: Machine = {
    id: 'equipment_parts_machine',
    name: '裝備原件機',
    width: 4,
    height: 6,
    input_ports: [
        { side: 'left', offset: 0, type: 'item' },
        { side: 'left', offset: 1, type: 'item' },
        { side: 'left', offset: 2, type: 'item' },
        { side: 'left', offset: 3, type: 'item' },
        { side: 'left', offset: 4, type: 'item' },
        { side: 'left', offset: 5, type: 'item' },
    ],
    output_ports: [
        { side: 'right', offset: 0, type: 'item' },
        { side: 'right', offset: 1, type: 'item' },
        { side: 'right', offset: 2, type: 'item' },
        { side: 'right', offset: 3, type: 'item' },
        { side: 'right', offset: 4, type: 'item' },
        { side: 'right', offset: 5, type: 'item' },
    ],
    power: 10,
    tags: ['合成製造'],
    is_source: false,
    is_sink: false,
    onTick: null,
    onInput: null,
    onOutput: null,
    calcEfficiency: null,
};

export const 封裝機: Machine = {
    id: 'packaging_machine',
    name: '封裝機',
    width: 6,
    height: 4,
    input_ports: [
        { side: 'top', offset: 0, type: 'item' },
        { side: 'top', offset: 1, type: 'item' },
        { side: 'top', offset: 2, type: 'item' },
        { side: 'top', offset: 3, type: 'item' },
        { side: 'top', offset: 4, type: 'item' },
        { side: 'top', offset: 5, type: 'item' },
    ],
    output_ports: [
        { side: 'bottom', offset: 0, type: 'item' },
        { side: 'bottom', offset: 1, type: 'item' },
        { side: 'bottom', offset: 2, type: 'item' },
        { side: 'bottom', offset: 3, type: 'item' },
        { side: 'bottom', offset: 4, type: 'item' },
        { side: 'bottom', offset: 5, type: 'item' },
    ],
    power: 20,
    tags: ['合成製造'],
    is_source: false,
    is_sink: false,
    onTick: null,
    onInput: null,
    onOutput: null,
    calcEfficiency: null,
};

export const 研磨機: Machine = {
    id: 'grinder',
    name: '研磨機',
    width: 6,
    height: 4,
    input_ports: [
        { side: 'top', offset: 0, type: 'item' },
        { side: 'top', offset: 1, type: 'item' },
        { side: 'top', offset: 2, type: 'item' },
        { side: 'top', offset: 3, type: 'item' },
        { side: 'top', offset: 4, type: 'item' },
        { side: 'top', offset: 5, type: 'item' },
    ],
    output_ports: [
        { side: 'bottom', offset: 0, type: 'item' },
        { side: 'bottom', offset: 1, type: 'item' },
        { side: 'bottom', offset: 2, type: 'item' },
        { side: 'bottom', offset: 3, type: 'item' },
        { side: 'bottom', offset: 4, type: 'item' },
        { side: 'bottom', offset: 5, type: 'item' },
    ],
    power: 50,
    tags: ['合成製造'],
    is_source: false,
    is_sink: false,
    onTick: null,
    onInput: null,
    onOutput: null,
    calcEfficiency: null,
};

export const 反應池: Machine = {
    id: 'reactor',
    name: '反應池',
    width: 5,
    height: 5,
    input_ports: [
        { side: 'top', offset: 1, type: 'item' },
        { side: 'top', offset: 3, type: 'item' },
        { side: 'left', offset: 1, type: 'liquid' },
        { side: 'left', offset: 3, type: 'liquid' },
    ],
    output_ports: [
        { side: 'right', offset: 1, type: 'liquid' },
        { side: 'right', offset: 3, type: 'liquid' },
        { side: 'bottom', offset: 1, type: 'item' },
        { side: 'bottom', offset: 3, type: 'item' },
    ],
    power: 50,
    tags: ['合成製造'],
    is_source: false,
    is_sink: false,
    onTick: null,
    onInput: null,
    onOutput: null,
    calcEfficiency: null,
};

export const 天有洪爐: Machine = {
    id: 'blast_furnace',
    name: '天有洪爐',
    width: 5,
    height: 5,
    input_ports: [
        { side: 'top', offset: 0, type: 'item' },
        { side: 'top', offset: 1, type: 'item' },
        { side: 'top', offset: 2, type: 'item' },
        { side: 'top', offset: 3, type: 'item' },
        { side: 'top', offset: 4, type: 'item' },
        { side: 'left', offset: 2, type: 'liquid' },
    ],
    output_ports: [
        { side: 'bottom', offset: 0, type: 'item' },
        { side: 'bottom', offset: 1, type: 'item' },
        { side: 'bottom', offset: 2, type: 'item' },
        { side: 'bottom', offset: 3, type: 'item' },
        { side: 'bottom', offset: 4, type: 'item' },
    ],
    power: 50,
    tags: ['合成製造'],
    is_source: false,
    is_sink: false,
    onTick: null,
    onInput: null,
    onOutput: null,
    calcEfficiency: null,
};

export const 提純機: Machine = {
    id: 'purifier',
    name: '提純機',
    width: 5,
    height: 5,
    input_ports: [
        { side: 'left', offset: 1, type: 'liquid' },
        { side: 'left', offset: 3, type: 'liquid' },
    ],
    output_ports: [
        { side: 'right', offset: 1, type: 'liquid' },
        { side: 'right', offset: 3, type: 'liquid' },
    ],
    power: 50,
    tags: ['合成製造'],
    is_source: false,
    is_sink: false,
    onTick: null,
    onInput: null,
    onOutput: null,
    calcEfficiency: null,
};

export const 拆解機: Machine = {
    id: 'disassembler',
    name: '拆解機',
    width: 6,
    height: 4,
    input_ports: [
        { side: 'top', offset: 0, type: 'item' },
        { side: 'top', offset: 1, type: 'item' },
        { side: 'top', offset: 2, type: 'item' },
        { side: 'top', offset: 3, type: 'item' },
        { side: 'top', offset: 4, type: 'item' },
        { side: 'top', offset: 5, type: 'item' },
    ],
    output_ports: [
        { side: 'right', offset: 1, type: 'liquid' },
        { side: 'bottom', offset: 0, type: 'item' },
        { side: 'bottom', offset: 1, type: 'item' },
        { side: 'bottom', offset: 2, type: 'item' },
        { side: 'bottom', offset: 3, type: 'item' },
        { side: 'bottom', offset: 4, type: 'item' },
        { side: 'bottom', offset: 5, type: 'item' },
    ],
    power: 20,
    tags: ['合成製造'],
    is_source: false,
    is_sink: false,
    onTick: null,
    onInput: null,
    onOutput: null,
    calcEfficiency: null,
};

export const 擴容反應池: Machine = {
    id: 'large_reactor',
    name: '擴容反應池',
    width: 6,
    height: 5,
    input_ports: [
        { side: 'top', offset: 1, type: 'item' },
        { side: 'top', offset: 2, type: 'item' },
        { side: 'top', offset: 3, type: 'item' },
        { side: 'top', offset: 4, type: 'item' },
        { side: 'left', offset: 1, type: 'liquid' },
        { side: 'left', offset: 3, type: 'liquid' },
    ],
    output_ports: [
        { side: 'right', offset: 1, type: 'liquid' },
        { side: 'right', offset: 3, type: 'liquid' },
        { side: 'bottom', offset: 1, type: 'item' },
        { side: 'bottom', offset: 2, type: 'item' },
        { side: 'bottom', offset: 3, type: 'item' },
        { side: 'bottom', offset: 4, type: 'item' },
    ],
    power: 100,
    tags: ['合成製造'],
    is_source: false,
    is_sink: false,
    onTick: null,
    onInput: null,
    onOutput: null,
    calcEfficiency: null,
};

// ─── 物流設備類 ───────────────────────────────────────────────────────────────

export const 物品准入口: Machine = {
    id: 'item_access_port',
    name: '物品准入口',
    width: 1,
    height: 1,
    input_ports: [{ side: 'left', offset: 0, type: 'item' }],
    output_ports: [{ side: 'right', offset: 0, type: 'item' }],
    power: 0,
    tags: ['物流設備'],
    is_source: false,
    is_sink: false,
    onTick: null,
    onInput: null,
    onOutput: null,
    calcEfficiency: null,
};

export const 分流器: Machine = {
    id: 'splitter',
    name: '分流器',
    width: 1,
    height: 1,
    input_ports: [{ side: 'left', offset: 0, type: 'item' }],
    output_ports: [
        { side: 'top', offset: 0, type: 'item' },
        { side: 'right', offset: 0, type: 'item' },
        { side: 'bottom', offset: 0, type: 'item' },
    ],
    power: 0,
    tags: ['物流設備'],
    is_source: false,
    is_sink: false,
    onTick: null,
    onInput: null,
    onOutput: null,
    calcEfficiency: null,
};

export const 物流橋: Machine = {
    id: 'logistics_bridge',
    name: '物流橋',
    width: 1,
    height: 1,
    input_ports: [
        { side: 'left', offset: 0, type: 'item' },
        { side: 'bottom', offset: 0, type: 'item' },
    ],
    output_ports: [
        { side: 'top', offset: 0, type: 'item' },
        { side: 'right', offset: 0, type: 'item' },
    ],
    power: 0,
    tags: ['物流設備'],
    is_source: false,
    is_sink: false,
    onTick: null,
    onInput: null,
    onOutput: null,
    calcEfficiency: null,
};

export const 匯流器: Machine = {
    id: 'merger',
    name: '匯流器',
    width: 1,
    height: 1,
    input_ports: [
        { side: 'top', offset: 0, type: 'item' },
        { side: 'left', offset: 0, type: 'item' },
        { side: 'bottom', offset: 0, type: 'item' },
    ],
    output_ports: [{ side: 'right', offset: 0, type: 'item' }],
    power: 0,
    tags: ['物流設備'],
    is_source: false,
    is_sink: false,
    onTick: null,
    onInput: null,
    onOutput: null,
    calcEfficiency: null,
};

export const 管道准入口: Machine = {
    id: 'pipe_access_port',
    name: '管道准入口',
    width: 1,
    height: 1,
    input_ports: [{ side: 'left', offset: 0, type: 'liquid' }],
    output_ports: [{ side: 'right', offset: 0, type: 'liquid' }],
    power: 0,
    tags: ['物流設備'],
    is_source: false,
    is_sink: false,
    onTick: null,
    onInput: null,
    onOutput: null,
    calcEfficiency: null,
};

export const 管道分流器: Machine = {
    id: 'pipe_splitter',
    name: '管道分流器',
    width: 1,
    height: 1,
    input_ports: [{ side: 'left', offset: 0, type: 'liquid' }],
    output_ports: [
        { side: 'top', offset: 0, type: 'liquid' },
        { side: 'right', offset: 0, type: 'liquid' },
        { side: 'bottom', offset: 0, type: 'liquid' },
    ],
    power: 0,
    tags: ['物流設備'],
    is_source: false,
    is_sink: false,
    onTick: null,
    onInput: null,
    onOutput: null,
    calcEfficiency: null,
};

export const 管道橋: Machine = {
    id: 'pipe_bridge',
    name: '管道橋',
    width: 1,
    height: 1,
    input_ports: [
        { side: 'left', offset: 0, type: 'liquid' },
        { side: 'bottom', offset: 0, type: 'liquid' },
    ],
    output_ports: [
        { side: 'top', offset: 0, type: 'liquid' },
        { side: 'right', offset: 0, type: 'liquid' },
    ],
    power: 0,
    tags: ['物流設備'],
    is_source: false,
    is_sink: false,
    onTick: null,
    onInput: null,
    onOutput: null,
    calcEfficiency: null,
};

export const 管道匯流器: Machine = {
    id: 'pipe_merger',
    name: '管道匯流器',
    width: 1,
    height: 1,
    input_ports: [
        { side: 'top', offset: 0, type: 'liquid' },
        { side: 'left', offset: 0, type: 'liquid' },
        { side: 'bottom', offset: 0, type: 'liquid' },
    ],
    output_ports: [{ side: 'right', offset: 0, type: 'liquid' }],
    power: 0,
    tags: ['物流設備'],
    is_source: false,
    is_sink: false,
    onTick: null,
    onInput: null,
    onOutput: null,
    calcEfficiency: null,
};

// ─── 倉庫存取類 ───────────────────────────────────────────────────────────────

export const 協議儲存箱: Machine = {
    id: 'protocol_storage_box',
    name: '協議儲存箱',
    width: 3,
    height: 3,
    input_ports: [
        { side: 'top', offset: 0, type: 'item' },
        { side: 'top', offset: 1, type: 'item' },
        { side: 'top', offset: 2, type: 'item' },
    ],
    output_ports: [
        { side: 'bottom', offset: 0, type: 'item' },
        { side: 'bottom', offset: 1, type: 'item' },
        { side: 'bottom', offset: 2, type: 'item' },
    ],
    power: 5,
    tags: ['倉庫存取'],
    is_source: false,
    is_sink: false,
    onTick: null,
    onInput: null,
    onOutput: null,
    calcEfficiency: null,
};

export const 倉庫存貨口: Machine = {
    id: 'warehouse_input',
    name: '倉庫存貨口',
    width: 3,
    height: 1,
    input_ports: [{ side: 'top', offset: 1, type: 'item' }],
    output_ports: [],
    power: 0,
    tags: ['倉庫存取'],
    is_source: false,
    is_sink: false,
    onTick: null,
    onInput: null,
    onOutput: null,
    calcEfficiency: null,
};

export const 倉庫取貨口: Machine = {
    id: 'warehouse_output',
    name: '倉庫取貨口',
    width: 3,
    height: 1,
    input_ports: [],
    output_ports: [{ side: 'top', offset: 1, type: 'item' }],
    power: 0,
    tags: ['倉庫存取'],
    is_source: false,
    is_sink: false,
    onTick: null,
    onInput: null,
    onOutput: null,
    calcEfficiency: null,
};

export const 儲液罐: Machine = {
    id: 'liquid_tank',
    name: '儲液罐',
    width: 3,
    height: 3,
    input_ports: [{ side: 'left', offset: 1, type: 'liquid' }],
    output_ports: [{ side: 'right', offset: 1, type: 'liquid' }],
    power: 0,
    tags: ['倉庫存取'],
    is_source: false,
    is_sink: false,
    onTick: null,
    onInput: null,
    onOutput: null,
    calcEfficiency: null,
};

export const 倉庫存取線基段: Machine = {
    id: 'warehouse_line_base',
    name: '倉庫存取線基段',
    width: 4,
    height: 8,
    input_ports: [],
    output_ports: [],
    power: 0,
    tags: ['倉庫存取'],
    is_source: false,
    is_sink: false,
    onTick: null,
    onInput: null,
    onOutput: null,
    calcEfficiency: null,
};

export const 倉庫存取線源樁: Machine = {
    id: 'warehouse_line_source',
    name: '倉庫存取線源樁',
    width: 4,
    height: 4,
    input_ports: [],
    output_ports: [],
    power: 0,
    tags: ['倉庫存取'],
    is_source: false,
    is_sink: false,
    onTick: null,
    onInput: null,
    onOutput: null,
    calcEfficiency: null,
};

export const 暗管入口: Machine = {
    id: 'conduit_inlet',
    name: '暗管入口',
    width: 3,
    height: 3,
    input_ports: [{ side: 'left', offset: 1, type: 'liquid' }],
    output_ports: [],
    power: 0,
    tags: ['倉庫存取'],
    is_source: false,
    is_sink: false,
    onTick: null,
    onInput: null,
    onOutput: null,
    calcEfficiency: null,
};

export const 暗管出口: Machine = {
    id: 'conduit_outlet',
    name: '暗管出口',
    width: 3,
    height: 3,
    input_ports: [],
    output_ports: [{ side: 'right', offset: 1, type: 'liquid' }],
    power: 0,
    tags: ['倉庫存取'],
    is_source: false,
    is_sink: false,
    onTick: null,
    onInput: null,
    onOutput: null,
    calcEfficiency: null,
};

export const 多口暗管入口: Machine = {
    id: 'multi_conduit_inlet',
    name: '多口暗管入口',
    width: 3,
    height: 5,
    input_ports: [
        { side: 'left', offset: 1, type: 'liquid' },
        { side: 'left', offset: 3, type: 'liquid' },
    ],
    output_ports: [],
    power: 0,
    tags: ['倉庫存取'],
    is_source: false,
    is_sink: false,
    onTick: null,
    onInput: null,
    onOutput: null,
    calcEfficiency: null,
};

export const 多口暗管出口: Machine = {
    id: 'multi_conduit_outlet',
    name: '多口暗管出口',
    width: 3,
    height: 5,
    input_ports: [],
    output_ports: [
        { side: 'right', offset: 1, type: 'liquid' },
        { side: 'right', offset: 3, type: 'liquid' },
    ],
    power: 0,
    tags: ['倉庫存取'],
    is_source: false,
    is_sink: false,
    onTick: null,
    onInput: null,
    onOutput: null,
    calcEfficiency: null,
};

// ─── 電力類 ───────────────────────────────────────────────────────────────────

export const 供電樁: Machine = {
    id: 'power_pole',
    name: '供電樁',
    width: 2,
    height: 2,
    input_ports: [],
    output_ports: [],
    power: 0,
    tags: ['電力'],
    is_source: false,
    is_sink: false,
    onTick: null,
    onInput: null,
    onOutput: null,
    calcEfficiency: null,
};

export const 息壤供電樁: Machine = {
    id: 'xi_rang_power_pole',
    name: '息壤供電樁',
    width: 2,
    height: 2,
    input_ports: [],
    output_ports: [],
    power: 0,
    tags: ['電力'],
    is_source: false,
    is_sink: false,
    onTick: null,
    onInput: null,
    onOutput: null,
    calcEfficiency: null,
};

export const 中繼器: Machine = {
    id: 'relay',
    name: '中繼器',
    width: 3,
    height: 3,
    input_ports: [],
    output_ports: [],
    power: 0,
    tags: ['電力'],
    is_source: false,
    is_sink: false,
    onTick: null,
    onInput: null,
    onOutput: null,
    calcEfficiency: null,
};

export const 息壤中繼器: Machine = {
    id: 'xi_rang_relay',
    name: '息壤中繼器',
    width: 3,
    height: 3,
    input_ports: [],
    output_ports: [],
    power: 0,
    tags: ['電力'],
    is_source: false,
    is_sink: false,
    onTick: null,
    onInput: null,
    onOutput: null,
    calcEfficiency: null,
};

export const 熱能池: Machine = {
    id: 'thermal_pool',
    name: '熱能池',
    width: 2,
    height: 2,
    input_ports: [
        { side: 'top', offset: 0, type: 'item' },
        { side: 'top', offset: 1, type: 'item' },
    ],
    output_ports: [],
    power: 0,
    tags: ['電力'],
    is_source: false,
    is_sink: false,
    onTick: null,
    onInput: null,
    onOutput: null,
    calcEfficiency: null,
};

// ─── FlowEngine 專用節點（非 machines.json 機器，供產線計算用）─────────────────

/**
 * 物品輸出口：產線起點（is_source = true）
 * FlowEngine 以此識別資源生產節點，直接輸出配方速率。
 */
export const 物品輸出口: Machine = {
    id: 'item_source',
    name: '物品輸出口',
    width: 1,
    height: 3,
    input_ports: [],
    output_ports: [{ side: 'right', offset: 1, type: 'item' }],
    power: 0,
    tags: ['物流設備'],
    is_source: true,
    is_sink: false,
    onTick: null,
    onInput: null,
    onOutput: null,
    calcEfficiency: null,
};

/**
 * 物品輸入口：產線終點（is_sink = true）
 * FlowEngine 以此識別產值交付節點，BFS 反向追蹤的起點。
 */
export const 物品輸入口: Machine = {
    id: 'item_sink',
    name: '物品輸入口',
    width: 1,
    height: 3,
    input_ports: [{ side: 'right', offset: 1, type: 'item' }],
    output_ports: [],
    power: 0,
    tags: ['物流設備'],
    is_source: false,
    is_sink: true,
    onTick: null,
    onInput: null,
    onOutput: null,
    calcEfficiency: null,
};

// ─── MACHINES 查詢 Map ────────────────────────────────────────────────────────

/** 所有機器定義的 lookup map（key = machine.name） */
export const MACHINES = new Map<string, Machine>([
    // 基礎生產
    [塑型機.name, 塑型機],
    [精煉爐.name, 精煉爐],
    [粉碎機.name, 粉碎機],
    [配件機.name, 配件機],
    [採種機.name, 採種機],
    [種植機.name, 種植機],
    [廢水處理機.name, 廢水處理機],
    // 合成製造
    [灌裝機.name, 灌裝機],
    [裝備原件機.name, 裝備原件機],
    [封裝機.name, 封裝機],
    [研磨機.name, 研磨機],
    [反應池.name, 反應池],
    [天有洪爐.name, 天有洪爐],
    [提純機.name, 提純機],
    [拆解機.name, 拆解機],
    [擴容反應池.name, 擴容反應池],
    // 物流設備
    [物品准入口.name, 物品准入口],
    [分流器.name, 分流器],
    [物流橋.name, 物流橋],
    [匯流器.name, 匯流器],
    [管道准入口.name, 管道准入口],
    [管道分流器.name, 管道分流器],
    [管道橋.name, 管道橋],
    [管道匯流器.name, 管道匯流器],
    // 倉庫存取
    [協議儲存箱.name, 協議儲存箱],
    [倉庫存貨口.name, 倉庫存貨口],
    [倉庫取貨口.name, 倉庫取貨口],
    [儲液罐.name, 儲液罐],
    [倉庫存取線基段.name, 倉庫存取線基段],
    [倉庫存取線源樁.name, 倉庫存取線源樁],
    [暗管入口.name, 暗管入口],
    [暗管出口.name, 暗管出口],
    [多口暗管入口.name, 多口暗管入口],
    [多口暗管出口.name, 多口暗管出口],
    // 電力
    [供電樁.name, 供電樁],
    [息壤供電樁.name, 息壤供電樁],
    [中繼器.name, 中繼器],
    [息壤中繼器.name, 息壤中繼器],
    [熱能池.name, 熱能池],
    // FlowEngine 專用
    [物品輸出口.name, 物品輸出口],
    [物品輸入口.name, 物品輸入口],
]);

/** 依名稱查詢機器定義 */
export function getMachine(name: string): Machine | undefined {
    return MACHINES.get(name);
}

/** 取得所有機器定義列表 */
export function getAllMachines(): Machine[] {
    return Array.from(MACHINES.values());
}
