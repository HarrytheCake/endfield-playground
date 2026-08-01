/**
 * Vue Flow 畫布節點 / 邊的型別包裝
 *
 * 本專案以 Vue Flow 為畫布渲染引擎，藍圖中的設備為 FactoryNode，
 * 管線連接為 FactoryEdge。FactoryNodeData 描述了設備節點的所有 CR-01 / CR-04 屬性。
 */

import type { Edge, Node } from '@vue-flow/core';
import type { Rotation } from './editor';
import type { PortMedia } from './machine';

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
    /**
     * 機器型態 id（對應 Machine.modes[].id）。
     * 缺省時以該機器 modes[0].id 解釋。
     */
    machineMode?: string;
    /** 選用的配方索引，對應 getRecipesForMachine(machineType, machineMode)[recipeIndex] */
    recipeIndex?: number;
    /** 設備旋轉次數（0/1/2/3 對應 0°/90°/180°/270°），預設 0 */
    rotation?: Rotation;
};

/** 已部署設備節點 */
export type FactoryNode = Node<FactoryNodeData>;

/**
 * FactoryEdge 攜帶的領域資料
 *
 * 僅存放管線本身的結構性資料；流量、效率、警示等計算結果一律由 flowStore /
 * validationStore 以 connectionUid 查表取得，不寫回這裡。
 */
export type FactoryEdgeData = {
    /**
     * 管線傳輸媒質，建立時依起點接口決定（belt／pipe）。
     * 欄位名沿用 portType 以相容既有邊資料；型別為 PortMedia。
     */
    portType: PortMedia;
    /** 手動彎折點座標（畫布像素座標），依序連接起點與終點，Phase 1 建立後不可編輯（CR-02 §2.3） */
    bendPoints?: { x: number; y: number }[];
};

/** 已部署管線 */
export type FactoryEdge = Edge<FactoryEdgeData>;
