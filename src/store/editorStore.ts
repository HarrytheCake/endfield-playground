import { computed, ref, shallowRef } from 'vue';
import { defineStore } from 'pinia';
import type { FactoryEdge, FactoryNode } from '@/types/graph';
import type { EquipmentType, Rotation, ToolMode } from '@/types/editor';
import { plans } from '@/data/plans';
import type { Plan } from '@/types/plan';
import { useHistoryStore } from '@/store/historyStore';
import { HistoryRecordType } from '@/types/history';

const mockNodes: FactoryNode[] = [
    // ═══════════════════════════════════════════════════════════════════
    // 鏈路 A：赤銅零件（武陵 2-step，預期效率 100%）
    //   赤銅礦 + 清水 → 精煉爐 → 赤銅塊(+汙水) → 配件機 → 赤銅零件
    // ═══════════════════════════════════════════════════════════════════
    {
        id: 'src-Cu-A',
        type: 'default',
        position: { x: 80, y: 100 },
        data: { label: '物品輸出口（赤銅礦）', machineType: '物品輸出口', recipeIndex: 2 },
    },
    {
        id: 'src-H2O-A',
        type: 'default',
        position: { x: 80, y: 300 },
        data: { label: '物品輸出口（清水）', machineType: '物品輸出口', recipeIndex: 3 },
    },
    {
        id: 'furnace-A',
        type: 'default',
        position: { x: 380, y: 200 },
        data: { label: '精煉爐', machineType: '精煉爐', recipeIndex: 2 },
    },
    {
        id: 'parts-A',
        type: 'default',
        position: { x: 680, y: 200 },
        data: { label: '配件機', machineType: '配件機', recipeIndex: 0 },
    },
    {
        id: 'sink-Cu-part',
        type: 'default',
        position: { x: 980, y: 200 },
        data: { label: '物品輸入口（赤銅零件）', machineType: '物品輸入口' },
    },
    {
        id: 'sink-sewage-A',
        type: 'default',
        position: { x: 680, y: 40 },
        data: { label: '物品輸入口（汙水）', machineType: '物品輸入口' },
    },
    // ═══════════════════════════════════════════════════════════════════
    // 鏈路 B：赫銅零件（武陵 5-step，提純機 4:1 瓶頸 → 25% 效率）
    //   赤銅礦 → 粉碎機 → 赤銅粉末 ┐
    //   沉積酸 ─────────────────────┤→ 反應池A → 赤銅溶液 → 提純機 → 赫銅溶液
    //   藍鐵礦 → 粉碎機 → 藍鐵粉末 ┐                                   ↓
    //                               └──────────────────────→ 反應池B → 赫銅塊 → 配件機 → 赫銅零件
    // ═══════════════════════════════════════════════════════════════════
    {
        id: 'src-Cu-B',
        type: 'default',
        position: { x: 80, y: 480 },
        data: { label: '物品輸出口（赤銅礦）', machineType: '物品輸出口', recipeIndex: 2 },
    },
    {
        id: 'crusher-B1',
        type: 'default',
        position: { x: 380, y: 480 },
        data: { label: '粉碎機（赤銅粉末）', machineType: '粉碎機', recipeIndex: 3 },
    },
    {
        id: 'src-Acid',
        type: 'default',
        position: { x: 80, y: 660 },
        data: { label: '物品輸出口（沉積酸）', machineType: '物品輸出口', recipeIndex: 4 },
    },
    {
        id: 'react-A',
        type: 'default',
        position: { x: 680, y: 570 },
        data: { label: '反應池（赤銅溶液）', machineType: '反應池', recipeIndex: 0 },
    },
    {
        id: 'purifier',
        type: 'default',
        position: { x: 980, y: 570 },
        data: { label: '提純機', machineType: '提純機', recipeIndex: 0 },
    },
    {
        id: 'src-BF-B',
        type: 'default',
        position: { x: 80, y: 840 },
        data: { label: '物品輸出口（藍鐵礦）', machineType: '物品輸出口', recipeIndex: 1 },
    },
    {
        id: 'crusher-B2',
        type: 'default',
        position: { x: 380, y: 840 },
        data: { label: '粉碎機（藍鐵粉末）', machineType: '粉碎機', recipeIndex: 1 },
    },
    {
        id: 'react-B',
        type: 'default',
        position: { x: 1280, y: 700 },
        data: { label: '反應池（赫銅塊）', machineType: '反應池', recipeIndex: 1 },
    },
    {
        id: 'parts-B',
        type: 'default',
        position: { x: 1580, y: 700 },
        data: { label: '配件機（赫銅零件）', machineType: '配件機', recipeIndex: 1 },
    },
    {
        id: 'sink-HC-part',
        type: 'default',
        position: { x: 1880, y: 700 },
        data: { label: '物品輸入口（赫銅零件）', machineType: '物品輸入口' },
    },
    {
        id: 'sink-sewage-B',
        type: 'default',
        position: { x: 1580, y: 880 },
        data: { label: '物品輸入口（汙水）', machineType: '物品輸入口' },
    },
    // ═══════════════════════════════════════════════════════════════════
    // 孤立節點（無連線 → 應顯示灰色虛線外框 + "非法"）
    // ═══════════════════════════════════════════════════════════════════
    {
        id: 'orphan-1',
        type: 'default',
        position: { x: 1880, y: 480 },
        data: { label: '反應池（孤立）', machineType: '反應池', recipeIndex: 0 },
    },
];

const mockEdges: FactoryEdge[] = [
    // ── 鏈路 A ──────────────────────────────────────────────────────────
    { id: 'e-CuA-furnaceA', source: 'src-Cu-A', target: 'furnace-A', animated: true },
    { id: 'e-H2OA-furnaceA', source: 'src-H2O-A', target: 'furnace-A', animated: true },
    // 精煉爐雙輸出：赤銅塊 edge 必須在汙水 edge 之前（影響品項配對順序）
    { id: 'e-furnaceA-partsA', source: 'furnace-A', target: 'parts-A', animated: true },
    { id: 'e-furnaceA-sewageA', source: 'furnace-A', target: 'sink-sewage-A', animated: true },
    { id: 'e-partsA-sinkCu', source: 'parts-A', target: 'sink-Cu-part', animated: true },
    // ── 鏈路 B ──────────────────────────────────────────────────────────
    { id: 'e-CuB-cB1', source: 'src-Cu-B', target: 'crusher-B1', animated: true },
    { id: 'e-cB1-reactA', source: 'crusher-B1', target: 'react-A', animated: true },
    { id: 'e-Acid-reactA', source: 'src-Acid', target: 'react-A', animated: true },
    { id: 'e-reactA-purifier', source: 'react-A', target: 'purifier', animated: true },
    // 提純機 → 反應池B（赫銅溶液）
    { id: 'e-purifier-reactB', source: 'purifier', target: 'react-B', animated: true },
    { id: 'e-BFB-cB2', source: 'src-BF-B', target: 'crusher-B2', animated: true },
    { id: 'e-cB2-reactB', source: 'crusher-B2', target: 'react-B', animated: true },
    // 反應池B 雙輸出：赫銅塊 edge 必須在汙水 edge 之前
    { id: 'e-reactB-partsB', source: 'react-B', target: 'parts-B', animated: true },
    { id: 'e-reactB-sewageB', source: 'react-B', target: 'sink-sewage-B', animated: true },
    { id: 'e-partsB-sinkHC', source: 'parts-B', target: 'sink-HC-part', animated: true },
];

/**
 * CR-01 / CR-02 useEditorStore
 *
 * 兼任 placedDeviceStore 與 pipelineStore 的角色 —— 持有藍圖上所有已部署設備（nodes）  \
 * 與管線（edges），以及編輯器當下的工具狀態（active tool、placement armed 等）。
 *
 * 高階 actions（placeDevice / moveDevices / rotateDevice / removeDevices /  \
 * setRecipe / pasteSelection / addConnection / removeConnection）內部會自動  \
 * 產生 Command 並推入 historyStore，L2 不需要也不應該自己組 Command。
 *
 * 其餘低階 / UI 狀態 actions（setMapSize / setActiveTool / armPlacement 等）  \
 * 屬於視角操作，**不進歷史**。
 *
 * @example
 * const editorStore = useEditorStore()
 * editorStore.placeDevice({
 *   id: crypto.randomUUID(),
 *   type: 'default',
 *   position: { x: 200, y: 300 },
 *   data: { label: '精煉爐', machineType: '精煉爐', recipeIndex: 0 },
 * })
 * // 此時 historyStore 已自動推入一筆 Command
 */
export const useEditorStore = defineStore('editor', () => {
    /** 藍圖上所有已部署設備節點 */
    const nodes = shallowRef<FactoryNode[]>(mockNodes);

    /** 藍圖上所有已部署管線 */
    const edges = shallowRef<FactoryEdge[]>(mockEdges);

    /** 畫布寬度（格） */
    const mapWidth = ref(256);

    /** 畫布高度（格） */
    const mapHeight = ref(256);

    /** 是否啟用 snap-to-grid */
    const snapToGrid = ref(true);

    /** 當前工具模式 */
    const activeTool = ref<ToolMode>('select');

    // ── 建造計畫 ──────────────────────────────────────────────────────────
    /** 目前選定的計畫 ID（預設武陵） */
    const currentPlanId = ref<string>('9bdb2f99-531e-416a-8f4c-27c5e8d8957c');

    /** 目前選定的計畫物件 */
    const currentPlan = computed<Plan | undefined>(() =>
        plans.find((p) => p.id === currentPlanId.value),
    );

    /** 每種機器類型的已使用台數（不含物品輸出口 / 物品輸入口） */
    const machineUsedCounts = computed(() => {
        const counts = new Map<string, number>();
        for (const node of nodes.value) {
            const mt = node.data?.machineType;
            if (!mt || mt === '物品輸出口' || mt === '物品輸入口') continue;
            counts.set(mt, (counts.get(mt) ?? 0) + 1);
        }
        return counts;
    });

    /** 工具列當前選中的設備類別 */
    const selectedEquipment = ref<EquipmentType>('smelter');

    /** 是否處於「擺放準備中」狀態（拿起設備尚未放下） */
    const placementArmed = ref(false);

    /** 已部署設備總數 */
    const machineCount = computed(() => nodes.value.length);

    /** 已部署節點總數（語意同 machineCount，保留供既有 UI 使用） */
    const nodeCount = computed(() => nodes.value.length);

    /** 已部署管線總數 */
    const edgeCount = computed(() => edges.value.length);

    /**
     * 設定畫布尺寸（最小 64 格）。
     *
     * @param width 新寬度
     * @param height 新高度
     */
    function setMapSize(width: number, height: number) {
        mapWidth.value = Math.max(64, width);
        mapHeight.value = Math.max(64, height);
    }

    /** 切換 snap-to-grid */
    function setSnapToGrid(enabled: boolean) {
        snapToGrid.value = enabled;
    }

    /** 切換當前工具模式；非 select 模式時自動 disarm placement */
    function setActiveTool(tool: ToolMode) {
        activeTool.value = tool;
        if (tool !== 'select') {
            placementArmed.value = false;
        }
    }

    /** 變更工具列選中的設備類別（不觸發拿起） */
    function setSelectedEquipment(equipment: EquipmentType) {
        selectedEquipment.value = equipment;
    }

    /** 選擇設備並進入「擺放準備中」狀態（拿起設備） */
    function armPlacement(equipment: EquipmentType) {
        selectedEquipment.value = equipment;
        placementArmed.value = true;
    }

    /** 結束「擺放準備中」狀態（取消拿起） */
    function disarmPlacement() {
        placementArmed.value = false;
    }

    /** 將畫布重置為初始 mock 資料（dev / 測試用） */
    function resetCanvas() {
        nodes.value = structuredClone(mockNodes);
        edges.value = structuredClone(mockEdges);
    }

    // ─── 高階 actions（CR-08：呼叫一次 = 一筆歷史項目） ──────────────────────────

    /**
     * 擺放單一設備節點。
     *
     * @param node 要擺放的 FactoryNode（呼叫端應已決定其 id / position / data）
     * @example
     * editorStore.placeDevice({
     *   id: 'node-uuid',
     *   type: 'default',
     *   position: { x: 200, y: 300 },
     *   data: { label: '精煉爐', machineType: '精煉爐', recipeIndex: 0, rotation: 0 },
     * })
     */
    function placeDevice(node: FactoryNode): void {
        const historyStore = useHistoryStore();
        const captured = node;
        historyStore.execute({
            id: crypto.randomUUID(),
            type: HistoryRecordType.MachinePlacement,
            label: `擺放 ${captured.data?.label ?? captured.id}`,
            execute() {
                nodes.value = [...nodes.value, captured];
            },
            undo() {
                nodes.value = nodes.value.filter((n) => n.id !== captured.id);
            },
        });
    }

    /**
     * 批次移動設備（依 delta 像素）。  \
     * 整組視為單一歷史項目，一次 undo 即可全部還原。
     *
     * @param uids 要移動的設備 uid 陣列
     * @param delta 位移向量（像素）
     * @example
     * editorStore.moveDevices(['a', 'b'], { x: 40, y: 0 })
     */
    function moveDevices(uids: string[], delta: { x: number; y: number }): void {
        if (uids.length === 0) return;
        const historyStore = useHistoryStore();
        const targetSet = new Set(uids);
        const applyDelta = (sign: 1 | -1) => {
            nodes.value = nodes.value.map((n) =>
                targetSet.has(n.id)
                    ? {
                          ...n,
                          position: {
                              x: n.position.x + sign * delta.x,
                              y: n.position.y + sign * delta.y,
                          },
                      }
                    : n,
            );
        };
        historyStore.execute({
            id: crypto.randomUUID(),
            type: HistoryRecordType.MachineMovement,
            label: `移動 ${uids.length} 台設備`,
            execute() {
                applyDelta(1);
            },
            undo() {
                applyDelta(-1);
            },
        });
    }

    /**
     * 旋轉單一設備。
     *
     * @param uid 設備 uid
     * @param rotation 目標旋轉次數（0/1/2/3 對應 0°/90°/180°/270°）
     * @example
     * editorStore.rotateDevice('node-uuid', 1)
     */
    function rotateDevice(uid: string, rotation: Rotation): void {
        const historyStore = useHistoryStore();
        const target = nodes.value.find((n) => n.id === uid);
        if (!target) return;
        const previous = (target.data?.rotation ?? 0) as Rotation;
        if (previous === rotation) return;
        const apply = (r: Rotation) => {
            nodes.value = nodes.value.map((n) =>
                n.id === uid ? { ...n, data: { ...(n.data ?? { label: '' }), rotation: r } } : n,
            );
        };
        historyStore.execute({
            id: crypto.randomUUID(),
            type: HistoryRecordType.MachineRotation,
            label: `旋轉設備 ${target.data?.label ?? uid}`,
            execute() {
                apply(rotation);
            },
            undo() {
                apply(previous);
            },
        });
    }

    /**
     * 批次刪除設備（連帶刪除其相關管線）。  \
     * 整組視為單一歷史項目。
     *
     * @param uids 要刪除的設備 uid 陣列
     * @example
     * editorStore.removeDevices(['a', 'b'])
     */
    function removeDevices(uids: string[]): void {
        if (uids.length === 0) return;
        const historyStore = useHistoryStore();
        const targetSet = new Set(uids);
        const snapshotNodes = nodes.value.filter((n) => targetSet.has(n.id));
        const snapshotEdges = edges.value.filter(
            (e) => targetSet.has(e.source) || targetSet.has(e.target),
        );
        historyStore.execute({
            id: crypto.randomUUID(),
            type: HistoryRecordType.MachineDeletion,
            label: `刪除 ${uids.length} 台設備`,
            execute() {
                nodes.value = nodes.value.filter((n) => !targetSet.has(n.id));
                edges.value = edges.value.filter(
                    (e) => !targetSet.has(e.source) && !targetSet.has(e.target),
                );
            },
            undo() {
                nodes.value = [...nodes.value, ...snapshotNodes];
                edges.value = [...edges.value, ...snapshotEdges];
            },
        });
    }

    /**
     * 變更設備配方。
     *
     * @param uid 設備 uid
     * @param recipeIndex 新配方索引
     * @example
     * editorStore.setRecipe('node-uuid', 2)
     */
    function setRecipe(uid: string, recipeIndex: number): void {
        const historyStore = useHistoryStore();
        const target = nodes.value.find((n) => n.id === uid);
        if (!target) return;
        const previous = target.data?.recipeIndex ?? 0;
        if (previous === recipeIndex) return;
        const apply = (idx: number) => {
            nodes.value = nodes.value.map((n) =>
                n.id === uid
                    ? { ...n, data: { ...(n.data ?? { label: '' }), recipeIndex: idx } }
                    : n,
            );
        };
        historyStore.execute({
            id: crypto.randomUUID(),
            type: HistoryRecordType.MachineRecipeChange,
            label: `變更配方 ${target.data?.label ?? uid}`,
            execute() {
                apply(recipeIndex);
            },
            undo() {
                apply(previous);
            },
        });
    }

    /**
     * 框選複製貼上（含管線）。  \
     * 為複製內容產生新 uid，並依 offset 位移；整組視為單一歷史項目。
     *
     * @param copiedNodes 來源節點陣列
     * @param copiedEdges 來源管線陣列；只有兩端設備都在 copiedNodes 內的管線會被複製
     * @param offset 位移向量（像素）
     * @example
     * editorStore.pasteSelection(selectedNodes, selectedEdges, { x: 60, y: 0 })
     */
    function pasteSelection(
        copiedNodes: FactoryNode[],
        copiedEdges: FactoryEdge[],
        offset: { x: number; y: number },
    ): void {
        if (copiedNodes.length === 0) return;
        const historyStore = useHistoryStore();
        const uidMap = new Map<string, string>();
        const newNodes: FactoryNode[] = copiedNodes.map((n) => {
            const newId = crypto.randomUUID();
            uidMap.set(n.id, newId);
            return {
                ...n,
                id: newId,
                position: { x: n.position.x + offset.x, y: n.position.y + offset.y },
            };
        });
        const newEdges: FactoryEdge[] = copiedEdges
            .filter((e) => uidMap.has(e.source) && uidMap.has(e.target))
            .map((e) => ({
                ...e,
                id: crypto.randomUUID(),
                source: uidMap.get(e.source)!,
                target: uidMap.get(e.target)!,
            }));
        const newNodeIds = new Set(newNodes.map((n) => n.id));
        const newEdgeIds = new Set(newEdges.map((e) => e.id));
        historyStore.execute({
            id: crypto.randomUUID(),
            type: HistoryRecordType.MachineCopyPaste,
            label: `複製貼上 ${newNodes.length} 台設備`,
            execute() {
                nodes.value = [...nodes.value, ...newNodes];
                edges.value = [...edges.value, ...newEdges];
            },
            undo() {
                nodes.value = nodes.value.filter((n) => !newNodeIds.has(n.id));
                edges.value = edges.value.filter((e) => !newEdgeIds.has(e.id));
            },
        });
    }

    /**
     * 新增管線。
     *
     * Phase 1 簡化版：不處理 autoNode（分流 / 匯流 / 物流橋）自動生成；  \
     * 該邏輯待 CR-02 進入實作階段後在本 action 內補上 macro 組裝。
     *
     * @param edge 要新增的 FactoryEdge（呼叫端決定 id / source / target）
     * @example
     * editorStore.addConnection({ id: 'e-uuid', source: 'a', target: 'b' })
     */
    function addConnection(edge: FactoryEdge): void {
        const historyStore = useHistoryStore();
        const captured = edge;
        historyStore.execute({
            id: crypto.randomUUID(),
            type: HistoryRecordType.MachineConnection,
            label: `新增管線 ${captured.source} → ${captured.target}`,
            execute() {
                edges.value = [...edges.value, captured];
            },
            undo() {
                edges.value = edges.value.filter((e) => e.id !== captured.id);
            },
        });
    }

    /**
     * 刪除單一管線。
     *
     * @param uid 管線 uid
     * @example
     * editorStore.removeConnection('e-uuid')
     */
    function removeConnection(uid: string): void {
        const historyStore = useHistoryStore();
        const target = edges.value.find((e) => e.id === uid);
        if (!target) return;
        const captured = target;
        historyStore.execute({
            id: crypto.randomUUID(),
            type: HistoryRecordType.MachineConnectionDeletion,
            label: `刪除管線 ${uid}`,
            execute() {
                edges.value = edges.value.filter((e) => e.id !== uid);
            },
            undo() {
                edges.value = [...edges.value, captured];
            },
        });
    }

    return {
        /** 藍圖上所有已部署設備節點 */
        nodes,
        /** 藍圖上所有已部署管線 */
        edges,
        /** 畫布寬度（格） */
        mapWidth,
        /** 畫布高度（格） */
        mapHeight,
        /** 是否啟用 snap-to-grid */
        snapToGrid,
        /** 當前工具模式 */
        activeTool,
        /** 工具列當前選中的設備類別 */
        selectedEquipment,
        /** 是否處於「擺放準備中」狀態（拿起設備尚未放下） */
        placementArmed,
        /** 目前選定的計畫 ID（預設武陵） */
        currentPlanId,
        /** 已部署設備總數 */
        machineCount,
        /** 已部署節點總數（語意同 machineCount，保留供既有 UI 使用） */
        nodeCount,
        /** 已部署管線總數 */
        edgeCount,
        /** 目前選定的計畫物件 */
        currentPlan,
        /** 每種機器類型的已使用台數（不含物品輸出口 / 物品輸入口） */
        machineUsedCounts,
        /**
         * 設定畫布尺寸（最小 64 格）。
         *
         * @param width 新寬度
         * @param height 新高度
         */
        setMapSize,
        /** 切換 snap-to-grid */
        setSnapToGrid,
        /** 切換當前工具模式；非 select 模式時自動 disarm placement */
        setActiveTool,
        /** 變更工具列選中的設備類別（不觸發拿起） */
        setSelectedEquipment,
        /** 選擇設備並進入「擺放準備中」狀態（拿起設備） */
        armPlacement,
        /** 結束「擺放準備中」狀態（取消拿起） */
        disarmPlacement,
        /** 將畫布重置為初始 mock 資料（dev / 測試用） */
        resetCanvas,
        /**
         * 擺放單一設備節點。
         *
         * @param node 要擺放的 FactoryNode（呼叫端應已決定其 id / position / data）
         * @example
         * editorStore.placeDevice({
         *   id: 'node-uuid',
         *   type: 'default',
         *   position: { x: 200, y: 300 },
         *   data: { label: '精煉爐', machineType: '精煉爐', recipeIndex: 0, rotation: 0 },
         * })
         */
        placeDevice,
        /**
         * 批次移動設備（依 delta 像素）。  \
         * 整組視為單一歷史項目，一次 undo 即可全部還原。
         *
         * @param uids 要移動的設備 uid 陣列
         * @param delta 位移向量（像素）
         * @example
         * editorStore.moveDevices(['a', 'b'], { x: 40, y: 0 })
         */
        moveDevices,
        /**
         * 旋轉單一設備。
         *
         * @param uid 設備 uid
         * @param rotation 目標旋轉次數（0/1/2/3 對應 0°/90°/180°/270°）
         * @example
         * editorStore.rotateDevice('node-uuid', 1)
         */
        rotateDevice,
        /**
         * 批次刪除設備（連帶刪除其相關管線）。  \
         * 整組視為單一歷史項目。
         *
         * @param uids 要刪除的設備 uid 陣列
         * @example
         * editorStore.removeDevices(['a', 'b'])
         */
        removeDevices,
        /**
         * 變更設備配方。
         *
         * @param uid 設備 uid
         * @param recipeIndex 新配方索引
         * @example
         * editorStore.setRecipe('node-uuid', 2)
         */
        setRecipe,
        /**
         * 框選複製貼上（含管線）。  \
         * 為複製內容產生新 uid，並依 offset 位移；整組視為單一歷史項目。
         *
         * @param copiedNodes 來源節點陣列
         * @param copiedEdges 來源管線陣列；只有兩端設備都在 copiedNodes 內的管線會被複製
         * @param offset 位移向量（像素）
         * @example
         * editorStore.pasteSelection(selectedNodes, selectedEdges, { x: 60, y: 0 })
         */
        pasteSelection,
        /**
         * 新增管線。
         *
         * Phase 1 簡化版：不處理 autoNode（分流 / 匯流 / 物流橋）自動生成；  \
         * 該邏輯待 CR-02 進入實作階段後在本 action 內補上 macro 組裝。
         *
         * @param edge 要新增的 FactoryEdge（呼叫端決定 id / source / target）
         * @example
         * editorStore.addConnection({ id: 'e-uuid', source: 'a', target: 'b' })
         */
        addConnection,
        /**
         * 刪除單一管線。
         *
         * @param uid 管線 uid
         * @example
         * editorStore.removeConnection('e-uuid')
         */
        removeConnection,
    };
});
