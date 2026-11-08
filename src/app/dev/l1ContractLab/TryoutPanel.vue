<script setup lang="ts">
/**
 * V21-C1 試玩表單。
 *
 * 選白名單 API、灌情境快捷、改有限欄位後真呼叫。結果交給父層的 JSON 面板。
 */
import { computed, ref } from 'vue';
import {
    TRYOUT_APIS,
    type TryoutApiId,
    type TryoutFixtureId,
    type TryoutPrefer,
    type TryoutScenario,
} from '@/app/dev/l1ContractLab/contractCatalog';
import { anchorsForFixture, fixtureCaption, runTryout } from '@/app/dev/l1ContractLab/tryoutRun';

/** 父層寫入共用輸出面板 */
const emit = defineEmits<{
    result: [payload: { title: string; value: unknown }];
}>();

/** 白名單 */
const apis = TRYOUT_APIS;

/** 目前 API */
const apiId = ref<TryoutApiId>(apis[0]!.id);

/** 目前快捷；空＝使用者改過、未再點快捷 */
const scenarioId = ref(apis[0]!.scenarios[0]!.id);

/** 查詢 x */
const x = ref(apis[0]!.scenarios[0]!.x);

/** 查詢 y */
const y = ref(apis[0]!.scenarios[0]!.y);

/** prefer；空字串＝不傳 */
const prefer = ref<TryoutPrefer>(apis[0]!.scenarios[0]!.prefer);

/** 目前快捷所屬裝置；改 API 時一併換 */
const fixture = ref<TryoutFixtureId>(apis[0]!.scenarios[0]!.fixture);

/** 最近一次快捷說明 */
const hint = ref(apis[0]!.scenarios[0]!.hint);

/** 座標不是數字時的提示；空＝可執行 */
const fieldError = ref('');

/** 給人讀的這次答案；完整資料仍在頁面下方 */
const lastPlain = ref('還沒問。先點一個範例，或填好位置後再問一次。');

/**
 * 錨點表上的埠，用第幾個進料／出料口來說。
 *
 * @param portType 進料或出料
 * @param portIndex 從 0 開始的編號
 */
function portPhrase(portType: 'input' | 'output', portIndex: number): string {
    const kind = portType === 'input' ? '進料' : '出料';
    return `第 ${portIndex + 1} 個${kind}口`;
}

/** 目前 API 定義 */
const activeApi = computed(() => apis.find((item) => item.id === apiId.value) ?? apis[0]!);

/** 目前裝置的外側錨點（唯讀） */
const anchorRows = computed(() => anchorsForFixture(fixture.value));

/** 裝置說明 */
const caption = computed(() => fixtureCaption(fixture.value));

/**
 * 把快捷灌進表單並立刻真呼叫。
 *
 * @param scenario 白名單內的一則
 */
function applyScenario(scenario: TryoutScenario) {
    scenarioId.value = scenario.id;
    x.value = scenario.x;
    y.value = scenario.y;
    prefer.value = scenario.prefer;
    fixture.value = scenario.fixture;
    hint.value = scenario.hint;
    execute();
}

/**
 * 換成另一支 API，並灌入它的第一則快捷。
 *
 * @param event 下拉的 change
 */
function onApiChange(event: Event) {
    const next = (event.target as HTMLSelectElement).value as TryoutApiId;
    apiId.value = next;
    const first = apis.find((item) => item.id === next)?.scenarios[0];
    if (!first) {
        return;
    }
    applyScenario(first);
}

/**
 * 用表單現值呼叫 API。座標無效時不打函式。
 */
function execute() {
    const xNum = typeof x.value === 'number' ? x.value : Number(x.value);
    const yNum = typeof y.value === 'number' ? y.value : Number(y.value);
    if (!Number.isFinite(xNum) || !Number.isFinite(yNum)) {
        fieldError.value = '橫向和縱向都要填數字。';
        lastPlain.value = fieldError.value;
        emit('result', {
            title: '試玩 · 位置還沒填好',
            value: { plain: fieldError.value, x: x.value, y: y.value },
        });
        return;
    }
    fieldError.value = '';
    const ran = runTryout({
        api: apiId.value,
        x: xNum,
        y: yNum,
        prefer: prefer.value,
        fixture: fixture.value,
        hint: hint.value,
    });
    const body = ran.value as { plain?: string };
    lastPlain.value = body.plain ?? '';
    emit('result', ran);
}
</script>

<template>
    <div class="space-y-4">
        <div
            class="rounded-lg border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900 dark:bg-blue-950/40"
        >
            <h2 class="text-lg font-semibold">試玩：滑鼠點到的埠，和管子接的格子</h2>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                這兩件事常被當成同一件事。滑鼠是看「點在埠旁邊的圓形範圍裡嗎」。接管子是看「是不是機器外面那一個整數格」。
            </p>
            <ol class="mt-3 list-decimal space-y-1 pl-5 text-sm text-gray-700 dark:text-gray-300">
                <li>選一個要問的問題。</li>
                <li>點一個範例。它會填好位置，並在下面寫出答案。</li>
                <li>想自己試，就改數字，再按「再問一次」。完整資料在這頁最下方。</li>
            </ol>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
            <label class="block text-sm">
                <span class="mb-1 block font-medium">要問的問題</span>
                <select
                    :value="apiId"
                    class="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 dark:border-gray-600 dark:bg-gray-900"
                    @change="onApiChange"
                >
                    <option v-for="item in apis" :key="item.id" :value="item.id">
                        {{ item.label }}
                    </option>
                </select>
                <span class="mt-1 block text-xs text-gray-500">{{ activeApi.summary }}</span>
            </label>
            <label class="block text-sm">
                <span class="mb-1 block font-medium">優先找哪一種埠</span>
                <select
                    v-model="prefer"
                    class="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 dark:border-gray-600 dark:bg-gray-900"
                >
                    <option value="">不指定</option>
                    <option value="input">進料（input）</option>
                    <option value="output">出料（output）</option>
                </select>
                <span class="mt-1 block text-xs text-gray-500">
                    兩個埠疊在同一點時才有差。拉線的起點通常優先出料，放開時優先進料。
                </span>
            </label>
            <label class="block text-sm">
                <span class="mb-1 block font-medium">橫向 x（格）</span>
                <input
                    v-model.number="x"
                    type="number"
                    step="0.1"
                    class="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 dark:border-gray-600 dark:bg-gray-900"
                />
            </label>
            <label class="block text-sm">
                <span class="mb-1 block font-medium">縱向 y（格）</span>
                <input
                    v-model.number="y"
                    type="number"
                    step="0.1"
                    class="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 dark:border-gray-600 dark:bg-gray-900"
                />
            </label>
            <p class="text-xs text-gray-500 sm:col-span-2">
                原點在機器佔用範圍的左上角。往右，橫向變大；往下，縱向變大。滑鼠可以用小數，接管子的格子必須是整數。
            </p>
        </div>

        <div>
            <h3 class="mb-1 text-sm font-semibold">範例</h3>
            <p class="mb-2 text-xs text-gray-500">
                點下去會填好數字並回答。改完數字後，用右邊的按鈕再問一次。
            </p>
            <div class="flex flex-wrap gap-2">
                <button
                    v-for="scenario in activeApi.scenarios"
                    :key="scenario.id"
                    type="button"
                    class="rounded-lg px-3 py-1.5 text-sm font-medium"
                    :class="
                        scenarioId === scenario.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200'
                    "
                    @click="applyScenario(scenario)"
                >
                    {{ scenario.label }}
                </button>
                <button
                    type="button"
                    class="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
                    @click="execute"
                >
                    再問一次
                </button>
            </div>
            <p v-if="hint" class="mt-2 text-sm text-gray-600 dark:text-gray-400">{{ hint }}</p>
            <p v-if="fieldError" class="mt-2 text-sm text-red-700 dark:text-red-300">
                {{ fieldError }}
            </p>
        </div>

        <div
            class="rounded-lg border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900 dark:bg-emerald-950/40"
        >
            <h3 class="text-sm font-semibold">這次的答案</h3>
            <p class="mt-1 text-sm text-gray-800 dark:text-gray-100">{{ lastPlain }}</p>
        </div>

        <div class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <h3 class="text-sm font-semibold">這次用的機器</h3>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {{ caption }}機器是固定的，避免例子對不上。
            </p>
            <h4 class="mt-3 text-sm font-medium">接管子用的格子（只能看）</h4>
            <p class="mt-1 text-xs text-gray-500">
                每一列是「機器外面、緊鄰的一整格」。滑鼠的圓形範圍在機器邊上，不在這張表裡。
            </p>
            <ul class="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <li
                    v-for="row in anchorRows"
                    :key="`${row.deviceId}-${row.portType}-${row.portIndex}`"
                >
                    {{ row.deviceId }} 的{{ portPhrase(row.portType, row.portIndex) }} → 格子 ({{
                        row.x
                    }}, {{ row.y }})
                </li>
            </ul>
        </div>
    </div>
</template>
