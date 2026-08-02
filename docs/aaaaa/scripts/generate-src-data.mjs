/**
 * V7-D2：自 docs/aaaaa/data/*.json 重產 src/data/*.ts
 *
 * 用法：
 *   node docs/aaaaa/scripts/generate-src-data.mjs
 *   node docs/aaaaa/scripts/generate-src-data.mjs --dry-run
 *
 * 產物：
 *   - src/data/machines.ts（含物品輸出口／入口 stub；基礎材料輸出點在 JSON）
 *   - src/data/products.ts（僅 products.json + 測試 stub；含 form；不注入材料假產品）
 *   - src/data/materials.ts（基礎材料 + form）
 *   - src/data/plans.ts
 *   - src/data/environments.ts
 *
 * 前置：請先 `pnpm sync:aaaaa-data` 確保 docs/aaaaa/data 為最新。
 * 注意：materials／products 的 `form`（solid｜liquid｜gas）必須保留在 data_1，
 *       否則 sync 會覆蓋 docs/aaaaa/data 的物態欄位。
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../..');
const DATA_DIR = join(__dirname, '../data');
const SRC_DATA = join(ROOT, 'src/data');
const dryRun = process.argv.includes('--dry-run');

/** 機器中文名 → 英文 id（保留既有 id；新機器在此補齊） */
const MACHINE_ID_BY_NAME = {
    塑型機: 'shaping_machine',
    精煉爐: 'refinery',
    粉碎機: 'crusher',
    配件機: 'parts_machine',
    採種機: 'seed_harvester',
    種植機: 'planter',
    廢水處理機: 'wastewater_processor',
    灌裝機: 'filling_machine',
    裝備原件機: 'equipment_parts_machine',
    封裝機: 'packaging_machine',
    研磨機: 'grinder',
    反應池: 'reactor',
    天有洪爐: 'tianyou_furnace',
    提純機: 'purifier',
    拆解機: 'disassembler',
    擴容反應池: 'large_reactor',
    物品准入口: 'item_access_port',
    分流器: 'splitter',
    物流橋: 'logistics_bridge',
    匯流器: 'merger',
    管道准入口: 'pipe_access_port',
    管道分流器: 'pipe_splitter',
    管道橋: 'pipe_bridge',
    管道匯流器: 'pipe_merger',
    協議儲存箱: 'protocol_storage_box',
    倉庫存貨口: 'warehouse_input',
    倉庫取貨口: 'warehouse_output',
    儲液罐: 'liquid_tank',
    倉庫存取線基段: 'warehouse_line_base',
    倉庫存取線源樁: 'warehouse_line_source',
    暗管入口: 'conduit_inlet',
    暗管出口: 'conduit_outlet',
    多口暗管入口: 'multi_conduit_inlet',
    多口暗管出口: 'multi_conduit_outlet',
    供電樁: 'power_pole',
    息壤供電樁: 'xi_rang_power_pole',
    中繼器: 'relay',
    息壤中繼器: 'xi_rang_relay',
    熱能池: 'thermal_pool',
    液氣轉化機: 'liquid_gas_converter',
    固氣轉化機: 'solid_gas_converter',
    氣體反應爐: 'gas_reactor',
    氣體散布機: 'gas_disperser',
    基礎材料輸出點: 'material_source',
};

/** 產品中文名 → 英文 id（已知項保留；其餘穩定 hash） */
const PRODUCT_ID_BY_NAME = {
    源礦: 'yuan_ore',
    藍鐵礦: 'blue_iron_ore',
    赤銅礦: 'red_copper_ore',
    清水: 'clean_water',
    沉積酸: 'deposit_acid',
    源石粉末: 'yuan_ore_powder',
    藍鐵粉末: 'blue_iron_powder',
    紫晶粉末: 'purple_crystal_powder',
    赤銅粉末: 'red_copper_powder',
    碳粉末: 'carbon_powder',
    藍鐵塊: 'blue_iron_ingot',
    紫晶纖維: 'purple_crystal_fiber',
    赤銅塊: 'red_copper_ingot',
    穩定碳塊: 'stable_carbon_block',
    赤銅溶液: 'red_copper_solution',
    赫銅塊: 'hue_copper_ingot',
    赫銅溶液: 'hue_copper_solution',
    赤銅零件: 'red_copper_part',
    赫銅零件: 'hue_copper_part',
    紫晶質瓶: 'purple_crystal_bottle',
    藍鐵瓶: 'blue_iron_bottle',
    低容量谷地電池: 'low_cap_valley_battery',
    中容量谷地電池: 'mid_cap_valley_battery',
    高容量谷地電池: 'high_cap_valley_battery',
};

function loadJson(name) {
    const path = join(DATA_DIR, name);
    if (!existsSync(path)) throw new Error(`缺少 ${path}；請先 pnpm sync:aaaaa-data`);
    return JSON.parse(readFileSync(path, 'utf8'));
}

function productId(name) {
    if (PRODUCT_ID_BY_NAME[name]) return PRODUCT_ID_BY_NAME[name];
    const h = createHash('sha1').update(name).digest('hex').slice(0, 10);
    return `p_${h}`;
}

function machineId(name) {
    const id = MACHINE_ID_BY_NAME[name];
    if (!id) throw new Error(`未登錄機器 id 對映：${name}（請補 MACHINE_ID_BY_NAME）`);
    return id;
}

function unlimitedToNull(n) {
    return n === -1 ? null : n;
}

function esc(str) {
    return JSON.stringify(str);
}

function indent(level) {
    return '    '.repeat(level);
}

function renderPort(port, level) {
    return `${indent(level)}{ side: ${esc(port.side)}, offset: ${port.offset}, media: ${esc(port.media ?? 'belt')} }`;
}

function renderPorts(ports, level) {
    if (!ports?.length) return `${indent(level)}[]`;
    return `[\n${ports.map((p) => renderPort(p, level + 1)).join(',\n')},\n${indent(level)}]`;
}

function renderLoss(loss, level) {
    if (loss == null) return 'null';
    return `{ item: ${esc(loss.item)}, rate_per_min: ${loss.rate_per_min} }`;
}

function renderMode(mode, level) {
    const i = indent(level);
    return `${i}{
${i}    id: ${esc(mode.id)},
${i}    label: ${esc(mode.label)},
${i}    input_ports: ${renderPorts(mode.input_ports, level + 1)},
${i}    output_ports: ${renderPorts(mode.output_ports, level + 1)},
${i}    loss: ${renderLoss(mode.loss, level + 1)},
${i}}`;
}

function renderMachine(m, level) {
    const i = indent(level);
    const id = machineId(m.name);
    /** V9-B1：埠僅存在於 modes[]；缺 modes 時才從舊外層欄位合成 default */
    const modes = m.modes?.length
        ? m.modes
        : [
              {
                  id: 'default',
                  label: '預設',
                  input_ports: m.input_ports ?? [],
                  output_ports: m.output_ports ?? [],
                  loss: null,
              },
          ];
    if (!modes.length) {
        throw new Error(`machine "${m.name}" has empty modes`);
    }
    return `${i}{
${i}    id: ${esc(id)},
${i}    name: ${esc(m.name)},
${i}    width: ${m.width},
${i}    height: ${m.height},
${i}    power: ${m.power ?? -1},
${i}    tags: ${JSON.stringify(m.tags ?? [])},
${i}    is_source: ${Boolean(m.is_source)},
${i}    is_sink: ${Boolean(m.is_sink)},
${i}    config_signed_off: ${Boolean(m.config_signed_off)},
${i}    modes: [
${modes.map((mode) => renderMode(mode, level + 2)).join(',\n')},
${i}    ],
${i}    onTick: null,
${i}    onInput: null,
${i}    onOutput: null,
${i}    calcEfficiency: null,
${i}}`;
}

function renderRecipeItem(item, level) {
    return `${indent(level)}{ itemId: ${esc(item.name ?? item.itemId)}, quantity: ${item.quantity} }`;
}

function renderRecipe(recipe, productName, recipeIndexInProduct, level) {
    const i = indent(level);
    const mid = MACHINE_ID_BY_NAME[recipe.machine] ?? 'unknown_machine';
    const pid = productId(productName);
    const id = `${mid}_${pid}_${recipeIndexInProduct}`;
    const modeLine =
        recipe.machine_mode != null || recipe.machineMode != null
            ? `\n${i}    machineMode: ${esc(recipe.machine_mode ?? recipe.machineMode)},`
            : '';
    const envLine =
        recipe.environment != null ? `\n${i}    environment: ${esc(recipe.environment)},` : '';
    return `${i}{
${i}    id: ${esc(id)},
${i}    inputs: [
${(recipe.inputs ?? []).map((x) => renderRecipeItem(x, level + 2)).join(',\n')}${
        (recipe.inputs ?? []).length ? ',' : ''
    }
${i}    ],
${i}    outputs: [
${(recipe.outputs ?? []).map((x) => renderRecipeItem(x, level + 2)).join(',\n')}${
        (recipe.outputs ?? []).length ? ',' : ''
    }
${i}    ],
${i}    machine: ${esc(recipe.machine)},${modeLine}${envLine}
${i}    timeSeconds: ${recipe.time_seconds ?? recipe.timeSeconds},
${i}}`;
}

/** 正規化 form；缺省 solid */
function normalizeForm(form) {
    if (form === 'liquid' || form === 'gas' || form === 'solid') return form;
    return 'solid';
}

function renderProduct(product, level) {
    const i = indent(level);
    const id = productId(product.name);
    const form = normalizeForm(product.form);
    return `${i}{
${i}    id: ${esc(id)},
${i}    name: ${esc(product.name)},
${i}    form: ${esc(form)},
${i}    recipes: [
${product.recipes.map((r, idx) => renderRecipe(r, product.name, idx, level + 2)).join(',\n')},
${i}    ],
${i}}`;
}

function renderMaterial(mat, level) {
    const i = indent(level);
    return `${i}{
${i}    id: ${esc(productId(mat.name))},
${i}    name: ${esc(mat.name)},
${i}    form: ${esc(normalizeForm(mat.form))},
${i}}`;
}

const SOURCE_SINK_STUBS = [
    {
        name: '物品輸出口',
        width: 1,
        height: 3,
        power: 0,
        tags: ['物流設備'],
        is_source: true,
        is_sink: false,
        config_signed_off: true,
        modes: [
            {
                id: 'default',
                label: '預設',
                input_ports: [],
                output_ports: [{ side: 'right', offset: 1, media: 'belt' }],
                loss: null,
            },
        ],
    },
    {
        name: '物品輸入口',
        width: 1,
        height: 3,
        power: 0,
        tags: ['物流設備'],
        is_source: false,
        is_sink: true,
        config_signed_off: true,
        modes: [
            {
                id: 'default',
                label: '預設',
                input_ports: [{ side: 'right', offset: 1, media: 'belt' }],
                output_ports: [],
                loss: null,
            },
        ],
    },
];

// 讓 stub 也能走 machineId()
MACHINE_ID_BY_NAME['物品輸出口'] = 'item_source';
MACHINE_ID_BY_NAME['物品輸入口'] = 'item_sink';

function generateMachinesTs(machinesJson, machineTags) {
    const all = [...machinesJson, ...SOURCE_SINK_STUBS];
    for (const m of all) machineId(m.name); // 提早驗證對映
    const tagsJson = JSON.stringify(machineTags);

    return `/**
 * 機器靜態定義資料（由 docs/aaaaa/scripts/generate-src-data.mjs 產生）
 *
 * 來源：docs/aaaaa/data/machines.json（含基礎材料輸出點）
 *       docs/aaaaa/data/machine_tags.json（分類標籤）
 * 另附 FlowEngine stub：物品輸出口（固體）、物品輸入口（sink；總產值只計此處交付）。
 *
 * 請勿手改本檔資料區；改 JSON 後重新執行：
 *   pnpm generate:src-data
 */

import type { Machine, MachineCategory } from '@/types/machine';
export { getMachineMode } from '@/types/machine';

// ─── 分類標籤（V9-C1）──────────────────────────────────────────────────────────

/** 機器 tag 分頁順序；對齊 machine_tags.json */
export const MACHINE_TAGS: readonly MachineCategory[] = ${tagsJson};

const _knownTagSet = new Set<string>(MACHINE_TAGS);

// ─── 機器定義陣列 ─────────────────────────────────────────────────────────────

/**
 * 全部機器的靜態定義陣列，模組載入時建立一次，整個應用生命週期內唯讀共用。
 */
export const machineList: Machine[] = [
${all.map((m) => renderMachine(m, 1)).join(',\n\n')},
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

/**
 * 依 tag 篩選機器（一機多 tag 可出現在多個分頁）。
 *
 * @param tag \`all\`＝全部；\`untagged\`＝無已知 tag；其餘為 MachineCategory
 */
export function getMachinesByTag(tag: MachineCategory | 'all' | 'untagged'): Machine[] {
    if (tag === 'all') return [...machineList];
    if (tag === 'untagged') {
        return machineList.filter((m) => !m.tags.some((t) => _knownTagSet.has(t)));
    }
    return machineList.filter((m) => m.tags.includes(tag));
}
`;
}

function generateMaterialsTs(materialsJson) {
    return `/**
 * 基礎材料資料（由 docs/aaaaa/scripts/generate-src-data.mjs 產生）
 *
 * 來源：docs/aaaaa/data/materials.json（含 form：solid｜liquid｜gas）
 *
 * 請勿手改本檔資料區；改 JSON 後重新執行：
 *   pnpm generate:src-data
 */

import type { MaterialDef, ItemForm } from '@/types/flow';
import { formToPortMedia } from '@/types/flow';
import type { PortMedia } from '@/types/machine';

// ─── 材料定義 ─────────────────────────────────────────────────────────────────

const materialList: MaterialDef[] = [
${materialsJson.map((m) => renderMaterial(m, 1)).join(',\n\n')},
];

const _materialMap = new Map<string, MaterialDef>(materialList.map((m) => [m.name, m]));

/** 取得所有基礎材料 */
export function getAllMaterials(): MaterialDef[] {
    return materialList;
}

/** 依名稱查材料 */
export function getMaterial(name: string): MaterialDef | undefined {
    return _materialMap.get(name);
}

/**
 * 依名稱查材料物態；未知時回傳 undefined。
 */
export function getMaterialForm(name: string): ItemForm | undefined {
    return _materialMap.get(name)?.form;
}

/**
 * 材料物態對應的線路媒質；未知材料回傳 null。
 */
export function getMaterialPortMedia(name: string): PortMedia | null {
    const form = getMaterialForm(name);
    return form ? formToPortMedia(form) : null;
}
`;
}

function generateProductsTs(productsJson, materialsJson) {
    const formByName = new Map();
    for (const mat of materialsJson) {
        formByName.set(mat.name, normalizeForm(mat.form));
    }
    for (const p of productsJson) {
        const f = normalizeForm(p.form);
        const prev = formByName.get(p.name);
        if (prev != null && prev !== f) {
            throw new Error(
                `form 不一致：「${p.name}」materials=${prev} products=${f}（兩邊必須相同）`,
            );
        }
        formByName.set(p.name, f);
    }

    /** V9-B2／H1-3：僅 products.json；不注入 materials 假產品、不注入測試 stub */
    const byName = new Map();
    for (const p of productsJson) {
        byName.set(p.name, {
            name: p.name,
            form: formByName.get(p.name) ?? 'solid',
            recipes: [...p.recipes],
        });
    }

    const ordered = [];
    const seen = new Set();
    for (const p of productsJson) {
        if (seen.has(p.name)) continue;
        ordered.push(byName.get(p.name));
        seen.add(p.name);
    }

    return `/**
 * 產品與配方資料（由 docs/aaaaa/scripts/generate-src-data.mjs 產生）
 *
 * 來源：docs/aaaaa/data/products.json（不含 materials 假產品、不含測試 stub）
 * 每個產品含 form（solid｜liquid｜gas）。基礎材料請查 materials.ts。
 *
 * 請勿手改本檔資料區；改 JSON 後重新執行：
 *   pnpm generate:src-data
 */

import type { RecipeDef, ProductDef, ItemForm } from '@/types/flow';
import { formToPortMedia } from '@/types/flow';
import type { PortMedia } from '@/types/machine';
import { getMaterialForm } from '@/data/materials';

// ─── 產品定義 ─────────────────────────────────────────────────────────────────

const productList: ProductDef[] = [
${ordered.map((p) => renderProduct(p, 1)).join(',\n\n')},
];

// ─── 查詢 API ─────────────────────────────────────────────────────────────────

/** 產品名稱快查 Map */
const _productMap = new Map<string, ProductDef>(productList.map((p) => [p.name, p]));

/**
 * 取得所有使用指定設備的配方。
 *
 * @param machineName 設備中文名稱
 * @param modeId 若提供，只回傳 machineMode 相符或未標 mode 的配方
 */
export function getRecipesForMachine(machineName: string, modeId?: string): RecipeDef[] {
    const recipes = productList.flatMap((p) => p.recipes.filter((r) => r.machine === machineName));
    if (modeId === undefined) return recipes;
    return recipes.filter((r) => r.machineMode == null || r.machineMode === modeId);
}

/**
 * 依產品名稱取得所有配方。
 */
export function getRecipesByProduct(productName: string): RecipeDef[] {
    return _productMap.get(productName)?.recipes ?? [];
}

/**
 * 取得指定產品的單一配方（依 index，預設第 0 個）。
 */
export function getRecipe(productName: string, index = 0): RecipeDef | undefined {
    return _productMap.get(productName)?.recipes[index];
}

/** 依名稱取得產品定義 */
export function getProduct(productName: string): ProductDef | undefined {
    return _productMap.get(productName);
}

/** 取得所有 ProductDef */
export function getAllProducts(): ProductDef[] {
    return productList;
}

/** 取得所有 RecipeDef（攤平） */
export function getAllRecipes(): RecipeDef[] {
    return productList.flatMap((p) => p.recipes);
}

/**
 * 查詢品項物態：優先產品表，其次材料表；皆無則視為 solid。
 * @param itemName 品項中文名（itemId）
 */
export function getItemForm(itemName: string): ItemForm {
    return _productMap.get(itemName)?.form ?? getMaterialForm(itemName) ?? 'solid';
}

/**
 * 品項應使用的線路媒質。
 * @param itemName 品項中文名
 */
export function getItemPortMedia(itemName: string): PortMedia {
    return formToPortMedia(getItemForm(itemName));
}
`;
}

function generatePlansTs(plansJson) {
    const plans = plansJson.map((p) => ({
        id: p.id,
        name: p.name,
        material_rates: (p.material_rates ?? []).map((r) => ({
            name: r.name,
            rate: unlimitedToNull(r.rate),
        })),
        machine_limits: (p.machine_limits ?? []).map((r) => ({
            name: r.name,
            limit: unlimitedToNull(r.limit),
        })),
        product_values: p.product_values ?? [],
        priority_products: (p.priority_products ?? []).map((r) => ({
            name: r.name,
            max_rate: unlimitedToNull(r.max_rate),
        })),
        transport_items: p.transport_items ?? [],
    }));

    return `/**
 * 建造計畫資料（由 docs/aaaaa/scripts/generate-src-data.mjs 產生）
 *
 * 來源：docs/aaaaa/data/plans.json
 * \`-1\` 在 TypeScript 面轉成 \`null\`（無上限）。
 *
 * 請勿手改本檔資料區；改 JSON 後重新執行：
 *   pnpm generate:src-data
 */

import type { Plan } from '@/types/plan';

/**
 * 所有可選建造計畫資料（武陵 / 四號谷地 等）。
 */
export const plans: Plan[] = ${JSON.stringify(plans, null, 4)};
`;
}

function generateEnvironmentsTs(envJson) {
    return `/**
 * 環境標籤資料（由 docs/aaaaa/scripts/generate-src-data.mjs 產生）
 *
 * 來源：docs/aaaaa/data/environments.json
 *
 * 請勿手改本檔資料區；改 JSON 後重新執行：
 *   pnpm generate:src-data
 */

import type { Environment } from '@/types/environment';

/** 全部環境標籤 */
export const environmentList: readonly Environment[] = ${JSON.stringify(envJson, null, 4)};

const _envMap = new Map<string, Environment>(environmentList.map((e) => [e.id, e]));

/**
 * 依 id 查詢環境標籤。
 *
 * @param id Environment.id（如 \`"none"\`）
 */
export function getEnvironment(id: string): Environment | undefined {
    return _envMap.get(id);
}

/** 取得全部環境標籤副本 */
export function getAllEnvironments(): Environment[] {
    return [...environmentList];
}
`;
}

function writeOut(relPath, content) {
    const abs = join(SRC_DATA, relPath);
    if (dryRun) {
        console.log(`[dry-run] would write ${relPath} (${content.length} bytes)`);
        return;
    }
    writeFileSync(abs, content, 'utf8');
    console.log(`wrote ${relPath} (${content.length} bytes)`);
}

// ─── main ─────────────────────────────────────────────────────────────────────

const machines = loadJson('machines.json');
const products = loadJson('products.json');
const plans = loadJson('plans.json');
const environments = loadJson('environments.json');
const materials = loadJson('materials.json');
const machineTags = loadJson('machine_tags.json');

console.log(
    `input: machines=${machines.length} products=${products.length} plans=${plans.length} envs=${environments.length} materials=${materials.length} tags=${machineTags.length}`,
);

writeOut('machines.ts', generateMachinesTs(machines, machineTags));
writeOut('materials.ts', generateMaterialsTs(materials));
writeOut('products.ts', generateProductsTs(products, materials));
writeOut('plans.ts', generatePlansTs(plans));
writeOut('environments.ts', generateEnvironmentsTs(environments));

if (!dryRun) {
    console.log('done. next: pnpm type-check && pnpm test');
}
