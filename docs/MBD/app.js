/**
 * =========================================================================
 * ⚙️ Module 4/4：自由拖曳拉線與沙盒鏡頭縮放 JS 控制核心 (app.js)
 * =========================================================================
 * 負責處理滑鼠變換、沙盒自由建造、一鍵拆除，
 * 以及多級設備之間自由點選並自動畫出動態傳送帶物流線的控制。
 */

const EndfieldApp = {
    // 1. 全域沙盒互動與連線狀態管理 (Pinia 精神資料共用)
    state: {
        actionMode: 'view',      // 當前滑鼠功能：view(平移), add-refinery, add-assembly, add-hub, link(拉線), delete(拆除)
        linkSourceId: null,       // 拉線模式下，被點選的第一台起點機器 ID
        isOverclock: false,      // 是否開啟全線超頻 200% 加速
        currentRecipe: 'aic_core',// 當前選擇的全域生產配方 ID
        
        // 沙盒初始內建的 3 台實機設備 (坐標定位在畫布中央)
        buildings: [
            { id: 1, type: 'refinery', subType: 'sourceA', x: 1600, y: 1600, name: '精煉爐 A' },
            { id: 2, type: 'refinery', subType: 'sourceB', x: 1600, y: 1780, name: '精煉爐 B' },
            { id: 3, type: 'assembly', subType: 'none', x: 1950, y: 1690, name: '組合組裝廠' }
        ],
        // 自由拉線建立的傳送帶拓撲清單
        connections: [
            { from: 1, to: 3 },
            { from: 2, to: 3 }
        ],
        nextId: 4
    },

    // 2. 鏡頭與畫面平移控制變數
    camera: {
        scale: 1.0,    // 當前畫布縮放比例
        panX: 0,       // 畫布在視口中的水平偏移
        panY: 0,       // 畫布在視口中的垂直偏移
        isDragging: false, // 是否正在以滑鼠拖曳方式平移視角
        startX: 0,     // 平移開始時的滑鼠 X 位置
        startY: 0      // 平移開始時的滑鼠 Y 位置
    },

    draggingBuildingId: null,
    draggingElement: null,
    dragOffsetX: 0,
    dragOffsetY: 0,
    dragMoved: false,
    // 預覽與網格配置
    previewEl: null,
    gridSize: 130,
    gridVisible: true,

    // 2.1 視角切換狀態
    viewModes: ['blueprint', 'flow', 'multi'],
    activeModeIdx: 2,

    // 3. 系統初始化啟動器
    init() {
        this.initCameraDOM();
        this.initResizerEngine();
        this.initDOMBinding();
        this.snapInitialBuildingsToGrid();
        this.renderAllBuildings();
        this.recalculatePipeline();
        this.updateGridStyle();
    },

    // 3.1 監聽滾輪縮放與滑鼠拖曳平移 (Pan & Zoom)
    initCameraDOM() {
        const viewport = document.getElementById('viewport');

        // A. 監聽滑鼠滾輪，執行平滑鏡頭縮放 (Zoom)
        //    這裡以視窗中心點為縮放焦點，補償平移量讓畫面不會因縮放而移動
        viewport.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomSpeed = 0.05;
            const oldScale = this.camera.scale;
            if (e.deltaY < 0) {
                this.camera.scale = Math.min(2.0, this.camera.scale + zoomSpeed);
            } else {
                this.camera.scale = Math.max(0.4, this.camera.scale - zoomSpeed);
            }
            const scaleDiff = this.camera.scale - oldScale;
            const layer = document.getElementById('transform-layer');
            const layerRect = layer.getBoundingClientRect();
            const viewportRect = viewport.getBoundingClientRect();
            const centerX = (viewportRect.left + viewportRect.width / 2) - layerRect.left;
            const centerY = (viewportRect.top + viewportRect.height / 2) - layerRect.top;
            this.camera.panX -= centerX * (scaleDiff / oldScale);
            this.camera.panY -= centerY * (scaleDiff / oldScale);
            this.applyCameraMatrix();
        });

        // B. 監聽滑鼠按下，執行畫布平移或自由建造
        viewport.addEventListener('mousedown', (e) => {
            if (e.target.closest('.placed-building')) return; // 點到建築物則交由建築物事件攔截

            if (this.state.actionMode === 'view') {
                this.camera.isDragging = true;
                this.camera.startX = e.clientX - this.camera.panX;
                this.camera.startY = e.clientY - this.camera.panY;
            } else if (this.state.actionMode.startsWith('add-')) {
                this.executeSandboxBuild(e);
            }
        });

        // 在 Add 模式下顯示預覽虛影並自動吸附至網格
        viewport.addEventListener('mousemove', (e) => {
            if (!this.state.actionMode.startsWith('add-')) return;
            const layerRect = document.getElementById('transform-layer').getBoundingClientRect();
            const absX = (e.clientX - layerRect.left) / this.camera.scale;
            const absY = (e.clientY - layerRect.top) / this.camera.scale;

            const centerX = this.snapToGrid(absX);
            const centerY = this.snapToGrid(absY);
            const topLeftX = centerX - 65;
            const topLeftY = centerY - 65;

            this.showPreviewForMode(this.state.actionMode, topLeftX, topLeftY);
        });

        viewport.addEventListener('mouseleave', () => {
            this.removePreview();
        });

        window.addEventListener('mousemove', (e) => {
            if (this.draggingBuildingId !== null) {
                const layer = document.getElementById('transform-layer').getBoundingClientRect();
                const building = this.state.buildings.find(b => b.id === this.draggingBuildingId);
                if (building) {
                    let newX = (e.clientX - layer.left) / this.camera.scale - this.dragOffsetX;
                    let newY = (e.clientY - layer.top) / this.camera.scale - this.dragOffsetY;
                    const snapped = this.snapTopLeftToGrid(newX, newY);
                    const candidateX = Math.max(0, snapped.x);
                    const candidateY = Math.max(0, snapped.y);
                    if (!this.isOverlappingBuilding(candidateX, candidateY, building.id)) {
                        building.x = candidateX;
                        building.y = candidateY;
                        if (this.draggingElement) {
                            this.draggingElement.style.left = `${building.x}px`;
                            this.draggingElement.style.top = `${building.y}px`;
                        }
                    }
                    this.dragMoved = true;
                    this.renderConveyorBelts();
                }
                return;
            }

            if (!this.camera.isDragging) return;
            this.camera.panX = e.clientX - this.camera.startX;
            this.camera.panY = e.clientY - this.camera.startY;
            this.applyCameraMatrix();
        });

        window.addEventListener('mouseup', () => {
            if (this.draggingBuildingId !== null) {
                this.draggingBuildingId = null;
                this.draggingElement = null;
                document.body.style.cursor = 'default';
            }
            this.camera.isDragging = false;
        });

        // 縮放控制按鈕綁定
        document.getElementById('zoom-in').onclick = () => this.manuallyAdjustZoom(0.1);
        document.getElementById('zoom-out').onclick = () => this.manuallyAdjustZoom(-0.1);
        document.getElementById('zoom-reset').onclick = () => {
            this.camera.scale = 1.0; this.camera.panX = 0; this.camera.panY = 0;
            this.applyCameraMatrix();
        };
    },

    applyCameraMatrix() {
        const layer = document.getElementById('transform-layer');
        layer.style.transform = `translate(${this.camera.panX}px, ${this.camera.panY}px) scale(${this.camera.scale})`;
    },

    // 手動按鈕調整縮放時，要保留畫面中心不動，避免畫布跳動
    manuallyAdjustZoom(amount) {
        const oldScale = this.camera.scale;
        const newScale = Math.max(0.4, Math.min(2.0, this.camera.scale + amount));
        const scaleDiff = newScale - oldScale;
        if (scaleDiff === 0) return;

        const layer = document.getElementById('transform-layer');
        const layerRect = layer.getBoundingClientRect();
        const viewport = document.getElementById('viewport').getBoundingClientRect();
        const centerX = (viewport.left + viewport.width / 2) - layerRect.left;
        const centerY = (viewport.top + viewport.height / 2) - layerRect.top;

        // 使用視窗中心點計算補償，讓縮放時原本中心位置保持不動
        this.camera.panX -= centerX * (scaleDiff / oldScale);
        this.camera.panY -= centerY * (scaleDiff / oldScale);

        this.camera.scale = newScale;
        this.applyCameraMatrix();
    },

    // 3.2 綁定主選單、按鈕與 Tab 鍵輪替控制
    initDOMBinding() {
        // 全域配方選擇器連動
        document.getElementById('global-recipe-select').onchange = (e) => {
            this.state.currentRecipe = e.target.value;
            this.recalculatePipeline();
        };

        // 網格開關
        const gridToggle = document.getElementById('grid-toggle');
        if (gridToggle) {
            gridToggle.onclick = () => {
                this.gridVisible = !this.gridVisible;
                gridToggle.classList.toggle('active', this.gridVisible);
                gridToggle.textContent = this.gridVisible ? '格線：開' : '格線：關';
                this.updateGridStyle();
            };
        }

        // 5.1 左下角切換選項與 Tab 鍵連動
        const switcherMap = { 'sw-bp': 'blueprint', 'sw-fl': 'flow', 'sw-multi': 'multi' };
        Object.keys(switcherMap).forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) btn.onclick = () => this.setPanelVisibility(switcherMap[btnId]);
        });

        // 5.1 鍵盤 Tab 鍵全自動輪替
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault(); // 阻止瀏覽器預設焦點
                this.activeModeIdx = (this.activeModeIdx + 1) % this.viewModes.length;
                this.setPanelVisibility(this.viewModes[this.activeModeIdx]);
            }
            if (e.key === 'Escape') {
                this.switchActionMode('view');
            }
        });

        // 底部快捷按鈕選單切換
        const modeMap = {
            'mode-view': 'view',
            'mode-add-refinery': 'add-refinery',
            'mode-add-assembly': 'add-assembly',
            'mode-add-hub': 'add-hub',
            'mode-link': 'link',
            'mode-delete': 'delete'
        };
        Object.keys(modeMap).forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) btn.onclick = () => this.switchActionMode(modeMap[btnId]);
        });

        // 點擊全線超頻連動
        document.getElementById('overclock-btn').onclick = () => {
            this.state.isOverclock = !this.state.isOverclock;
            const btn = document.getElementById('overclock-btn');
            if (this.state.isOverclock) {
                btn.textContent = "🔥 全線超頻中 (200%) - 點擊還原";
                btn.style.color = "var(--accent-orange)";
            } else {
                btn.textContent = "⚡ 點擊全線超頻 (100%)";
                btn.style.color = "var(--accent-blue)";
            }
            this.recalculatePipeline();
        };
    },

    switchActionMode(mode) {
        this.state.actionMode = mode;
        this.state.linkSourceId = null; // 清除拉線暫存
        document.querySelectorAll('.game-bottom-bar .bar-item').forEach(b => b.classList.remove('active'));
        
        let targetBtnId = 'mode-view';
        if (mode === 'add-refinery') targetBtnId = 'mode-add-refinery';
        if (mode === 'add-assembly') targetBtnId = 'mode-add-assembly';
        if (mode === 'add-hub') targetBtnId = 'mode-add-hub';
        if (mode === 'link') targetBtnId = 'mode-link';
        if (mode === 'delete') targetBtnId = 'mode-delete';
        
        const targetBtn = document.getElementById(targetBtnId);
        if (targetBtn) targetBtn.classList.add('active');
        document.querySelectorAll('.placed-building').forEach(box => box.classList.remove('selected-src'));
        // 切換模式時如果離開 add-* 模式，移除放置預覽
        if (!mode.startsWith('add-')) this.removePreview();
    },

    // ==========================================
    // 4. 自由沙盒建造與一鍵拆除回收演算法
    // ==========================================
    executeSandboxBuild(e) {
        const layer = document.getElementById('transform-layer').getBoundingClientRect();
        // 考慮目前畫布的平移 (Pan) 與縮放 (Zoom) 權重，精準算出絕對圖層坐標
        const absoluteX = (e.clientX - layer.left) / this.camera.scale;
        const absoluteY = (e.clientY - layer.top) / this.camera.scale;

        let type = 'refinery'; let name = '精煉爐'; let subType = 'sourceA';
        if (this.state.actionMode === 'add-assembly') { type = 'assembly'; name = '組合加工廠'; subType = 'none'; }
        if (this.state.actionMode === 'add-hub') { type = 'hub'; name = '儲存終端'; subType = 'none'; }

        // 使用網格吸附：將中心吸附到網格單位，再轉為左上角
        const centerX = this.snapToGrid(absoluteX);
        const centerY = this.snapToGrid(absoluteY);
        const x = centerX - 65;
        const y = centerY - 65;

        if (!this.isOverlappingBuilding(x, y)) {
            this.state.buildings.push({
                id: this.state.nextId++,
                type: type,
                subType: subType,
                x: x,
                y: y,
                name: name
            });

            // 移除預覽
            this.removePreview();

            this.renderAllBuildings();
            this.recalculatePipeline();

            // 若當前不是拆除模式，放置一個物件後回到平移模式
            if (this.state.actionMode !== 'delete') {
                this.switchActionMode('view');
            }
        }
    },

    // 處理滑鼠選取建築實體的複雜連鎖事件 (拉線/拆除/選取/雙向高亮)
    handleBuildingClick(building, element) {
        const id = building.id;
        
        if (this.state.actionMode === 'delete') {
            // 💥 一鍵拆除回收：移除設備，並同步切斷所有與它接通的傳送帶物流線路
            this.state.buildings = this.state.buildings.filter(b => b.id !== id);
            this.state.connections = this.state.connections.filter(c => c.from !== id && c.to !== id);
            this.renderAllBuildings();
            this.recalculatePipeline();
        } else if (this.state.actionMode === 'link') {
            // 🔗 自由拉線功能：先點起點，再點終點
            if (!this.state.linkSourceId) {
                this.state.linkSourceId = id;
                element.classList.add('selected-src'); // 起點加上高亮邊框
            } else {
                if (this.state.linkSourceId !== id) {
                    // 防止在兩個單元之間建立多條線（視為無向連線：A↔B 視為同一條）
                    const src = this.state.linkSourceId;
                    const isDuplicate = this.state.connections.some(c => (
                        (c.from === src && c.to === id) || (c.from === id && c.to === src)
                    ));
                    if (!isDuplicate) {
                        this.state.connections.push({ from: src, to: id });
                    }
                }
                // 完成連線，重置拉線狀態
                this.switchActionMode('link');
                this.recalculatePipeline();
            }
        } else if (this.state.actionMode === 'view') {
            // 5.3 規範：點選雙向導覽高亮機制
            document.querySelectorAll('.placed-building').forEach(box => box.classList.remove('link-highlight'));
            element.classList.add('link-highlight');
        }
    },

    changeBuildingDirection(id, val) {
        const b = this.state.buildings.find(item => item.id === id);
        if (b) b.subType = val;
        this.recalculatePipeline();
    },

    // ==========================================
    // 5. 跨視角同步渲染與傳送帶 SVG 物流繪製
    // ==========================================
    renderAllBuildings() {
        const layer = document.getElementById('transform-layer');
        // 清除舊的建築物 HTML 元件，保留底層連線 SVG 層
        layer.querySelectorAll('.placed-building').forEach(el => el.remove());

        this.state.buildings.forEach(b => {
            const el = document.createElement('div');
            el.className = `placed-building type-${b.type}`;
            el.style.left = `${b.x}px`;
            el.style.top = `${b.y}px`;

            if (b.type === 'refinery') {
                el.innerHTML = `
                    <div class="b-icon">🏭</div>
                    <div class="b-name">${b.name}</div>
                    <select onchange="EndfieldApp.changeBuildingDirection(${b.id}, this.value)">
                        <option value="sourceA" ${b.subType==='sourceA'?'selected':''}>配方: 生產原料A</option>
                        <option value="sourceB" ${b.subType==='sourceB'?'selected':''}>配方: 導線B</option>
                    </select>
                    <div class="b-indicator"></div>
                `;
            } else if (b.type === 'assembly') {
                el.innerHTML = `<div class="b-icon">🔷</div><div class="b-name">${b.name}</div><div class="b-indicator"></div>`;
            } else {
                // 5.3 規格：儲存終端外觀渲染
                el.innerHTML = `<div class="b-icon">📦</div><div class="b-name">${b.name}</div><div class="b-indicator" style="background:var(--accent-green); box-shadow:0 0 8px var(--accent-green);"></div>`;
            }

            // 建築物拖曳 / 點擊互動
            el.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                if (this.state.actionMode === 'view') {
                    e.preventDefault();
                    const layerRect = document.getElementById('transform-layer').getBoundingClientRect();
                    this.draggingBuildingId = b.id;
                    this.dragOffsetX = (e.clientX - layerRect.left) / this.camera.scale - b.x;
                    this.dragOffsetY = (e.clientY - layerRect.top) / this.camera.scale - b.y;
                    this.draggingElement = el;
                    this.dragMoved = false;
                    document.body.style.cursor = 'grabbing';
                } else {
                    this.handleBuildingClick(b, el);
                }
            });

            el.addEventListener('click', (e) => {
                if (this.state.actionMode === 'view') {
                    if (this.dragMoved) {
                        this.dragMoved = false;
                        return;
                    }
                    this.handleBuildingClick(b, el);
                }
            });

            layer.appendChild(el);
        });

        this.renderConveyorBelts();
    },

    showPreviewForMode(mode, x, y) {
        const layer = document.getElementById('transform-layer');
        if (!this.previewEl) {
            this.previewEl = document.createElement('div');
            this.previewEl.className = 'placed-building preview';
            this.previewEl.style.position = 'absolute';
            this.previewEl.style.pointerEvents = 'none';
            layer.appendChild(this.previewEl);
        }

        let type = 'refinery';
        let name = '精煉爐';
        if (mode === 'add-assembly') { type = 'assembly'; name = '組合加工廠'; }
        if (mode === 'add-hub') { type = 'hub'; name = '儲存終端'; }

        const isInvalid = this.isOverlappingBuilding(x, y);
        this.previewEl.className = `placed-building preview type-${type}${isInvalid ? ' invalid' : ''}`;
        this.previewEl.style.left = `${x}px`;
        this.previewEl.style.top = `${y}px`;

        if (type === 'refinery') {
            this.previewEl.innerHTML = `<div class="b-icon">🏭</div><div class="b-name">${name}</div><div class="b-indicator"></div>`;
        } else if (type === 'assembly') {
            this.previewEl.innerHTML = `<div class="b-icon">🔷</div><div class="b-name">${name}</div><div class="b-indicator"></div>`;
        } else {
            this.previewEl.innerHTML = `<div class="b-icon">📦</div><div class="b-name">${name}</div><div class="b-indicator" style="background:var(--accent-green); box-shadow:0 0 8px var(--accent-green);"></div>`;
        }
    },

    removePreview() {
        if (this.previewEl && this.previewEl.parentNode) {
            this.previewEl.parentNode.removeChild(this.previewEl);
        }
        this.previewEl = null;
    },

    isOverlappingBuilding(x, y, excludeId = null) {
        const candidate = { left: x, top: y, right: x + 130, bottom: y + 130 };
        return this.state.buildings.some(b => {
            if (excludeId !== null && b.id === excludeId) return false;
            const existing = { left: b.x, top: b.y, right: b.x + 130, bottom: b.y + 130 };
            return candidate.left < existing.right && candidate.right > existing.left &&
                   candidate.top < existing.bottom && candidate.bottom > existing.top;
        });
    },

    snapToGrid(value) {
        const halfGrid = this.gridSize / 2;
        return Math.round((value - halfGrid) / this.gridSize) * this.gridSize + halfGrid;
    },

    snapTopLeftToGrid(x, y) {
        return {
            x: this.snapToGrid(x + 65) - 65,
            y: this.snapToGrid(y + 65) - 65
        };
    },

    snapInitialBuildingsToGrid() {
        this.state.buildings.forEach((b) => {
            const snapped = this.snapTopLeftToGrid(b.x, b.y);
            b.x = snapped.x;
            b.y = snapped.y;
        });
    },

    updateGridStyle() {
        const layer = document.getElementById('transform-layer');
        if (!layer) return;
        layer.style.setProperty('--grid-size', `${this.gridSize}px`);
        if (this.gridVisible) {
            layer.classList.add('grid-visible');
        } else {
            layer.classList.remove('grid-visible');
        }
    },

    // 傳送帶自由拉線：精確捕捉設備中心坐標，並在兩點間繪製平滑的 S 型貝茲物流帶
    renderConveyorBelts() {
        const svg = document.getElementById('conveyor-svg');
        if (!svg) return;
        svg.innerHTML = ''; // 清空畫布重繪

        this.state.connections.forEach(conn => {
            const fromNode = this.state.buildings.find(b => b.id === conn.from);
            const toNode = this.state.buildings.find(b => b.id === conn.to);
            if (!fromNode || !toNode) return;

            // 換算設備幾何中心點位置 (130px 寬高的一半是 65px)
            const x1 = fromNode.x + 65;
            const y1 = fromNode.y + 65;
            const x2 = toNode.x + 65;
            const y2 = toNode.y + 65;

            // 建立傳送帶外框、內襯與橘色發光虛線流向層
            const svgNS = 'http://www.w3.org/2000/svg';
            const pathBg = document.createElementNS(svgNS, 'path');
            const pathEdge = document.createElementNS(svgNS, 'path');
            const pathFlow = document.createElementNS(svgNS, 'path');

            // 計算三次貝茲曲線控制點 (橫向延展平滑轉彎)
            const controlOffset = Math.abs(x2 - x1) / 2;
            const dString = `M ${x1},${y1} C ${x1 + controlOffset},${y1} ${x2 - controlOffset},${y2} ${x2},${y2}`;

            pathEdge.setAttribute('d', dString); pathEdge.setAttribute('class', 'belt-path-edge');
            pathBg.setAttribute('d', dString);   pathBg.setAttribute('class', 'belt-path-bg');
            pathFlow.setAttribute('d', dString); pathFlow.setAttribute('class', 'belt-path-flow');
            pathFlow.dataset.from = conn.from;
            pathFlow.dataset.to = conn.to;

            const pathHit = document.createElementNS(svgNS, 'path');
            pathHit.setAttribute('d', dString);
            pathHit.setAttribute('class', 'belt-path-hit');
            pathHit.dataset.from = conn.from;
            pathHit.dataset.to = conn.to;

            // 如果全域開啟超頻加速，則傳送帶動態動畫同步流速變快
            if (this.state.isOverclock) {
                pathFlow.classList.add('belt-fast');
            }

            const deleteHandler = (e) => {
                e.stopPropagation();
                if (this.state.actionMode === 'delete') {
                    this.state.connections = this.state.connections.filter(c => !(c.from === conn.from && c.to === conn.to));
                    this.renderAllBuildings();
                    this.recalculatePipeline();
                }
            };

            pathHit.addEventListener('click', deleteHandler);
            pathFlow.addEventListener('click', deleteHandler);

            svg.appendChild(pathEdge);
            svg.appendChild(pathBg);
            svg.appendChild(pathHit);
            svg.appendChild(pathFlow);
        });
    },

    // 呼叫 Module 3 (recipes.js) 計算流量，並即時渲染更新看板數據
    recalculatePipeline() {
        if (!window.EndfieldEngine) return;
        
        const report = window.EndfieldEngine.runFlowEstimation(
            this.state.buildings, 
            this.state.currentRecipe, 
            this.state.isOverclock
        );

        // 渲染至大盤面板
        document.getElementById('stat-supplyA').textContent = `${report.supplyA} /min (滿載需求: ${report.needA})`;
        document.getElementById('stat-supplyB').textContent = `${report.isMulti ? report.supplyB + ' /min (滿載需求: ' + report.needB + ')' : '無此項原料需求'}`;
        document.getElementById('stat-final-output').textContent = `${report.finalOutput.toFixed(1)} /min`;

        // 變更標籤名稱
        document.getElementById('lbl-supplyA').textContent = `⛏️ 一級源 A (${report.labelA}) 總出力`;
        document.getElementById('lbl-supplyB').textContent = `⚡ 一級源 B (${report.labelB}) 總出力`;

        // 全網綜合報告顯示
        const txt = document.getElementById('stat-report-text');
        const card = document.getElementById('status-report-card');
        const globalIndicator = document.getElementById('global-status-text');

        if (!report.hasAssembly && report.isMulti) {
            txt.textContent = `💤 網絡空轉：未檢測到 ${report.recipeIcon} ${report.recipeName} 加工工廠節點。`;
            txt.style.color = "#8a99ad"; card.style.borderColor = "var(--panel-border)";
            globalIndicator.textContent = "空轉"; globalIndicator.style.color = "#8a99ad";
        } else if (report.efficiency < 1.0 && report.isMulti) {
            txt.textContent = `⚠️ 產能受限：原料缺口導致組裝廠綜合運作率僅 ${(report.efficiency * 100).toFixed(0)}%`;
            txt.style.color = "var(--warn-red)"; card.style.borderColor = "var(--warn-red)";
            globalIndicator.textContent = "原料中斷"; globalIndicator.style.color = "var(--warn-red)";
        } else {
            let msg = `🚀 全速發電：沙盒內所有工業節點均完美平衡運轉！[目標產物：${report.recipeIcon} ${report.recipeName}]`;
            if (!report.hasHub) msg += " (💡提示: 建造儲存終端可進一步解除 20% 倉儲流速卡頓限制)";
            txt.textContent = msg;
            txt.style.color = "var(--accent-green)"; card.style.borderColor = "var(--accent-green)";
            globalIndicator.textContent = "高效運轉中"; globalIndicator.style.color = "var(--accent-green)";
        }

        // 同步狀態燈號
        document.querySelectorAll('.placed-building').forEach(el => {
            if (this.state.isOverclock) el.classList.add('b-overclocked');
            else el.classList.remove('b-overclocked');
        });

        this.renderConveyorBelts();
    },

    // 5.2 規範：左右/上下並排阻隔線滑鼠拖曳拉伸與軸向控制引擎
    initResizerEngine() {
        const bar = document.getElementById('pane-resizer');
        const layout = document.getElementById('workspace-layout');
        const bp = document.getElementById('panel-blueprint');
        const fl = document.getElementById('panel-flow');

        bar.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('dir-toggle-btn')) return;
            e.preventDefault();
            
            const onDrag = (ev) => {
                const rect = layout.getBoundingClientRect();
                const percentage = this.layoutDir === 'row'
                    ? ((ev.clientX - rect.left) / rect.width) * 100
                    : ((ev.clientY - rect.top) / rect.height) * 100;
                
                if (percentage > 15 && percentage < 85) {
                    bp.style.flex = `${percentage}%`;
                    fl.style.flex = `${100 - percentage}%`;
                }
            };
            const onStop = () => {
                document.removeEventListener('mousemove', onDrag);
                document.removeEventListener('mouseup', onStop);
            };
            document.addEventListener('mousemove', onDrag);
            document.addEventListener('mouseup', onStop);
        });

        // 阻隔線旁排列方向切換按鈕控制 (⇄ vs ⇳)
        document.getElementById('dirBtn').onclick = (e) => {
            e.stopPropagation();
            bp.style.flex = "50%"; fl.style.flex = "50%";
            const btn = document.getElementById('dirBtn');
            
            if (this.layoutDir === 'row') {
                this.layoutDir = 'col';
                layout.classList.remove('dir-row'); layout.classList.add('dir-col');
                btn.textContent = "⇳";
            } else {
                this.layoutDir = 'row';
                layout.classList.remove('dir-col'); layout.classList.add('dir-row');
                btn.textContent = "⇄";
            }
        };
    },

    setPanelVisibility(mode) {
        const bp = document.getElementById('panel-blueprint');
        const fl = document.getElementById('panel-flow');
        const rz = document.getElementById('pane-resizer');
        document.querySelectorAll('.switch-icon-btn').forEach(b => b.classList.remove('active'));

        if (mode === 'blueprint') {
            document.getElementById('sw-bp').classList.add('active');
            bp.classList.remove('hidden'); fl.classList.add('hidden'); rz.classList.add('hidden');
            bp.style.flex = "100%";
        } else if (mode === 'flow') {
            document.getElementById('sw-fl').classList.add('active');
            fl.classList.remove('hidden'); bp.classList.add('hidden'); rz.classList.add('hidden');
            fl.style.flex = "100%";
        } else {
            document.getElementById('sw-multi').classList.add('active');
            bp.classList.remove('hidden'); fl.classList.remove('hidden'); rz.classList.remove('hidden');
            bp.style.flex = "60%"; fl.style.flex = "40%";
        }
        this.activeModeIdx = this.viewModes.indexOf(mode);
    }
};

// 網頁完全載入完成後啟動主控制矩陣大腦
window.EndfieldApp = EndfieldApp;
window.addEventListener('DOMContentLoaded', () => EndfieldApp.init());
