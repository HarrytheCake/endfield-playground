import type { Position } from '@/types/euclideanSpace'
import type { Rotation } from '@/types/editor';

export interface shironesMachine
{
    id: string;
    position: Position;
    rotation: Rotation;
    size: Position;
}

export interface shironesPipeline {
    id: string;
    waypoints: Position[];
}