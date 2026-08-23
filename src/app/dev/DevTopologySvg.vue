<script setup lang="ts">
/**
 * V9-C2：Dev 拓樸 SVG — 依機器 width×height 格點畫埠（side／offset）。
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
    listGridLines,
    resolveMachineCells,
    resolveDisplayGrid,
    nodeRotation,
} from '@/app/dev/topologyPortUtils';

const props = withDefaults(
    defineProps<{
        nodes: FactoryNode[];
        edges: FactoryEdge[];
        /** 節點填色／非法等視覺覆寫 */
        nodeStyle?: Record<string, { fill?: string; invalid?: boolean; subtitleExtra?: string }>;
        /** 邊流量標籤／堵塞 */
        edgeStyle?: Record<string, { label?: string; congested?: boolean }>;
        selectedNodeId?: string | null;
        /** 每一格像素；節點矩形＝格數×cellSize */
        cellSize?: number;
        /** @deprecated 改依機器 WxH×cellSize；保留僅相容舊呼叫 */
        nodeWidth?: number;
        /** @deprecated 改依機器 WxH×cellSize */
        nodeHeight?: number;
        pad?: number;
    }>(),
    {
        nodeStyle: () => ({}),
        edgeStyle: () => ({}),
        selectedNodeId: null,
        cellSize: 22,
        pad: 48,
    },
);

const emit = defineEmits<{
    selectNode: [nodeId: string];
}>();

interface NodeGeom {
    id: string;
    x: number;
    y: number;
    rectW: number;
    rectH: number;
    widthCells: number;
    heightCells: number;
    machineWidth: number;
    machineHeight: number;
    rotation: 0 | 1 | 2 | 3;
}

function nodeGeom(n: FactoryNode): NodeGeom {
    const cells = resolveMachineCells(n.data?.machineType as string | undefined);
    const rotation = nodeRotation(n.data);
    const display = resolveDisplayGrid(cells.width, cells.height, rotation);
    const rectW = display.widthCells * props.cellSize;
    const rectH = display.heightCells * props.cellSize;
    return {
        id: n.id,
        x: n.position.x,
        y: n.position.y,
        rectW,
        rectH,
        widthCells: display.widthCells,
        heightCells: display.heightCells,
        machineWidth: cells.width,
        machineHeight: cells.height,
        rotation,
    };
}

const geoms = computed(() => {
    const map = new Map<string, NodeGeom>();
    for (const n of props.nodes) map.set(n.id, nodeGeom(n));
    return map;
});

const viewBox = computed(() => {
    if (!props.nodes.length) return '0 0 640 240';
    const gs = [...geoms.value.values()];
    const minX = Math.min(...gs.map((g) => g.x)) - props.pad;
    const minY = Math.min(...gs.map((g) => g.y)) - props.pad;
    const maxX = Math.max(...gs.map((g) => g.x + g.rectW)) + props.pad;
    const maxY = Math.max(...gs.map((g) => g.y + g.rectH)) + props.pad;
    return `${minX} ${minY} ${Math.max(maxX - minX, 320)} ${Math.max(maxY - minY, 200)}`;
});

interface DrawnNode {
    id: string;
    x: number;
    y: number;
    rectW: number;
    rectH: number;
    widthCells: number;
    heightCells: number;
    title: string;
    modeLabel: string;
    subtitle: string;
    sizeLabel: string;
    fill: string;
    invalid: boolean;
    selected: boolean;
    gridLines: { key: string; x1: number; y1: number; x2: number; y2: number }[];
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
    return props.nodes.map((n) => {
        const g = geoms.value.get(n.id)!;
        const style = props.nodeStyle[n.id] ?? {};
        const machineType = n.data?.machineType as string | undefined;
        const machineMode = n.data?.machineMode as string | undefined;
        const mode = resolveNodeMode(machineType, machineMode);
        const markers = listModePortMarkers(mode);
        const ports = markers.map((m) => {
            const local = portPositionOnRect(
                m,
                g.machineWidth,
                g.machineHeight,
                g.rectW,
                g.rectH,
                g.rotation,
            );
            return {
                key: m.key,
                x: g.x + local.x,
                y: g.y + local.y,
                color: portMediaColor(m.media),
                label: `${m.label}:${m.media[0]}`,
            };
        });
        const gridLines = listGridLines(g.widthCells, g.heightCells, g.rectW, g.rectH).map(
            (line) => ({
                ...line,
                x1: g.x + line.x1,
                y1: g.y + line.y1,
                x2: g.x + line.x2,
                y2: g.y + line.y2,
            }),
        );

        return {
            id: n.id,
            x: g.x,
            y: g.y,
            rectW: g.rectW,
            rectH: g.rectH,
            widthCells: g.widthCells,
            heightCells: g.heightCells,
            title: (n.data?.label as string) || n.id,
            modeLabel: modePortSummaryLabel(mode),
            subtitle: style.subtitleExtra ?? n.id,
            sizeLabel: `${g.widthCells}×${g.heightCells}`,
            fill: style.fill ?? '#52525b',
            invalid: style.invalid ?? false,
            selected: props.selectedNodeId === n.id,
            gridLines,
            ports,
            noPortData: !mode,
        };
    });
});

const drawnEdges = computed(() => {
    const byId = new Map(props.nodes.map((n) => [n.id, n]));
    return props.edges.map((e) => {
        const s = byId.get(e.source);
        const t = byId.get(e.target);
        const sg = s ? geoms.value.get(s.id) : undefined;
        const tg = t ? geoms.value.get(t.id) : undefined;
        const sMode = resolveNodeMode(
            s?.data?.machineType as string | undefined,
            s?.data?.machineMode as string | undefined,
        );
        const tMode = resolveNodeMode(
            t?.data?.machineType as string | undefined,
            t?.data?.machineMode as string | undefined,
        );
        const p1 = edgeEndpoint(
            sg?.x ?? 0,
            sg?.y ?? 0,
            sg?.machineWidth ?? 2,
            sg?.machineHeight ?? 2,
            sg?.rectW ?? props.cellSize * 2,
            sg?.rectH ?? props.cellSize * 2,
            sMode,
            'out',
            e.sourceHandle,
            sg?.rotation ?? 0,
        );
        const p2 = edgeEndpoint(
            tg?.x ?? 0,
            tg?.y ?? 0,
            tg?.machineWidth ?? 2,
            tg?.machineHeight ?? 2,
            tg?.rectW ?? props.cellSize * 2,
            tg?.rectH ?? props.cellSize * 2,
            tMode,
            'in',
            e.targetHandle,
            tg?.rotation ?? 0,
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
            <span>節點＝機器 width×height 格點；埠依 side／offset</span>
            <span>點節點可選取並切 machineMode</span>
        </div>
        <div
            class="overflow-x-auto rounded-md border border-dashed border-gray-300 bg-zinc-50 dark:border-gray-600 dark:bg-zinc-900/40"
        >
            <svg :viewBox="viewBox" class="min-h-60 w-full" xmlns="http://www.w3.org/2000/svg">
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
                        :width="node.rectW"
                        :height="node.rectH"
                        rx="3"
                        :fill="node.fill"
                        :stroke="node.selected ? '#2563eb' : node.invalid ? '#a1a1aa' : '#3f3f46'"
                        :stroke-dasharray="node.invalid ? '4 3' : undefined"
                        :stroke-width="node.selected ? 3 : 2"
                    />
                    <line
                        v-for="line in node.gridLines"
                        :key="line.key"
                        :x1="line.x1"
                        :y1="line.y1"
                        :x2="line.x2"
                        :y2="line.y2"
                        stroke="rgba(255,255,255,0.18)"
                        stroke-width="1"
                    />
                    <text
                        :x="node.x + node.rectW / 2"
                        :y="node.y + Math.min(14, node.rectH * 0.28)"
                        text-anchor="middle"
                        class="fill-white text-[10px] font-semibold"
                    >
                        {{ node.title }}
                    </text>
                    <text
                        :x="node.x + node.rectW / 2"
                        :y="node.y + Math.min(28, node.rectH * 0.5)"
                        text-anchor="middle"
                        class="fill-white/90 text-[8px]"
                    >
                        {{ node.sizeLabel }} · {{ node.modeLabel }}
                    </text>
                    <text
                        v-if="node.rectH >= 48"
                        :x="node.x + node.rectW / 2"
                        :y="node.y + Math.min(42, node.rectH * 0.72)"
                        text-anchor="middle"
                        class="fill-white/75 text-[8px]"
                    >
                        {{ node.subtitle }}
                    </text>
                    <text
                        v-if="node.noPortData"
                        :x="node.x + node.rectW / 2"
                        :y="node.y + node.rectH + 12"
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
