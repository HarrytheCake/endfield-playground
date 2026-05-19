/**
 * =========================================================================
 * 明日方舟：終末地 // AIC 工業核心數據模組 (CR-01 & CR-04 流量估算規格)
 * =========================================================================
 * 內建 5 大類別、共 13 種全手冊合成表資料結構。
 * 負責全域資料的木桶短板效益限制計算。
 */

const ENDFIELD_RECIPE_ENGINE = {
    // 13 種官方全合成表完整資料庫
    recipes: {
        // --- 1. 精煉爐系列 (Refining Unit) ---
        iron_plate: {
            name: "工業鐵板", category: "精煉爐", icon: "💿",
            labelA: "粗鐵礦", labelB: "電力網路",
            sa: 30, sb: 0, na: 0, nb: 0, f: 30, isMulti: false
        },
        copper_wire: {
            name: "整合導線", category: "精煉爐", icon: "⚡",
            labelA: "粗銅礦", labelB: "電力網路",
            sa: 60, sb: 0, na: 0, nb: 0, f: 60, isMulti: false
        },
        carbon_block: {
            name: "穩定化碳塊", category: "精煉爐", icon: "📦",
            labelA: "天然木材", labelB: "電力網路",
            sa: 20, sb: 0, na: 0, nb: 0, f: 20, isMulti: false
        },
        originium_block: {
            name: "源石精煉塊", category: "精煉爐", icon: "💎",
            labelA: "源石粉末", labelB: "電力網路",
            sa: 30, sb: 0, na: 0, nb: 0, f: 30, isMulti: false
        },

        // --- 2. 粉碎研磨機系列 (Grinding Unit) ---
        sand_powder: {
            name: "沙葉粉", category: "研磨機", icon: "🍂",
            labelA: "野生沙葉", labelB: "電力網路",
            sa: 30, sb: 0, na: 0, nb: 0, f: 30, isMulti: false
        },
        wheat_powder: {
            name: "灰蘆麥粉", category: "研磨機", icon: "🌾",
            labelA: "原株灰蘆麥", labelB: "電力網路",
            sa: 30, sb: 0, na: 0, nb: 0, f: 30, isMulti: false
        },
        copper_powder: {
            name: "赤銅塊粉", category: "研磨機", icon: "🟫",
            labelA: "粗銅礦原石", labelB: "電力網路",
            sa: 20, sb: 0, na: 0, nb: 0, f: 20, isMulti: false
        },

        // --- 3. 組合加工廠系列 (Assembly Unit) 多級匯流合成 ---
        aic_core: {
            name: "AIC 自動化核心", category: "組合加工廠", icon: "🔷",
            labelA: "工業鐵板", labelB: "整合導線",
            sa: 15, sb: 20, na: 10, nb: 20, f: 10, isMulti: true
        },
        battery: {
            name: "高能電池模組", category: "組合加工廠", icon: "🔋",
            labelA: "穩定化碳塊", labelB: "整合導線",
            sa: 10, sb: 15, na: 5,  nb: 15, f: 8,  isMulti: true
        },
        ori_component: {
            name: "源石集成構件", category: "組合加工廠", icon: "🧬",
            labelA: "源石精煉塊", labelB: "整合導線",
            sa: 12, sb: 15, na: 8,  nb: 12, f: 6,  isMulti: true
        },
        steel_bottle: {
            name: "鋼製空瓶", category: "組合加工廠", icon: "🧪",
            labelA: "工業鐵板", labelB: "基本框架",
            sa: 15, sb: 0, na: 10, nb: 0, f: 15, isMulti: false
        },

        // --- 4. 灌裝反應池系列 (Filling / Reactor) ---
        water_bottle: {
            name: "裝瓶清水", category: "反應池", icon: "🥤",
            labelA: "鋼製空瓶", labelB: "自然清水",
            sa: 10, sb: 40, na: 5,  nb: 20, f: 12, isMulti: true
        },
        stimulant: {
            name: "戰術過載針劑", category: "反應池", icon: "💉",
            labelA: "鋼製空瓶", labelB: "灰蘆麥粉",
            sa: 15, sb: 15, na: 10, nb: 10, f: 10, isMulti: true
        },

        // --- 5. 生態種植機系列 (Planting Unit) ---
        rye_seed: {
            name: "灰蘆麥種子", category: "種植機", icon: "🌱",
            labelA: "灰蘆麥原株", labelB: "肥料基底",
            sa: 20, sb: 0, na: 0, nb: 0, f: 40, isMulti: false
        }
    },

    /**
     * 核心流量瓶頸演算法：多級供需短板限制計算
     * 依據地圖上實際蓋出的工廠數量，結合當前合成表配方，動態計算鏈條瓶頸
     */
    runFlowEstimation(buildings, activeRecipeId, isOverclock) {
        const recipe = this.recipes[activeRecipeId] || this.recipes['aic_core'];
        const multiplier = isOverclock ? 2 : 1;

        // 統計地圖中不同設定類別與生產方向的機器數量
        let countSrcA = 0;
        let countSrcB = 0;
        let countAssembly = 0;
        let countHub = 0;

        buildings.forEach(b => {
            if (b.type === 'refinery') {
                if (b.subType === 'sourceA') countSrcA++;
                if (b.subType === 'sourceB') countSrcB++;
            } else if (b.type === 'assembly') {
                countAssembly++;
            } else if (b.type === 'hub') {
                countHub++;
            }
        });

        // 1. 計算一級工廠最大生產流量 (考慮超頻)
        const supplyA = countSrcA * recipe.sa * multiplier;
        const supplyB = countSrcB * recipe.sb * multiplier;

        // 2. 計算二級加工廠滿載所需的理論原料消耗量
        const needA = countAssembly * recipe.na * multiplier;
        const needB = countAssembly * recipe.nb * multiplier;
        const theoreticalFinalMax = countAssembly * recipe.f * multiplier;

        // 3. 多級木桶瓶頸演算 (短板效益核心邏輯)
        let efficiencyRate = 1.0;
        
        if (recipe.isMulti) {
            // 計算兩條輸入線原料的滿足比例
            const satRatioA = needA > 0 ? (supplyA / needA) : 1.0;
            const satRatioB = needB > 0 ? (supplyB / needB) : 1.0;
            // 系統效率強行由最低（最缺）的那條產線決定
            efficiencyRate = Math.min(1.0, satRatioA, satRatioB);
        } else {
            // 單級配方（例如純基礎精煉）不需要考慮 B 原料供需，僅看是否有部署供應機器
            efficiencyRate = countSrcA > 0 ? 1.0 : 0.0;
        }

        // 如果連一台加工組裝廠都沒蓋，實際產出直接歸零
        if (countAssembly === 0 && recipe.isMulti) efficiencyRate = 0.0;

        // 4. 回推實際最終成品產出速率
        let finalActualOutput = 0;
        if (recipe.isMulti) {
            finalActualOutput = theoreticalFinalMax * efficiencyRate;
        } else {
            // 單級配方直接等於一級產能
            finalActualOutput = supplyA;
        }

        // 考慮儲存終端（倉庫節點）的接收限制
        // 如果沒有建造儲存終端，產能會稍微受到塞車物流限制 (模擬倉儲瓶頸)
        if (countHub === 0 && finalActualOutput > 0) {
            finalActualOutput *= 0.8; // 減少 20% 效率
        }

        // 回傳估算包供 app.js 進行即時渲染
        return {
            recipeName: recipe.name,
            recipeIcon: recipe.icon,
            labelA: recipe.labelA,
            labelB: recipe.labelB,
            supplyA: supplyA,
            supplyB: supplyB,
            needA: needA,
            needB: needB,
            efficiency: efficiencyRate,
            finalOutput: finalActualOutput,
            isMulti: recipe.isMulti,
            hasAssembly: countAssembly > 0,
            hasHub: countHub > 0
        };
    }
};

// 將模組掛載至全域物件中，實現前端狀態模組重合
window.EndfieldEngine = ENDFIELD_RECIPE_ENGINE;
