/**
 * V17-H2／#58：正式頁與 dev 情境的 history 邊界。
 *
 * 跨情境導航時應 {@link useHistoryStore.clear}；同區（如 `/dev/a`→`/dev/b`）保留堆疊。
 */

/** 操作歷史所屬情境 */
export type HistoryContext = 'formal' | 'dev';

/**
 * 由路由 path 判斷歷史情境。
 *
 * - `/` → formal
 * - `/dev…`（含 `/dev/paper-fig-main-field`）→ dev
 * - 其他（含將導向 `/` 的 catch-all）→ formal
 */
export function historyContextFromPath(path: string): HistoryContext {
    const raw = path.split(/[?#]/, 1)[0] ?? '/';
    const normalized = raw.replace(/\/+$/, '') || '/';
    if (normalized === '/') return 'formal';
    if (normalized.startsWith('/dev')) return 'dev';
    return 'formal';
}

/**
 * 是否應在此次導航清空 `historyStore`。
 *
 * @param fromPath 來源 fullPath／path
 * @param toPath 目標 fullPath／path
 */
export function shouldClearHistoryOnNavigate(fromPath: string, toPath: string): boolean {
    return historyContextFromPath(fromPath) !== historyContextFromPath(toPath);
}
