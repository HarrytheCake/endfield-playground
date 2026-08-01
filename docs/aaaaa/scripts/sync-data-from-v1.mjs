/**
 * V7-B1：將 docs/aaaaa/data_1 原樣同步至 docs/aaaaa/data
 *
 * 用法：
 *   node docs/aaaaa/scripts/sync-data-from-v1.mjs
 *   node docs/aaaaa/scripts/sync-data-from-v1.mjs --dry-run
 *
 * 不做語意轉換；複製後對每個 .json 執行 JSON.parse 驗證。  \
 * V7-C1：複製 README 後注入 playground 文首註記（見 playground-data-readme-banner.md）。
 */

import { copyFileSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const AAAAA_ROOT = join(__dirname, '..');
const SRC_DIR = join(AAAAA_ROOT, 'data_1');
const DEST_DIR = join(AAAAA_ROOT, 'data');
const README_BANNER_PATH = join(__dirname, 'playground-data-readme-banner.md');
const README_BANNER_MARKER = '<!-- PLAYGROUND_NOTES -->';

/** 須同步的檔名（相對於 data_1 / data） */
const FILES = [
    'materials.json',
    'materials.md',
    'machines.json',
    'machines.md',
    'machine_tags.json',
    'machine_tags.md',
    'products.json',
    'products.md',
    'environments.json',
    'environments.md',
    'plans.json',
    'plans.md',
    'layouts.json',
    'layouts.md',
    'blueprints.json',
    'blueprints.md',
    'README.md',
];

const dryRun = process.argv.includes('--dry-run');

/**
 * 將 repo 相對路徑印成可讀字串。
 * @param {string} abs
 */
function rel(abs) {
    return relative(process.cwd(), abs).replace(/\\/g, '/');
}

function main() {
    if (!existsSync(SRC_DIR)) {
        console.error(`[sync-data-from-v1] 來源不存在：${rel(SRC_DIR)}`);
        process.exit(1);
    }

    console.log(`[sync-data-from-v1] 來源：${rel(SRC_DIR)}`);
    console.log(`[sync-data-from-v1] 目標：${rel(DEST_DIR)}`);
    console.log(`[sync-data-from-v1] 模式：${dryRun ? 'dry-run' : 'write'}`);
    console.log('');

    if (!dryRun && !existsSync(DEST_DIR)) {
        mkdirSync(DEST_DIR, { recursive: true });
        console.log(`[sync-data-from-v1] 已建立目錄 ${rel(DEST_DIR)}`);
    }

    /** @type {string[]} */
    const copied = [];
    /** @type {string[]} */
    const missing = [];

    for (const name of FILES) {
        const from = join(SRC_DIR, name);
        const to = join(DEST_DIR, name);

        if (!existsSync(from)) {
            missing.push(name);
            console.warn(`[skip] 來源缺少 ${name}`);
            continue;
        }

        console.log(`${dryRun ? '[dry-run] ' : ''}${rel(from)}  →  ${rel(to)}`);

        if (!dryRun) {
            copyFileSync(from, to);
            copied.push(name);
        }
    }

    if (missing.length > 0) {
        console.error(`[sync-data-from-v1] 有 ${missing.length} 個清單檔案在來源中不存在`);
        process.exit(1);
    }

    if (dryRun) {
        console.log('');
        console.log(`[sync-data-from-v1] dry-run 完成（將同步 ${FILES.length} 個檔案）`);
        return;
    }

    // JSON 驗證
    const jsonFiles = FILES.filter((f) => f.endsWith('.json'));
    for (const name of jsonFiles) {
        const path = join(DEST_DIR, name);
        const raw = readFileSync(path, 'utf8');
        try {
            JSON.parse(raw);
            console.log(`[ok] JSON.parse ${name}`);
        } catch (err) {
            console.error(`[fail] JSON.parse ${name}：${/** @type {Error} */ (err).message}`);
            process.exit(1);
        }
    }

    // V7-C1：於 data/README.md 文首注入 playground 註記（重跑同步不會遺失）
    applyReadmeBanner();

    console.log('');
    console.log(`[sync-data-from-v1] 完成：已同步 ${copied.length} 個檔案`);
}

/**
 * 將 playground 註記置於 data/README.md 文首。
 * 若已含標記則先剝除舊註記再重寫，避免重複堆疊。
 */
function applyReadmeBanner() {
    const readmePath = join(DEST_DIR, 'README.md');
    if (!existsSync(readmePath)) {
        console.warn('[skip] data/README.md 不存在，略過 playground 註記');
        return;
    }
    if (!existsSync(README_BANNER_PATH)) {
        console.warn(`[skip] 找不到註記範本：${rel(README_BANNER_PATH)}`);
        return;
    }

    const banner = readFileSync(README_BANNER_PATH, 'utf8').replace(/\s+$/, '') + '\n';
    let body = readFileSync(readmePath, 'utf8');

    if (body.startsWith(README_BANNER_MARKER)) {
        const end = body.indexOf('\n---\n');
        if (end !== -1) {
            body = body.slice(end + '\n---\n'.length).replace(/^\s+/, '');
        }
    }

    writeFileSync(readmePath, banner + body, 'utf8');
    console.log(`[ok] 已寫入 playground 註記 → ${rel(readmePath)}`);
}

main();
