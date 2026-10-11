<script setup lang="ts">
/**
 * V11-F1 — `/dev/layout-l1-preview` 佈局 L1 格點演示
 *
 * L1 除錯頁：fixture＋resolveConnections／toTopology／佔格展開。  \
 * **不** import editorStore／Pinia；非正式 GridCanvas。
 */
import { computed, ref } from 'vue';
import { getMachineById } from '@/data/machines';
import {
    getMockLayoutScenario,
    MOCK_LAYOUT_SCENARIOS,
    type MockLayoutScenarioId,
} from '@/data/mockLayout';
import { getDeviceOccupiedCells } from '@/utils/layout/deviceOccupancy';
import { resolveConnections } from '@/utils/layout/resolveConnections';
import { deviceSizeFromMachine, toDeviceFootprint } from '@/utils/layout/toFootprint';
import { toTopology } from '@/utils/layout/toTopology';

const CELL = 28;
const GRID_W = 12;
const GRID_H = 8;

const scenarioId = ref<MockLayoutScenarioId>('connected');

const scenario = computed(() => getMockLayoutScenario(scenarioId.value));

const connections = computed(() =>
    resolveConnections(scenario.value.devices, scenario.value.pipelines),
);

const topology = computed(() =>
    toTopology(scenario.value.devices, scenario.value.pipelines, connections.value),
);

/** 設備佔格（xy；忽略 z 疊加顯示） */
const deviceCells = computed(() => {
    const result: Array<{
        key: string;
        deviceId: string;
        label: string;
        x: number;
        y: number;
    }> = [];

    for (const device of scenario.value.devices) {
        const machine = getMachineById(device.machineType);
        if (!machine) continue;
        const size = deviceSizeFromMachine(machine);
        const cells = getDeviceOccupiedCells(toDeviceFootprint(device, size));
        const seen = new Set<string>();
        for (const cell of cells) {
            const xy = `${cell.x},${cell.y}`;
            if (seen.has(xy)) continue;
            seen.add(xy);
            result.push({
                key: `${device.id}-${xy}`,
                deviceId: device.id,
                label: device.label ?? machine.name,
                x: cell.x,
                y: cell.y,
            });
        }
    }
    return result;
});

function connectionStatus(conn: {
    from: { portType: string } | null;
    to: { portType: string } | null;
}): 'ok' | 'broken' | 'direction' {
    if (!conn.from || !conn.to) return 'broken';
    if (conn.from.portType === 'output' && conn.to.portType === 'input') return 'ok';
    return 'direction';
}

function connectionStatusLabel(status: 'ok' | 'broken' | 'direction'): string {
    if (status === 'ok') return '已連接';
    if (status === 'direction') return '方向不符';
    return '斷線';
}

function pipelinePath(waypoints: { x: number; y: number }[]): string {
    return waypoints
        .map((p, i) => {
            const cx = (p.x + 0.5) * CELL;
            const cy = (p.y + 0.5) * CELL;
            return `${i === 0 ? 'M' : 'L'}${cx} ${cy}`;
        })
        .join(' ');
}
</script>

<template>
    <div class="space-y-6">
        <header>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                佈局 L1 格點預覽（V11）
            </h2>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                fixture → <code>resolveConnections</code> → <code>toTopology</code>。不接
                Pinia／主畫布。
            </p>
        </header>

        <div class="flex flex-wrap gap-2">
            <button
                v-for="s in MOCK_LAYOUT_SCENARIOS"
                :key="s.id"
                type="button"
                class="rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
                :class="
                    scenarioId === s.id
                        ? 'border-blue-500 bg-blue-50 text-blue-800 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-100'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200'
                "
                @click="scenarioId = s.id"
            >
                {{ s.label }}
            </button>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-400">{{ scenario.description }}</p>

        <div
            class="overflow-auto rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
        >
            <svg
                :width="GRID_W * CELL"
                :height="GRID_H * CELL"
                class="block max-w-full"
                role="img"
                aria-label="佈局 L1 格點預覽"
            >
                <!-- 格線 -->
                <g stroke="#e5e7eb" stroke-width="1">
                    <line
                        v-for="x in GRID_W + 1"
                        :key="`vx-${x}`"
                        :x1="(x - 1) * CELL"
                        y1="0"
                        :x2="(x - 1) * CELL"
                        :y2="GRID_H * CELL"
                    />
                    <line
                        v-for="y in GRID_H + 1"
                        :key="`hy-${y}`"
                        x1="0"
                        :y1="(y - 1) * CELL"
                        :x2="GRID_W * CELL"
                        :y2="(y - 1) * CELL"
                    />
                </g>

                <!-- 設備佔格 -->
                <g>
                    <rect
                        v-for="cell in deviceCells"
                        :key="cell.key"
                        :x="cell.x * CELL + 1"
                        :y="cell.y * CELL + 1"
                        :width="CELL - 2"
                        :height="CELL - 2"
                        rx="3"
                        class="fill-sky-200 stroke-sky-600 dark:fill-sky-900 dark:stroke-sky-400"
                        stroke-width="1.5"
                    />
                    <text
                        v-for="device in scenario.devices"
                        :key="`lbl-${device.id}`"
                        :x="(device.position.x + 0.5) * CELL"
                        :y="(device.position.y + 0.55) * CELL"
                        text-anchor="middle"
                        class="fill-sky-950 text-[10px] font-semibold dark:fill-sky-100"
                    >
                        {{ device.label ?? device.machineType }}
                    </text>
                </g>

                <!-- 管線 -->
                <g v-for="(pipe, idx) in scenario.pipelines" :key="pipe.id">
                    <path
                        :d="pipelinePath(pipe.waypoints)"
                        fill="none"
                        stroke-width="3"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        :stroke="
                            connectionStatus(connections[idx]!) === 'ok'
                                ? '#16a34a'
                                : connectionStatus(connections[idx]!) === 'direction'
                                  ? '#e11d48'
                                  : '#ea580c'
                        "
                    />
                    <circle
                        v-for="(wp, wi) in pipe.waypoints"
                        :key="`${pipe.id}-wp-${wi}`"
                        :cx="(wp.x + 0.5) * CELL"
                        :cy="(wp.y + 0.5) * CELL"
                        r="3.5"
                        :fill="
                            connectionStatus(connections[idx]!) === 'ok'
                                ? '#16a34a'
                                : connectionStatus(connections[idx]!) === 'direction'
                                  ? '#e11d48'
                                  : '#ea580c'
                        "
                    />
                </g>
            </svg>
            <p class="mt-2 text-xs text-gray-500">
                綠＝output→input；紅＝方向不符；橙＝斷線。格＝{{ CELL }}px；畫布 {{ GRID_W }}×{{
                    GRID_H
                }}。
            </p>
        </div>

        <section
            class="space-y-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
        >
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">resolveConnections</h3>
            <ul class="space-y-2 text-sm">
                <li
                    v-for="conn in connections"
                    :key="conn.id"
                    class="rounded border px-3 py-2 font-mono text-xs"
                    :class="
                        connectionStatus(conn) === 'ok'
                            ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950'
                            : connectionStatus(conn) === 'direction'
                              ? 'border-rose-300 bg-rose-50 dark:border-rose-700 dark:bg-rose-950'
                              : 'border-orange-300 bg-orange-50 dark:border-orange-700 dark:bg-orange-950'
                    "
                >
                    <div class="font-sans text-sm font-semibold">
                        {{ conn.pipelineId }}
                        —
                        {{ connectionStatusLabel(connectionStatus(conn)) }}
                    </div>
                    <div>from: {{ conn.from ? JSON.stringify(conn.from) : 'null' }}</div>
                    <div>to: {{ conn.to ? JSON.stringify(conn.to) : 'null' }}</div>
                </li>
            </ul>
        </section>

        <section
            class="space-y-2 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
        >
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">toTopology 摘要</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
                nodes={{ topology.nodes.length }}；edges={{ topology.edges.length }}（斷線不進
                edges）
            </p>
            <pre
                class="overflow-x-auto rounded bg-gray-100 p-2 text-xs text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                >{{
                    JSON.stringify(
                        {
                            nodes: topology.nodes.map((n) => ({
                                id: n.id,
                                machineType: n.data?.machineType,
                                position: n.position,
                            })),
                            edges: topology.edges.map((e) => ({
                                id: e.id,
                                source: e.source,
                                target: e.target,
                                sourceHandle: e.sourceHandle,
                                targetHandle: e.targetHandle,
                            })),
                        },
                        null,
                        2,
                    )
                }}</pre
            >
        </section>
    </div>
</template>
