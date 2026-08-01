<script setup lang="ts">
/**
 * V8-B1：機器目錄 — 列表／JSON／埠示意（placeholder）
 */
import { computed, ref, watch } from 'vue';
import { getAllMachines, getMachineMode } from '@/data/machines';
import type { Machine, MachineMode, PortDef, PortMedia, PortSide } from '@/types/machine';

const machines = getAllMachines();
const filter = ref('');
const selectedId = ref(machines[0]?.id ?? '');
const selectedModeId = ref(machines[0]?.modes[0]?.id ?? 'default');

const filtered = computed(() => {
    const q = filter.value.trim().toLowerCase();
    if (!q) return machines;
    return machines.filter(
        (m) =>
            m.name.toLowerCase().includes(q) ||
            m.id.toLowerCase().includes(q) ||
            m.tags.some((t) => t.toLowerCase().includes(q)),
    );
});

const selected = computed(() => machines.find((m) => m.id === selectedId.value) ?? null);

const activeMode = computed((): MachineMode | null => {
    if (!selected.value) return null;
    return getMachineMode(selected.value, selectedModeId.value);
});

watch(selectedId, (id) => {
    const m = machines.find((x) => x.id === id);
    selectedModeId.value = m?.modes[0]?.id ?? 'default';
});

/**
 * 可序列化的機器檢視（去掉行為函式佔位）。
 */
function machineJsonView(m: Machine, modeId: string) {
    const mode = getMachineMode(m, modeId);
    return {
        id: m.id,
        name: m.name,
        width: m.width,
        height: m.height,
        power: m.power,
        tags: m.tags,
        is_source: m.is_source,
        is_sink: m.is_sink,
        config_signed_off: m.config_signed_off,
        modes: m.modes.map((md) => ({
            id: md.id,
            label: md.label,
            input_ports: md.input_ports,
            output_ports: md.output_ports,
            loss: md.loss,
        })),
        activeMode: {
            id: mode.id,
            label: mode.label,
            input_ports: mode.input_ports,
            output_ports: mode.output_ports,
            loss: mode.loss,
        },
    };
}

const jsonText = computed(() => {
    if (!selected.value) return '';
    return JSON.stringify(machineJsonView(selected.value, selectedModeId.value), null, 2);
});

type PortMarker = {
    key: string;
    side: PortSide;
    offset: number;
    media: PortMedia;
    kind: 'in' | 'out';
    index: number;
    label: string;
};

const portMarkers = computed((): PortMarker[] => {
    const mode = activeMode.value;
    if (!mode) return [];
    const markers: PortMarker[] = [];
    mode.input_ports.forEach((p, i) => {
        markers.push({
            key: `in-${i}`,
            side: p.side,
            offset: p.offset,
            media: p.media,
            kind: 'in',
            index: i,
            label: `in-${i}`,
        });
    });
    mode.output_ports.forEach((p, i) => {
        markers.push({
            key: `out-${i}`,
            side: p.side,
            offset: p.offset,
            media: p.media,
            kind: 'out',
            index: i,
            label: `out-${i}`,
        });
    });
    return markers;
});

/** 各邊最大 offset，供佈局正規化 */
function maxOffsetOnSide(ports: readonly PortDef[], side: PortSide): number {
    const list = ports.filter((p) => p.side === side);
    if (!list.length) return 0;
    return Math.max(...list.map((p) => p.offset), 0);
}

const layout = computed(() => {
    const mode = activeMode.value;
    const m = selected.value;
    const w = Math.max(m?.width ?? 3, 2);
    const h = Math.max(m?.height ?? 3, 2);
    const cell = 28;
    const boxW = w * cell;
    const boxH = h * cell;
    const pad = 36;
    return { w, h, cell, boxW, boxH, pad, viewW: boxW + pad * 2, viewH: boxH + pad * 2, mode };
});

/**
 * 埠在預覽框上的像素位置。
 */
function portXY(marker: PortMarker): { x: number; y: number } {
    const { boxW, boxH, pad, mode, w, h } = layout.value;
    if (!mode) return { x: pad, y: pad };
    const ports =
        marker.kind === 'in' ? mode.input_ports : mode.output_ports;
    const maxOff = Math.max(maxOffsetOnSide(ports, marker.side), marker.kind === 'in' ? w : h, 1);
    const t = (marker.offset + 0.5) / (maxOff + 1);

    switch (marker.side) {
        case 'top':
            return { x: pad + t * boxW, y: pad };
        case 'bottom':
            return { x: pad + t * boxW, y: pad + boxH };
        case 'left':
            return { x: pad, y: pad + t * boxH };
        case 'right':
            return { x: pad + boxW, y: pad + t * boxH };
    }
}

function mediaColor(media: PortMedia): string {
    return media === 'pipe' ? '#0ea5e9' : '#f59e0b';
}

function selectMachine(id: string) {
    selectedId.value = id;
}
</script>

<template>
    <div class="grid gap-4 lg:grid-cols-[240px_1fr]">
        <div
            class="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
        >
            <input
                v-model="filter"
                type="search"
                placeholder="搜尋名稱／id／tag"
                class="mb-2 w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            />
            <p class="mb-2 text-[10px] text-gray-500">共 {{ filtered.length }}／{{ machines.length }} 台</p>
            <ul class="max-h-[520px] space-y-0.5 overflow-y-auto text-xs">
                <li v-for="m in filtered" :key="m.id">
                    <button
                        type="button"
                        class="w-full rounded px-2 py-1.5 text-left transition-colors"
                        :class="
                            selectedId === m.id
                                ? 'bg-blue-100 font-medium text-blue-900 dark:bg-blue-900/40 dark:text-blue-100'
                                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                        "
                        @click="selectMachine(m.id)"
                    >
                        <span class="block truncate">{{ m.name }}</span>
                        <span class="block truncate text-[10px] text-gray-500">{{ m.id }}</span>
                    </button>
                </li>
            </ul>
        </div>

        <div v-if="selected && activeMode" class="space-y-4">
            <div
                class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
            >
                <div class="mb-3 flex flex-wrap items-center gap-2">
                    <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
                        {{ selected.name }}
                    </h3>
                    <span class="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        {{ selected.id }}
                    </span>
                    <span class="text-[10px] text-gray-500">
                        {{ selected.width }}×{{ selected.height }} · power {{ selected.power }}
                    </span>
                </div>

                <div class="mb-3 flex flex-wrap gap-2">
                    <span class="self-center text-[10px] text-gray-500">machineMode</span>
                    <button
                        v-for="mode in selected.modes"
                        :key="mode.id"
                        type="button"
                        class="rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
                        :class="
                            selectedModeId === mode.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200'
                        "
                        @click="selectedModeId = mode.id"
                    >
                        {{ mode.label }}
                        <span class="opacity-70">({{ mode.id }})</span>
                    </button>
                </div>

                <div class="mb-2 flex flex-wrap gap-3 text-[10px] text-gray-500">
                    <span class="inline-flex items-center gap-1">
                        <span class="inline-block h-2.5 w-2.5 rounded-sm" style="background: #f59e0b" />
                        belt
                    </span>
                    <span class="inline-flex items-center gap-1">
                        <span class="inline-block h-2.5 w-2.5 rounded-sm" style="background: #0ea5e9" />
                        pipe
                    </span>
                    <span>入 {{ activeMode.input_ports.length }} · 出 {{ activeMode.output_ports.length }}</span>
                    <span v-if="activeMode.loss">
                        loss: {{ activeMode.loss.item }} {{ activeMode.loss.rate_per_min }}/min
                    </span>
                </div>

                <div
                    class="overflow-x-auto rounded-md border border-dashed border-gray-300 bg-zinc-50 dark:border-gray-600 dark:bg-zinc-900/40"
                >
                    <svg
                        :viewBox="`0 0 ${layout.viewW} ${layout.viewH}`"
                        class="mx-auto max-h-[280px] w-full max-w-md"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <rect
                            :x="layout.pad"
                            :y="layout.pad"
                            :width="layout.boxW"
                            :height="layout.boxH"
                            rx="4"
                            class="fill-white stroke-gray-400 dark:fill-zinc-800"
                            stroke-width="1.5"
                        />
                        <text
                            :x="layout.pad + layout.boxW / 2"
                            :y="layout.pad + layout.boxH / 2"
                            text-anchor="middle"
                            dominant-baseline="middle"
                            class="fill-gray-500"
                            font-size="11"
                        >
                            {{ activeMode.label }}
                        </text>
                        <g v-for="marker in portMarkers" :key="marker.key">
                            <rect
                                :x="portXY(marker).x - 7"
                                :y="portXY(marker).y - 7"
                                width="14"
                                height="14"
                                rx="2"
                                :fill="mediaColor(marker.media)"
                                stroke="#fff"
                                stroke-width="1"
                            />
                            <text
                                :x="portXY(marker).x"
                                :y="
                                    marker.side === 'top'
                                        ? portXY(marker).y - 12
                                        : marker.side === 'bottom'
                                          ? portXY(marker).y + 18
                                          : portXY(marker).y + 18
                                "
                                text-anchor="middle"
                                class="fill-gray-600"
                                font-size="8"
                            >
                                {{ marker.label }}·{{ marker.media }}
                            </text>
                        </g>
                    </svg>
                </div>
            </div>

            <div
                class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
            >
                <h4 class="mb-2 text-xs font-semibold text-gray-900 dark:text-white">JSON</h4>
                <pre
                    class="max-h-[360px] overflow-auto rounded bg-zinc-900 p-3 text-[11px] leading-relaxed text-zinc-100"
                >{{ jsonText }}</pre>
            </div>
        </div>
    </div>
</template>
