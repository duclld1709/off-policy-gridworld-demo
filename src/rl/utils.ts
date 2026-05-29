import type { GridLayout, State } from "../types/rl";

export function sameState(a: State, b: State): boolean {
  return a.row === b.row && a.col === b.col;
}

export function stateKey(state: State): string {
  return `(${state.row},${state.col})`;
}

export function inBounds(state: State, grid: GridLayout): boolean {
  return state.row >= 0 && state.row < grid.length && state.col >= 0 && state.col < (grid[state.row]?.length ?? 0);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function formatProb(value: number): string {
  return value.toFixed(3);
}
