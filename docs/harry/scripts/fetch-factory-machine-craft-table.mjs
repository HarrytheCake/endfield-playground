/**
 * 從 data.akedata.wiki 抓取最新版本的 TableCfg 資料表（FactoryMachineCraftTable.json、FactoryBuildingTable.json）
 *
 * 用法：
 *   node docs/harry/scripts/fetch-factory-machine-craft-table.mjs
 *   node docs/harry/scripts/fetch-factory-machine-craft-table.mjs --dry-run
 *
 * 流程：
 *   1. GET manifest.json，用 manifest.latest 對應 versions[] 找出該版本的 tableCfgPath
 *   2. 用 tableCfgPath 組出各資料表（見 TABLE_NAMES）的下載 URL 並逐一下載
 *   3. 落地存到 docs/harry/dev/data/<TableName>.json（資料夾不存在則建立）
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HARRY_ROOT = join(__dirname, '..');
const DEST_DIR = join(HARRY_ROOT, 'dev', 'data');

const MANIFEST_URL = 'https://data.akedata.wiki/manifest.json';
const DATA_HOST = 'https://data.akedata.wiki';

/** 要下載的資料表檔名，皆位於 <tableCfgPath>/ 底下 */
const TABLE_NAMES = [
    'FactoryMachineCraftTable.json',
    'FactoryBuildingTable.json',
    'I18nTextTable_CN.json',
];

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
    for (const tableName of TABLE_NAMES) {
        const tableUrl = `${DATA_HOST}/${version.tableCfgPath}/${tableName}`;
        console.log(`[fetch-factory-machine-craft-table] 下載：${tableUrl}`);
        const { data } = await fetchJson(tableUrl, tableName);
        tables.push({ name: tableName, data });
    }

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
