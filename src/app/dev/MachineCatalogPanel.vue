<script setup lang="ts">
/**
 * V9-C1／C2：機器目錄 — tag 分頁／WxH 格點埠示意／JSON
 */
import { computed, ref, watch } from 'vue';
import {
    getAllMachines,
    getMachineMode,
    getMachinesByTag,
    MACHINE_TAGS,
} from '@/data/machines';
import {
    listGridLines,
    listModePortMarkers,
    portMediaColor,
    portPositionOnRect,
} from '@/app/dev/topologyPortUtils';
import type { Machine, MachineCategory, MachineMode } from '@/types/machine';

type TagFilter = 'all' | MachineCategory | 'untagged';

const machines = getAllMachines();
const tagFilter = ref<TagFilter>('all');
const filter = ref('');
const selectedId = ref(machines[0]?.id ?? '');
const selectedModeId = ref(machines[0]?.modes[0]?.id ?? 'default');

const untaggedCount = computed(() => getMachinesByTag('untagged').length);

const tagTabs = computed(() => {
    const tabs: { id: TagFilter; label: string }[] = [
        { id: 'all', label: '全部' },
        ...MACHINE_TAGS.map((t) => ({ id: t as TagFilter, label: t })),
    ];
    if (untaggedCount.value > 0) {
        tabs.push({ id: 'untagged', label: '未分類' });
    }
    return tabs;
});

const taggedList = computed(() => getMachinesByTag(tagFilter.value));

const filtered = computed(() => {
    const q = filter.value.trim().toLowerCase();
    if (!q) return taggedList.value;
    return taggedList.value.filter(
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

watch([tagFilter, filtered], () => {
    if (!filtered.value.some((m) => m.id === selectedId.value)) {
        selectedId.value = filtered.value[0]?.id ?? '';
    }
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

const portMarkers = computed(() => listModePortMarkers(activeMode.value));

const layout = computed(() => {
    const mode = activeMode.value;
    const m = selected.value;
    const w = Math.max(m?.width ?? 2, 1);
    const h = Math.max(m?.height ?? 2, 1);
    const cell = 28;
    const boxW = w * cell;
    const boxH = h * cell;
    const pad = 36;
    return {
        w,
        h,
        cell,
        boxW,
        boxH,
        pad,
        viewW: boxW + pad * 2,
        viewH: boxH + pad * 2,
        mode,
        gridLines: listGridLines(w, h, boxW, boxH),
    };
});

const drawnPorts = computed(() => {
    const { boxW, boxH, pad, w, h } = layout.value;
    const m = selected.value;
    if (!m) return [];
    return portMarkers.value.map((marker) => {
        const local = portPositionOnRect(marker, m.width, m.height, boxW, boxH, 0, {
            warnOnClamp: true,
        });
        return {
            key: marker.key,
            label: marker.label,
            media: marker.media,
            x: pad + local.x,
            y: pad + local.y,
            sizeLabel: `${w}×${h}`,
        };
    });
});

function selectMachine(id: string) {
    selectedId.value = id;
}
</script>

<template>
    <div class="grid gap-4 lg:grid-cols-[240px_1fr]">
        <div
            class="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
        >
            <div class="mb-2 flex flex-wrap gap-1">
                <button
                    v-for="tab in tagTabs"
                    :key="tab.id"
                    type="button"
                    class="rounded px-2 py-1 text-[10px] font-medium"
                    :class="
                        tagFilter === tab.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                    "
                    @click="tagFilter = tab.id"
                >
                    {{ tab.label }}
                </button>
            </div>
            <p class="mb-2 text-[10px] text-gray-500 dark:text-gray-400">
                依 machine.tags 分頁（對齊 machine_tags.json）；一機多 tag 可出現多頁
            </p>
            <input
                v-model="filter"
                type="search"
                placeholder="搜尋名稱／id／tag"
                class="mb-2 w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            />
            <p class="mb-2 text-[10px] text-gray-500">
                共 {{ filtered.length }}／{{ taggedList.length }} 台
                <span v-if="tagFilter !== 'all'">（全庫 {{ machines.length }}）</span>
            </p>
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
                        <span class="block truncate text-[10px] text-gray-500">
                            {{ m.id }}
                            <span v-if="m.tags.length"> · {{ m.tags.join('／') }}</span>
                        </span>
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
                    <span>{{ selected.width }}×{{ selected.height }} 格</span>
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
                        class="mx-auto max-h-[320px] w-full max-w-lg"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <rect
                            :x="layout.pad"
                            :y="layout.pad"
                            :width="layout.boxW"
                            :height="layout.boxH"
                            rx="2"
                            class="fill-white stroke-gray-400 dark:fill-zinc-800"
                            stroke-width="1.5"
                        />
                        <line
                            v-for="line in layout.gridLines"
                            :key="line.key"
                            :x1="layout.pad + line.x1"
                            :y1="layout.pad + line.y1"
                            :x2="layout.pad + line.x2"
                            :y2="layout.pad + line.y2"
                            stroke="rgba(113,113,122,0.35)"
                            stroke-width="1"
                        />
                        <text
                            :x="layout.pad + layout.boxW / 2"
                            :y="layout.pad + layout.boxH / 2"
                            text-anchor="middle"
                            dominant-baseline="middle"
                            class="fill-gray-500"
                            font-size="11"
                        >
                            {{ activeMode.label }} · {{ selected.width }}×{{ selected.height }}
                        </text>
                        <g v-for="p in drawnPorts" :key="p.key">
                            <rect
                                :x="p.x - 7"
                                :y="p.y - 7"
                                width="14"
                                height="14"
                                rx="2"
                                :fill="portMediaColor(p.media)"
                                stroke="#fff"
                                stroke-width="1"
                            />
                            <text
                                :x="p.x"
                                :y="p.y + 18"
                                text-anchor="middle"
                                class="fill-gray-600"
                                font-size="8"
                            >
                                {{ p.label }}·{{ p.media }}
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
