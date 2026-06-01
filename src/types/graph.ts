import type { Edge, Node } from '@vue-flow/core';

export type FactoryNodeData = {
    label: string;
    machineType?: string;
    /** 選用的配方索引，對應 getRecipesForMachine(machineType)[recipeIndex] */
    recipeIndex?: number;
};

export type FactoryNode = Node<FactoryNodeData>;
export type FactoryEdge = Edge;
