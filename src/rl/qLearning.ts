import { ACTIONS, DEFAULT_GRID_SIZE } from "../constants/grid";
import type { Hyperparams, PolicyTable, QTable, Transition, UpdateInfo } from "../types/rl";
import { actionIndex, getActionProb } from "./policies";

export function createQTable(gridSize = DEFAULT_GRID_SIZE): QTable {
  return Array.from({ length: gridSize }, () =>
    Array.from({ length: gridSize }, () => ACTIONS.map(() => 0)),
  );
}

export function cloneQTable(qTable: QTable): QTable {
  return qTable.map((row) => row.map((values) => [...values]));
}

export function expectedStateValue(policy: PolicyTable, qTable: QTable, row: number, col: number): number {
  return policy[row][col].reduce((sum, prob, index) => sum + prob * qTable[row][col][index], 0);
}

export function applyImportanceSamplingUpdate(
  qTable: QTable,
  targetPolicy: PolicyTable,
  transition: Transition,
  hyperparams: Hyperparams,
): { qTable: QTable; updateInfo: UpdateInfo } {
  const nextQTable = cloneQTable(qTable);
  const actionIdx = actionIndex(transition.action);
  const piProb = getActionProb(targetPolicy, transition.state, transition.action);
  const rhoRaw = piProb / Math.max(transition.muProbAtAction, 1e-9);
  const rhoClipped = Math.min(rhoRaw, hyperparams.rhoMax);
  const bootstrapValue = transition.done
    ? 0
    : expectedStateValue(targetPolicy, qTable, transition.nextState.row, transition.nextState.col);
  const tdTarget = transition.done ? transition.reward : transition.reward + hyperparams.gamma * bootstrapValue;
  const oldQ = qTable[transition.state.row][transition.state.col][actionIdx];
  const tdError = tdTarget - oldQ;
  const updateStrength = hyperparams.alpha * rhoClipped * tdError;

  // Importance sampling scales the TD update because this transition was collected by μ,
  // while the value update is for the target policy π.
  nextQTable[transition.state.row][transition.state.col][actionIdx] = oldQ + updateStrength;

  return {
    qTable: nextQTable,
    updateInfo: {
      transitionId: transition.id,
      state: transition.state,
      action: transition.action,
      reward: transition.reward,
      nextState: transition.nextState,
      done: transition.done,
      muProb: transition.muProbAtAction,
      piProb,
      rhoRaw,
      rhoClipped,
      tdTarget,
      tdError,
      updateStrength,
      oldQ,
      newQ: oldQ + updateStrength,
    },
  };
}
