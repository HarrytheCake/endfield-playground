<script setup lang="ts">
/**
 * V8-B2：產品／材料目錄 — 列表／JSON／form 色塊 placeholder
 */
import { computed, ref } from 'vue';
import { getAllMaterials } from '@/data/materials';
import { getAllProducts } from '@/data/products';
import type { ItemForm } from '@/types/flow';

type CatalogKind = 'all' | 'material' | 'product';

interface CatalogRow {
    key: string;
    kind: 'material' | 'product';
    id: string;
    name: string;
    form: ItemForm;
    recipeCount: number;
    /** 序列化用原始物件 */
    payload: unknown;
}

const materials = getAllMaterials();
const products = getAllProducts();

const materialNames = new Set(materials.map((m) => m.name));

const rows = computed((): CatalogRow[] => {
    const list: CatalogRow[] = [];
    for (const m of materials) {
        list.push({
            key: `mat:${m.id}`,
            kind: 'material',
            id: m.id,
            name: m.name,
            form: m.form,
            recipeCount: 0,
            payload: m,
        });
    }
    for (const p of products) {
        // 材料已以 materials 列展示時，產品列仍保留（含配方）；標成 product
        list.push({
            key: `prod:${p.id}`,
            kind: 'product',
            id: p.id,
            name: p.name,
            form: p.form,
            recipeCount: p.recipes.length,
            payload: {
                id: p.id,
                name: p.name,
                form: p.form,
                alsoMaterial: materialNames.has(p.name),
                recipes: p.recipes,
            },
        });
    }
    return list;
});

const kindFilter = ref<CatalogKind>('all');
const filter = ref('');
const selectedKey = ref(rows.value[0]?.key ?? '');

const filtered = computed(() => {
    const q = filter.value.trim().toLowerCase();
    return rows.value.filter((r) => {
        if (kindFilter.value === 'material' && r.kind !== 'material') return false;
        if (kindFilter.value === 'product' && r.kind !== 'product') return false;
        if (!q) return true;
        return (
            r.name.toLowerCase().includes(q) ||
            r.id.toLowerCase().includes(q) ||
            r.form.includes(q)
        );
    });
});

const selected = computed(() => rows.value.find((r) => r.key === selectedKey.value) ?? null);

const jsonText = computed(() =>
    selected.value ? JSON.stringify(selected.value.payload, null, 2) : '',
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
</script>

<template>
    <div class="grid gap-4 lg:grid-cols-[260px_1fr]">
        <div
            class="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
        >
            <div class="mb-2 flex flex-wrap gap-1">
                <button
                    v-for="k in [
                        { id: 'all' as const, label: '全部' },
                        { id: 'material' as const, label: '材料' },
                        { id: 'product' as const, label: '產品' },
                    ]"
                    :key="k.id"
                    type="button"
                    class="rounded px-2 py-1 text-[10px] font-medium"
                    :class="
                        kindFilter === k.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                    "
                    @click="kindFilter = k.id"
                >
                    {{ k.label }}
                </button>
            </div>
            <input
                v-model="filter"
                type="search"
                placeholder="搜尋名稱／id／form"
                class="mb-2 w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            />
            <p class="mb-2 text-[10px] text-gray-500">
                顯示 {{ filtered.length }}（材料 {{ materials.length }} · 產品 {{ products.length }}）
            </p>
            <ul class="max-h-[520px] space-y-0.5 overflow-y-auto text-xs">
                <li v-for="r in filtered" :key="r.key">
                    <button
                        type="button"
                        class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors"
                        :class="
                            selectedKey === r.key
                                ? 'bg-blue-100 font-medium text-blue-900 dark:bg-blue-900/40 dark:text-blue-100'
                                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                        "
                        @click="selectRow(r.key)"
                    >
                        <span
                            class="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
                            :style="{ background: formColor(r.form) }"
                            :title="r.form"
                        />
                        <span class="min-w-0 flex-1">
                            <span class="block truncate">{{ r.name }}</span>
                            <span class="block truncate text-[10px] text-gray-500">
                                {{ r.kind === 'material' ? '材料' : '產品' }}
                                · {{ r.form }}
                                <template v-if="r.kind === 'product'">
                                    · {{ r.recipeCount }} 配方
                                </template>
                            </span>
                        </span>
                    </button>
                </li>
            </ul>
        </div>

        <div v-if="selected" class="space-y-4">
            <div
                class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
            >
                <div class="flex flex-wrap items-start gap-4">
                    <!-- placeholder 視覺：色塊＋form 標籤（正式圖後補） -->
                    <div
                        class="flex h-28 w-28 shrink-0 flex-col items-center justify-center rounded-md border border-dashed border-gray-300 dark:border-gray-600"
                        :style="{ background: formColor(selected.form) + '33' }"
                    >
                        <div
                            class="mb-2 h-12 w-12 rounded"
                            :style="{ background: formColor(selected.form) }"
                        />
                        <span class="text-[10px] font-medium text-gray-700 dark:text-gray-200">
                            {{ formLabel(selected.form) }}
                        </span>
                        <span class="font-mono text-[9px] text-gray-500">{{ selected.form }}</span>
                    </div>
                    <div class="min-w-0 flex-1 space-y-1">
                        <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
                            {{ selected.name }}
                        </h3>
                        <p class="font-mono text-[11px] text-gray-500">{{ selected.id }}</p>
                        <p class="text-xs text-gray-600 dark:text-gray-400">
                            類型：{{ selected.kind === 'material' ? '基礎材料' : '產品／配方載體' }}
                        </p>
                        <p class="text-xs text-gray-600 dark:text-gray-400">
                            form（物態）：
                            <span class="font-medium">{{ selected.form }}</span>
                            （{{ formLabel(selected.form) }}）→
                            {{ selected.form === 'solid' ? 'belt' : 'pipe' }}
                        </p>
                        <p v-if="selected.kind === 'product'" class="text-xs text-gray-600 dark:text-gray-400">
                            配方數：{{ selected.recipeCount }}
                        </p>
                        <p class="text-[10px] text-gray-400">圖像 placeholder；正式美術後補</p>
                    </div>
                </div>
            </div>

            <div
                class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
            >
                <h4 class="mb-2 text-xs font-semibold text-gray-900 dark:text-white">JSON</h4>
                <pre
                    class="max-h-[420px] overflow-auto rounded bg-zinc-900 p-3 text-[11px] leading-relaxed text-zinc-100"
                >{{ jsonText }}</pre>
            </div>
        </div>
    </div>
</template>
