/**
 * T2 真實瀏覽器回歸：先啟動 pnpm dev，再執行本腳本。
 * 使用外部 Playwright 或 PLAYWRIGHT_MODULE 指定既有套件入口，不改專案依賴。
 * 僅在 Vite 開發環境透過 Vue instance 觀察 local ref、事件與 action 次數；
 * 正常操作使用 Chromium 原生 mouse，取消／多指標等邊界另行注入事件。
 */
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';

/** 可沿用本機工具快取；未指定時嘗試標準 playwright 套件 */
const playwrightModule = process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE)).href
    : 'playwright';
/** 既有瀏覽器工具，不向產品新增測試依賴 */
const { chromium } = await import(playwrightModule);
/** 本次獨立的無頭瀏覽器，結束時必定關閉 */
const browser = await chromium.launch({ headless: true });
/** 每案結果與失敗訊息，全部案例執行後統一回報 */
const results = [];
/** 未預期的頁面錯誤，不可被測試成功掩蓋 */
const pageErrors = [];

try {
    /** 正式頁桌面視窗，不以另造畫布替代正式路徑 */
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto(process.env.T2_BASE_URL ?? 'http://127.0.0.1:5173/');
    await page.waitForSelector('.area-canvas [data-device-id]');
    await page.evaluate(async () => {
        const svg = document.querySelector('.area-canvas svg');
        const instance = svg.__vueParentComponent.parent;
        const state = instance.setupState;
        const { useHistoryStore } = await import('/src/store/historyStore.ts');
        const { usePlacementIntent } = await import('/src/editor/toolbar/usePlacementIntent.ts');
        const context = {
            instance,
            state,
            history: useHistoryStore(state.layoutStore._p),
            placement: usePlacementIntent(),
            selected: [],
            moves: 0,
            pointerId: null,
        };
        window.__t2 = context;
        instance.vnode.props = {
            ...instance.vnode.props,
            onSelectDevice: (id) => context.selected.push(id),
        };
        state.layoutStore.$onAction(({ name }) => {
            if (name === 'moveDevice') context.moves++;
        });
        svg.addEventListener('pointerdown', (event) => {
            context.pointerId = event.pointerId;
        });
    });

    /**
     * 用高階快照 action 建立獨立案例，重設測試計數而非改寫 store 內部。
     * @param snapshot 可選設備／管線快照；省略時放兩台分流器與遠處管線
     */
    async function reset(snapshot) {
        await page.evaluate((fixture) => {
            const t = window.__t2;
            t.state.clearGesture();
            t.state.offset = { x: 0, y: 0 };
            t.state.zoom = 1;
            t.state.editorStore.setActiveTool('select');
            t.state.canvasStore.setBaseRegion(null);
            t.placement.disarm();
            t.state.layoutStore.loadSnapshot(
                fixture ?? {
                    devices: [
                        {
                            id: 'a',
                            machineType: 'splitter',
                            position: { x: 2, y: 2, z: 0 },
                            rotation: 0,
                        },
                        {
                            id: 'b',
                            machineType: 'splitter',
                            position: { x: 8, y: 2, z: 0 },
                            rotation: 0,
                        },
                    ],
                    pipelines: [
                        {
                            id: 'belt',
                            media: 'belt',
                            waypoints: [
                                { x: 12, y: 2, z: 0 },
                                { x: 14, y: 2, z: 0 },
                            ],
                        },
                    ],
                },
            );
            t.history.clear();
            t.selected = [];
            t.moves = 0;
        }, snapshot);
    }

    /** @returns 可序列化的真實狀態，含提交次數與事件，不只看最後畫面 */
    async function state() {
        return page.evaluate(() => {
            const t = window.__t2;
            return {
                devices: t.state.layoutStore.devices,
                pipelines: t.state.layoutStore.pipelines,
                preview: t.state.deviceDragPreview,
                offset: t.state.offset,
                history: t.history.undoDepth,
                moves: t.moves,
                selected: t.selected,
                panning: t.state.panning,
            };
        });
    }

    /** @param x 世界格 x @param y 世界格 y @returns 格中心的實際螢幕座標 */
    async function point(x, y) {
        return page.evaluate(
            ({ x, y }) => {
                const s = window.__t2.state;
                const box = document.querySelector('.area-canvas svg').getBoundingClientRect();
                return {
                    x:
                        box.left +
                        (((x + 0.5) * s.cellSize * s.zoom + s.offset.x) / s.width) * box.width,
                    y:
                        box.top +
                        (((y + 0.5) * s.cellSize * s.zoom + s.offset.y) / s.height) * box.height,
                };
            },
            { x, y },
        );
    }

    /** @param x 起始世界格 x @param y 起始世界格 y @param button 原生滑鼠按鍵 */
    async function down(x, y, button = 'left') {
        const p = await point(x, y);
        await page.mouse.move(p.x, p.y);
        await page.mouse.down({ button });
    }

    /** @param x 目標世界格 x @param y 目標世界格 y */
    async function move(x, y) {
        const p = await point(x, y);
        await page.mouse.move(p.x, p.y);
    }

    /** @param x 點擊世界格 x @param y 點擊世界格 y */
    async function click(x, y) {
        const p = await point(x, y);
        await page.mouse.click(p.x, p.y);
    }

    /**
     * 每案獨立重設；失敗仍釋放滑鼠，讓後續案例能揭露其他問題。
     * @param name 案例名稱 @param run 驗證函式
     */
    async function check(name, run) {
        try {
            await reset();
            await run();
            results.push({ name, passed: true });
        } catch (error) {
            results.push({ name, passed: false, error: error.stack });
        } finally {
            await page.mouse.up();
        }
        console.log(`${results.at(-1).passed ? 'PASS' : 'FAIL'} ${name}`);
    }

    await check(
        'local preview, visible footprint, label, unchanged store and single commit',
        async () => {
            await down(2, 2);
            await move(5, 4);
            const during = await state();
            assert.deepEqual(during.devices[0].position, { x: 2, y: 2, z: 0 });
            assert.deepEqual(during.preview, { deviceId: 'a', position: { x: 5, y: 4, z: 0 } });
            assert.equal(during.history, 0);
            assert.equal(during.moves, 0);
            const device = page.locator('[data-device-id="a"]');
            assert.equal(await device.count(), 1);
            assert.equal(await device.getAttribute('data-device-dragging'), 'true');
            assert.equal(await device.locator('rect').getAttribute('x'), '141');
            assert.equal(await device.locator('text').getAttribute('x'), '154');
            await page.mouse.up();
            const after = await state();
            assert.deepEqual(after.devices[0].position, { x: 5, y: 4, z: 0 });
            assert.equal(after.history, 1);
            assert.equal(after.moves, 1);
            assert.equal(after.preview, null);
            assert.deepEqual(after.selected, []);
            assert.deepEqual(after.pipelines, during.pipelines);
        },
    );

    await check('overlap rejection restores original without history', async () => {
        await down(2, 2);
        await move(8, 2);
        await page.mouse.up();
        const s = await state();
        assert.deepEqual(s.devices[0].position, { x: 2, y: 2, z: 0 });
        assert.equal(s.history, 0);
        assert.equal(s.moves, 1);
        assert.equal(s.preview, null);
    });

    await check('pipeline overlap follows L1 rejection', async () => {
        await down(2, 2);
        await move(13, 2);
        await page.mouse.up();
        const s = await state();
        assert.deepEqual(s.devices[0].position, { x: 2, y: 2, z: 0 });
        assert.equal(s.history, 0);
    });

    await check('device click emits instance id without history', async () => {
        await click(2, 2);
        const s = await state();
        assert.deepEqual(s.selected, ['a']);
        assert.equal(s.history, 0);
        assert.equal(s.moves, 0);
    });

    await check('background click clears selection', async () => {
        await click(10, 5);
        assert.deepEqual((await state()).selected, [null]);
    });

    await check('two native armed clicks keep continuous placement', async () => {
        await page.evaluate(() => window.__t2.placement.arm('splitter'));
        await click(10, 5);
        await click(12, 5);
        const s = await state();
        assert.equal(s.devices.length, 4);
        assert.equal(s.history, 2);
        assert.deepEqual(s.selected, [null, null]);
    });

    await check('armed device drag suppresses trailing placement click', async () => {
        await page.evaluate(() => window.__t2.placement.arm('splitter'));
        await down(2, 2);
        await move(5, 4);
        await page.mouse.up();
        const s = await state();
        assert.equal(s.devices.length, 2);
        assert.equal(s.history, 1);
        assert.equal(s.moves, 1);
        await click(12, 5);
        assert.equal((await state()).devices.length, 3);
    });

    await check('background drag pans and suppresses armed placement and selection', async () => {
        await page.evaluate(() => window.__t2.placement.arm('splitter'));
        await down(10, 5);
        await move(11, 6);
        await page.mouse.up();
        const s = await state();
        assert.deepEqual(s.offset, { x: 28, y: 28 });
        assert.equal(s.devices.length, 2);
        assert.equal(s.history, 0);
        assert.deepEqual(s.selected, []);
    });

    for (const mode of ['middle', 'pan', 'space']) {
        await check(`${mode} pans even when started over a device`, async () => {
            if (mode === 'pan')
                await page.evaluate(() => window.__t2.state.editorStore.setActiveTool('pan'));
            if (mode === 'space') await page.keyboard.down('Space');
            await down(2, 2, mode === 'middle' ? 'middle' : 'left');
            await move(3, 3);
            if (mode === 'space') await page.keyboard.up('Space');
            await page.mouse.up({ button: mode === 'middle' ? 'middle' : 'left' });
            const s = await state();
            assert.deepEqual(s.offset, { x: 28, y: 28 });
            assert.equal(s.moves, 0);
            assert.equal(s.history, 0);
            assert.deepEqual(s.selected, []);
        });
    }

    await check('drag back to original cell creates no command or selection', async () => {
        await down(2, 2);
        await move(5, 4);
        await move(2, 2);
        await page.mouse.up();
        const s = await state();
        assert.equal(s.moves, 0);
        assert.equal(s.history, 0);
        assert.deepEqual(s.selected, []);
    });

    await check('subthreshold device jitter remains a click', async () => {
        const p = await point(2, 2);
        await down(2, 2);
        await page.mouse.move(p.x + 2, p.y + 2);
        assert.equal((await state()).preview, null);
        await page.mouse.up();
        assert.deepEqual((await state()).selected, ['a']);
    });

    await check('exact 4 CSS px marks drag even inside original cell', async () => {
        const p = await point(2, 2);
        await down(2, 2);
        await page.mouse.move(p.x + 4, p.y);
        assert.notEqual((await state()).preview, null);
        await page.mouse.up();
        const s = await state();
        assert.deepEqual(s.selected, []);
        assert.equal(s.history, 0);
    });

    for (const cancellation of ['pointercancel', 'lostpointercapture']) {
        await check(
            `${cancellation} cancels without command and next native click recovers`,
            async () => {
                await page.evaluate(() => window.__t2.placement.arm('splitter'));
                await down(2, 2);
                await move(5, 4);
                await page.evaluate((kind) => {
                    const t = window.__t2;
                    const svg = document.querySelector('.area-canvas svg');
                    if (kind === 'lostpointercapture') {
                        svg.releasePointerCapture(t.pointerId);
                    } else {
                        svg.dispatchEvent(
                            new PointerEvent(kind, { bubbles: true, pointerId: t.pointerId }),
                        );
                    }
                }, cancellation);
                await move(6, 4);
                await page.mouse.up();
                const s = await state();
                assert.equal(s.preview, null);
                assert.equal(s.history, 0);
                assert.equal(s.moves, 0);
                assert.equal(s.devices.length, 2);
                assert.deepEqual(s.selected, []);
                await click(12, 5);
                assert.equal((await state()).devices.length, 3);
            },
        );
    }

    await check(
        'secondary pointer and wrong-button release cannot steal or commit gesture',
        async () => {
            await down(2, 2);
            await move(5, 4);
            const before = await state();
            await page.evaluate(() => {
                const svg = document.querySelector('.area-canvas svg');
                const pointerId = window.__t2.pointerId;
                for (const type of ['pointerdown', 'pointermove', 'pointerup']) {
                    svg.dispatchEvent(
                        new PointerEvent(type, {
                            bubbles: true,
                            pointerId: 99,
                            clientX: 800,
                            clientY: 500,
                            button: 0,
                        }),
                    );
                }
                svg.dispatchEvent(
                    new PointerEvent('pointerup', { bubbles: true, pointerId, button: 2 }),
                );
            });
            assert.deepEqual((await state()).preview, before.preview);
            assert.equal((await state()).moves, 0);
            await page.mouse.up();
            assert.equal((await state()).moves, 1);
        },
    );

    await check('right mouse button does not start gesture', async () => {
        await down(2, 2, 'right');
        await move(5, 4);
        await page.mouse.up({ button: 'right' });
        const s = await state();
        assert.equal(s.preview, null);
        assert.equal(s.history, 0);
        assert.deepEqual(s.offset, { x: 0, y: 0 });
    });

    for (const rotation of [1, 3]) {
        await check(
            `rotated multi-cell footprint preserves grab offset and z (${rotation})`,
            async () => {
                await reset({
                    devices: [
                        {
                            id: 'large',
                            machineType: 'filling_machine',
                            position: { x: 2, y: 2, z: 3 },
                            rotation,
                        },
                    ],
                    pipelines: [],
                });
                await down(5, 7);
                await move(8, 9);
                assert.deepEqual((await state()).preview.position, { x: 5, y: 4, z: 3 });
                await page.mouse.up();
                const s = await state();
                assert.deepEqual(s.devices[0].position, { x: 5, y: 4, z: 3 });
                assert.equal(s.devices[0].rotation, rotation);
            },
        );
    }

    await check('last drawn device wins overlapping xy projections', async () => {
        await reset({
            devices: [
                { id: 'low', machineType: 'splitter', position: { x: 2, y: 2, z: 0 }, rotation: 0 },
                {
                    id: 'high',
                    machineType: 'splitter',
                    position: { x: 2, y: 2, z: 3 },
                    rotation: 0,
                },
            ],
            pipelines: [],
        });
        await click(2, 2);
        assert.deepEqual((await state()).selected, ['high']);
    });

    await check('offset and zoom preserve final world coordinates', async () => {
        await page.evaluate(() => {
            window.__t2.state.offset = { x: 73, y: 41 };
            window.__t2.state.zoom = 1.5;
        });
        await down(2, 2);
        await move(5, 4);
        await page.mouse.up();
        assert.deepEqual((await state()).devices[0].position, { x: 5, y: 4, z: 0 });
    });

    await check('pointerup consumes final coordinates even without final pointermove', async () => {
        await down(2, 2);
        const target = await point(5, 4);
        await page.evaluate((p) => {
            document.querySelector('.area-canvas svg').dispatchEvent(
                new PointerEvent('pointerup', {
                    bubbles: true,
                    pointerId: window.__t2.pointerId,
                    button: 0,
                    clientX: p.x,
                    clientY: p.y,
                }),
            );
        }, target);
        assert.deepEqual((await state()).devices[0].position, { x: 5, y: 4, z: 0 });
        assert.equal((await state()).moves, 1);
    });

    await check('removing dragged device clears stale preview without exception', async () => {
        await down(2, 2);
        await move(5, 4);
        await page.evaluate(() => {
            window.__t2.state.layoutStore.removeDevice('a');
            window.__t2.history.clear();
        });
        await page.mouse.up();
        const s = await state();
        assert.equal(s.devices.length, 1);
        assert.equal(s.preview, null);
        assert.equal(s.history, 0);
    });

    await check('empty layout and unknown machine do not crash hit testing', async () => {
        await reset({ devices: [], pipelines: [] });
        await click(5, 5);
        assert.deepEqual((await state()).selected, [null]);
        await reset({
            devices: [
                {
                    id: 'unknown',
                    machineType: 'missing',
                    position: { x: 2, y: 2, z: 0 },
                    rotation: 0,
                },
            ],
            pipelines: [],
        });
        await click(2, 2);
        assert.deepEqual((await state()).selected, [null]);
        assert.equal((await state()).moves, 0);
    });

    await check(
        'preview and committed base error follow existing nonblocking boundary contract',
        async () => {
            await page.evaluate(() => window.__t2.state.canvasStore.setBaseRegion('wuling'));
            await down(2, 2);
            const box = await page.locator('.area-canvas svg').boundingBox();
            await page.mouse.move(box.x - 20, box.y + 4 * 28 + 14);
            assert.equal(await page.locator('[data-device-id="a"].out-of-base').count(), 1);
            await page.mouse.up();
            const s = await state();
            assert.deepEqual(s.devices[0].position, { x: -1, y: 4, z: 0 });
            assert.equal(s.history, 1);
            assert.equal(await page.locator('[data-device-id="a"].out-of-base').count(), 1);
        },
    );

    for (const dark of [false, true]) {
        await check(
            `${dark ? 'dark' : 'light'} held preview is light blue with unchanged border`,
            async () => {
                await page.evaluate(
                    (enabled) => document.documentElement.classList.toggle('dark', enabled),
                    dark,
                );
                const originalStroke = await page
                    .locator('[data-device-id="a"] rect')
                    .evaluate((element) => getComputedStyle(element).stroke);
                await down(2, 2);
                await move(5, 4);
                await page.locator('[data-device-id="a"][data-device-dragging="true"]').waitFor();
                const colors = await page.locator('[data-device-id="a"]').evaluate((element) => {
                    const swatch = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    swatch.style.fill = 'var(--color-sky-300)';
                    element.appendChild(swatch);
                    const expected = getComputedStyle(swatch).fill;
                    swatch.remove();
                    return {
                        fill: getComputedStyle(element.querySelector('rect')).fill,
                        expected,
                        dash: element.querySelector('rect').getAttribute('stroke-dasharray'),
                        strokeWidth: element.querySelector('rect').getAttribute('stroke-width'),
                        stroke: getComputedStyle(element.querySelector('rect')).stroke,
                        text: getComputedStyle(element.querySelector('text')).fill,
                    };
                });
                assert.equal(colors.fill, colors.expected);
                assert.notEqual(colors.fill, colors.text);
                assert.equal(colors.dash, null);
                assert.equal(colors.strokeWidth, '1.5');
                assert.equal(colors.stroke, originalStroke);
                if (process.env.T2_SCREENSHOT_DIR) {
                    await mkdir(process.env.T2_SCREENSHOT_DIR, { recursive: true });
                    await page.locator('.area-canvas').screenshot({
                        path: resolve(
                            process.env.T2_SCREENSHOT_DIR,
                            `W1011-T2_drag_${dark ? 'dark' : 'light'}.png`,
                        ),
                    });
                }
                await page.mouse.up();
            },
        );
    }

    await check('unmount during drag releases capture without committing', async () => {
        await down(2, 2);
        await move(5, 4);
        const result = await page.evaluate(async () => {
            const t = window.__t2;
            const svg = document.querySelector('.area-canvas svg');
            const pinia = t.state.layoutStore._p;
            const layout = t.state.layoutStore;
            const history = t.history;
            const pointerId = t.pointerId;
            const app = t.instance.appContext.app;
            app.unmount();
            return {
                captured: svg.hasPointerCapture(pointerId),
                preview: t.state.deviceDragPreview,
                history: history.undoDepth,
                devices: layout.devices,
                piniaAlive: !!pinia,
            };
        });
        assert.equal(result.captured, false);
        assert.equal(result.preview, null);
        assert.equal(result.history, 0);
        assert.deepEqual(result.devices[0].position, { x: 2, y: 2, z: 0 });
    });

    assert.deepEqual(pageErrors, [], 'Unexpected browser page errors');
} finally {
    await browser.close();
}

/** 讓命令的失敗狀態反映任一案例失敗，而不只印出文字 */
const failures = results.filter((result) => !result.passed);
for (const failure of failures) console.error(failure.name, failure.error);
console.log(`Browser checks: ${results.length - failures.length}/${results.length} passed`);
if (failures.length) process.exitCode = 1;
