import { useCallback, useEffect, useMemo, useState } from "react";
import { DEFAULT_ANIMATION_SPEED_MS, DEFAULT_HYPERPARAMS } from "../constants/hyperparams";
import { cloneGrid } from "../constants/grid";
import type { EpisodeSummary, EvaluationStrategy, GridLayout, Hyperparams, Mode, State, Transition, UpdateInfo } from "../types/rl";
import {
  advanceTrainingStep,
  createEpisodeRuntime,
  createLearner,
  refreshPolicies,
  trainEpisodesFast,
  type EpisodeRuntime,
  type LearnerState,
} from "../rl/trainingLoop";
import {
  advanceEvaluationStep,
  createEvaluationRuntime,
  type EvaluationRuntime,
} from "../rl/evaluation";
import { useMetrics } from "./useMetrics";

interface ControllerState {
  learner: LearnerState;
  runtime: EpisodeRuntime;
  evaluationRuntime: EvaluationRuntime;
  evaluationStrategy: EvaluationStrategy;
  mode: Mode;
  lastTransition?: Transition;
  lastUpdate?: UpdateInfo;
  sampledIds: number[];
  summaries: EpisodeSummary[];
  lastAction?: string;
  lastReward?: number;
  batchSummary?: string;
  isAutoTraining: boolean;
  isEvaluating: boolean;
}

function createInitialState(): ControllerState {
  return {
    learner: createLearner(DEFAULT_HYPERPARAMS),
    runtime: createEpisodeRuntime(),
    evaluationRuntime: createEvaluationRuntime(),
    evaluationStrategy: "greedy",
    mode: "Training",
    sampledIds: [],
    summaries: [],
    isAutoTraining: false,
    isEvaluating: false,
  };
}

export function useTrainingController() {
  const [hyperparams, setHyperparams] = useState<Hyperparams>(DEFAULT_HYPERPARAMS);
  const [speedMs, setSpeedMs] = useState(DEFAULT_ANIMATION_SPEED_MS);
  const [grid, setGrid] = useState<GridLayout>(() => cloneGrid());
  const [controller, setController] = useState<ControllerState>(() => createInitialState());
  const metrics = useMetrics(controller.summaries);
  const canEditTraps =
    controller.mode === "Training" &&
    controller.runtime.episode === 1 &&
    controller.runtime.step === 0 &&
    controller.learner.replayBuffer.items.length === 0 &&
    controller.summaries.length === 0;

  const reset = useCallback(() => {
    setController(createInitialState());
    setHyperparams(DEFAULT_HYPERPARAMS);
    setSpeedMs(DEFAULT_ANIMATION_SPEED_MS);
    setGrid(cloneGrid());
  }, []);

  const moveTrap = useCallback(
    (from: State, to: State) => {
      if (!canEditTraps) return;
      setGrid((currentGrid) => {
        if (currentGrid[from.row]?.[from.col] !== "X") return currentGrid;
        if (currentGrid[to.row]?.[to.col] !== ".") return currentGrid;

        const nextGrid = cloneGrid(currentGrid);
        nextGrid[from.row][from.col] = ".";
        nextGrid[to.row][to.col] = "X";
        return nextGrid;
      });
    },
    [canEditTraps],
  );

  const toggleTrap = useCallback(
    (state: State) => {
      if (!canEditTraps) return;
      setGrid((currentGrid) => {
        const cell = currentGrid[state.row]?.[state.col];
        if (cell !== "." && cell !== "X") return currentGrid;

        const nextGrid = cloneGrid(currentGrid);
        nextGrid[state.row][state.col] = cell === "X" ? "." : "X";
        return nextGrid;
      });
    },
    [canEditTraps],
  );

  const updateHyperparam = useCallback(<K extends keyof Hyperparams>(key: K, value: Hyperparams[K]) => {
    setHyperparams((prev) => {
      const next = { ...prev, [key]: value };
      setController((current) => ({
        ...current,
        learner: refreshPolicies(
          {
            ...current.learner,
            replayBuffer: { ...current.learner.replayBuffer, capacity: next.replayBufferCapacity },
          },
          next,
        ),
      }));
      return next;
    });
  }, []);

  const trainOneStep = useCallback(() => {
    setController((current) => {
      const result = advanceTrainingStep(current.learner, current.runtime, hyperparams, grid);
      const summaries = result.completedEpisode
        ? [...current.summaries, result.completedEpisode]
        : current.summaries;

      return {
        ...current,
        mode: "Training",
        learner: result.learner,
        runtime: result.runtime,
        lastTransition: result.transition,
        lastUpdate: result.updateInfo,
        sampledIds: result.sampledIds,
        summaries,
        lastAction: result.transition?.action,
        lastReward: result.transition?.reward,
        batchSummary: undefined,
        isEvaluating: false,
      };
    });
  }, [grid, hyperparams]);

  const trainEpisodes = useCallback(
    (episodeCount: number) => {
      setController((current) => {
        const result = trainEpisodesFast(current.learner, current.runtime, hyperparams, episodeCount, grid);
        const summaries = [...current.summaries, ...result.summaries];
        const avgReward =
          result.summaries.reduce((sum, summary) => sum + summary.reward, 0) / Math.max(1, result.summaries.length);
        const successes = result.summaries.filter((summary) => summary.doneReason === "goal").length;
        const traps = result.summaries.filter((summary) => summary.doneReason === "trap").length;

        return {
          ...current,
          mode: "Training",
          learner: result.learner,
          runtime: result.runtime,
          lastTransition: result.lastResult?.transition,
          lastUpdate: result.lastResult?.updateInfo,
          sampledIds: result.lastResult?.sampledIds ?? [],
          summaries,
          lastAction: result.lastResult?.transition?.action,
          lastReward: result.lastResult?.transition?.reward,
          batchSummary: `${episodeCount} episodes: avg reward ${avgReward.toFixed(1)}, success ${successes}, traps ${traps}`,
          isAutoTraining: false,
          isEvaluating: false,
        };
      });
    },
    [grid, hyperparams],
  );

  const toggleAutoTrain = useCallback(() => {
    setController((current) => ({
      ...current,
      mode: "Training",
      isAutoTraining: !current.isAutoTraining,
      isEvaluating: false,
    }));
  }, []);

  const evaluateTargetPolicy = useCallback((strategy: EvaluationStrategy) => {
    setController((current) => ({
      ...current,
      mode: "Evaluation",
      evaluationRuntime: createEvaluationRuntime(),
      evaluationStrategy: strategy,
      isAutoTraining: false,
      isEvaluating: true,
      sampledIds: [],
      batchSummary: undefined,
      lastAction: undefined,
      lastReward: undefined,
    }));
  }, []);

  const stepEvaluation = useCallback(() => {
    setController((current) => {
      const result = advanceEvaluationStep(
        current.evaluationRuntime,
        current.learner.targetPolicy,
        hyperparams.maxStepsPerEpisode,
        current.evaluationStrategy,
        grid,
      );
      return {
        ...current,
        mode: "Evaluation",
        evaluationRuntime: result.runtime,
        lastAction: result.action,
        lastReward: result.reward,
        isEvaluating: result.runtime.doneReason === "none",
      };
    });
  }, [grid, hyperparams.maxStepsPerEpisode]);

  useEffect(() => {
    if (!controller.isAutoTraining) return undefined;
    const interval = window.setInterval(trainOneStep, speedMs);
    return () => window.clearInterval(interval);
  }, [controller.isAutoTraining, speedMs, trainOneStep]);

  useEffect(() => {
    if (!controller.isEvaluating) return undefined;
    const interval = window.setInterval(stepEvaluation, speedMs);
    return () => window.clearInterval(interval);
  }, [controller.isEvaluating, speedMs, stepEvaluation]);

  const activeRuntime = controller.mode === "Evaluation" ? controller.evaluationRuntime : controller.runtime;
  const displayState = useMemo(
    () => ({
      mode: controller.mode,
      evaluationStrategy: controller.evaluationStrategy,
      currentState: activeRuntime.state,
      currentStep: activeRuntime.step,
      trajectory: activeRuntime.trajectory,
      totalReward: activeRuntime.totalReward,
      doneReason: activeRuntime.doneReason,
      episode: controller.runtime.episode,
    }),
    [activeRuntime, controller.evaluationStrategy, controller.mode, controller.runtime.episode],
  );

  return {
    controller,
    grid,
    canEditTraps,
    hyperparams,
    speedMs,
    metrics,
    displayState,
    reset,
    updateHyperparam,
    setSpeedMs,
    moveTrap,
    toggleTrap,
    trainOneStep,
    trainEpisodes,
    toggleAutoTrain,
    evaluateTargetPolicy,
  };
}
