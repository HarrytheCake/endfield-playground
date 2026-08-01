/**
 * 機器靜態定義資料（由 docs/aaaaa/scripts/generate-src-data.mjs 產生）
 *
 * 來源：docs/aaaaa/data/machines.json
 * 另附 FlowEngine 專用節點：物品輸出口（is_source）、物品輸入口（is_sink）。
 *
 * 請勿手改本檔資料區；改 JSON 後重新執行：
 *   pnpm generate:src-data
 */

import type { Machine } from '@/types/machine';
export { getMachineMode } from '@/types/machine';

// ─── 機器定義陣列 ─────────────────────────────────────────────────────────────

/**
 * 全部機器的靜態定義陣列，模組載入時建立一次，整個應用生命週期內唯讀共用。
 */
export const machineList: Machine[] = [
    {
        id: "shaping_machine",
        name: "塑型機",
        width: 3,
        height: 3,
        input_ports: [
            { side: "top", offset: 0, media: "belt" },
            { side: "top", offset: 1, media: "belt" },
            { side: "top", offset: 2, media: "belt" },
        ],
        output_ports: [
            { side: "bottom", offset: 0, media: "belt" },
            { side: "bottom", offset: 1, media: "belt" },
            { side: "bottom", offset: 2, media: "belt" },
        ],
        power: 10,
        tags: ["基礎生產"],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: "base_mode",
                label: "基礎模式",
                input_ports: [
                    { side: "top", offset: 0, media: "belt" },
                    { side: "top", offset: 1, media: "belt" },
                    { side: "top", offset: 2, media: "belt" },
                ],
                output_ports: [
                    { side: "bottom", offset: 0, media: "belt" },
                    { side: "bottom", offset: 1, media: "belt" },
                    { side: "bottom", offset: 2, media: "belt" },
                ],
                loss: null,
            },
            {
                id: "gas_mode",
                label: "氣體模式",
                input_ports: [
                    { side: "top", offset: 0, media: "belt" },
                    { side: "top", offset: 1, media: "belt" },
                    { side: "top", offset: 2, media: "belt" },
                    { side: "left", offset: 1, media: "belt" },
                ],
                output_ports: [
                    { side: "bottom", offset: 0, media: "belt" },
                    { side: "bottom", offset: 1, media: "belt" },
                    { side: "bottom", offset: 2, media: "belt" },
                ],
                loss: null,
            },
        ],
        onTick: null,
        onInput: null,
        onOutput: null,
        calcEfficiency: null,
    },

    {
        id: "filling_machine",
        name: "灌裝機",
        width: 6,
        height: 4,
        input_ports: [
            { side: "top", offset: 0, media: "belt" },
            { side: "top", offset: 1, media: "belt" },
            { side: "top", offset: 2, media: "belt" },
            { side: "top", offset: 3, media: "belt" },
            { side: "top", offset: 4, media: "belt" },
            { side: "top", offset: 5, media: "belt" },
        ],
        output_ports: [
            { side: "bottom", offset: 0, media: "belt" },
            { side: "bottom", offset: 1, media: "belt" },
            { side: "bottom", offset: 2, media: "belt" },
            { side: "bottom", offset: 3, media: "belt" },
            { side: "bottom", offset: 4, media: "belt" },
            { side: "bottom", offset: 5, media: "belt" },
        ],
        power: 20,
        tags: ["合成製造"],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: "base_mode",
                label: "基礎模式",
                input_ports: [
                    { side: "top", offset: 0, media: "belt" },
                    { side: "top", offset: 1, media: "belt" },
                    { side: "top", offset: 2, media: "belt" },
                    { side: "top", offset: 3, media: "belt" },
                    { side: "top", offset: 4, media: "belt" },
                    { side: "top", offset: 5, media: "belt" },
                ],
                output_ports: [
                    { side: "bottom", offset: 0, media: "belt" },
                    { side: "bottom", offset: 1, media: "belt" },
                    { side: "bottom", offset: 2, media: "belt" },
                    { side: "bottom", offset: 3, media: "belt" },
                    { side: "bottom", offset: 4, media: "belt" },
                    { side: "bottom", offset: 5, media: "belt" },
                ],
                loss: null,
            },
            {
                id: "gas_liquid_mode",
                label: "氣液模式",
                input_ports: [
                    { side: "top", offset: 0, media: "belt" },
                    { side: "top", offset: 1, media: "belt" },
                    { side: "top", offset: 2, media: "belt" },
                    { side: "top", offset: 3, media: "belt" },
                    { side: "top", offset: 4, media: "belt" },
                    { side: "top", offset: 5, media: "belt" },
                    { side: "left", offset: 1, media: "pipe" },
                ],
                output_ports: [
                    { side: "bottom", offset: 0, media: "belt" },
                    { side: "bottom", offset: 1, media: "belt" },
                    { side: "bottom", offset: 2, media: "belt" },
                    { side: "bottom", offset: 3, media: "belt" },
                    { side: "bottom", offset: 4, media: "belt" },
                    { side: "bottom", offset: 5, media: "belt" },
                ],
                loss: null,
            },
        ],
        onTick: null,
        onInput: null,
        onOutput: null,
        calcEfficiency: null,
    },

    {
        id: "refinery",
        name: "精煉爐",
        width: 3,
        height: 3,
        input_ports: [
            { side: "top", offset: 0, media: "belt" },
            { side: "top", offset: 1, media: "belt" },
            { side: "top", offset: 2, media: "belt" },
        ],
        output_ports: [
            { side: "bottom", offset: 0, media: "belt" },
            { side: "bottom", offset: 1, media: "belt" },
            { side: "bottom", offset: 2, media: "belt" },
        ],
        power: 5,
        tags: ["基礎生產"],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: "base_mode",
                label: "基礎模式",
                input_ports: [
                    { side: "top", offset: 0, media: "belt" },
                    { side: "top", offset: 1, media: "belt" },
                    { side: "top", offset: 2, media: "belt" },
                ],
                output_ports: [
                    { side: "bottom", offset: 0, media: "belt" },
                    { side: "bottom", offset: 1, media: "belt" },
                    { side: "bottom", offset: 2, media: "belt" },
                ],
                loss: null,
            },
            {
                id: "liquid_mode",
                label: "液體模式",
                input_ports: [
                    { side: "top", offset: 0, media: "belt" },
                    { side: "top", offset: 1, media: "belt" },
                    { side: "top", offset: 2, media: "belt" },
                    { side: "left", offset: 1, media: "pipe" },
                ],
                output_ports: [
                    { side: "right", offset: 1, media: "pipe" },
                    { side: "bottom", offset: 0, media: "belt" },
                    { side: "bottom", offset: 1, media: "belt" },
                    { side: "bottom", offset: 2, media: "belt" },
                ],
                loss: null,
            },
        ],
        onTick: null,
        onInput: null,
        onOutput: null,
        calcEfficiency: null,
    },

    {
        id: "crusher",
        name: "粉碎機",
        width: 3,
        height: 3,
        input_ports: [
            { side: "top", offset: 0, media: "belt" },
            { side: "top", offset: 1, media: "belt" },
            { side: "top", offset: 2, media: "belt" },
        ],
        output_ports: [
            { side: "bottom", offset: 0, media: "belt" },
            { side: "bottom", offset: 1, media: "belt" },
            { side: "bottom", offset: 2, media: "belt" },
        ],
        power: 5,
        tags: ["基礎生產"],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: "default",
                label: "預設",
                input_ports: [
                    { side: "top", offset: 0, media: "belt" },
                    { side: "top", offset: 1, media: "belt" },
                    { side: "top", offset: 2, media: "belt" },
                ],
                output_ports: [
                    { side: "bottom", offset: 0, media: "belt" },
                    { side: "bottom", offset: 1, media: "belt" },
                    { side: "bottom", offset: 2, media: "belt" },
                ],
                loss: null,
            },
        ],
        onTick: null,
        onInput: null,
        onOutput: null,
        calcEfficiency: null,
    },

    {
        id: "parts_machine",
        name: "配件機",
        width: 3,
        height: 3,
        input_ports: [
            { side: "top", offset: 0, media: "belt" },
            { side: "top", offset: 1, media: "belt" },
            { side: "top", offset: 2, media: "belt" },
        ],
        output_ports: [
            { side: "bottom", offset: 0, media: "belt" },
            { side: "bottom", offset: 1, media: "belt" },
            { side: "bottom", offset: 2, media: "belt" },
        ],
        power: 20,
        tags: ["基礎生產"],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: "default",
                label: "預設",
                input_ports: [
                    { side: "top", offset: 0, media: "belt" },
                    { side: "top", offset: 1, media: "belt" },
                    { side: "top", offset: 2, media: "belt" },
                ],
                output_ports: [
                    { side: "bottom", offset: 0, media: "belt" },
                    { side: "bottom", offset: 1, media: "belt" },
                    { side: "bottom", offset: 2, media: "belt" },
                ],
                loss: null,
            },
        ],
        onTick: null,
        onInput: null,
        onOutput: null,
        calcEfficiency: null,
    },

    {
        id: "equipment_parts_machine",
        name: "裝備原件機",
        width: 4,
        height: 6,
        input_ports: [
            { side: "left", offset: 0, media: "belt" },
            { side: "left", offset: 1, media: "belt" },
            { side: "left", offset: 2, media: "belt" },
            { side: "left", offset: 3, media: "belt" },
            { side: "left", offset: 4, media: "belt" },
            { side: "left", offset: 5, media: "belt" },
        ],
        output_ports: [
            { side: "right", offset: 0, media: "belt" },
            { side: "right", offset: 1, media: "belt" },
            { side: "right", offset: 2, media: "belt" },
            { side: "right", offset: 3, media: "belt" },
            { side: "right", offset: 4, media: "belt" },
            { side: "right", offset: 5, media: "belt" },
        ],
        power: 10,
        tags: ["合成製造"],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: "default",
                label: "預設",
                input_ports: [
                    { side: "left", offset: 0, media: "belt" },
                    { side: "left", offset: 1, media: "belt" },
                    { side: "left", offset: 2, media: "belt" },
                    { side: "left", offset: 3, media: "belt" },
                    { side: "left", offset: 4, media: "belt" },
                    { side: "left", offset: 5, media: "belt" },
                ],
                output_ports: [
                    { side: "right", offset: 0, media: "belt" },
                    { side: "right", offset: 1, media: "belt" },
                    { side: "right", offset: 2, media: "belt" },
                    { side: "right", offset: 3, media: "belt" },
                    { side: "right", offset: 4, media: "belt" },
                    { side: "right", offset: 5, media: "belt" },
                ],
                loss: null,
            },
        ],
        onTick: null,
        onInput: null,
        onOutput: null,
        calcEfficiency: null,
    },

    {
        id: "packaging_machine",
        name: "封裝機",
        width: 6,
        height: 4,
        input_ports: [
            { side: "top", offset: 0, media: "belt" },
            { side: "top", offset: 1, media: "belt" },
            { side: "top", offset: 2, media: "belt" },
            { side: "top", offset: 3, media: "belt" },
            { side: "top", offset: 4, media: "belt" },
            { side: "top", offset: 5, media: "belt" },
        ],
        output_ports: [
            { side: "bottom", offset: 0, media: "belt" },
            { side: "bottom", offset: 1, media: "belt" },
            { side: "bottom", offset: 2, media: "belt" },
            { side: "bottom", offset: 3, media: "belt" },
            { side: "bottom", offset: 4, media: "belt" },
            { side: "bottom", offset: 5, media: "belt" },
        ],
        power: 20,
        tags: ["合成製造"],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: "default",
                label: "預設",
                input_ports: [
                    { side: "top", offset: 0, media: "belt" },
                    { side: "top", offset: 1, media: "belt" },
                    { side: "top", offset: 2, media: "belt" },
                    { side: "top", offset: 3, media: "belt" },
                    { side: "top", offset: 4, media: "belt" },
                    { side: "top", offset: 5, media: "belt" },
                ],
                output_ports: [
                    { side: "bottom", offset: 0, media: "belt" },
                    { side: "bottom", offset: 1, media: "belt" },
                    { side: "bottom", offset: 2, media: "belt" },
                    { side: "bottom", offset: 3, media: "belt" },
                    { side: "bottom", offset: 4, media: "belt" },
                    { side: "bottom", offset: 5, media: "belt" },
                ],
                loss: null,
            },
        ],
        onTick: null,
        onInput: null,
        onOutput: null,
        calcEfficiency: null,
    },

    {
        id: "grinder",
        name: "研磨機",
        width: 6,
        height: 4,
        input_ports: [
            { side: "top", offset: 0, media: "belt" },
            { side: "top", offset: 1, media: "belt" },
            { side: "top", offset: 2, media: "belt" },
            { side: "top", offset: 3, media: "belt" },
            { side: "top", offset: 4, media: "belt" },
            { side: "top", offset: 5, media: "belt" },
        ],
        output_ports: [
            { side: "bottom", offset: 0, media: "belt" },
            { side: "bottom", offset: 1, media: "belt" },
            { side: "bottom", offset: 2, media: "belt" },
            { side: "bottom", offset: 3, media: "belt" },
            { side: "bottom", offset: 4, media: "belt" },
            { side: "bottom", offset: 5, media: "belt" },
        ],
        power: 50,
        tags: ["合成製造"],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: "default",
                label: "預設",
                input_ports: [
                    { side: "top", offset: 0, media: "belt" },
                    { side: "top", offset: 1, media: "belt" },
                    { side: "top", offset: 2, media: "belt" },
                    { side: "top", offset: 3, media: "belt" },
                    { side: "top", offset: 4, media: "belt" },
                    { side: "top", offset: 5, media: "belt" },
                ],
                output_ports: [
                    { side: "bottom", offset: 0, media: "belt" },
                    { side: "bottom", offset: 1, media: "belt" },
                    { side: "bottom", offset: 2, media: "belt" },
                    { side: "bottom", offset: 3, media: "belt" },
                    { side: "bottom", offset: 4, media: "belt" },
                    { side: "bottom", offset: 5, media: "belt" },
                ],
                loss: null,
            },
        ],
        onTick: null,
        onInput: null,
        onOutput: null,
        calcEfficiency: null,
    },

    {
        id: "reactor",
        name: "反應池",
        width: 5,
        height: 5,
        input_ports: [
            { side: "top", offset: 1, media: "belt" },
            { side: "top", offset: 3, media: "belt" },
            { side: "left", offset: 1, media: "belt" },
            { side: "left", offset: 3, media: "belt" },
        ],
        output_ports: [
            { side: "right", offset: 1, media: "pipe" },
            { side: "right", offset: 3, media: "pipe" },
            { side: "bottom", offset: 1, media: "belt" },
            { side: "bottom", offset: 3, media: "belt" },
        ],
        power: 50,
        tags: ["合成製造"],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: "default",
                label: "預設",
                input_ports: [
                    { side: "top", offset: 1, media: "belt" },
                    { side: "top", offset: 3, media: "belt" },
                    { side: "left", offset: 1, media: "belt" },
                    { side: "left", offset: 3, media: "belt" },
                ],
                output_ports: [
                    { side: "right", offset: 1, media: "pipe" },
                    { side: "right", offset: 3, media: "pipe" },
                    { side: "bottom", offset: 1, media: "belt" },
                    { side: "bottom", offset: 3, media: "belt" },
                ],
                loss: null,
            },
        ],
        onTick: null,
        onInput: null,
        onOutput: null,
        calcEfficiency: null,
    },

    {
        id: "tianyou_furnace",
        name: "天有洪爐",
        width: 5,
        height: 5,
        input_ports: [
            { side: "top", offset: 0, media: "belt" },
            { side: "top", offset: 1, media: "belt" },
            { side: "top", offset: 2, media: "belt" },
            { side: "top", offset: 3, media: "belt" },
            { side: "top", offset: 4, media: "belt" },
            { side: "left", offset: 2, media: "belt" },
        ],
        output_ports: [
            { side: "bottom", offset: 0, media: "belt" },
            { side: "bottom", offset: 1, media: "belt" },
            { side: "bottom", offset: 2, media: "belt" },
            { side: "bottom", offset: 3, media: "belt" },
            { side: "bottom", offset: 4, media: "belt" },
        ],
        power: 50,
        tags: ["合成製造"],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: "default",
                label: "預設",
                input_ports: [
                    { side: "top", offset: 0, media: "belt" },
                    { side: "top", offset: 1, media: "belt" },
                    { side: "top", offset: 2, media: "belt" },
                    { side: "top", offset: 3, media: "belt" },
                    { side: "top", offset: 4, media: "belt" },
                    { side: "left", offset: 2, media: "belt" },
                ],
                output_ports: [
                    { side: "bottom", offset: 0, media: "belt" },
                    { side: "bottom", offset: 1, media: "belt" },
                    { side: "bottom", offset: 2, media: "belt" },
                    { side: "bottom", offset: 3, media: "belt" },
                    { side: "bottom", offset: 4, media: "belt" },
                ],
                loss: null,
            },
        ],
        onTick: null,
        onInput: null,
        onOutput: null,
        calcEfficiency: null,
    },

    {
        id: "purifier",
        name: "提純機",
        width: 5,
        height: 5,
        input_ports: [
            { side: "left", offset: 1, media: "pipe" },
            { side: "left", offset: 3, media: "pipe" },
        ],
        output_ports: [
            { side: "right", offset: 1, media: "pipe" },
            { side: "right", offset: 3, media: "pipe" },
        ],
        power: 50,
        tags: ["合成製造"],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: "liquid_mode",
                label: "液體模式",
                input_ports: [
                    { side: "left", offset: 1, media: "pipe" },
                    { side: "left", offset: 3, media: "pipe" },
                ],
                output_ports: [
                    { side: "right", offset: 1, media: "pipe" },
                    { side: "right", offset: 3, media: "pipe" },
                ],
                loss: null,
            },
            {
                id: "gas_mode",
                label: "氣體模式",
                input_ports: [
                    { side: "top", offset: 0, media: "belt" },
                    { side: "top", offset: 1, media: "belt" },
                    { side: "top", offset: 2, media: "belt" },
                    { side: "top", offset: 3, media: "belt" },
                    { side: "top", offset: 4, media: "belt" },
                    { side: "left", offset: 2, media: "pipe" },
                ],
                output_ports: [
                    { side: "right", offset: 1, media: "pipe" },
                    { side: "right", offset: 3, media: "pipe" },
                ],
                loss: null,
            },
        ],
        onTick: null,
        onInput: null,
        onOutput: null,
        calcEfficiency: null,
    },

    {
        id: "disassembler",
        name: "拆解機",
        width: 6,
        height: 4,
        input_ports: [
            { side: "top", offset: 0, media: "belt" },
            { side: "top", offset: 1, media: "belt" },
            { side: "top", offset: 2, media: "belt" },
            { side: "top", offset: 3, media: "belt" },
            { side: "top", offset: 4, media: "belt" },
            { side: "top", offset: 5, media: "belt" },
        ],
        output_ports: [
            { side: "right", offset: 1, media: "pipe" },
            { side: "bottom", offset: 0, media: "belt" },
            { side: "bottom", offset: 1, media: "belt" },
            { side: "bottom", offset: 2, media: "belt" },
            { side: "bottom", offset: 3, media: "belt" },
            { side: "bottom", offset: 4, media: "belt" },
            { side: "bottom", offset: 5, media: "belt" },
        ],
        power: 20,
        tags: ["合成製造"],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: "default",
                label: "預設",
                input_ports: [
                    { side: "top", offset: 0, media: "belt" },
                    { side: "top", offset: 1, media: "belt" },
                    { side: "top", offset: 2, media: "belt" },
                    { side: "top", offset: 3, media: "belt" },
                    { side: "top", offset: 4, media: "belt" },
                    { side: "top", offset: 5, media: "belt" },
                ],
                output_ports: [
                    { side: "right", offset: 1, media: "pipe" },
                    { side: "bottom", offset: 0, media: "belt" },
                    { side: "bottom", offset: 1, media: "belt" },
                    { side: "bottom", offset: 2, media: "belt" },
                    { side: "bottom", offset: 3, media: "belt" },
                    { side: "bottom", offset: 4, media: "belt" },
                    { side: "bottom", offset: 5, media: "belt" },
                ],
                loss: null,
            },
        ],
        onTick: null,
        onInput: null,
        onOutput: null,
        calcEfficiency: null,
    },

    {
        id: "item_access_port",
        name: "物品准入口",
        width: 1,
        height: 1,
        input_ports: [
            { side: "left", offset: 0, media: "belt" },
        ],
        output_ports: [
            { side: "right", offset: 0, media: "belt" },
        ],
        power: 0,
        tags: ["物流設備"],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: "default",
                label: "預設",
                input_ports: [
                    { side: "left", offset: 0, media: "belt" },
                ],
                output_ports: [
                    { side: "right", offset: 0, media: "belt" },
                ],
                loss: null,
            },
        ],
        onTick: null,
        onInput: null,
        onOutput: null,
        calcEfficiency: null,
    },

    {
        id: "splitter",
        name: "分流器",
        width: 1,
        height: 1,
        input_ports: [
            { side: "left", offset: 0, media: "belt" },
        ],
        output_ports: [
            { side: "top", offset: 0, media: "belt" },
            { side: "right", offset: 0, media: "belt" },
            { side: "bottom", offset: 0, media: "belt" },
        ],
        power: 0,
        tags: ["物流設備"],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: "default",
                label: "預設",
                input_ports: [
                    { side: "left", offset: 0, media: "belt" },
                ],
                output_ports: [
                    { side: "top", offset: 0, media: "belt" },
                    { side: "right", offset: 0, media: "belt" },
                    { side: "bottom", offset: 0, media: "belt" },
                ],
                loss: null,
            },
        ],
        onTick: null,
        onInput: null,
        onOutput: null,
        calcEfficiency: null,
    },

    {
        id: "logistics_bridge",
        name: "物流橋",
        width: 1,
        height: 1,
        input_ports: [
            { side: "left", offset: 0, media: "belt" },
            { side: "bottom", offset: 0, media: "belt" },
        ],
        output_ports: [
            { side: "top", offset: 0, media: "belt" },
            { side: "right", offset: 0, media: "belt" },
        ],
        power: 0,
        tags: ["物流設備"],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: "default",
                label: "預設",
                input_ports: [
                    { side: "left", offset: 0, media: "belt" },
                    { side: "bottom", offset: 0, media: "belt" },
                ],
                output_ports: [
                    { side: "top", offset: 0, media: "belt" },
                    { side: "right", offset: 0, media: "belt" },
                ],
                loss: null,
            },
        ],
        onTick: null,
        onInput: null,
        onOutput: null,
        calcEfficiency: null,
    },

    {
        id: "merger",
        name: "匯流器",
        width: 1,
        height: 1,
        input_ports: [
            { side: "top", offset: 0, media: "belt" },
            { side: "left", offset: 0, media: "belt" },
            { side: "bottom", offset: 0, media: "belt" },
        ],
        output_ports: [
            { side: "right", offset: 0, media: "belt" },
        ],
        power: 0,
        tags: ["物流設備"],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: "default",
                label: "預設",
                input_ports: [
                    { side: "top", offset: 0, media: "belt" },
                    { side: "left", offset: 0, media: "belt" },
                    { side: "bottom", offset: 0, media: "belt" },
                ],
                output_ports: [
                    { side: "right", offset: 0, media: "belt" },
                ],
                loss: null,
            },
        ],
        onTick: null,
        onInput: null,
        onOutput: null,
        calcEfficiency: null,
    },

    {
        id: "pipe_access_port",
        name: "管道准入口",
        width: 1,
        height: 1,
        input_ports: [
            { side: "left", offset: 0, media: "pipe" },
        ],
        output_ports: [
            { side: "right", offset: 0, media: "pipe" },
        ],
        power: 0,
        tags: ["物流設備"],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: "default",
                label: "預設",
                input_ports: [
                    { side: "left", offset: 0, media: "pipe" },
                ],
                output_ports: [
                    { side: "right", offset: 0, media: "pipe" },
                ],
                loss: null,
            },
        ],
        onTick: null,
        onInput: null,
        onOutput: null,
        calcEfficiency: null,
    },

    {
        id: "pipe_splitter",
        name: "管道分流器",
        width: 1,
        height: 1,
        input_ports: [
            { side: "left", offset: 0, media: "pipe" },
        ],
        output_ports: [
            { side: "top", offset: 0, media: "pipe" },
            { side: "right", offset: 0, media: "pipe" },
            { side: "bottom", offset: 0, media: "pipe" },
        ],
        power: 0,
        tags: ["物流設備"],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: "default",
                label: "預設",
                input_ports: [
                    { side: "left", offset: 0, media: "pipe" },
                ],
                output_ports: [
                    { side: "top", offset: 0, media: "pipe" },
                    { side: "right", offset: 0, media: "pipe" },
                    { side: "bottom", offset: 0, media: "pipe" },
                ],
                loss: null,
            },
        ],
        onTick: null,
        onInput: null,
        onOutput: null,
        calcEfficiency: null,
    },

    {
        id: "pipe_bridge",
        name: "管道橋",
        width: 1,
        height: 1,
        input_ports: [
            { side: "left", offset: 0, media: "pipe" },
            { side: "bottom", offset: 0, media: "pipe" },
        ],
        output_ports: [
            { side: "top", offset: 0, media: "pipe" },
            { side: "right", offset: 0, media: "pipe" },
        ],
        power: 0,
        tags: ["物流設備"],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: "default",
                label: "預設",
                input_ports: [
                    { side: "left", offset: 0, media: "pipe" },
                    { side: "bottom", offset: 0, media: "pipe" },
                ],
                output_ports: [
                    { side: "top", offset: 0, media: "pipe" },
                    { side: "right", offset: 0, media: "pipe" },
                ],
                loss: null,
            },
        ],
        onTick: null,
        onInput: null,
        onOutput: null,
        calcEfficiency: null,
    },

    {
        id: "pipe_merger",
        name: "管道匯流器",
        width: 1,
        height: 1,
        input_ports: [
            { side: "top", offset: 0, media: "pipe" },
            { side: "left", offset: 0, media: "pipe" },
            { side: "bottom", offset: 0, media: "pipe" },
        ],
        output_ports: [
            { side: "right", offset: 0, media: "pipe" },
        ],
        power: 0,
        tags: ["物流設備"],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: "default",
                label: "預設",
                input_ports: [
                    { side: "top", offset: 0, media: "pipe" },
                    { side: "left", offset: 0, media: "pipe" },
                    { side: "bottom", offset: 0, media: "pipe" },
                ],
                output_ports: [
                    { side: "right", offset: 0, media: "pipe" },
                ],
                loss: null,
            },
        ],
        onTick: null,
        onInput: null,
        onOutput: null,
        calcEfficiency: null,
    },

    {
        id: "protocol_storage_box",
        name: "協議儲存箱",
        width: 3,
        height: 3,
        input_ports: [
            { side: "top", offset: 0, media: "belt" },
            { side: "top", offset: 1, media: "belt" },
            { side: "top", offset: 2, media: "belt" },
        ],
        output_ports: [
            { side: "bottom", offset: 0, media: "belt" },
            { side: "bottom", offset: 1, media: "belt" },
            { side: "bottom", offset: 2, media: "belt" },
        ],
        power: 5,
        tags: ["倉庫存取"],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: "default",
                label: "預設",
                input_ports: [
                    { side: "top", offset: 0, media: "belt" },
                    { side: "top", offset: 1, media: "belt" },
                    { side: "top", offset: 2, media: "belt" },
                ],
                output_ports: [
                    { side: "bottom", offset: 0, media: "belt" },
                    { side: "bottom", offset: 1, media: "belt" },
                    { side: "bottom", offset: 2, media: "belt" },
                ],
                loss: null,
            },
        ],
        onTick: null,
        onInput: null,
        onOutput: null,
        calcEfficiency: null,
    },

    {
        id: "warehouse_input",
        name: "倉庫存貨口",
        width: 3,
        height: 1,
        input_ports: [
            { side: "top", offset: 1, media: "belt" },
        ],
        output_ports:         [],
        power: 0,
        tags: ["倉庫存取"],
        is_source: false,
        is_sink: true,
        config_signed_off: true,
        modes: [
            {
                id: "default",
                label: "預設",
                input_ports: [
                    { side: "top", offset: 1, media: "belt" },
                ],
                output_ports:                 [],
                loss: null,
            },
        ],
        onTick: null,
        onInput: null,
        onOutput: null,
        calcEfficiency: null,
    },

    {
        id: "warehouse_output",
        name: "倉庫取貨口",
        width: 3,
        height: 1,
        input_ports:         [],
        output_ports: [
            { side: "top", offset: 1, media: "belt" },
        ],
        power: 0,
        tags: ["倉庫存取"],
        is_source: true,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: "default",
                label: "預設",
                input_ports:                 [],
                output_ports: [
                    { side: "top", offset: 1, media: "belt" },
                ],
                loss: null,
            },
        ],
        onTick: null,
        onInput: null,
        onOutput: null,
        calcEfficiency: null,
    },

    {
        id: "liquid_tank",
        name: "儲液罐",
        width: 3,
        height: 3,
        input_ports: [
            { side: "left", offset: 1, media: "pipe" },
        ],
        output_ports: [
            { side: "right", offset: 1, media: "pipe" },
        ],
        power: 0,
        tags: ["倉庫存取"],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: "default",
                label: "預設",
                input_ports: [
                    { side: "left", offset: 1, media: "pipe" },
                ],
                output_ports: [
                    { side: "right", offset: 1, media: "pipe" },
                ],
                loss: null,
            },
        ],
        onTick: null,
        onInput: null,
        onOutput: null,
        calcEfficiency: null,
    },

    {
        id: "warehouse_line_base",
        name: "倉庫存取線基段",
        width: 4,
        height: 8,
        input_ports:         [],
        output_ports:         [],
        power: 0,
        tags: ["倉庫存取"],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: "default",
                label: "預設",
                input_ports:                 [],
                output_ports:                 [],
                loss: null,
            },
        ],
        onTick: null,
        onInput: null,
        onOutput: null,
        calcEfficiency: null,
    },

    {
        id: "warehouse_line_source",
        name: "倉庫存取線源樁",
        width: 4,
        height: 4,
        input_ports:         [],
        output_ports:         [],
        power: 0,
        tags: ["倉庫存取"],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: "default",
                label: "預設",
                input_ports:                 [],
                output_ports:                 [],
                loss: null,
            },
        ],
        onTick: null,
        onInput: null,
        onOutput: null,
        calcEfficiency: null,
    },

    {
        id: "conduit_inlet",
        name: "暗管入口",
        width: 3,
        height: 3,
        input_ports: [
            { side: "left", offset: 1, media: "pipe" },
        ],
        output_ports:         [],
        power: 0,
        tags: ["倉庫存取"],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: "default",
                label: "預設",
                input_ports: [
                    { side: "left", offset: 1, media: "pipe" },
                ],
                output_ports:                 [],
                loss: null,
            },
        ],
        onTick: null,
        onInput: null,
        onOutput: null,
        calcEfficiency: null,
    },

    {
        id: "conduit_outlet",
        name: "暗管出口",
        width: 3,
        height: 3,
        input_ports:         [],
        output_ports: [
            { side: "right", offset: 1, media: "pipe" },
        ],
        power: 0,
        tags: ["倉庫存取"],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: "default",
                label: "預設",
                input_ports:                 [],
                output_ports: [
                    { side: "right", offset: 1, media: "pipe" },
                ],
                loss: null,
            },
        ],
        onTick: null,
        onInput: null,
        onOutput: null,
        calcEfficiency: null,
    },

    {
        id: "multi_conduit_inlet",
        name: "多口暗管入口",
        width: 3,
        height: 5,
        input_ports: [
            { side: "left", offset: 1, media: "pipe" },
            { side: "left", offset: 3, media: "pipe" },
        ],
        output_ports:         [],
        power: 0,
        tags: ["倉庫存取"],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: "default",
                label: "預設",
                input_ports: [
                    { side: "left", offset: 1, media: "pipe" },
                    { side: "left", offset: 3, media: "pipe" },
                ],
                output_ports:                 [],
                loss: null,
            },
        ],
        onTick: null,
        onInput: null,
        onOutput: null,
        calcEfficiency: null,
    },

    {
        id: "multi_conduit_outlet",
        name: "多口暗管出口",
        width: 3,
        height: 5,
        input_ports:         [],
        output_ports: [
            { side: "right", offset: 1, media: "pipe" },
            { side: "right", offset: 3, media: "pipe" },
        ],
        power: 0,
        tags: ["倉庫存取"],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: "default",
                label: "預設",
                input_ports:                 [],
                output_ports: [
                    { side: "right", offset: 1, media: "pipe" },
                    { side: "right", offset: 3, media: "pipe" },
                ],
                loss: null,
            },
        ],
        onTick: null,
        onInput: null,
        onOutput: null,
        calcEfficiency: null,
    },

    {
        id: "seed_harvester",
        name: "採種機",
        width: 5,
        height: 5,
        input_ports: [
            { side: "top", offset: 0, media: "belt" },
            { side: "top", offset: 1, media: "belt" },
            { side: "top", offset: 2, media: "belt" },
            { side: "top", offset: 3, media: "belt" },
            { side: "top", offset: 4, media: "belt" },
        ],
        output_ports: [
            { side: "bottom", offset: 0, media: "belt" },
            { side: "bottom", offset: 1, media: "belt" },
            { side: "bottom", offset: 2, media: "belt" },
            { side: "bottom", offset: 3, media: "belt" },
            { side: "bottom", offset: 4, media: "belt" },
        ],
        power: 10,
        tags: ["基礎生產"],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: "default",
                label: "預設",
                input_ports: [
                    { side: "top", offset: 0, media: "belt" },
                    { side: "top", offset: 1, media: "belt" },
                    { side: "top", offset: 2, media: "belt" },
                    { side: "top", offset: 3, media: "belt" },
                    { side: "top", offset: 4, media: "belt" },
                ],
                output_ports: [
                    { side: "bottom", offset: 0, media: "belt" },
                    { side: "bottom", offset: 1, media: "belt" },
                    { side: "bottom", offset: 2, media: "belt" },
                    { side: "bottom", offset: 3, media: "belt" },
                    { side: "bottom", offset: 4, media: "belt" },
                ],
                loss: null,
            },
        ],
        onTick: null,
        onInput: null,
        onOutput: null,
        calcEfficiency: null,
    },

    {
        id: "planter",
        name: "種植機",
        width: 5,
        height: 5,
        input_ports: [
            { side: "top", offset: 0, media: "belt" },
            { side: "top", offset: 1, media: "belt" },
            { side: "top", offset: 2, media: "belt" },
            { side: "top", offset: 3, media: "belt" },
            { side: "top", offset: 4, media: "belt" },
        ],
        output_ports: [
            { side: "bottom", offset: 0, media: "belt" },
            { side: "bottom", offset: 1, media: "belt" },
            { side: "bottom", offset: 2, media: "belt" },
            { side: "bottom", offset: 3, media: "belt" },
            { side: "bottom", offset: 4, media: "belt" },
        ],
        power: 20,
        tags: ["基礎生產"],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: "base_mode",
                label: "基礎模式",
                input_ports: [
                    { side: "top", offset: 0, media: "belt" },
                    { side: "top", offset: 1, media: "belt" },
                    { side: "top", offset: 2, media: "belt" },
                    { side: "top", offset: 3, media: "belt" },
                    { side: "top", offset: 4, media: "belt" },
                ],
                output_ports: [
                    { side: "bottom", offset: 0, media: "belt" },
                    { side: "bottom", offset: 1, media: "belt" },
                    { side: "bottom", offset: 2, media: "belt" },
                    { side: "bottom", offset: 3, media: "belt" },
                    { side: "bottom", offset: 4, media: "belt" },
                ],
                loss: null,
            },
            {
                id: "liquid_mode",
                label: "液體模式",
                input_ports: [
                    { side: "top", offset: 0, media: "belt" },
                    { side: "top", offset: 1, media: "belt" },
                    { side: "top", offset: 2, media: "belt" },
                    { side: "top", offset: 3, media: "belt" },
                    { side: "top", offset: 4, media: "belt" },
                    { side: "left", offset: 2, media: "pipe" },
                ],
                output_ports: [
                    { side: "bottom", offset: 0, media: "belt" },
                    { side: "bottom", offset: 1, media: "belt" },
                    { side: "bottom", offset: 2, media: "belt" },
                    { side: "bottom", offset: 3, media: "belt" },
                    { side: "bottom", offset: 4, media: "belt" },
                ],
                loss: null,
            },
        ],
        onTick: null,
        onInput: null,
        onOutput: null,
        calcEfficiency: null,
    },

    {
        id: "wastewater_processor",
        name: "廢水處理機",
        width: 3,
        height: 3,
        input_ports: [
            { side: "left", offset: 1, media: "pipe" },
        ],
        output_ports:         [],
        power: 50,
        tags: ["基礎生產"],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: "default",
                label: "預設",
                input_ports: [
                    { side: "left", offset: 1, media: "pipe" },
                ],
                output_ports:                 [],
                loss: null,
            },
        ],
        onTick: null,
        onInput: null,
        onOutput: null,
        calcEfficiency: null,
    },

    {
        id: "large_reactor",
        name: "擴容反應池",
        width: 6,
        height: 5,
        input_ports: [
            { side: "top", offset: 1, media: "belt" },
            { side: "top", offset: 2, media: "belt" },
            { side: "top", offset: 3, media: "belt" },
            { side: "top", offset: 4, media: "belt" },
            { side: "left", offset: 1, media: "pipe" },
            { side: "left", offset: 3, media: "pipe" },
        ],
        output_ports: [
            { side: "right", offset: 1, media: "pipe" },
            { side: "right", offset: 3, media: "pipe" },
            { side: "bottom", offset: 1, media: "belt" },
            { side: "bottom", offset: 2, media: "belt" },
            { side: "bottom", offset: 3, media: "belt" },
            { side: "bottom", offset: 4, media: "belt" },
        ],
        power: 100,
        tags: ["合成製造"],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: "default",
                label: "預設",
                input_ports: [
                    { side: "top", offset: 1, media: "belt" },
                    { side: "top", offset: 2, media: "belt" },
                    { side: "top", offset: 3, media: "belt" },
                    { side: "top", offset: 4, media: "belt" },
                    { side: "left", offset: 1, media: "pipe" },
                    { side: "left", offset: 3, media: "pipe" },
                ],
                output_ports: [
                    { side: "right", offset: 1, media: "pipe" },
                    { side: "right", offset: 3, media: "pipe" },
                    { side: "bottom", offset: 1, media: "belt" },
                    { side: "bottom", offset: 2, media: "belt" },
                    { side: "bottom", offset: 3, media: "belt" },
                    { side: "bottom", offset: 4, media: "belt" },
                ],
                loss: null,
            },
        ],
        onTick: null,
        onInput: null,
        onOutput: null,
        calcEfficiency: null,
    },

    {
        id: "power_pole",
        name: "供電樁",
        width: 2,
        height: 2,
        input_ports:         [],
        output_ports:         [],
        power: 0,
        tags: ["電力"],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: "default",
                label: "預設",
                input_ports:                 [],
                output_ports:                 [],
                loss: null,
            },
        ],
        onTick: null,
        onInput: null,
        onOutput: null,
        calcEfficiency: null,
    },

    {
        id: "xi_rang_power_pole",
        name: "息壤供電樁",
        width: 2,
        height: 2,
        input_ports:         [],
        output_ports:         [],
        power: 0,
        tags: ["電力"],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: "default",
                label: "預設",
                input_ports:                 [],
                output_ports:                 [],
                loss: null,
            },
        ],
        onTick: null,
        onInput: null,
        onOutput: null,
        calcEfficiency: null,
    },

    {
        id: "relay",
        name: "中繼器",
        width: 3,
        height: 3,
        input_ports:         [],
        output_ports:         [],
        power: 0,
        tags: ["電力"],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: "default",
                label: "預設",
                input_ports:                 [],
                output_ports:                 [],
                loss: null,
            },
        ],
        onTick: null,
        onInput: null,
        onOutput: null,
        calcEfficiency: null,
    },

    {
        id: "xi_rang_relay",
        name: "息壤中繼器",
        width: 3,
        height: 3,
        input_ports:         [],
        output_ports:         [],
        power: 0,
        tags: ["電力"],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: "default",
                label: "預設",
                input_ports:                 [],
                output_ports:                 [],
                loss: null,
            },
        ],
        onTick: null,
        onInput: null,
        onOutput: null,
        calcEfficiency: null,
    },

    {
        id: "thermal_pool",
        name: "熱能池",
        width: 2,
        height: 2,
        input_ports: [
            { side: "top", offset: 0, media: "belt" },
            { side: "top", offset: 1, media: "belt" },
        ],
        output_ports:         [],
        power: 0,
        tags: ["電力"],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: "default",
                label: "預設",
                input_ports: [
                    { side: "top", offset: 0, media: "belt" },
                    { side: "top", offset: 1, media: "belt" },
                ],
                output_ports:                 [],
                loss: null,
            },
        ],
        onTick: null,
        onInput: null,
        onOutput: null,
        calcEfficiency: null,
    },

    {
        id: "liquid_gas_converter",
        name: "液氣轉化機",
        width: 5,
        height: 5,
        input_ports: [
            { side: "top", offset: 2, media: "pipe" },
            { side: "left", offset: 1, media: "pipe" },
            { side: "left", offset: 3, media: "pipe" },
        ],
        output_ports: [
            { side: "right", offset: 1, media: "pipe" },
            { side: "right", offset: 3, media: "pipe" },
        ],
        power: 50,
        tags: ["合成製造"],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: "liquid_mode",
                label: "液體產出",
                input_ports: [
                    { side: "top", offset: 2, media: "pipe" },
                    { side: "left", offset: 1, media: "pipe" },
                    { side: "left", offset: 3, media: "pipe" },
                ],
                output_ports: [
                    { side: "right", offset: 1, media: "pipe" },
                    { side: "right", offset: 3, media: "pipe" },
                ],
                loss: { item: "液化息壤", rate_per_min: 6 },
            },
            {
                id: "gas_mode",
                label: "氣體產出",
                input_ports: [
                    { side: "top", offset: 2, media: "pipe" },
                    { side: "left", offset: 1, media: "pipe" },
                    { side: "left", offset: 3, media: "pipe" },
                ],
                output_ports: [
                    { side: "right", offset: 1, media: "pipe" },
                    { side: "right", offset: 3, media: "pipe" },
                ],
                loss: { item: "液化息壤", rate_per_min: 6 },
            },
        ],
        onTick: null,
        onInput: null,
        onOutput: null,
        calcEfficiency: null,
    },

    {
        id: "solid_gas_converter",
        name: "固氣轉化機",
        width: 5,
        height: 5,
        input_ports: [
            { side: "top", offset: 2, media: "pipe" },
            { side: "left", offset: 1, media: "pipe" },
            { side: "left", offset: 3, media: "pipe" },
        ],
        output_ports: [
            { side: "bottom", offset: 1, media: "belt" },
            { side: "bottom", offset: 3, media: "belt" },
        ],
        power: 50,
        tags: ["合成製造"],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: "solid_mode",
                label: "固體產出",
                input_ports: [
                    { side: "top", offset: 2, media: "pipe" },
                    { side: "left", offset: 1, media: "pipe" },
                    { side: "left", offset: 3, media: "pipe" },
                ],
                output_ports: [
                    { side: "bottom", offset: 1, media: "belt" },
                    { side: "bottom", offset: 3, media: "belt" },
                ],
                loss: { item: "息壤氣", rate_per_min: 6 },
            },
            {
                id: "gas_mode",
                label: "氣體產出",
                input_ports: [
                    { side: "top", offset: 1, media: "belt" },
                    { side: "top", offset: 2, media: "pipe" },
                    { side: "top", offset: 3, media: "belt" },
                ],
                output_ports: [
                    { side: "right", offset: 1, media: "pipe" },
                    { side: "right", offset: 3, media: "pipe" },
                ],
                loss: { item: "息壤氣", rate_per_min: 6 },
            },
        ],
        onTick: null,
        onInput: null,
        onOutput: null,
        calcEfficiency: null,
    },

    {
        id: "gas_reactor",
        name: "氣體反應爐",
        width: 5,
        height: 5,
        input_ports: [
            { side: "left", offset: 1, media: "pipe" },
            { side: "left", offset: 3, media: "pipe" },
        ],
        output_ports: [
            { side: "right", offset: 1, media: "pipe" },
            { side: "right", offset: 3, media: "pipe" },
        ],
        power: 50,
        tags: ["合成製造"],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: "default",
                label: "預設",
                input_ports: [
                    { side: "left", offset: 1, media: "pipe" },
                    { side: "left", offset: 3, media: "pipe" },
                ],
                output_ports: [
                    { side: "right", offset: 1, media: "pipe" },
                    { side: "right", offset: 3, media: "pipe" },
                ],
                loss: null,
            },
        ],
        onTick: null,
        onInput: null,
        onOutput: null,
        calcEfficiency: null,
    },

    {
        id: "gas_disperser",
        name: "氣體散布機",
        width: 3,
        height: 3,
        input_ports: [
            { side: "left", offset: 1, media: "pipe" },
        ],
        output_ports:         [],
        power: -1,
        tags: ["合成製造"],
        is_source: false,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: "default",
                label: "預設",
                input_ports: [
                    { side: "left", offset: 1, media: "pipe" },
                ],
                output_ports:                 [],
                loss: null,
            },
        ],
        onTick: null,
        onInput: null,
        onOutput: null,
        calcEfficiency: null,
    },

    {
        id: "item_source",
        name: "物品輸出口",
        width: 1,
        height: 3,
        input_ports:         [],
        output_ports: [
            { side: "right", offset: 1, media: "belt" },
        ],
        power: 0,
        tags: ["物流設備"],
        is_source: true,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: "default",
                label: "預設",
                input_ports:                 [],
                output_ports: [
                    { side: "right", offset: 1, media: "belt" },
                ],
                loss: null,
            },
        ],
        onTick: null,
        onInput: null,
        onOutput: null,
        calcEfficiency: null,
    },

    {
        id: "item_sink",
        name: "物品輸入口",
        width: 1,
        height: 3,
        input_ports: [
            { side: "right", offset: 1, media: "belt" },
        ],
        output_ports:         [],
        power: 0,
        tags: ["物流設備"],
        is_source: false,
        is_sink: true,
        config_signed_off: true,
        modes: [
            {
                id: "default",
                label: "預設",
                input_ports: [
                    { side: "right", offset: 1, media: "belt" },
                ],
                output_ports:                 [],
                loss: null,
            },
        ],
        onTick: null,
        onInput: null,
        onOutput: null,
        calcEfficiency: null,
    },
];

// ─── 查詢 Map ───────────────────────────────────────────────────────────────────

/** name（中文）→ Machine 快查 Map */
export const machineMap: ReadonlyMap<string, Machine> = new Map(
    machineList.map((m) => [m.name, m]),
);

/** id（英文 snake_case）→ Machine 快查 Map */
const machineByIdMap: ReadonlyMap<string, Machine> = new Map(machineList.map((m) => [m.id, m]));

// ─── 查詢函式 ───────────────────────────────────────────────────────────────────

/**
 * 依中文名稱查詢機器定義。
 *
 * @param name 機器中文名稱（對應 Machine.name）
 */
export function getMachine(name: string): Machine | undefined {
    return machineMap.get(name);
}

/**
 * 依英文 id 查詢機器定義。
 *
 * @param id 機器英文 id（對應 Machine.id）
 */
export function getMachineById(id: string): Machine | undefined {
    return machineByIdMap.get(id);
}

/**
 * 取得所有機器定義列表的副本。
 */
export function getAllMachines(): Machine[] {
    return [...machineList];
}
