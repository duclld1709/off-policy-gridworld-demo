import type { Action, GridLayout, State } from "../types/rl";

export const GRID_SIZE = 5;

export const GRID: GridLayout = [
  ["S", ".", ".", ".", "."],
  [".", "X", ".", "X", "."],
  [".", ".", ".", ".", "."],
  [".", "X", ".", "X", "."],
  [".", ".", ".", ".", "G"],
];

export const START_STATE: State = { row: 0, col: 0 };
export const GOAL_STATE: State = { row: 4, col: 4 };

export const ACTIONS: Action[] = ["UP", "DOWN", "LEFT", "RIGHT"];

export const ACTION_DELTAS: Record<Action, State> = {
  UP: { row: -1, col: 0 },
  DOWN: { row: 1, col: 0 },
  LEFT: { row: 0, col: -1 },
  RIGHT: { row: 0, col: 1 },
};

export function cloneGrid(grid: GridLayout = GRID): GridLayout {
  return grid.map((row) => [...row]);
}
