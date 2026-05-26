import type { HistoryBasicRecord, HistoryChangeEvent } from '@/types/history';

/** 歷史紀錄管理器 (靜態類別) */
export class HistoryManager {
    /** 歷史紀錄堆疊 */
    private static historyStack: HistoryBasicRecord[] = [];
    /** 當前索引 */
    private static currentIndex: number | null = null;
    /** 訂閱者列表 */
    private static subscribers: HistorySubscriber[] = [];

    /** 是否可以復原 */
    public static get canUndo(): boolean {
        return this.currentIndex !== null && this.currentIndex > 0;
    }

    /** 是否可以取消復原 */
    public static get canRedo(): boolean {
        return this.currentIndex !== null && this.currentIndex < this.historyStack.length - 1;
    }

    /** 取得當前歷史紀錄 */
    public static getCurrent(): HistoryBasicRecord | null {
        return this.historyStack[this.currentIndex ?? -1] ?? null;
    }

    /** 新增歷史紀錄 */
    public static push(record: HistoryBasicRecord) {
        const currentIndex = this.currentIndex ?? -1;
        this.historyStack.splice(currentIndex + 1);
        this.historyStack.push(record);
        this.currentIndex = this.historyStack.length - 1;
        const previous = this.historyStack[currentIndex];
        this.subscribers.forEach((callback) => {
            callback({ action: 'push', current: record, previous });
        });
    }

    /**
     * 執行復原
     * @returns 復原後的歷史紀錄
     */
    public static undo(): HistoryBasicRecord | null {
        const currentIndex = this.currentIndex ?? -1;
        if (currentIndex <= 0) return null;
        this.currentIndex = currentIndex - 1;
        const previous = this.historyStack[currentIndex - 1];
        const current = this.historyStack[currentIndex];
        this.subscribers.forEach((callback) => {
            callback({ action: 'undo', current, previous });
        });
        return current;
    }

    /**
     * 執行取消復原
     * @returns 取消復原後的歷史紀錄
     */
    public static redo(): HistoryBasicRecord | null {
        const currentIndex = this.currentIndex ?? -1;
        if (currentIndex >= this.historyStack.length - 1) return null;
        this.currentIndex = currentIndex + 1;
        const current = this.historyStack[currentIndex + 1];
        const previous = this.historyStack[currentIndex];
        this.subscribers.forEach((callback) => {
            callback({ action: 'redo', current, previous });
        });
        return current;
    }

    /** 清空歷史紀錄 */
    public static clear() {
        this.historyStack = [];
        this.currentIndex = null;
        this.subscribers.forEach((callback) => {
            callback({ action: 'clear', current: null, previous: null });
        });
    }

    /**
     * 訂閱歷史紀錄變更事件
     * @param callback 監聽函數
     * @returns 監聽函數索引
     */
    public static subscribe(callback: HistorySubscriber): number {
        const existingIndex = this.subscribers.indexOf(callback);
        if (existingIndex !== -1) return existingIndex;
        this.subscribers.push(callback);
        return this.subscribers.length - 1;
    }

    /**
     * 取消訂閱歷史紀錄變更事件
     * @param callback 監聽函數
     * @returns 是否成功取消訂閱
     */
    public static unsubscribe(callback: HistorySubscriber): boolean;
    /**
     * 取消訂閱歷史紀錄變更事件
     * @param index 監聽函數索引
     * @returns 是否成功取消訂閱
     */
    public static unsubscribe(index: number): boolean;
    public static unsubscribe(indexOrCallback: number | HistorySubscriber): boolean {
        const existingIndex =
            typeof indexOrCallback === 'number'
                ? indexOrCallback
                : this.subscribers.indexOf(indexOrCallback);
        if (existingIndex === -1) return false;
        return this.subscribers.splice(existingIndex, 1).length > 0;
    }
}

type HistorySubscriber = (event: HistoryChangeEvent) => void;
