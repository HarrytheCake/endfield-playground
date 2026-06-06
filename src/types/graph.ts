/**
 * Vue Flow 畫布節點 / 邊的型別包裝
 *
 * 本專案以 Vue Flow 為畫布渲染引擎，藍圖中的設備為 FactoryNode，  \
 * 管線連接為 FactoryEdge。FactoryNodeData 描述了設備節點的所有 CR-01 / CR-04 屬性。
 */

import type { Edge, Node } from '@vue-flow/core';
import type { Rotation } from './editor';

/**
 * FactoryNode 攜帶的領域資料
 *
 * Vue Flow 的 Node.position 仍為像素座標，由 canvasStore.gridSize / snapToGrid 控制吸附；
 * 旋轉與配方為 CR-01 規範欄位，由 editorStore 的 high-level actions 維護。
 */
export type FactoryNodeData = {
    /** 節點顯示文字（預設為機器中文名） */
    label: string;
    /** 機器型別名稱（對應 Machine.name） */
    machineType?: string;
    /** 選用的配方索引，對應 getRecipesForMachine(machineType)[recipeIndex] */
    recipeIndex?: number;
    /** 設備旋轉次數（0/1/2/3 對應 0°/90°/180°/270°），預設 0 */
    rotation?: Rotation;
};

/** 已部署設備節點 */
export type FactoryNode = Node<FactoryNodeData>;

/** 已部署管線 */
export type FactoryEdge = Edge;
