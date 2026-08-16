<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useEventListener, useRafFn } from '@vueuse/core';
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import { MiniMap } from '@vue-flow/minimap';
import { VueFlow, EdgeLabelRenderer, useVueFlow } from '@vue-flow/core';
import type { Connection, EdgeMouseEvent, NodeDragEvent, NodeMouseEvent } from '@vue-flow/core';
import type { DropdownMenuItem } from '@nuxt/ui';
import type { DevicePositionSnapshot, EquipmentType, Rotation } from '@/types/editor';
import type { FactoryEdge, FactoryNode } from '@/types/graph';
import type { PortMedia } from '@/types/machine';
import { useEditorStore } from '@/store/editorStore';
import { useSelectionStore } from '@/store/selectionStore';
import { useFlowStore } from '@/store/flowStore';
import { useCanvasStore } from '@/store/canvasStore';
import { getMachine, getMachineMode } from '@/data/machines';
import { onComboTriggered, useComboHeld } from '@/composables/useKeybinding';
import FlowNodeOverlay from './FlowNodeOverlay.vue';
import PipelineEdge from './PipelineEdge.vue';

/** 自訂節點型別：覆寫 default，加入效率 overlay */
const nodeTypes = { default: FlowNodeOverlay };

/** 自訂邊型別：pipeline 依 bendPoints 畫出直角折線管線（CR-02 §2.3） */
const edgeTypes = { pipeline: PipelineEdge };

/** 藍圖 store：畫布上的節點 / 邊與工具狀態的唯一資料來源 */
const editorStore = useEditorStore();
/** 選取狀態 store：框選 / 點選的節點 uid 清單 */
const selectionStore = useSelectionStore();
/** FlowEngine 計算結果 store：管線流量與堵塞狀態 */
const flowStore = useFlowStore();
/** 畫布視圖狀態 store：格線大小為畫布格線與 snap-to-grid 的唯一數值來源 */
const canvasStore = useCanvasStore();
/** 解構 editorStore 的響應式參照，供 template 與 watch 直接使用 */
const { nodes, edges, snapToGrid, activeTool, selectedEquipment, placementArmed } =
    storeToRefs(editorStore);
/** 解構 flowStore 的響應式參照，供流量標籤 overlay 讀取 */
const { edgeFlows, congestedEdges } = storeToRefs(flowStore);
/** 解構 canvasStore 的響應式參照，供 template 綁定畫布格線 */
const { gridSize } = storeToRefs(canvasStore);
/** Vue Flow 提供的座標轉換 API；vfEdges 用於流量標籤 overlay 的定位計算 */
const { screenToFlowCoordinate, edges: vfEdges, viewport, setViewport } = useVueFlow();

/** 需要顯示流量標籤的管線（rate > 0 且已計算） */
const labeledEdges = computed(() => vfEdges.value.filter((e) => edgeFlows.value.has(e.id)));

/**
 * 依管線是否堵塞，回傳流量標籤要套用的顏色 class。
 * @param edgeId 管線 id
 * @returns Tailwind class 字串
 * @example
 * const cls = edgeLabelClass('edge-1')
 */
function edgeLabelClass(edgeId: string): string {
    return congestedEdges.value.has(edgeId)
        ? 'bg-orange-400/90 text-black'
        : 'bg-zinc-700/90 text-white';
}

/** 各設備類型對應的中文顯示名稱，供節點標籤與工具列共用 */
const equipmentLabelMap: Record<EquipmentType, string> = {
    smelter: '精煉爐',
    crusher: '粉碎機',
    assembler: '組裝台',
    'conveyor-node': '輸送帶節點',
    'power-node': '電力節點',
};

/** 所有合法設備類型清單，由 equipmentLabelMap 的 key 推導，供 isEquipmentType 型別守衛使用 */
const equipmentTypes = Object.keys(equipmentLabelMap) as EquipmentType[];

/**
 * VueFlow 選取範圍變化時，同步選取的節點 id 與管線 id 到 selectionStore。
 * @param selection VueFlow 提供的選取變化事件內容
 * @example
 * handleSelectionChange({ nodes: [{ id: 'node-1' }], edges: [{ id: 'edge-1' }] })
 */
function handleSelectionChange(selection: {
    nodes?: Array<{ id: string }>;
    edges?: Array<{ id: string }>;
}) {
    selectionStore.setSelection((selection.nodes ?? []).map((node) => node.id));
    selectionStore.setEdgeSelection((selection.edges ?? []).map((edge) => edge.id));
}

/** 管線右鍵選單目前是否展開 */
const edgeContextMenuOpen = ref(false);

/** 管線右鍵選單目前的目標管線 uid；無選單展開時為 null */
const edgeContextMenuTargetId = ref<string | null>(null);

/** 管線右鍵選單的錨點螢幕座標，跟隨右鍵點擊位置更新 */
const edgeContextMenuPosition = ref({ x: 0, y: 0 });

/** 管線右鍵選單項目：目前僅提供刪除該管線 */
const edgeContextMenuItems = computed<DropdownMenuItem[]>(() => [
    {
        label: '刪除管線',
        icon: 'i-lucide-trash-2',
        onSelect: () => {
            if (!edgeContextMenuTargetId.value) return;
            editorStore.removeConnection(edgeContextMenuTargetId.value);
            edgeContextMenuTargetId.value = null;
        },
    },
]);

/**
 * 在管線上按下滑鼠右鍵時，於點擊處開啟刪除選單，並阻擋瀏覽器原生選單。
 * @param event VueFlow 提供的管線右鍵事件，含目標管線與原生滑鼠事件
 * @example
 * handleEdgeContextMenu({ edge, event: mouseEvent } as EdgeMouseEvent)
 */
function handleEdgeContextMenu({ edge, event }: EdgeMouseEvent) {
    event.preventDefault();
    const mouseEvent = event as MouseEvent;
    edgeContextMenuTargetId.value = edge.id;
    edgeContextMenuPosition.value = { x: mouseEvent.clientX, y: mouseEvent.clientY };
    edgeContextMenuOpen.value = true;
}

/** CR-01 拿起預覽中的旋轉狀態，僅存在於 placementArmed 期間，放置後隨即由 disarm 重置 */
const previewRotation = ref<Rotation>(0);

/**
 * 目前點選、可用 R 鍵旋轉的已放置設備 uid。
 *
 * 未使用 selectionStore，是因為 Vue Flow 單純點擊節點時並不會觸發 selection-change
 * （該事件僅在框選拖曳時才會發出），無法反映單點選取狀態，故改由 handleNodeClick 直接記錄。
 */
const rotateTargetUid = ref<string | null>(null);

/** 拿起狀態結束（放置或取消）時，重置預覽旋轉為 0，避免殘留到下一次拿起 */
watch(placementArmed, (armed) => {
    if (!armed) previewRotation.value = 0;
});

/**
 * 旋轉設備（可配置，預設 R 鍵）：依序循環 0° → 90° → 180° → 270° → 0°。
 * - 拿起預覽中：旋轉 previewRotation（放置時套用）
 * - 非拿起狀態且畫布上有點選中的已放置設備：呼叫 editorStore.rotateDevice 直接旋轉該設備（自動進歷史）
 */
onComboTriggered('rotateDevice', () => {
    if (placementArmed.value) {
        previewRotation.value = ((previewRotation.value + 1) % 4) as Rotation;
        return;
    }

    if (!rotateTargetUid.value) return;
    const target = nodes.value.find((n) => n.id === rotateTargetUid.value);
    if (!target) return;
    const current = (target.data?.rotation ?? 0) as Rotation;
    editorStore.rotateDevice(target.id, ((current + 1) % 4) as Rotation);
});

/**
 * Escape 鍵：拿起預覽中按下時取消本次拿起。  \
 * 固定綁在原生 Escape，**不**透過 keybindingStore 配置——與 `openSettings`（可配置，
 * 見 `useShortcuts.ts`）共用同一顆實體按鍵時，取消放置永遠優先；即使使用者把
 * `openSettings` 改綁到別的鍵，Escape 取消放置的行為依然不變。
 */
useEventListener(window, 'keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape' && placementArmed.value) {
        editorStore.disarmPlacement();
    }
});

/** 畫面平移速度（px/秒），四個方向共用；不做成可調參數，超出本次範圍 */
const PAN_SPEED_PER_SECOND = 600;

/** WASD（可配置）持續按住狀態：上／下／左／右 */
const panUpHeld = useComboHeld('panUp');
const panDownHeld = useComboHeld('panDown');
const panLeftHeld = useComboHeld('panLeft');
const panRightHeld = useComboHeld('panRight');

/** 是否有任一畫面平移方向鍵按住中，控制下方 raf loop 的啟停 */
const isPanning = computed(
    () => panUpHeld.value || panDownHeld.value || panLeftHeld.value || panRightHeld.value,
);

/**
 * WASD 按住移動畫面：每幀依按住方向與 delta time 位移 Vue Flow 的 viewport。  \
 * 平移的是 Vue Flow 自身的 viewport（`setViewport`），不是 `canvasStore.offset`——
 * 後者目前未接上實際畫布渲染。  \
 * 方向語意：上／左 = 視角往該方向移動（看到更上/左方的內容），故 viewport.x / y 增加；
 * 下／右則相反。
 */
const { pause: pausePan, resume: resumePan } = useRafFn(
    ({ delta }) => {
        const distance = (PAN_SPEED_PER_SECOND * delta) / 1000;
        let dx = 0;
        let dy = 0;
        if (panUpHeld.value) dy += distance;
        if (panDownHeld.value) dy -= distance;
        if (panLeftHeld.value) dx += distance;
        if (panRightHeld.value) dx -= distance;
        if (dx === 0 && dy === 0) return;
        setViewport({ ...viewport.value, x: viewport.value.x + dx, y: viewport.value.y + dy });
    },
    { immediate: false },
);

/** 僅在至少一個方向鍵按住時啟動 raf loop，放開後暫停，避免長期空轉 */
watch(isPanning, (panning) => {
    if (panning) resumePan();
    else pausePan();
});

/**
 * 依螢幕座標與設備類型，組出一個可加入畫布的 FactoryNode。
 * @param equipment 要放置的設備類型
 * @param clientX 螢幕座標 X
 * @param clientY 螢幕座標 Y
 * @returns 可直接加入 VueFlow 的節點資料
 * @example
 * const node = buildFactoryNode('smelter', 100, 200)
 */
function buildFactoryNode(equipment: EquipmentType, clientX: number, clientY: number): FactoryNode {
    const raw = screenToFlowCoordinate({ x: clientX, y: clientY });
    const position = snapToGrid.value
        ? {
              x: Math.round(raw.x / gridSize.value) * gridSize.value,
              y: Math.round(raw.y / gridSize.value) * gridSize.value,
          }
        : raw;

    return {
        id: `node-${equipment}-${Date.now()}-${Math.round(Math.random() * 10000)}`,
        type: 'default',
        position,
        data: {
            label: equipmentLabelMap[equipment],
            machineType: equipment,
            rotation: previewRotation.value,
        },
    };
}

/**
 * 依指定螢幕座標，將設備節點放置到畫布上。  \
 * 透過 editorStore.placeDevice() 放置，使其自動進入歷史堆疊（可 undo/redo）。
 * @param equipment 要放置的設備類型
 * @param clientX 螢幕座標 X
 * @param clientY 螢幕座標 Y
 * @example
 * placeNodeAtPointer('crusher', 100, 200)
 */
function placeNodeAtPointer(equipment: EquipmentType, clientX: number, clientY: number) {
    editorStore.placeDevice(buildFactoryNode(equipment, clientX, clientY));
}

/**
 * 型別守衛：判斷字串是否為合法的 EquipmentType，用於過濾拖拉事件帶入的資料。
 * @param value 待檢查的字串
 * @returns 是否為合法設備類型
 * @example
 * if (isEquipmentType(raw)) { placeNodeAtPointer(raw, x, y) }
 */
function isEquipmentType(value: string): value is EquipmentType {
    return equipmentTypes.includes(value as EquipmentType);
}

/**
 * 畫布點擊時，若已透過工具列武裝了放置模式，則在點擊處放置設備並解除武裝。
 * @param event 滑鼠點擊事件
 * @example
 * handlePaneClick(mouseEvent)
 */
function handlePaneClick(event: MouseEvent) {
    rotateTargetUid.value = null;

    if (!placementArmed.value || activeTool.value !== 'select') {
        return;
    }

    placeNodeAtPointer(selectedEquipment.value, event.clientX, event.clientY);
    editorStore.disarmPlacement();
}

/**
 * 記錄被點擊的節點為目前 R 鍵旋轉的目標，讓 R 鍵 watch 知道要旋轉哪個已放置設備。
 * @param event VueFlow 節點點擊事件，僅取用其中的 node
 * @example
 * handleNodeClick({ node, event: mouseEvent } as NodeMouseEvent)
 */
function handleNodeClick({ node }: NodeMouseEvent) {
    rotateTargetUid.value = node.id;
}

/**
 * 拖曳開始時各設備的位置快照；非拖曳中為 null。
 * 供 drag-stop 呼叫 commitDeviceMove，讓移動進入歷史且不重複套用位移。
 */
const dragBeforeSnapshot = ref<DevicePositionSnapshot | null>(null);

/**
 * 本次拖曳涉及的設備 uid（單選或多選）。
 */
const dragUids = ref<string[]>([]);

/**
 * 記錄拖曳開始時的位置快照。  \
 * node-drag-start 與 selection-drag-start 共用（事件形狀相同）。
 *
 * @param event Vue Flow 拖曳事件，nodes 為本次一併移動的節點
 * @example
 * handleNodeDragStart({ node, nodes: [node], event } as NodeDragEvent)
 */
function handleNodeDragStart({ nodes: dragged }: NodeDragEvent) {
    if (dragged.length === 0) {
        dragBeforeSnapshot.value = null;
        dragUids.value = [];
        return;
    }
    dragUids.value = dragged.map((n) => n.id);
    dragBeforeSnapshot.value = Object.fromEntries(
        dragged.map((n) => [n.id, { x: n.position.x, y: n.position.y }]),
    );
}

/**
 * 拖曳結束後確認位置並寫入歷史。  \
 * 零位移由 L1 commitDeviceMove 略過，不進歷史。
 *
 * @example
 * handleNodeDragStop()
 */
function handleNodeDragStop() {
    const before = dragBeforeSnapshot.value;
    const uids = dragUids.value;
    dragBeforeSnapshot.value = null;
    dragUids.value = [];
    if (!before || uids.length === 0) return;
    editorStore.commitDeviceMove(uids, before);
}

/**
 * 處理從工具列拖拉設備到畫布放開的事件，於放開處放置對應設備。
 * @param event 拖放事件
 * @example
 * handleCanvasDrop(dragEvent)
 */
function handleCanvasDrop(event: DragEvent) {
    const droppedEquipment = event.dataTransfer?.getData('application/x-endfield-equipment') ?? '';
    if (!isEquipmentType(droppedEquipment)) {
        return;
    }

    event.preventDefault();
    placeNodeAtPointer(droppedEquipment, event.clientX, event.clientY);
    editorStore.disarmPlacement();
}

/**
 * 自 handle id（`out-0` / `in-1`）解析埠索引；解析不出來時回退埠 0。  \
 * id 格式與 FlowNodeOverlay.vue 動態產生的 Handle 一致。
 * @param handle Vue Flow 傳入的 handle id
 * @example
 * parsePortIndex('out-1') // → 1
 */
function parsePortIndex(handle: string | null | undefined): number {
    if (!handle) return 0;
    const matched = handle.match(/-(\d+)$/);
    return matched ? Number(matched[1]) : 0;
}

/**
 * 依來源節點的機型與出發 handle，查出該埠的傳輸媒質（belt／pipe）。  \
 * 查不到機型 / 型態 / 埠定義時 fallback 為 belt，避免擋下連線操作。
 * @param sourceNode 連線起點節點
 * @param sourceHandle 連線起點 handle id
 * @example
 * resolveConnectionPortType(sourceNode, 'out-0') // → 'belt'
 */
function resolveConnectionPortType(
    sourceNode: FactoryNode,
    sourceHandle: string | null | undefined,
): PortMedia {
    const machine = sourceNode.data?.machineType
        ? getMachine(sourceNode.data.machineType)
        : undefined;
    if (!machine) return 'belt';
    const mode = getMachineMode(machine, sourceNode.data?.machineMode);
    const idx = parsePortIndex(sourceHandle);
    return mode.output_ports[idx]?.media ?? 'belt';
}

/**
 * 使用者拖曳出一條新連線放開時，組出 FactoryEdge 並透過 editorStore.addConnection() 建立管線。  \
 * 全程走 L1 高階 action，會自動進歷史（可 undo/redo）。
 * @param connection Vue Flow 提供的連線結果（起點 / 終點節點與 handle id）
 * @example
 * handleConnect({ source: 'a', target: 'b', sourceHandle: 'out-0', targetHandle: 'in-0' })
 */
function handleConnect(connection: Connection) {
    const sourceNode = nodes.value.find((n) => n.id === connection.source);
    if (!sourceNode) return;

    const edge: FactoryEdge = {
        id: `edge-${crypto.randomUUID()}`,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        type: 'pipeline',
        data: { portType: resolveConnectionPortType(sourceNode, connection.sourceHandle) },
    };
    editorStore.addConnection(edge);
}
</script>

<template>
    <div class="panel h-full overflow-hidden" @dragover.prevent @drop="handleCanvasDrop">
        <VueFlow
            v-model:nodes="nodes"
            v-model:edges="edges"
            :node-types="nodeTypes"
            :edge-types="edgeTypes"
            :fit-view-on-init="true"
            :nodes-draggable="true"
            :zoom-on-scroll="true"
            :pan-on-drag="activeTool === 'pan'"
            :selection-on-drag="activeTool === 'box-select'"
            :snap-to-grid="snapToGrid"
            :snap-grid="[gridSize, gridSize]"
            class="factory-flow"
            @selection-change="handleSelectionChange"
            @connect="handleConnect"
            @edge-context-menu="handleEdgeContextMenu"
            @node-click="handleNodeClick"
            @pane-click="handlePaneClick"
            @node-drag-start="handleNodeDragStart"
            @node-drag-stop="handleNodeDragStop"
            @selection-drag-start="handleNodeDragStart"
            @selection-drag-stop="handleNodeDragStop"
        >
            <Background variant="lines" :gap="gridSize" :size="1" pattern-color="#3f3f46" />
            <Controls />
            <MiniMap />

            <!-- F2：管線流量速率標籤 overlay -->
            <EdgeLabelRenderer>
                <div
                    v-for="edge in labeledEdges"
                    :key="edge.id"
                    class="pointer-events-none absolute rounded px-1.5 py-0.5 text-xs font-semibold"
                    :class="edgeLabelClass(edge.id)"
                    :style="{
                        transform: `translate(-50%, -50%) translate(${(edge.sourceX + edge.targetX) / 2}px,${(edge.sourceY + edge.targetY) / 2}px)`,
                    }"
                >
                    {{ edgeFlows.get(edge.id)!.rate.toFixed(1) }}/min
                </div>
            </EdgeLabelRenderer>
        </VueFlow>

        <!-- CR-02 管線右鍵刪除選單：錨點跟隨右鍵座標定位，選單內容由 Nuxt UI 傳送門渲染 -->
        <div
            class="pointer-events-none fixed z-50 h-0 w-0"
            :style="{
                left: `${edgeContextMenuPosition.x}px`,
                top: `${edgeContextMenuPosition.y}px`,
            }"
        >
            <UDropdownMenu v-model:open="edgeContextMenuOpen" :items="edgeContextMenuItems">
                <span />
            </UDropdownMenu>
        </div>
    </div>
</template>
