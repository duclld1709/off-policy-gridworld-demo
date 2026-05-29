import type { Action, GridLayout, State } from "../types/rl";

export const DEFAULT_GRID_SIZE = 5;
export const MIN_GRID_SIZE = 3;
export const MAX_GRID_SIZE = 10;
export const GRID_SIZE_OPTIONS = Array.from(
  { length: MAX_GRID_SIZE - MIN_GRID_SIZE + 1 },
  (_, index) => MIN_GRID_SIZE + index,
);

export const GRID: GridLayout = [
  ["S", ".", ".", ".", "."],
  [".", "X", ".", "X", "X"],
  [".", "X", ".", ".", "."],
  [".", "X", ".", "X", "."],
  [".", ".", ".", "X", "G"],
];

export const GRID_3: GridLayout = [
  ["S", ".", "."],
  [".", "X", "."],
  [".", ".", "G"],
];

export const GRID_4: GridLayout = [
  ["S", ".", "X", "."],
  ["X", ".", "X", "."],
  [".", ".", ".", "."],
  [".", "X", ".", "G"],
];

export const GRID_5: GridLayout = GRID;

export const GRID_6: GridLayout = [
  ["S", ".", ".", "X", ".", "."],
  ["X", "X", ".", "X", ".", "X"],
  [".", ".", ".", ".", ".", "."],
  [".", "X", "X", ".", "X", "."],
  [".", ".", ".", ".", "X", "."],
  ["X", ".", "X", ".", ".", "G"],
];

export const GRID_7: GridLayout = [
  ["S", ".", ".", "X", ".", ".", "."],
  ["X", "X", ".", "X", ".", "X", "."],
  [".", ".", ".", ".", ".", "X", "."],
  [".", "X", "X", "X", ".", ".", "."],
  [".", ".", ".", ".", ".", "X", "."],
  [".", "X", ".", "X", ".", "X", "."],
  [".", ".", ".", "X", ".", ".", "G"],
];

export const GRID_8: GridLayout = [
  ["S", ".", ".", "X", ".", ".", ".", "."],
  ["X", "X", ".", "X", ".", "X", "X", "."],
  [".", ".", ".", ".", ".", ".", "X", "."],
  [".", "X", "X", "X", ".", "X", ".", "."],
  [".", ".", ".", ".", ".", "X", ".", "X"],
  ["X", "X", ".", "X", ".", ".", ".", "."],
  [".", ".", ".", "X", "X", "X", ".", "."],
  [".", "X", ".", ".", ".", ".", ".", "G"],
];

export const GRID_9: GridLayout = [
  ["S", ".", ".", "X", ".", ".", ".", "X", "."],
  ["X", "X", ".", "X", ".", "X", ".", "X", "."],
  [".", ".", ".", ".", ".", "X", ".", ".", "."],
  [".", "X", "X", "X", ".", ".", ".", "X", "."],
  [".", ".", ".", ".", "X", "X", ".", ".", "."],
  ["X", "X", ".", ".", ".", ".", "X", "X", "."],
  [".", ".", ".", "X", "X", ".", ".", ".", "."],
  [".", "X", ".", ".", ".", ".", "X", "X", "."],
  [".", ".", ".", "X", ".", ".", ".", ".", "G"],
];

export const GRID_10: GridLayout = [
  ["S", ".", ".", "X", ".", ".", ".", "X", ".", "."],
  ["X", "X", ".", "X", ".", "X", ".", "X", ".", "X"],
  [".", ".", ".", ".", ".", "X", ".", ".", ".", "."],
  [".", "X", "X", "X", ".", ".", ".", "X", "X", "."],
  [".", ".", ".", ".", "X", "X", ".", ".", ".", "."],
  ["X", "X", ".", ".", ".", ".", "X", "X", ".", "X"],
  [".", ".", ".", "X", "X", ".", ".", ".", ".", "."],
  [".", "X", ".", ".", ".", ".", "X", "X", "X", "."],
  [".", "X", ".", "X", ".", ".", ".", ".", ".", "."],
  [".", ".", ".", "X", ".", "X", "X", "X", ".", "G"],
];

export const GRID_LAYOUTS_BY_SIZE: Record<number, GridLayout> = {
  3: GRID_3,
  4: GRID_4,
  5: GRID_5,
  6: GRID_6,
  7: GRID_7,
  8: GRID_8,
  9: GRID_9,
  10: GRID_10,
};

export const START_STATE: State = { row: 0, col: 0 };

export const ACTIONS: Action[] = ["UP", "DOWN", "LEFT", "RIGHT"];

export const ACTION_DELTAS: Record<Action, State> = {
  UP: { row: -1, col: 0 },
  DOWN: { row: 1, col: 0 },
  LEFT: { row: 0, col: -1 },
  RIGHT: { row: 0, col: 1 },
};

export function createGrid(size = DEFAULT_GRID_SIZE): GridLayout {
  return cloneGrid(GRID_LAYOUTS_BY_SIZE[size] ?? GRID_LAYOUTS_BY_SIZE[DEFAULT_GRID_SIZE]);
}

export function cloneGrid(grid: GridLayout = GRID): GridLayout {
  return grid.map((row) => [...row]);
}
