export type Position = number[];

export const enum Axis {
    x = 0,
    y = 1,
    z = 2,
}

export interface AxisMove {
    axis: Axis;
    delta: number;
}
