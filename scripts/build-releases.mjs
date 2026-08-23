/**
 * 一次產出兩份單檔（vite-plugin-singlefile）build：
 *
 *   dist/         —— 正式版，/dev/paper-fig-main-field 維持 DEV-only 守衛擋下
 *   dist-mockup/  —— 額外放行 /dev/paper-fig-main-field 的分享版，供設計參考頁單檔分享用
 *
 * 兩者共用同一份型別檢查（vue-tsc -b 只跑一次），差異只在 vite build 時的
 * VITE_INCLUDE_DEV_MOCKUP 環境變數（見 src/router/index.ts 的路由守衛）。
 *
 * 用法：
 *   node scripts/build-releases.mjs
 *   pnpm build:releases
 */
import { spawnSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';

/**
 * Windows 上 shell:true + args 陣列會觸發 Node 的 shell-escaping 警告（DEP0190），
 * 故該平台改成單一指令字串交給 shell 解析；args 皆為腳本內固定字面值，無外部輸入，安全。
 * @param {string} command @param {string[]} args @param {NodeJS.ProcessEnv} [extraEnv]
 */
function run(command, args, extraEnv = {}) {
    const isWindows = process.platform === 'win32';
    const result = spawnSync(isWindows ? [command, ...args].join(' ') : command, isWindows ? [] : args, {
        stdio: 'inherit',
        shell: isWindows,
        env: { ...process.env, ...extraEnv },
    });
    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

run('pnpm', ['exec', 'vue-tsc', '-b']);

for (const dir of ['dist', 'dist-mockup']) {
    if (existsSync(dir)) {
        rmSync(dir, { recursive: true, force: true });
    }
}

run('pnpm', ['exec', 'vite', 'build', '--outDir', 'dist']);
run('pnpm', ['exec', 'vite', 'build', '--outDir', 'dist-mockup'], {
    VITE_INCLUDE_DEV_MOCKUP: 'true',
});
