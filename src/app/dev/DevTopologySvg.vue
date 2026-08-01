<script setup lang="ts">
/**
 * V8-D1：Dev 拓樸 SVG — 節點顯示 machineMode 埠方位／media，邊可對齊 handle。
 */
import { computed } from 'vue';
import type { FactoryNode, FactoryEdge } from '@/types/graph';
import {
    resolveNodeMode,
    listModePortMarkers,
    portPositionOnRect,
    edgeEndpoint,
    portMediaColor,
    modePortSummaryLabel,
} from '@/app/dev/topologyPortUtils';

const props = withDefaults(
    defineProps<{
        nodes: FactoryNode[];
        edges: FactoryEdge[];
        /** 節點填色／非法等視覺覆寫 */
        nodeStyle?: Record<
            string,
            { fill?: string; invalid?: boolean; subtitleExtra?: string }
        >;
        /** 邊流量標籤／堵塞 */
        edgeStyle?: Record<string, { label?: string; congested?: boolean }>;
        selectedNodeId?: string | null;
        nodeWidth?: number;
        nodeHeight?: number;
        pad?: number;
    }>(),
    {
        nodeStyle: () => ({}),
        edgeStyle: () => ({}),
        selectedNodeId: null,
        nodeWidth: 132,
        nodeHeight: 64,
        pad: 48,
    },
);

const emit = defineEmits<{
    selectNode: [nodeId: string];
}>();

const NODE_W = computed(() => props.nodeWidth);
const NODE_H = computed(() => props.nodeHeight);

const viewBox = computed(() => {
    if (!props.nodes.length) return '0 0 640 240';
    const xs = props.nodes.map((n) => n.position.x);
    const ys = props.nodes.map((n) => n.position.y);
    const minX = Math.min(...xs) - props.pad;
    const minY = Math.min(...ys) - props.pad;
    const maxX = Math.max(...xs) + NODE_W.value + props.pad;
    const maxY = Math.max(...ys) + NODE_H.value + props.pad;
    return `${minX} ${minY} ${Math.max(maxX - minX, 320)} ${Math.max(maxY - minY, 200)}`;
});

interface DrawnNode {
    id: string;
    x: number;
    y: number;
    title: string;
    modeLabel: string;
    subtitle: string;
    fill: string;
    invalid: boolean;
    selected: boolean;
    ports: {
        key: string;
        x: number;
        y: number;
        color: string;
        label: string;
    }[];
    noPortData: boolean;
}

const drawnNodes = computed((): DrawnNode[] => {
    const w = NODE_W.value;
    const h = NODE_H.value;
    return props.nodes.map((n) => {
        const style = props.nodeStyle[n.id] ?? {};
        const machineType = n.data?.machineType as string | undefined;
        const machineMode = n.data?.machineMode as string | undefined;
        const mode = resolveNodeMode(machineType, machineMode);
        const markers = listModePortMarkers(mode);
        const ports = mode
            ? markers.map((m) => {
                  const local = portPositionOnRect(m, mode, w, h);
                  return {
                      key: m.key,
                      x: n.position.x + local.x,
                      y: n.position.y + local.y,
                      color: portMediaColor(m.media),
                      label: `${m.label}:${m.media[0]}`,
                  };
              })
            : [];

        return {
            id: n.id,
            x: n.position.x,
            y: n.position.y,
            title: (n.data?.label as string) || n.id,
            modeLabel: modePortSummaryLabel(mode),
            subtitle: style.subtitleExtra ?? n.id,
            fill: style.fill ?? '#52525b',
            invalid: style.invalid ?? false,
            selected: props.selectedNodeId === n.id,
            ports,
            noPortData: !mode,
        };
    });
});

const drawnEdges = computed(() => {
    const byId = new Map(props.nodes.map((n) => [n.id, n]));
    const w = NODE_W.value;
    const h = NODE_H.value;
    return props.edges.map((e) => {
        const s = byId.get(e.source);
        const t = byId.get(e.target);
        const sMode = resolveNodeMode(
            s?.data?.machineType as string | undefined,
            s?.data?.machineMode as string | undefined,
        );
        const tMode = resolveNodeMode(
            t?.data?.machineType as string | undefined,
            t?.data?.machineMode as string | undefined,
        );
        const p1 = edgeEndpoint(
            s?.position.x ?? 0,
            s?.position.y ?? 0,
            w,
            h,
            sMode,
            'out',
            e.sourceHandle,
        );
        const p2 = edgeEndpoint(
            t?.position.x ?? 0,
            t?.position.y ?? 0,
            w,
            h,
            tMode,
            'in',
            e.targetHandle,
        );
        const es = props.edgeStyle[e.id] ?? {};
        return {
            id: e.id,
            x1: p1.x,
            y1: p1.y,
            x2: p2.x,
            y2: p2.y,
            labelX: (p1.x + p2.x) / 2,
            labelY: (p1.y + p2.y) / 2 - 8,
            label: es.label ?? e.id,
            congested: es.congested ?? false,
        };
    });
});

function onNodeClick(id: string) {
    emit('selectNode', id);
}
</script>

<template>
    <div class="space-y-2">
        <div class="flex flex-wrap gap-3 text-[10px] text-gray-500">
            <span class="inline-flex items-center gap-1">
                <span class="inline-block h-2.5 w-2.5 rounded-sm" style="background: #f59e0b" />
                belt 埠
            </span>
            <span class="inline-flex items-center gap-1">
                <span class="inline-block h-2.5 w-2.5 rounded-sm" style="background: #0ea5e9" />
                pipe 埠
            </span>
            <span>點節點可選取並切 machineMode</span>
        </div>
        <div
            class="overflow-x-auto rounded-md border border-dashed border-gray-300 bg-zinc-50 dark:border-gray-600 dark:bg-zinc-900/40"
        >
            <svg :viewBox="viewBox" class="min-h-[240px] w-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <marker
                        id="topo-arrow"
                        viewBox="0 0 10 10"
                        refX="8"
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto-start-reverse"
                    >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#71717a" />
                    </marker>
                    <marker
                        id="topo-arrow-c"
                        viewBox="0 0 10 10"
                        refX="8"
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto-start-reverse"
                    >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#f97316" />
                    </marker>
                </defs>
                <g v-for="edge in drawnEdges" :key="edge.id">
                    <line
                        :x1="edge.x1"
                        :y1="edge.y1"
                        :x2="edge.x2"
                        :y2="edge.y2"
                        :stroke="edge.congested ? '#f97316' : '#71717a'"
                        :stroke-width="edge.congested ? 3 : 2"
                        :marker-end="edge.congested ? 'url(#topo-arrow-c)' : 'url(#topo-arrow)'"
                    />
                    <text
                        :x="edge.labelX"
                        :y="edge.labelY"
                        text-anchor="middle"
                        class="fill-zinc-700 text-[10px] dark:fill-zinc-200"
                    >
                        {{ edge.label }}
                    </text>
                </g>
                <g
                    v-for="node in drawnNodes"
                    :key="node.id"
                    class="cursor-pointer"
                    @click="onNodeClick(node.id)"
                >
                    <rect
                        :x="node.x"
                        :y="node.y"
                        :width="NODE_W"
                        :height="NODE_H"
                        rx="6"
                        :fill="node.fill"
                        :stroke="node.selected ? '#2563eb' : node.invalid ? '#a1a1aa' : '#3f3f46'"
                        :stroke-dasharray="node.invalid ? '4 3' : undefined"
                        :stroke-width="node.selected ? 3 : 2"
                    />
                    <text
                        :x="node.x + NODE_W / 2"
                        :y="node.y + 16"
                        text-anchor="middle"
                        class="fill-white text-[11px] font-semibold"
                    >
                        {{ node.title }}
                    </text>
                    <text
                        :x="node.x + NODE_W / 2"
                        :y="node.y + 32"
                        text-anchor="middle"
                        class="fill-white/90 text-[9px]"
                    >
                        {{ node.modeLabel }}
                    </text>
                    <text
                        :x="node.x + NODE_W / 2"
                        :y="node.y + 46"
                        text-anchor="middle"
                        class="fill-white/80 text-[9px]"
                    >
                        {{ node.subtitle }}
                    </text>
                    <text
                        v-if="node.noPortData"
                        :x="node.x + NODE_W / 2"
                        :y="node.y + NODE_H + 12"
                        text-anchor="middle"
                        class="fill-zinc-500 text-[8px]"
                    >
                        無埠資料
                    </text>
                    <g v-for="p in node.ports" :key="p.key">
                        <rect
                            :x="p.x - 5"
                            :y="p.y - 5"
                            width="10"
                            height="10"
                            rx="1.5"
                            :fill="p.color"
                            stroke="#fff"
                            stroke-width="1"
                        />
                    </g>
                </g>
            </svg>
        </div>
    </div>
</template>
