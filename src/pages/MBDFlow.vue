<template>
    <div class="mbd-flow-page">
        <header class="game-header">
            <div class="header-left">
                <span class="header-logo">🪐 AIC_MATRIX_BUILDER_V1.0</span>
                <span class="zone-badge">武陵工業園區前哨站</span>
            </div>
            <div class="header-center">
                <label class="control-label">當前 AIC 園區生產目標：</label>
                <select class="recipe-picker" v-model="selectedRecipe">
                    <optgroup label="⚙️ 1. 精煉爐配方 (Stage 1 基礎板材)">
                        <option value="iron_plate">工業鐵板 (粗鐵礦 × 2 ➔ 鐵板 × 1)</option>
                        <option value="copper_wire">整合導線 (粗銅礦 × 1 ➔ 導線 × 2)</option>
                        <option value="carbon_block">穩定化碳塊 (天然木材 × 1 ➔ 碳塊 × 1)</option>
                        <option value="originium_block">
                            源石精煉塊 (源石粉末 × 1 ➔ 精煉塊 × 1)
                        </option>
                    </optgroup>
                    <optgroup label="🌀 2. 粉碎與研磨機系列">
                        <option value="sand_powder">沙葉粉 (野生沙葉 × 1 ➔ 沙葉粉 × 1)</option>
                        <option value="wheat_powder">灰蘆麥粉 (原株灰蘆麥 × 1 ➔ 麥粉 × 1)</option>
                        <option value="copper_powder">赤銅塊粉 (粗銅礦原石 × 1 ➔ 銅粉 × 1)</option>
                    </optgroup>
                    <optgroup label="🔷 3. 組合加工廠 (Stage 2 多級匯流合成)">
                        <option value="aic_core">
                            AIC 自動化核心 (鐵板 × 1 + 導線 × 2 ➔ 核心 × 1)
                        </option>
                        <option value="battery">
                            高能電池模組 (碳塊 × 2 + 導線 × 3 ➔ 電池 × 1)
                        </option>
                        <option value="ori_component">
                            源石集成構件 (精煉塊 × 3 + 導線 × 2 ➔ 構件 × 1)
                        </option>
                        <option value="steel_bottle">鋼製空瓶 (工業鐵板 × 2 ➔ 空瓶 × 1)</option>
                    </optgroup>
                    <optgroup label="🚰 4. 灌裝反應池 (流體工業)">
                        <option value="water_bottle">
                            裝瓶清水 (空瓶 × 1 + 清水 × 10 ➔ 裝瓶水 × 1)
                        </option>
                        <option value="stimulant">
                            戰術過載針劑 (空瓶 × 1 + 麥粉 × 1 ➔ 針劑 × 1)
                        </option>
                    </optgroup>
                    <optgroup label="🌱 5. 生態種植機 (農業自動化)">
                        <option value="rye_seed">灰蘆麥種子 (灰蘆麥 × 1 ➔ 種子 × 2)</option>
                    </optgroup>
                </select>
            </div>
            <div class="header-right">
                <div class="status-indicator">
                    全網電網狀態：<span>{{ globalStatus }}</span>
                </div>
                <div class="grid-control-group">
                    <button
                        class="grid-toggle-btn"
                        :class="{ active: gridVisible }"
                        @click="toggleGrid"
                    >
                        格線：{{ gridVisible ? '開' : '關' }}
                    </button>
                    <div class="grid-size-label">格線間距：100px</div>
                </div>
            </div>
        </header>

        <main class="editor-container">
            <div class="view-switcher-leftbottom">
                <button class="switch-icon-btn">⚒️ 藍圖視角</button>
                <button class="switch-icon-btn">📊 流量視角</button>
                <button class="switch-icon-btn active">田 並列視角</button>
            </div>

            <div class="workspace-layout dir-row" id="workspace-layout">
                <div class="view-panel" id="panel-blueprint" style="flex: 60%">
                    <div class="panel-header">
                        <span>📐 3D 俯視沙盒畫布</span>
                        <span class="panel-hint">⚡ 點擊開啟全線超頻 (100%)</span>
                    </div>

                    <div class="sandbox-viewport">
                        <div class="zoom-overlay">
                            <button class="zoom-btn">＋</button>
                            <button class="zoom-btn">－</button>
                            <button class="zoom-btn">重置鏡頭</button>
                        </div>
                        <div
                            :class="[
                                'sandbox-transform-layer',
                                { 'grid-visible': gridVisible, 'grid-hidden': !gridVisible },
                            ]"
                        >
                            <svg class="conveyor-svg-layer"></svg>
                        </div>
                    </div>
                </div>

                <div class="resizer-bar">
                    <button class="dir-toggle-btn">⇄</button>
                </div>

                <div class="view-panel" id="panel-flow" style="flex: 40%">
                    <div class="panel-header">📊 園區生產網路實時數據</div>
                    <div class="data-panel">
                        <div class="data-card">
                            <div class="card-title">一級源 A 總出力</div>
                            <div class="card-val">{{ statSupplyA }}</div>
                        </div>
                        <div class="data-card">
                            <div class="card-title">一級源 B 總出力</div>
                            <div class="card-val">{{ statSupplyB }}</div>
                        </div>
                        <div class="data-card">
                            <div class="card-title">最終成品總產出率</div>
                            <div class="card-val">{{ statFinal }}</div>
                        </div>
                        <div class="data-card network-report-card">
                            <div class="card-title">AIC 全域網絡動態綜合評估報告</div>
                            <div class="card-val">{{ reportText }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <footer class="game-bottom-bar">
            <div class="bar-item active">🔍 檢視/平移地圖</div>
            <div class="bar-item">🏭 建造：精煉爐設備</div>
            <div class="bar-item">🔷 建造：組合加工廠</div>
            <div class="bar-item">📦 建造：儲存終端</div>
            <div class="bar-item">🔗 傳送帶自由拉線</div>
            <div class="bar-item mode-delete">💥 拆除回收模式</div>
        </footer>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const selectedRecipe = ref('aic_core');
const globalStatus = ref('正常運轉');
const gridVisible = ref(true);
const statSupplyA = ref('0 /min');
const statSupplyB = ref('0 /min');
const statFinal = ref('0 /min');
const reportText = ref('偵測中...');

function toggleGrid() {
    gridVisible.value = !gridVisible.value;
}

onMounted(() => {
    // TODO: 若要整合原先的 `recipes.js` / `app.js`，在此將它們模組化並注入。
});
</script>

<style scoped>
/* 從 docs/MBD/style.css 提取的主要樣式（已簡化以適配元件） */
:root {
    --bg-dark: #07090d;
    --panel-bg: #121620;
    --panel-border: #3b4659;
    --accent-orange: #ff6b00;
    --accent-blue: #00e5ff;
    --accent-green: #a3e635;
    --status-grey: #64748b;
    --text-main: #e2e8f0;
    --text-muted: #8a99ad;
    --warn-red: #ef4444;
    --game-grid: #1b1e19;
}
.mbd-flow-page {
    color: var(--text-main);
    font-family: 'Segoe UI', 'Microsoft JhengHei', sans-serif;
    height: 100vh;
    display: flex;
    flex-direction: column;
    padding: 15px;
    box-sizing: border-box;
    background: var(--bg-dark);
}
.game-header {
    display: flex;
    background: #0f121a;
    padding: 12px 20px;
    border-radius: 6px;
    border: 2px solid var(--panel-border);
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
}
.header-left {
    display: flex;
    align-items: center;
    gap: 15px;
}
.header-logo {
    font-size: 24px;
    font-weight: 700;
    letter-spacing: 2px;
    color: #fff;
}
.zone-badge {
    background: #1c2433;
    padding: 4px 10px;
    font-size: 14px;
    border-radius: 4px;
    border: 1px solid var(--accent-blue);
    color: var(--accent-blue);
    font-weight: 700;
}
.control-label {
    font-size: 18px;
    font-weight: 700;
    color: var(--accent-blue);
}
.recipe-picker {
    background: #000;
    color: #fff;
    border: 2px solid var(--accent-orange);
    padding: 8px 12px;
    font-size: 18px;
    border-radius: 4px;
}
.header-right {
    display: flex;
    align-items: center;
    gap: 16px;
}
.grid-control-group {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(2, 14, 28, 0.85);
    border: 1px solid var(--panel-border);
    padding: 8px 10px;
    border-radius: 8px;
}
.grid-toggle-btn {
    background: #15202b;
    color: #8ab4f8;
    border: 1px solid #2b3a50;
    padding: 7px 12px;
    border-radius: 6px;
    cursor: pointer;
}
.grid-toggle-btn.active {
    background: var(--accent-blue);
    color: #000;
    border-color: var(--accent-blue);
}
.editor-container {
    position: relative;
    flex: 1;
    display: flex;
    background: #151924;
    border: 2px solid var(--panel-border);
    border-radius: 8px;
    overflow: hidden;
}
.workspace-layout {
    display: flex;
    width: 100%;
    height: 100%;
    position: relative;
}
.workspace-layout.dir-row {
    flex-direction: row;
}
.view-panel {
    background: var(--panel-bg);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
}
.panel-header {
    padding: 12px 20px;
    background: #181f2d;
    font-size: 18px;
    font-weight: 700;
    border-bottom: 2px solid var(--panel-border);
    color: var(--accent-blue);
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.sandbox-viewport {
    flex: 1;
    position: relative;
    overflow: hidden;
    background-color: var(--game-grid);
    cursor: grab;
}
.sandbox-transform-layer {
    position: absolute;
    width: 4000px;
    height: 4000px;
    top: -1500px;
    left: -1500px;
    transform-origin: 0 0;
}
.sandbox-transform-layer.grid-visible {
    --grid-size: 130px;
    background-image:
        linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px);
    background-size: var(--grid-size) var(--grid-size);
}
.zoom-overlay {
    position: absolute;
    top: 15px;
    left: 15px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    z-index: 500;
}
.zoom-btn {
    background: rgba(15, 17, 21, 0.95);
    border: 2px solid var(--panel-border);
    color: #fff;
    width: 44px;
    height: 44px;
    font-size: 22px;
    font-weight: 700;
    border-radius: 4px;
    cursor: pointer;
}
.data-panel {
    flex: 1;
    background: #0a0d14;
    padding: 25px;
    display: flex;
    flex-direction: column;
    gap: 15px;
    overflow-y: auto;
}
.data-card {
    background: #161c26;
    padding: 18px;
    border-radius: 6px;
    border-left: 6px solid var(--status-grey);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}
.card-title {
    font-size: 16px;
    color: var(--text-muted);
    margin-bottom: 6px;
    font-weight: 700;
}
.card-val {
    font-size: 26px;
    font-weight: 700;
    color: var(--accent-orange);
}
.game-bottom-bar {
    background: #0f121a;
    border: 2px solid var(--panel-border);
    border-radius: 6px;
    padding: 12px;
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-top: 12px;
}
.bar-item {
    background: #1c2433;
    border: 1px solid #3b485e;
    color: var(--text-muted);
    padding: 10px 20px;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    border-radius: 4px;
}
.bar-item.active {
    border-color: var(--accent-orange);
    color: #fff;
    background: var(--accent-orange);
    box-shadow: 0 0 12px rgba(255, 107, 0, 0.5);
}
</style>
