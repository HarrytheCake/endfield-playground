<script setup lang="ts">
/**
 * V14 週會演示頁：把 canPlaceDevice／canConnect 的回傳畫成綠／紅卡
 *
 * 不接 layoutStore 寫入、不接畫布落子——只示範「預檢長怎樣、L2 該怎麼讀」。
 */

import { computed, ref } from 'vue';
import type { Machine } from '@/types/machine';
import type { PlacedDevice, Pipeline } from '@/types/layout';
import { getMachineMode } from '@/types/machine';
import { resolveDisplayGrid, rotatePort } from '@/utils/portUtils';
import { resolvePortAnchorCell } from '@/utils/layout/portAnchors';
import {
    DRAFT_ID,
    canMoveDevice,
    canPlaceDevice,
    type DeviceDraft,
} from '@/utils/layout/placementCheck';
import {
    canConnect,
    describeConnectFailure,
    type ConnectResult,
} from '@/utils/layout/connectRules';

/** 1×1 belt stub（與單元測試同形） */
function stubBelt(): Machine {
    return {
        id: 'stub_belt',
        name: '演示帶機',
        width: 1,
        height: 1,
        power: 0,
        tags: [],
        is_source: false,
        is_sink: false,
        modes: [
            {
                id: 'default',
                label: '預設',
                input_ports: [{ side: 'left', offset: 0, media: 'belt' }],
                output_ports: [{ side: 'right', offset: 0, media: 'belt' }],
                loss: null,
            },
        ],
        onTick: null,
        onInput: null,
        onOutput: null,
        calcEfficiency: null,
    };
}

const belt = stubBelt();
const getMachine = (id: string): Machine | undefined => (id === belt.id ? belt : undefined);

function deviceAt(id: string, x: number, y: number): PlacedDevice {
    return {
        id,
        machineType: 'stub_belt',
        position: { x, y, z: 0 },
        rotation: 0,
        label: id,
    };
}

function portAnchor(
    device: PlacedDevice,
    portType: 'input' | 'output',
): { x: number; y: number; z: number } {
    const mode = getMachineMode(belt, device.machineMode);
    const ports = portType === 'input' ? mode.input_ports : mode.output_ports;
    const port = ports[0];
    const rotated = rotatePort(port.side, port.offset, belt.width, belt.height, device.rotation);
    const display = resolveDisplayGrid(belt.width, belt.height, device.rotation);
    const cell = resolvePortAnchorCell(
        device.position.x,
        device.position.y,
        display.widthCells,
        display.heightCells,
        rotated.side,
        rotated.offset,
    );
    return { x: cell.x, y: cell.y, z: 0 };
}

interface PlaceCase {
    id: string;
    title: string;
    hint: string;
    run: () => ReturnType<typeof canPlaceDevice> | ReturnType<typeof canMoveDevice>;
}

interface ConnectCase {
    id: string;
    title: string;
    hint: string;
    run: () => ConnectResult;
}

const placeCases: PlaceCase[] = [
    {
        id: 'empty',
        title: '空地可放',
        hint: '無既有設備 → ok:true',
        run: () =>
            canPlaceDevice(
                { machineType: 'splitter', position: { x: 0, y: 0, z: 0 }, rotation: 0 },
                { devices: [], pipelines: [] },
            ),
    },
    {
        id: 'overlap',
        title: '重疊拒絕',
        hint: `conflicts 含 ${DRAFT_ID}`,
        run: () => {
            const draft: DeviceDraft = {
                machineType: 'splitter',
                position: { x: 0, y: 0, z: 0 },
                rotation: 0,
            };
            return canPlaceDevice(draft, {
                devices: [
                    {
                        id: 'a',
                        machineType: 'splitter',
                        position: { x: 0, y: 0, z: 0 },
                        rotation: 0,
                    },
                ],
                pipelines: [],
            });
        },
    },
    {
        id: 'unknown',
        title: '未知機型',
        hint: 'invalidIds 含 draft 代稱',
        run: () =>
            canPlaceDevice(
                {
                    machineType: 'not_a_real_machine_zzz',
                    position: { x: 0, y: 0, z: 0 },
                    rotation: 0,
                },
                { devices: [], pipelines: [] },
            ),
    },
    {
        id: 'move-home',
        title: '移動到原位',
        hint: 'canMoveDevice 原位 → ok:true',
        run: () => {
            const d = {
                id: 'a',
                machineType: 'splitter',
                position: { x: 2, y: 3, z: 0 },
                rotation: 0 as const,
            };
            return canMoveDevice('a', { x: 2, y: 3, z: 0 }, { devices: [d], pipelines: [] });
        },
    },
];

const connectCases: ConnectCase[] = [
    {
        id: 'ok-belt',
        title: '合法 belt 連線',
        hint: 'output → input、媒質一致',
        run: () => {
            const src = deviceAt('src', 0, 0);
            const dst = deviceAt('dst', 4, 0);
            const start = portAnchor(src, 'output');
            const end = portAnchor(dst, 'input');
            return canConnect(
                { media: 'belt', waypoints: [start, { x: 2, y: 0, z: 0 }, end] },
                { devices: [src, dst], pipelines: [] },
                getMachine,
            );
        },
    },
    {
        id: 'rule7',
        title: '規則 7：斷線放行',
        hint: '兩端未命中埠 → 仍 ok:true',
        run: () =>
            canConnect(
                {
                    media: 'belt',
                    waypoints: [
                        { x: 99, y: 99, z: 0 },
                        { x: 100, y: 99, z: 0 },
                    ],
                },
                { devices: [], pipelines: [] },
                getMachine,
            ),
    },
    {
        id: 'media',
        title: '媒質不符',
        hint: 'pipe 管線接到 belt 埠',
        run: () => {
            const src = deviceAt('src', 0, 0);
            const dst = deviceAt('dst', 4, 0);
            const start = portAnchor(src, 'output');
            const end = portAnchor(dst, 'input');
            return canConnect(
                { media: 'pipe', waypoints: [start, { x: 2, y: 0, z: 0 }, end] },
                { devices: [src, dst], pipelines: [] },
                getMachine,
            );
        },
    },
    {
        id: 'occupied',
        title: '埠已被佔用',
        hint: '既有管線佔住目標 input',
        run: () => {
            const src = deviceAt('src', 0, 0);
            const dst = deviceAt('dst', 4, 0);
            const other = deviceAt('other', 0, 3);
            const start = portAnchor(src, 'output');
            const end = portAnchor(dst, 'input');
            const otherStart = portAnchor(other, 'output');
            const existing: Pipeline = {
                id: 'taken',
                media: 'belt',
                waypoints: [otherStart, { x: end.x, y: otherStart.y, z: 0 }, end],
            };
            return canConnect(
                { media: 'belt', waypoints: [start, { x: 2, y: 0, z: 0 }, end] },
                { devices: [src, dst, other], pipelines: [existing] },
                getMachine,
            );
        },
    },
];

const tab = ref<'place' | 'connect'>('place');

const placeResults = computed(() =>
    placeCases.map((c) => {
        const result = c.run();
        return { ...c, result, ok: result.ok };
    }),
);

const connectResults = computed(() =>
    connectCases.map((c) => {
        const result = c.run();
        return {
            ...c,
            result,
            ok: result.ok,
            message: describeConnectFailure(result),
        };
    }),
);

function resultTone(ok: boolean): string {
    return ok ? 'border-emerald-400 bg-emerald-50' : 'border-rose-400 bg-rose-50';
}
</script>

<template>
    <div class="mx-auto max-w-5xl space-y-6">
        <header class="space-y-2">
            <p class="text-xs font-medium tracking-wide text-slate-500">V14／W0921｜dev only</p>
            <h1 class="text-2xl font-semibold text-slate-900">落子預檢／連線規則演示</h1>
            <p class="max-w-3xl text-sm leading-relaxed text-slate-600">
                本頁只呼叫純函式，<strong>不寫入 store、不進歷史</strong
                >。綠＝可放／可連；紅＝拒絕。 draft 在 conflicts 裡的代稱固定為
                <code class="rounded bg-slate-200 px-1">{{ DRAFT_ID }}</code
                >。 不解鎖選取／旋轉／刪除。
            </p>
            <p class="text-xs text-slate-500">
                入口：
                <code class="rounded bg-slate-200 px-1">/dev/placement-connect-check.html</code>
                （不經 router）
            </p>
        </header>

        <div class="flex gap-2">
            <button
                type="button"
                class="rounded px-3 py-1.5 text-sm"
                :class="
                    tab === 'place'
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-slate-700 ring-1 ring-slate-300'
                "
                @click="tab = 'place'"
            >
                A0 canPlaceDevice
            </button>
            <button
                type="button"
                class="rounded px-3 py-1.5 text-sm"
                :class="
                    tab === 'connect'
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-slate-700 ring-1 ring-slate-300'
                "
                @click="tab = 'connect'"
            >
                A1 canConnect
            </button>
        </div>

        <section v-if="tab === 'place'" class="grid gap-4 sm:grid-cols-2">
            <article
                v-for="item in placeResults"
                :key="item.id"
                class="rounded-lg border-2 p-4 shadow-sm"
                :class="resultTone(item.ok)"
            >
                <div class="mb-2 flex items-baseline justify-between gap-2">
                    <h2 class="font-medium">{{ item.title }}</h2>
                    <span class="text-xs font-semibold tracking-wide uppercase">
                        {{ item.ok ? 'ok' : 'fail' }}
                    </span>
                </div>
                <p class="mb-3 text-xs text-slate-600">{{ item.hint }}</p>
                <pre
                    class="overflow-x-auto rounded bg-white/80 p-2 text-xs leading-relaxed text-slate-800"
                    >{{ JSON.stringify(item.result, null, 2) }}</pre
                >
            </article>
        </section>

        <section v-else class="grid gap-4 sm:grid-cols-2">
            <article
                v-for="item in connectResults"
                :key="item.id"
                class="rounded-lg border-2 p-4 shadow-sm"
                :class="resultTone(item.ok)"
            >
                <div class="mb-2 flex items-baseline justify-between gap-2">
                    <h2 class="font-medium">{{ item.title }}</h2>
                    <span class="text-xs font-semibold tracking-wide uppercase">
                        {{ item.ok ? 'ok' : 'fail' }}
                    </span>
                </div>
                <p class="mb-1 text-xs text-slate-600">{{ item.hint }}</p>
                <p v-if="item.message" class="mb-3 text-xs font-medium text-rose-700">
                    {{ item.message }}
                </p>
                <pre
                    class="overflow-x-auto rounded bg-white/80 p-2 text-xs leading-relaxed text-slate-800"
                    >{{ JSON.stringify(item.result, null, 2) }}</pre
                >
            </article>
        </section>

        <footer class="border-t border-slate-200 pt-4 text-xs leading-relaxed text-slate-500">
            L2 接線時：落子預覽呼叫
            <code>canPlaceDevice</code>；連線 draft 呼叫 <code>canConnect</code>。兩邊都不要自算
            <code>detectOverlaps</code>／另寫錨點命中。詳細用法見
            <code>docs/aaaaa/dev/dev_v14/USAGE_l2_placement_and_connect.md</code>。
        </footer>
    </div>
</template>
