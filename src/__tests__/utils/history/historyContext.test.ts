/**
 * V17-H2／#58：history 情境邊界
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { createMemoryHistory, createRouter } from 'vue-router';
import {
    historyContextFromPath,
    shouldClearHistoryOnNavigate,
} from '@/utils/history/historyContext';
import { installClearHistoryOnContextSwitch } from '@/utils/history/clearHistoryOnContextSwitch';
import { useHistoryStore } from '@/store/historyStore';
import { HistoryRecordType, type Command } from '@/types/history';

function stubCmd(label: string): Command {
    return {
        id: label,
        type: HistoryRecordType.MachinePlacement,
        label,
        execute: () => undefined,
        undo: () => undefined,
    };
}

describe('historyContextFromPath', () => {
    it('／ → formal；／dev… → dev', () => {
        expect(historyContextFromPath('/')).toBe('formal');
        expect(historyContextFromPath('/?x=1')).toBe('formal');
        expect(historyContextFromPath('/dev')).toBe('dev');
        expect(historyContextFromPath('/dev/history-replay')).toBe('dev');
        expect(historyContextFromPath('/dev/paper-fig-main-field')).toBe('dev');
        expect(historyContextFromPath('/dev/flow-engine#h')).toBe('dev');
    });
});

describe('shouldClearHistoryOnNavigate', () => {
    it('跨正式↔dev 為 true；同區為 false', () => {
        expect(shouldClearHistoryOnNavigate('/', '/dev/history-replay')).toBe(true);
        expect(shouldClearHistoryOnNavigate('/dev/a', '/')).toBe(true);
        expect(shouldClearHistoryOnNavigate('/dev/a', '/dev/b')).toBe(false);
        expect(shouldClearHistoryOnNavigate('/', '/')).toBe(false);
    });
});

describe('installClearHistoryOnContextSwitch', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('跨界導航後 undoDepth＝0；同區導航保留', async () => {
        const router = createRouter({
            history: createMemoryHistory(),
            routes: [
                { path: '/', component: { template: '<div/>' } },
                { path: '/dev/a', component: { template: '<div/>' } },
                { path: '/dev/b', component: { template: '<div/>' } },
            ],
        });
        installClearHistoryOnContextSwitch(router);

        await router.push('/');
        const history = useHistoryStore();
        history.execute(stubCmd('formal-op'));
        expect(history.undoDepth).toBe(1);

        await router.push('/dev/a');
        expect(history.undoDepth).toBe(0);

        history.execute(stubCmd('dev-op'));
        expect(history.undoDepth).toBe(1);

        await router.push('/dev/b');
        expect(history.undoDepth).toBe(1);

        await router.push('/');
        expect(history.undoDepth).toBe(0);
    });
});
