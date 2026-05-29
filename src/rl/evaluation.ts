import type { DoneReason, EvaluationStrategy, GridLayout, PolicyTable, State } from "../types/rl";
import { resetEnvironment, stepEnvironment } from "./environment";
import { mostLikelyAction, sampleAction } from "./policies";

export interface EvaluationRuntime {
  state: State;
  step: number;
  totalReward: number;
  doneReason: DoneReason;
  trajectory: State[];
}

export function createEvaluationRuntime(): EvaluationRuntime {
  const start = resetEnvironment();
  return {
    state: start,
    step: 0,
    totalReward: 0,
    doneReason: "none",
    trajectory: [start],
  };
}

export function advanceEvaluationStep(
  runtime: EvaluationRuntime,
  targetPolicy: PolicyTable,
  maxSteps: number,
  strategy: EvaluationStrategy,
  grid: GridLayout,
): { runtime: EvaluationRuntime; action?: string; reward?: number } {
  if (runtime.doneReason !== "none") return { runtime };

  const action = strategy === "greedy" ? mostLikelyAction(targetPolicy, runtime.state) : sampleAction(targetPolicy, runtime.state);
  const result = stepEnvironment(runtime.state, action, grid);
  const nextStep = runtime.step + 1;
  const hitMaxSteps = !result.done && nextStep >= maxSteps;
  const doneReason: DoneReason = hitMaxSteps ? "max_steps" : result.doneReason;

  return {
    runtime: {
      state: result.nextState,
      step: nextStep,
      totalReward: runtime.totalReward + result.reward,
      doneReason,
      trajectory: [...runtime.trajectory, result.nextState],
    },
    action,
    reward: result.reward,
  };
}
