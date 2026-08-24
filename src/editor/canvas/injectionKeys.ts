import type { InjectionKey, Ref } from 'vue';

/**
 * 畫布格線像素大小的 provide/inject key。
 *
 * `PipelineEdge.vue`（L3）依規則不得 import store，但管線折線的 Z 形中繼點
 * 要吸附格線需要 `canvasStore.gridSize`。改由 `FactoryCanvas.vue`（L2）
 * `provide` 這個 key，`PipelineEdge.vue` 用 `inject` 讀取，避免 L3 直接依賴 Pinia。
 */
export const PIPELINE_GRID_SIZE_KEY: InjectionKey<Ref<number>> = Symbol('pipelineGridSize');
