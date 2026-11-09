/**
 * L1 契約實驗室資料（V19 Hub MVP）
 *
 * 演示頁 `L1ContractLab.vue` 消費此檔：定義表、inventory、詞彙、頁內教學。
 * 改契約時請同步更新本檔與公開 LAB 指南；維運規則見 todolist_v19／E1。
 */

/**
 * 契約實驗室分頁版本鍵
 *
 * @example
 * const v: ContractVersion = 'V16'
 */
export type ContractVersion = 'V14' | 'V15' | 'V16' | 'V17';

/**
 * 單一 API／契約列（表格一列）
 */
export interface ContractApiRow {
    /** 匯出符號或呼叫路徑（顯示用） */
    symbol: string;
    /** 模組路徑（顯示用） */
    module: string;
    /** 一句話：做什麼 */
    purpose: string;
    /** 誰該呼叫 */
    callers: string;
    /** 常見誤用 */
    dont: string;
}

/**
 * 可選的更深演示連結
 */
export interface ContractDeeperDemo {
    /** 連結文字 */
    label: string;
    /** 相對站台路徑或獨立 HTML */
    href: string;
}

/**
 * 單一版本契約塊（總覽列＋分頁內容）
 */
export interface ContractVersionBlock {
    /** 版本鍵 */
    version: ContractVersion;
    /** 分頁標題 */
    title: string;
    /** 相關 PR 字串 */
    prs: string;
    /** 總覽「一句話」 */
    oneLiner: string;
    /** API 列 */
    apis: ContractApiRow[];
    /** 可選深鏈 */
    deeperDemo?: ContractDeeperDemo;
}

/**
 * Hub 長期邊界區域（A-2）
 */
export type ContractInventoryArea =
    | 'layout-utils'
    | 'layout-store'
    | 'validation'
    | 'engine-adapter';

/**
 * inventory 列：已登錄＝有定義表／演示；todo＝後續週補
 */
export interface ContractInventoryRow {
    /** 所屬區域 */
    area: ContractInventoryArea;
    /** 匯出符號或 action 名 */
    symbol: string;
    /** 模組路徑 */
    module: string;
    /** listed＝已在版本表；todo＝待後續週 */
    status: 'listed' | 'todo';
    /** 一句白話 */
    note: string;
}

/**
 * 頁內詞彙一列
 */
export interface ContractGlossaryEntry {
    /** 標記詞 */
    term: string;
    /** 白話說明 */
    meaning: string;
}

/**
 * 頁內最短路徑一步
 */
export interface ContractGuideStep {
    /** 步驟序號（顯示用） */
    step: number;
    /** 標題 */
    title: string;
    /** 說明 */
    detail: string;
}

/** 區域顯示名 */
export const INVENTORY_AREA_LABELS: Record<ContractInventoryArea, string> = {
    'layout-utils': 'layout utils（格線／埠／連線純函式）',
    'layout-store': 'layoutStore 公開 action',
    validation: '驗證／偵測器（可選）',
    'engine-adapter': '引擎 adapter（可選）',
};

/**
 * 給無經驗者：最短路徑（頁內教學）
 */
export const HUB_GUIDE_STEPS: ContractGuideStep[] = [
    {
        step: 1,
        title: '這頁是什麼？',
        detail: '這是「L1 契約實驗室」，不是遊戲正式畫面。用來查底層函式／store 該怎麼呼叫，並可按按鈕真實跑一次看 JSON。',
    },
    {
        step: 2,
        title: '怎麼打開？',
        detail: '終端機執行 pnpm dev → 瀏覽器開左側 Dev 導覽點「L1 契約實驗室」，或直接開 /dev/l1-contract-lab。',
    },
    {
        step: 3,
        title: '各分頁點什麼？',
        detail: '「入門」＝跟這幾步；「詞彙」＝專有名詞白話；「目錄」＝長期會收哪些 API（已列／待列）；「試玩」＝分辨滑鼠點到的埠，和管子要接的格子；「總覽／V14–V17」＝定義表與一鍵測試。',
    },
    {
        step: 4,
        title: '正式頁現在能做什麼？（#78 已合）',
        detail: '正式佈局頁可：放設備、拖曳、埠對埠拉管線、斷線警示、旋轉設備等。本 lab 不取代正式頁，只說明底層契約。',
    },
    {
        step: 5,
        title: '卡住讀哪？',
        detail: '先看本頁詞彙與目錄。Markdown 最短跟做：tutorial/l1-contract-lab/usage.md；再深讀 USAGE（docs/aaaaa/dev/USAGE_l1_contract_lab.md）與 LAB（work_dispatch/aaaaa/1018/LAB_l1_contract_guide.md）。',
    },
];

/**
 * 頁內維運規則摘要（完整見 docs/aaaaa/dev/dev_v19/E1_ops_rules_and_handoff.md）
 */
export const HUB_OPS_RULES: readonly string[] = [
    '單一真相＝本頁／contractCatalog.ts；不要另開平行 swagger 頁。',
    '新 L1 合入時：inventory 改 listed（或新增列）＋定義列 purpose／callers／dont。',
    '建議附至少一則可點測案例；寫入 store 須用獨立 Pinia，勿污染正式頁。',
    '易踩雷或破壞性變更：USAGE／LAB 補一句；新詞進 LAB 詞彙表。',
    '禁止只改程式不改 catalog（視為 hub 欠帳）。本周不做自動 codegen。',
];

/**
 * 頁內精簡詞彙（摘自 LAB §2；完整表見 LAB 長文）
 */
export const HUB_GLOSSARY: ContractGlossaryEntry[] = [
    {
        term: 'L1',
        meaning: '基礎層：資料、規則函式、store 動作。通常不直接畫正式 UI。',
    },
    {
        term: 'L2',
        meaning: '互動層：畫布拖設備、拉管線等。應呼叫 L1，不要自己重寫規則。',
    },
    {
        term: '契約',
        meaning: '呼叫端與提供端都同意的用法：輸入、輸出、什麼不能做。',
    },
    {
        term: '純函式',
        meaning: '同樣輸入大致同樣輸出、不偷偷改全域畫面狀態（方便測試）。',
    },
    {
        term: 'store',
        meaning: '集中存放狀態（本專案用 Pinia）。layoutStore 管佈局設備與管線。',
    },
    {
        term: '機型 machineType',
        meaning: '哪一種機器。新模型用英文 id（如 crusher），不是中文顯示名。',
    },
    {
        term: '埠／PortRef',
        meaning: '進料／出料接口；身分證是 { deviceId, portType, portIndex }，不要用座標反推。',
    },
    {
        term: '埠熱區',
        meaning: '滑鼠算「有點到埠」的範圍。函式：hitTestPortAt（圓心＝埠視覺邊心）。',
    },
    {
        term: '外側錨點格',
        meaning: '設備佔格外相鄰一格，給 canConnect／路徑端點用；不是滑鼠熱區主依據。',
    },
    {
        term: 'primaryOutput',
        meaning: '源設備主要產出哪種材料；只寫 layoutStore，引擎經 toTopology 讀。',
    },
    {
        term: '拓樸 topology',
        meaning: '設備當點、管線當邊的關係圖；流量引擎靠它算產耗。',
    },
    {
        term: 'draft',
        meaning: '尚未寫入 store 的預覽狀態（拖著還沒放下的設備或線）。',
    },
];

/**
 * Hub inventory（長期邊界骨架；本周不必填滿定義表）
 */
export const CONTRACT_INVENTORY: ContractInventoryRow[] = [
    /** layout-utils：已列（版本表有／可點測） */
    {
        area: 'layout-utils',
        symbol: 'canPlaceDevice',
        module: '@/utils/layout/placementCheck',
        status: 'listed',
        note: '落子預覽；V14',
    },
    {
        area: 'layout-utils',
        symbol: 'canMoveDevice',
        module: '@/utils/layout/placementCheck',
        status: 'listed',
        note: '移動預覽；V14',
    },
    {
        area: 'layout-utils',
        symbol: 'canConnect',
        module: '@/utils/layout/connectRules',
        status: 'listed',
        note: '管線能否連；V14',
    },
    {
        area: 'layout-utils',
        symbol: 'describeConnectFailure',
        module: '@/utils/layout/connectRules',
        status: 'listed',
        note: '連線失敗人話；V14',
    },
    {
        area: 'layout-utils',
        symbol: 'devicesOutsideBase',
        module: '@/utils/layout/devicesOutsideBase',
        status: 'listed',
        note: '出界 id 列表；V15',
    },
    {
        area: 'layout-utils',
        symbol: 'hitTestPortAt',
        module: '@/utils/layout/portHitTest',
        status: 'listed',
        note: '埠熱區；可傳 prefer；V15／#65',
    },
    {
        area: 'layout-utils',
        symbol: 'toTopology',
        module: '@/utils/layout/toTopology',
        status: 'listed',
        note: '佈局→引擎圖；V16／V17',
    },
    {
        area: 'layout-utils',
        symbol: 'resolvePortAnchorCell',
        module: '@/utils/layout/portAnchors',
        status: 'listed',
        note: '外側錨點格；V15／V20-C1 對照案例',
    },
    {
        area: 'layout-utils',
        symbol: 'collectPortAnchors／findPortAt',
        module: '@/utils/layout/portAnchorIndex',
        status: 'listed',
        note: '錨點展開／格點精確（≠熱區）；V15 可點測',
    },
    {
        area: 'layout-utils',
        symbol: 'resolveConnections',
        module: '@/utils/layout/resolveConnections',
        status: 'listed',
        note: '管線→Connection[]；V15 可點測',
    },
    {
        area: 'layout-utils',
        symbol: 'buildConnectionWaypoints',
        module: '@/utils/layout/connectionWaypoints',
        status: 'listed',
        note: '#78 連線折線；V15 分頁可點測',
    },
    {
        area: 'layout-utils',
        symbol: 'buildGapConnectionWaypoints',
        module: '@/utils/layout/connectionWaypoints',
        status: 'listed',
        note: '間隙中央通道雙轉角；V15／V20-D1 可點測',
    },
    /** layout-utils：待列 */
    {
        area: 'layout-utils',
        symbol: 'getDeviceOccupiedCells',
        module: '@/utils/layout/deviceOccupancy',
        status: 'todo',
        note: '設備佔格',
    },
    {
        area: 'layout-utils',
        symbol: 'detectOverlaps',
        module: '@/utils/layout/overlapDetection',
        status: 'todo',
        note: '重疊偵測（預覽請走 canPlace）',
    },
    {
        area: 'layout-utils',
        symbol: 'toDeviceFootprint／toPipelineFootprint',
        module: '@/utils/layout/toFootprint',
        status: 'todo',
        note: '佔格足跡轉換',
    },
    {
        area: 'layout-utils',
        symbol: 'collectLayoutIssues／assessInvolving',
        module: '@/utils/layout/placementCheck',
        status: 'todo',
        note: '佈局問題彙整',
    },
    {
        area: 'layout-utils',
        symbol: 'getPipelineTiles／buildPipelinePolyline',
        module: '@/utils/layout/pipelineTiles＋pipelinePolyline',
        status: 'todo',
        note: '管線視覺／折線幾何',
    },
    {
        area: 'layout-utils',
        symbol: 'getMachinePortMedia',
        module: '@/utils/layout/portMedia',
        status: 'todo',
        note: '埠媒質查詢',
    },
    {
        area: 'layout-utils',
        symbol: 'pipelineGeometry 系列',
        module: '@/utils/layout/pipelineGeometry',
        status: 'todo',
        note: '軸對齊路徑／佔格',
    },
    /** layout-store：已列 */
    {
        area: 'layout-store',
        symbol: 'addDevice／removeDevice',
        module: '@/store/layoutStore',
        status: 'listed',
        note: '寫入設備；overlap 不擋（見 V16）',
    },
    {
        area: 'layout-store',
        symbol: 'moveDevice',
        module: '@/store/layoutStore',
        status: 'listed',
        note: '移動寫入；V16',
    },
    {
        area: 'layout-store',
        symbol: 'rotateDevice',
        module: '@/store/layoutStore',
        status: 'listed',
        note: '旋轉 0–3；V16',
    },
    {
        area: 'layout-store',
        symbol: 'setDevicePrimaryOutput',
        module: '@/store/layoutStore',
        status: 'listed',
        note: '源素材；V16／C5',
    },
    {
        area: 'layout-store',
        symbol: 'addPipeline／removePipeline',
        module: '@/store/layoutStore',
        status: 'listed',
        note: '管線寫入（內含 canConnect）；V16／V20-D1 可點測',
    },
    /** layout-store：待列 */
    {
        area: 'layout-store',
        symbol: 'loadSnapshot／toSnapshot',
        module: '@/store/layoutStore',
        status: 'todo',
        note: '快照進出',
    },
    {
        area: 'layout-store',
        symbol: 'connections／layoutIssues（computed）',
        module: '@/store/layoutStore',
        status: 'todo',
        note: '衍生狀態；只讀',
    },
    /** validation（可選） */
    {
        area: 'validation',
        symbol: 'resolveMachineDef',
        module: '@/data/machines',
        status: 'listed',
        note: '機型 id 查表；V17（亦供驗證）',
    },
    {
        area: 'validation',
        symbol: 'detectors／E001…',
        module: '@/lib/validation/detectors/*',
        status: 'todo',
        note: '後續週可選掛說明',
    },
    /** engine-adapter（可選） */
    {
        area: 'engine-adapter',
        symbol: 'toTopology → buildGraph／propagateFlows',
        module: '@/utils/layout/toTopology＋useFlowEngine',
        status: 'listed',
        note: '引擎餵入鏈；V17',
    },
    {
        area: 'engine-adapter',
        symbol: 'historyContext／跨界 clear',
        module: '@/utils/history/*',
        status: 'listed',
        note: '正式／dev 歷史隔離；V17',
    },
];

/**
 * 總覽：版本 → 契約塊（頁面唯一資料源）
 */
export const CONTRACT_BLOCKS: ContractVersionBlock[] = [
    {
        version: 'V14',
        title: '落子前預檢＋連線規則',
        prs: '#54／#55',
        oneLiner: 'L2 預覽與 store 真落子走同一套 canPlace／canConnect；勿自算佔格或另寫錨點。',
        deeperDemo: {
            label: 'V14 專頁（綠／紅案例卡）',
            href: '/dev/placement-connect-check.html',
        },
        apis: [
            {
                symbol: 'canPlaceDevice',
                module: '@/utils/layout/placementCheck',
                purpose: 'draft 能否放置；回傳 PlacementResult（含 DRAFT_ID conflicts）',
                callers: '落子預覽、toolbar 意圖；預檢與寫入規則同源，寫入重疊不擋（見 addDevice）',
                dont: '自己 import detectOverlaps 另算預覽',
            },
            {
                symbol: 'canMoveDevice',
                module: '@/utils/layout/placementCheck',
                purpose: '既有設備移到新格是否合法；原位必 ok（預檢可回 overlap）',
                callers: '拖曳預覽／放開前',
                dont: '移動時用 canPlaceDevice 假裝新機',
            },
            {
                symbol: 'canConnect',
                module: '@/utils/layout/connectRules',
                purpose: '管線 waypoints 能否連；與 resolveConnections 同錨點',
                callers: '連線 draft；addPipeline 防線',
                dont: '另寫「端點碰哪一埠」；單端命中仍要查方向／媒質',
            },
            {
                symbol: 'describeConnectFailure',
                module: '@/utils/layout/connectRules',
                purpose: '把 ConnectResult 轉成人話；ConnectResult 本身無 message',
                callers: 'UI 文案',
                dont: '在 L1 規則函式裡組 UI 字串',
            },
        ],
    },
    {
        version: 'V15',
        title: '出界列表＋埠熱區命中',
        prs: '#60／#65',
        oneLiner: '出界／熱區／錨點／waypoints（含 gap）可點測；規則錨點≠滑鼠熱區。',
        apis: [
            {
                symbol: 'devicesOutsideBase',
                module: '@/utils/layout/devicesOutsideBase',
                purpose: '回傳佔格超出基地的 device id[]；region=null → []',
                callers: '畫布紅框／警示；不改 canPlaceDevice',
                dont: '把出界當 PlacementResult 拒絕理由（除非產品改裁決）',
            },
            {
                symbol: 'hitTestPortAt',
                module: '@/utils/layout/portHitTest',
                purpose:
                    '點擊／拖線熱區命中 → PortRef＋side＋media；圓心＝埠視覺邊心；可傳 prefer（拖線 output、放開 input）',
                callers: 'C1／L2 開始拖線、放開接線',
                dont: '拿 findPortAt（格點精確）當滑鼠熱區；忽略 prefer 導致緊貼埠對埠認錯端',
            },
            {
                symbol: 'resolvePortAnchorCell',
                module: '@/utils/layout/portAnchors',
                purpose: '設備外側相鄰一格＝管線／規則錨點（非整數邊心）',
                callers: 'collectPortAnchors、canConnect、waypoints',
                dont: '與 SVG 邊心像素函式互換；當滑鼠熱區圓心',
            },
            {
                symbol: 'collectPortAnchors／findPortAt',
                module: '@/utils/layout/portAnchorIndex',
                purpose:
                    '展開外側錨點；整數格精確命中（可 prefer）；供 resolveConnections／canConnect 共用',
                callers: '連線解析、規則錨點',
                dont: '拿 findPortAt 當滑鼠熱區（連續座標請用 hitTestPortAt）',
            },
            {
                symbol: 'resolveConnections',
                module: '@/utils/layout/resolveConnections',
                purpose: 'pipeline 首／末格對錨點 → Connection；錯位則 from／to null（管線不刪）',
                callers: 'layoutStore.connections、引擎前衍生',
                dont: '以為會做媒質檢查（那是 canConnect）；端點用熱區座標',
            },
            {
                symbol: 'buildConnectionWaypoints',
                module: '@/utils/layout/connectionWaypoints',
                purpose: '兩外側錨點 → 直線或單轉角 waypoints（#78）；不驗媒質／碰撞',
                callers: 'L2 拉線預覽路徑',
                dont: '用此結果取代 canConnect；間隙繞障見 buildGapConnectionWaypoints',
            },
            {
                symbol: 'buildGapConnectionWaypoints',
                module: '@/utils/layout/connectionWaypoints',
                purpose:
                    '兩端設備間固定中央通道 → 雙轉角路徑；無通道回 null；不搜尋其他繞障、不驗媒質',
                callers: 'L2 緊貼／對側拉線候選（#78）',
                dont: '當通用繞障搜尋；用結果直接略過 canConnect／碰撞預檢',
            },
        ],
    },
    {
        version: 'V16',
        title: '源素材寫入＋設備旋轉＋管線寫入（layoutStore）',
        prs: '#72／V18 rotateDevice／V20-D1 pipeline',
        oneLiner:
            'primaryOutput／rotateDevice／addPipeline 只寫 layoutStore；addPipeline 內含 canConnect；重疊不擋設備寫入。',
        deeperDemo: {
            label: 'layoutStore 演示（獨立 HTML）',
            href: '/dev/layout-store-preview.html',
        },
        apis: [
            {
                symbol: 'setDevicePrimaryOutput',
                module: '@/store/layoutStore',
                purpose: 'uid＋itemId|null＋可選 rate；進歷史；省略 rate＝30',
                callers: '左面板／源設備表單（正式 UI／harry H1）',
                dont: '雙寫 editorStore.primaryOutput',
            },
            {
                symbol: 'rotateDevice',
                module: '@/store/layoutStore',
                purpose: '單一設備設 rotation（0–3）；進 MachineRotation 歷史；原點／管線座標不動',
                callers: 'L2 快捷鍵旋轉（#78）；勿在 L2 自寫第二套',
                dont: '旋轉時改 position 或改寫管線 waypoints；勿因 overlap 擋寫入',
            },
            {
                symbol: 'addDevice／moveDevice',
                module: '@/store/layoutStore',
                purpose: '寫入類；僅 invalid 失敗；overlap 仍寫入（E001→layoutIssues）',
                callers: 'L2 落子／拖曳確認',
                dont: '把 PlacementResult.overlap 當寫入擋板（預檢 can* 仍可回 overlap）',
            },
            {
                symbol: 'addPipeline／removePipeline',
                module: '@/store/layoutStore',
                purpose:
                    '寫入／刪除管線；add 先跑 canConnect（失敗→invalid）再進歷史；remove 找不到或 id 不唯一→invalid',
                callers: 'L2 確認拉線／刪線',
                dont: '略過 canConnect 自寫第二套連線防線；把 UI 錯誤字串塞進 L1',
            },
            {
                symbol: 'toTopology（已映射欄位）',
                module: '@/utils/layout/toTopology',
                purpose:
                    'devices→FactoryNode；帶出 primaryOutput／sourceRatePerMin；machineType＝英文 id',
                callers: '引擎餵入（見 V17）',
                dont: '以為引擎會直接 watch layoutStore（接法＝經 adapter）',
            },
        ],
    },
    {
        version: 'V17',
        title: '機型 id 查表＋引擎切片＋歷史隔離',
        prs: '#74／#76（#73／#58）',
        oneLiner:
            '查定義 resolveMachineDef（id 優先）；配方仍用 name；toTopology 可測 30/min；正式頁不自動 fixture；跨正式／dev 清 history。',
        deeperDemo: {
            label: 'FlowEngine 測試頁',
            href: '/dev/flow-engine',
        },
        apis: [
            {
                symbol: 'resolveMachineDef',
                module: '@/data/machines',
                purpose: 'getMachineById ?? getMachine；過渡雙查',
                callers: '驗證 getDef、引擎、任何新碼查機型',
                dont: 'getRecipesForMachine(英文 id)；偵測器直接 getMachine',
            },
            {
                symbol: 'getRecipesForMachine(def.name, mode)',
                module: '@/data/products',
                purpose: '配方鍵＝中文名',
                callers: '驗證／引擎在 resolve 之後',
                dont: '把 machineType id 當配方鍵',
            },
            {
                symbol: 'toTopology → buildGraph／propagateFlows',
                module: '@/utils/layout/toTopology＋@/composables/useFlowEngine',
                purpose: '英文 id 快照可建圖算產耗（測試產線 30/min）',
                callers: '引擎掛載／單元測',
                dont: '正式頁自動 loadSnapshot(connected)（已廢）',
            },
            {
                symbol: 'historyContext／clear on navigate',
                module: '@/utils/history/*＋router',
                purpose: '／＝formal、／dev＝dev；跨界 history.clear()',
                callers: '已掛 router；呼叫端通常不用再清',
                dont: '以為獨立 HTML preview 與 SPA 共用 Pinia（其實分開）',
            },
        ],
    },
];

/** 試玩白名單 API（V21-C1；不含 canConnect） */
export type TryoutApiId = 'hitTestPortAt' | 'findPortAt';

/** 試玩用的固定裝置場景 */
export type TryoutFixtureId = 'crusher-origin' | 'splitters-adjacent';

/** 表單 prefer：空字串＝呼叫時不傳 */
export type TryoutPrefer = '' | 'input' | 'output';

/**
 * 一則情境快捷（灌進表單的預設參數）
 */
export interface TryoutScenario {
    /** 穩定 id */
    id: string;
    /** 按鈕文案 */
    label: string;
    /** 連續格 x，或 findPortAt 的整數格 x */
    x: number;
    /** 連續格 y，或 findPortAt 的整數格 y */
    y: number;
    /** 優先方向；空＝不傳 */
    prefer: TryoutPrefer;
    /** 這則快捷使用的裝置 */
    fixture: TryoutFixtureId;
    /** 給人讀的預期 */
    hint: string;
}

/**
 * 試玩白名單一項
 */
export interface TryoutApiDef {
    /** API id */
    id: TryoutApiId;
    /** 下拉顯示名 */
    label: string;
    /** 一句話 */
    summary: string;
    /** 至少兩則快捷 */
    scenarios: readonly TryoutScenario[];
}

/**
 * V21-C1 試玩白名單。
 *
 * 座標對齊既有一鍵案例：crusher@(0,0) 熱區 (0.5, 0.1)、頂邊 input[0] 錨點 (0,-1)；
 * 緊貼埠對埠為 splitter A@(0,0) 與 B@(1,0)，視覺點 (1, 0.5)。
 */
export const TRYOUT_APIS: readonly TryoutApiDef[] = [
    {
        id: 'hitTestPortAt',
        label: '滑鼠有沒有點到埠',
        summary:
            '模擬滑鼠點在某個位置，看會不會落進埠旁邊的圓形範圍。兩台機器的埠疊在同一點時，要指定優先找進料還是出料。程式裡叫 hitTestPortAt。',
        scenarios: [
            {
                id: 'hit-hot',
                label: '點在進料口旁邊',
                x: 0.5,
                y: 0.1,
                prefer: 'input',
                fixture: 'crusher-origin',
                hint: '粉碎機最左邊的進料口在機器頂邊上。這個小數點落在它旁邊的範圍裡，所以會找到 c 的第 1 個進料口。',
            },
            {
                id: 'hit-prefer-out',
                label: '兩埠重疊，優先出料',
                x: 1,
                y: 0.5,
                prefer: 'output',
                fixture: 'splitters-adjacent',
                hint: '左邊機器的出料口和右邊機器的進料口，畫面上是同一個點。指定優先出料，就會選到 a，不會因為機器的排列順序而換邊。',
            },
            {
                id: 'hit-prefer-in',
                label: '同一點，優先進料',
                x: 1,
                y: 0.5,
                prefer: 'input',
                fixture: 'splitters-adjacent',
                hint: '還是同一個點。改成優先進料，就會選到 b 的進料口。拉線時，起點通常優先出料，放開時優先進料。',
            },
        ],
    },
    {
        id: 'findPortAt',
        label: '這個格子能不能接管子',
        summary:
            '看這個整數格子是不是某台機器外面、用來接管子的那一格。小數點的滑鼠位置通常對不到，結果會是空的。程式裡叫 findPortAt。',
        scenarios: [
            {
                id: 'find-anchor',
                label: '正好是進料的端點格',
                x: 0,
                y: -1,
                prefer: 'input',
                fixture: 'crusher-origin',
                hint: '(0, -1) 是粉碎機頂邊第一個進料口外面的那一格。數字和表上完全一樣，所以對得到。',
            },
            {
                id: 'find-hot-null',
                label: '拿滑鼠的點去對端點',
                x: 0.5,
                y: 0.1,
                prefer: '',
                fixture: 'crusher-origin',
                hint: '(0.5, 0.1) 是滑鼠用的小數點，下面的表沒有這一格，所以結果是空的。滑鼠點得到，不代表管子能接在這裡。',
            },
        ],
    },
];
