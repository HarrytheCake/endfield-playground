<script setup lang="ts">
import { computed } from 'vue';
import type { Position } from '@/types/euclideanSpace';
import { getPipelineTiles } from '@/utils/layout/pipelineTiles';
import type { PipelineKind, TileShape } from '@/utils/layout/pipelineTiles';
import beltStraightUrl from '@/assets/icon/Line straight.svg';
import beltCurveUrl from '@/assets/icon/Line Curve.svg';
import pipeStraightUrl from '@/assets/icon/pipe straight.svg';
import pipeCurveUrl from '@/assets/icon/pipe Curve.svg';

const props = defineProps<{
    /** 管線路徑（格座標，依序連接起點埠、彎折點與終點埠）；必須沿軸走 */
    waypoints: Position[];
    /** 管線種類，決定使用哪組素材 */
    kind: PipelineKind;
    /** 單格邊長（像素）；素材原尺寸為 45，會依此縮放 */
    cellSize: number;
}>();

/** 種類 × 形狀 → 素材網址 */
const ASSET_URLS: Record<PipelineKind, Record<TileShape, string>> = {
    belt: { straight: beltStraightUrl, curve: beltCurveUrl },
    pipe: { straight: pipeStraightUrl, curve: pipeCurveUrl },
};

/** 逐格素材換成 SVG：定位到該格，旋轉以格中心為軸；翻轉先於旋轉 */
const images = computed(() =>
    getPipelineTiles(props.waypoints, props.kind).map((tile) => {
        const size = props.cellSize;
        const half = size / 2;
        const flip = tile.mirrored ? ` translate(${size} 0) scale(-1 1)` : '';
        return {
            key: `${tile.x},${tile.y}`,
            url: ASSET_URLS[props.kind][tile.shape],
            transform: `translate(${tile.x * size} ${tile.y * size}) rotate(${tile.rotate} ${half} ${half})${flip}`,
        };
    }),
);
</script>

<template>
    <g data-testid="pipeline-shape" :data-kind="props.kind">
        <image
            v-for="image in images"
            :key="image.key"
            :href="image.url"
            :width="props.cellSize"
            :height="props.cellSize"
            :transform="image.transform"
        />
    </g>
</template>
