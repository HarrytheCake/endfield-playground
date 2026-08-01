/**
 * data/environments 查詢函式單元測試
 */

import { describe, it, expect } from 'vitest';
import {
    environmentList,
    getEnvironment,
    getAllEnvironments,
} from '@/data/environments';

describe('environmentList', () => {
    it('包含內建 none', () => {
        const none = environmentList.find((e) => e.id === 'none');
        expect(none?.builtin).toBe(true);
    });
});

describe('getEnvironment()', () => {
    it('依 id 查詢', () => {
        expect(getEnvironment('stable')?.label).toBe('穩定環境');
    });

    it('不存在回傳 undefined', () => {
        expect(getEnvironment('nope')).toBeUndefined();
    });
});

describe('getAllEnvironments()', () => {
    it('回傳副本', () => {
        const copy = getAllEnvironments();
        expect(copy.length).toBe(environmentList.length);
        copy.pop();
        expect(getAllEnvironments().length).toBe(environmentList.length);
    });
});
