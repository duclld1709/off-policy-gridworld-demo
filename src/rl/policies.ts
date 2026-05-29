import { ACTIONS, GRID_SIZE } from "../constants/grid";
import type { Action, PolicyTable, QTable, State } from "../types/rl";

export function actionIndex(action: Action): number {
  return ACTIONS.indexOf(action);
}

export function createUniformPolicy(): PolicyTable {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => ACTIONS.map(() => 1 / ACTIONS.length)),
  );
}

export function softmaxPolicyFromQ(qTable: QTable, temperature: number): PolicyTable {
  const safeTemperature = Math.max(0.05, temperature);

  return qTable.map((row) =>
    row.map((actionValues) => {
      const maxQ = Math.max(...actionValues);
      const expValues = actionValues.map((q) => Math.exp((q - maxQ) / safeTemperature));
      const sum = expValues.reduce((acc, value) => acc + value, 0);
      return expValues.map((value) => value / sum);
    }),
  );
}

export function behaviorPolicyFromTarget(targetPolicy: PolicyTable, epsilon: number): PolicyTable {
  return targetPolicy.map((row) =>
    row.map((probs) => probs.map((prob) => epsilon / ACTIONS.length + (1 - epsilon) * prob)),
  );
}

export function getActionProb(policy: PolicyTable, state: State, action: Action): number {
  return policy[state.row][state.col][actionIndex(action)];
}

export function sampleAction(policy: PolicyTable, state: State, random = Math.random): Action {
  const probs = policy[state.row][state.col];
  const roll = random();
  let cumulative = 0;
  for (let index = 0; index < probs.length; index += 1) {
    cumulative += probs[index];
    if (roll <= cumulative) return ACTIONS[index];
  }
  return ACTIONS[ACTIONS.length - 1];
}

export function mostLikelyAction(policy: PolicyTable, state: State): Action {
  const probs = policy[state.row][state.col];
  let bestIndex = 0;
  for (let index = 1; index < probs.length; index += 1) {
    if (probs[index] > probs[bestIndex]) bestIndex = index;
  }
  return ACTIONS[bestIndex];
}
