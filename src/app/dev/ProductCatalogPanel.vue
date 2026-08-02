<script setup lang="ts">
/**
 * V9-B2／D1：產品／材料目錄＋最短反向鏈路預覽
 */
import { computed, ref, watch } from 'vue';
import { getAllMaterials } from '@/data/materials';
import { getAllProducts } from '@/data/products';
import type { ItemForm } from '@/types/flow';
import {
    collectLeafMaterials,
    countRecipeSteps,
    findShortestReverseChain,
    type ChainNode,
} from '@/utils/reverseChain';

type CatalogKind = 'material' | 'product';

interface CatalogRow {
    key: string;
    kind: CatalogKind;
    id: string;
    name: string;
    form: ItemForm;
    recipeCount: number;
    payload: unknown;
}

const materials = getAllMaterials();
const products = getAllProducts();

const kindFilter = ref<CatalogKind>('product');
const filter = ref('');

const rows = computed((): CatalogRow[] => {
    if (kindFilter.value === 'material') {
        return materials.map((m) => ({
            key: `mat:${m.id}`,
            kind: 'material' as const,
            id: m.id,
            name: m.name,
            form: m.form,
            recipeCount: 0,
            payload: m,
        }));
    }
    return products.map((p) => ({
        key: `prod:${p.id}`,
        kind: 'product' as const,
        id: p.id,
        name: p.name,
        form: p.form,
        recipeCount: p.recipes.length,
        payload: {
            id: p.id,
            name: p.name,
            form: p.form,
            recipes: p.recipes,
        },
    }));
});

const selectedKey = ref(rows.value[0]?.key ?? '');

watch(kindFilter, () => {
    selectedKey.value = rows.value[0]?.key ?? '';
});

const filtered = computed(() => {
    const q = filter.value.trim().toLowerCase();
    return rows.value.filter((r) => {
        if (!q) return true;
        return (
            r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q) || r.form.includes(q)
        );
    });
});

const selected = computed(() => rows.value.find((r) => r.key === selectedKey.value) ?? null);

const jsonText = computed(() =>
    selected.value ? JSON.stringify(selected.value.payload, null, 2) : '',
);

const reverseChain = computed((): ChainNode | null => {
    if (!selected.value || selected.value.kind !== 'product') return null;
    return findShortestReverseChain(selected.value.name);
});

const chainSteps = computed(() => (reverseChain.value ? countRecipeSteps(reverseChain.value) : 0));

const chainLeaves = computed(() =>
    reverseChain.value ? collectLeafMaterials(reverseChain.value) : [],
);

function formLabel(form: ItemForm): string {
    if (form === 'solid') return '固體';
    if (form === 'liquid') return '液體';
    return '氣體';
}

function formColor(form: ItemForm): string {
    if (form === 'solid') return '#a3a3a3';
    if (form === 'liquid') return '#38bdf8';
    return '#c4b5fd';
}

function selectRow(key: string) {
    selectedKey.value = key;
}

/** 樹狀文字列（縮排） */
function chainLines(node: ChainNode, depth = 0): string[] {
    const pad = '  '.repeat(depth);
    if (node.kind === 'material') {
        return [`${pad}• ${node.itemId}（材料）`];
    }
    const mode = node.recipe?.machineMode ? `/${node.recipe.machineMode}` : '';
    const env = node.recipe?.environment ? ` · env=${node.recipe.environment}` : '';
    const rate = node.ratePerMin != null ? ` · ${node.ratePerMin}/min` : '';
    const lines = [`${pad}• ${node.itemId} ← ${node.recipe?.machine ?? '?'}${mode}${rate}${env}`];
    for (const child of node.inputs ?? []) {
        lines.push(...chainLines(child, depth + 1));
    }
    return lines;
}

const chainText = computed(() =>
    reverseChain.value ? chainLines(reverseChain.value).join('\n') : '',
);
</script>

<template>
    <div class="grid gap-4 lg:grid-cols-[260px_1fr]">
        <div
            class="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
        >
            <div class="mb-2 flex flex-wrap gap-1">
                <button
                    v-for="k in [
                        { id: 'product' as const, label: '產品' },
                        { id: 'material' as const, label: '基礎材料' },
                    ]"
                    :key="k.id"
                    type="button"
                    class="rounded px-2 py-1 text-[10px] font-medium"
                    :class="
                        kindFilter === k.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                    "
                    @click="kindFilter = k.id"
                >
                    {{ k.label }}
                </button>
            </div>
            <p class="mb-2 text-[10px] text-gray-500 dark:text-gray-400">
                產品＝products.json；材料＝materials.json（不含假產品）
            </p>
            <input
                v-model="filter"
                type="search"
                placeholder="搜尋名稱／id／form…"
                class="mb-2 w-full rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-900"
            />
            <ul class="max-h-[28rem] space-y-0.5 overflow-y-auto text-xs">
                <li v-for="r in filtered" :key="r.key">
                    <button
                        type="button"
                        class="flex w-full items-center gap-2 rounded px-2 py-1 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                        :class="selectedKey === r.key ? 'bg-blue-50 dark:bg-blue-950' : ''"
                        @click="selectRow(r.key)"
                    >
                        <span
                            class="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
                            :style="{ background: formColor(r.form) }"
                            :title="formLabel(r.form)"
                        />
                        <span class="truncate font-medium">{{ r.name }}</span>
                        <span class="ml-auto shrink-0 text-[10px] text-gray-400">
                            {{ r.kind === 'product' ? `${r.recipeCount}配方` : r.form }}
                        </span>
                    </button>
                </li>
            </ul>
            <p class="mt-2 text-[10px] text-gray-400">{{ filtered.length }} 筆</p>
        </div>

        <div class="space-y-3">
            <div
                v-if="selected"
                class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
            >
                <div class="mb-3 flex flex-wrap items-center gap-3">
                    <div
                        class="flex h-16 w-16 items-center justify-center rounded text-xs font-bold text-white"
                        :style="{ background: formColor(selected.form) }"
                    >
                        {{ formLabel(selected.form) }}
                    </div>
                    <div>
                        <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
                            {{ selected.name }}
                        </h3>
                        <p class="text-xs text-gray-500">
                            {{ selected.kind === 'product' ? '產品' : '基礎材料' }} ·
                            {{ selected.id }} · form={{ selected.form }}
                        </p>
                    </div>
                </div>
                <div
                    v-if="selected.kind === 'product'"
                    class="mb-3 rounded-md border border-emerald-200 bg-emerald-50/80 p-3 dark:border-emerald-900 dark:bg-emerald-950/30"
                >
                    <h4 class="mb-1 text-xs font-semibold text-emerald-900 dark:text-emerald-100">
                        最短反向鏈路（V9-D1）
                    </h4>
                    <p
                        v-if="reverseChain"
                        class="mb-2 text-[10px] text-emerald-800/80 dark:text-emerald-200/70"
                    >
                        {{ chainSteps }} 步配方 · 葉材料：{{ chainLeaves.join('、') || '—' }}
                    </p>
                    <pre
                        v-if="reverseChain"
                        class="max-h-48 overflow-auto rounded bg-white/80 p-2 text-[11px] leading-relaxed whitespace-pre-wrap text-gray-800 dark:bg-zinc-900 dark:text-zinc-100"
                        >{{ chainText }}</pre
                    >
                    <p v-else class="text-[11px] text-amber-700 dark:text-amber-300">
                        無法推演（無可用配方或循環阻擋）
                    </p>
                </div>

                <h4 class="mb-1 text-xs font-semibold text-gray-700 dark:text-gray-200">JSON</h4>
                <pre
                    class="max-h-96 overflow-auto rounded bg-gray-50 p-3 text-[11px] dark:bg-gray-900"
                    >{{ jsonText }}</pre
                >
            </div>
            <p v-else class="text-sm text-gray-400">請選擇品項</p>
        </div>
    </div>
</template>
