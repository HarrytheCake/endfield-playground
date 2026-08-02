/**
 * 環境標籤資料（由 docs/aaaaa/scripts/generate-src-data.mjs 產生）
 *
 * 來源：docs/aaaaa/data/environments.json
 *
 * 請勿手改本檔資料區；改 JSON 後重新執行：
 *   pnpm generate:src-data
 */

import type { Environment } from '@/types/environment';

/** 全部環境標籤 */
export const environmentList: readonly Environment[] = [
    {
        id: 'none',
        label: '無環境（預設）',
        builtin: true,
    },
    {
        id: 'stable',
        label: '穩定環境',
    },
    {
        id: 'acidic',
        label: '酸性環境',
    },
    {
        id: 'humid',
        label: '濕潤環境',
    },
    {
        id: 'xisang',
        label: '息壤環境',
    },
];

const _envMap = new Map<string, Environment>(environmentList.map((e) => [e.id, e]));

/**
 * 依 id 查詢環境標籤。
 *
 * @param id Environment.id（如 `"none"`）
 */
export function getEnvironment(id: string): Environment | undefined {
    return _envMap.get(id);
}

/** 取得全部環境標籤副本 */
export function getAllEnvironments(): Environment[] {
    return [...environmentList];
}
