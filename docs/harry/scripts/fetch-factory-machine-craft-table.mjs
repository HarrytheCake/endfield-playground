/**
 * 從 data.akedata.wiki 抓取最新版本的 TableCfg 資料表
 * （FactoryMachineCraftTable.json、FactoryBuildingTable.json、I18nTextTable_CN.json）
 *
 * 用法：
 *   node docs/harry/scripts/fetch-factory-machine-craft-table.mjs
 *   node docs/harry/scripts/fetch-factory-machine-craft-table.mjs --dry-run
 *
 * 流程：
 *   1. GET manifest.json，用 manifest.latest 對應 versions[] 找出該版本的 tableCfgPath
 *   2. 下載 SOURCE_TABLE_NAMES 各資料表；I18nTextTable_CN.json 全表約 140k 筆、10MB+，
 *      只把 SOURCE_TABLE_NAMES 內各筆資料 "id" 欄位實際引用到的 id 對應文字留下，其餘丟棄
 *   3. 落地存到 docs/harry/dev/data/<TableName>.json（資料夾不存在則建立）
 *
 * 注意：抽取 "id" 參照時必須用 fetch 回應的原始文字（regex），不能先 JSON.parse 再讀欄位——
 * 這些 id 是超過 Number.MAX_SAFE_INTEGER 的 int64，JSON.parse 轉成 JS number 會直接失真
 * （小數精度不足導致尾數被捨去成 0），之後就永遠比對不到 I18nTextTable_CN.json 裡的原始 key。
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HARRY_ROOT = join(__dirname, '..');
const DEST_DIR = join(HARRY_ROOT, 'dev', 'data');

const MANIFEST_URL = 'https://data.akedata.wiki/manifest.json';
const DATA_HOST = 'https://data.akedata.wiki';

/** 完整下載、原樣落地的資料表檔名，皆位於 <tableCfgPath>/ 底下 */
const SOURCE_TABLE_NAMES = ['FactoryMachineCraftTable.json', 'FactoryBuildingTable.json'];

/** 只保留被 SOURCE_TABLE_NAMES 引用到的 id 的翻譯表 */
const I18N_TABLE_NAME = 'I18nTextTable_CN.json';

/** 比對 JSON 原始文字中形如 "id": 1234 的數值型 id（字串型 "id": "xxx" 不會命中） */
const NUMERIC_ID_PATTERN = /"id":\s*(-?\d+)/g;

/**
 * 從原始（未 JSON.parse）回應文字抽取所有數值型 "id" 參照，維持原始位數不失真。
 * @param {string} rawText
 * @returns {Set<string>}
 */
function extractReferencedIds(rawText) {
    const ids = new Set();
    for (const match of rawText.matchAll(NUMERIC_ID_PATTERN)) {
        ids.add(match[1]);
    }
    return ids;
}

const dryRun = process.argv.includes('--dry-run');

/**
 * 將 repo 相對路徑印成可讀字串。
 * @param {string} abs
 */
function rel(abs) {
    return relative(process.cwd(), abs).replace(/\\/g, '/');
}

/**
 * @param {string} url
 * @param {string} label
 */
async function fetchJson(url, label) {
    let res;
    try {
        res = await fetch(url);
    } catch (err) {
        console.error(
            `[fetch-factory-machine-craft-table] ${label} 連線失敗：${/** @type {Error} */ (err).message}`,
        );
        process.exit(1);
    }
    if (!res.ok) {
        console.error(
            `[fetch-factory-machine-craft-table] ${label} 回應非 200：${res.status} ${res.statusText}`,
        );
        process.exit(1);
    }
    const text = await res.text();
    try {
        return { data: JSON.parse(text), raw: text };
    } catch (err) {
        console.error(
            `[fetch-factory-machine-craft-table] ${label} JSON.parse 失敗：${/** @type {Error} */ (err).message}`,
        );
        process.exit(1);
    }
}

async function main() {
    console.log(`[fetch-factory-machine-craft-table] 模式：${dryRun ? 'dry-run' : 'write'}`);
    console.log('');

    console.log(`[fetch-factory-machine-craft-table] 取得 manifest：${MANIFEST_URL}`);
    const { data: manifest } = await fetchJson(MANIFEST_URL, 'manifest.json');

    const latestId = manifest.latest;
    const version = Array.isArray(manifest.versions)
        ? manifest.versions.find((v) => v.id === latestId)
        : undefined;

    if (!latestId || !version || !version.tableCfgPath) {
        console.error(
            `[fetch-factory-machine-craft-table] 在 manifest.versions 找不到 latest="${latestId}" 對應的 tableCfgPath`,
        );
        process.exit(1);
    }

    console.log(
        `[fetch-factory-machine-craft-table] 最新版本：${version.id}（gameVersion=${version.gameVersion}, hotfixVersion=${version.hotfixVersion}）`,
    );
    console.log(`[fetch-factory-machine-craft-table] tableCfgPath：${version.tableCfgPath}`);

    /** @type {{ name: string, data: unknown }[]} */
    const tables = [];
    /** @type {Set<string>} */
    const referencedIds = new Set();
    for (const tableName of SOURCE_TABLE_NAMES) {
        const tableUrl = `${DATA_HOST}/${version.tableCfgPath}/${tableName}`;
        console.log(`[fetch-factory-machine-craft-table] 下載：${tableUrl}`);
        const { data, raw } = await fetchJson(tableUrl, tableName);
        tables.push({ name: tableName, data });
        for (const id of extractReferencedIds(raw)) referencedIds.add(id);
    }
    console.log(
        `[fetch-factory-machine-craft-table] 從來源表收集到 ${referencedIds.size} 個被引用的 i18n id`,
    );

    const i18nUrl = `${DATA_HOST}/${version.tableCfgPath}/${I18N_TABLE_NAME}`;
    console.log(`[fetch-factory-machine-craft-table] 下載：${i18nUrl}`);
    const { data: i18nData } = await fetchJson(i18nUrl, I18N_TABLE_NAME);

    const i18nEntries = /** @type {Record<string, unknown>} */ (i18nData);
    const totalI18nKeys = Object.keys(i18nEntries).length;
    /** @type {Record<string, unknown>} */
    const filteredI18n = {};
    let matchedCount = 0;
    for (const id of referencedIds) {
        if (Object.prototype.hasOwnProperty.call(i18nEntries, id)) {
            filteredI18n[id] = i18nEntries[id];
            matchedCount++;
        }
    }
    console.log(
        `[fetch-factory-machine-craft-table] I18nTextTable_CN 篩選：${matchedCount}/${referencedIds.size} 個引用 id 有對應翻譯（全表共 ${totalI18nKeys} 筆）`,
    );
    tables.push({ name: I18N_TABLE_NAME, data: filteredI18n });

    if (dryRun) {
        console.log('');
        console.log('[fetch-factory-machine-craft-table] dry-run 完成，未寫入檔案');
        return;
    }

    if (!existsSync(DEST_DIR)) {
        mkdirSync(DEST_DIR, { recursive: true });
        console.log(`[fetch-factory-machine-craft-table] 已建立目錄 ${rel(DEST_DIR)}`);
    }

    console.log('');
    for (const { name, data } of tables) {
        const destFile = join(DEST_DIR, name);
        const output = JSON.stringify(data, null, 2) + '\n';
        writeFileSync(destFile, output, 'utf8');
        console.log(
            `[fetch-factory-machine-craft-table] 完成：已寫入 ${rel(destFile)}（${output.length} bytes）`,
        );
    }
}

main();
