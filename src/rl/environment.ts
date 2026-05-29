import { ACTION_DELTAS, GRID, START_STATE } from "../constants/grid";
import type { Action, CellType, GridLayout, State, StepResult } from "../types/rl";
import { inBounds } from "./utils";

export function resetEnvironment(): State {
  return { ...START_STATE };
}

export function getCell(state: State, grid: GridLayout = GRID): CellType {
  return grid[state.row][state.col];
}

export function isTrap(state: State, grid: GridLayout = GRID): boolean {
  return getCell(state, grid) === "X";
}

export function isGoal(state: State, grid: GridLayout = GRID): boolean {
  return getCell(state, grid) === "G";
}

export function stepEnvironment(state: State, action: Action, grid: GridLayout = GRID): StepResult {
  const delta = ACTION_DELTAS[action];
  const candidate = { row: state.row + delta.row, col: state.col + delta.col };

  if (!inBounds(candidate)) {
    return {
      nextState: { ...state },
      reward: -5,
      done: false,
      doneReason: "none",
    };
  }

  if (isTrap(candidate, grid)) {
    return {
      nextState: candidate,
      reward: -20,
      done: true,
      doneReason: "trap",
    };
  }

  if (isGoal(candidate, grid)) {
    return {
      nextState: candidate,
      reward: 20,
      done: true,
      doneReason: "goal",
    };
  }

  return {
    nextState: candidate,
    reward: -1,
    done: false,
    doneReason: "none",
  };
}
