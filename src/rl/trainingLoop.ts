import { DEFAULT_HYPERPARAMS } from "../constants/hyperparams";
import { START_STATE } from "../constants/grid";
import type {
  DoneReason,
  EpisodeSummary,
  GridLayout,
  Hyperparams,
  PolicyTable,
  QTable,
  ReplayBuffer,
  State,
  Transition,
  UpdateInfo,
} from "../types/rl";
import { resetEnvironment, stepEnvironment } from "./environment";
import { createQTable, applyImportanceSamplingUpdate } from "./qLearning";
import { addTransition, createReplayBuffer, sampleReplayBuffer } from "./replayBuffer";
import { behaviorPolicyFromTarget, getActionProb, sampleAction, softmaxPolicyFromQ } from "./policies";
import { average } from "./utils";

export interface LearnerState {
  qTable: QTable;
  targetPolicy: PolicyTable;
  behaviorPolicy: PolicyTable;
  replayBuffer: ReplayBuffer;
}

export interface EpisodeRuntime {
  episode: number;
  step: number;
  state: State;
  totalReward: number;
  doneReason: DoneReason;
  trajectory: State[];
  episodeRhos: number[];
}

export interface TrainingStepResult {
  learner: LearnerState;
  runtime: EpisodeRuntime;
  transition?: Transition;
  updateInfo?: UpdateInfo;
  sampledIds: number[];
  completedEpisode?: EpisodeSummary;
}

export function createLearner(hyperparams: Hyperparams = DEFAULT_HYPERPARAMS): LearnerState {
  const qTable = createQTable();
  const targetPolicy = softmaxPolicyFromQ(qTable, hyperparams.temperature);
  return {
    qTable,
    targetPolicy,
    behaviorPolicy: behaviorPolicyFromTarget(targetPolicy, hyperparams.epsilon),
    replayBuffer: createReplayBuffer(hyperparams.replayBufferCapacity),
  };
}

export function createEpisodeRuntime(episode = 1): EpisodeRuntime {
  return {
    episode,
    step: 0,
    state: resetEnvironment(),
    totalReward: 0,
    doneReason: "none",
    trajectory: [{ ...START_STATE }],
    episodeRhos: [],
  };
}

export function refreshPolicies(learner: LearnerState, hyperparams: Hyperparams): LearnerState {
  const targetPolicy = softmaxPolicyFromQ(learner.qTable, hyperparams.temperature);
  return {
    ...learner,
    targetPolicy,
    behaviorPolicy: behaviorPolicyFromTarget(targetPolicy, hyperparams.epsilon),
  };
}

export function advanceTrainingStep(
  learner: LearnerState,
  runtime: EpisodeRuntime,
  hyperparams: Hyperparams,
  grid: GridLayout,
): TrainingStepResult {
  const activeRuntime = runtime.doneReason === "none" ? runtime : createEpisodeRuntime(runtime.episode + 1);
  const action = sampleAction(learner.behaviorPolicy, activeRuntime.state);
  const muProbAtAction = getActionProb(learner.behaviorPolicy, activeRuntime.state, action);
  const envResult = stepEnvironment(activeRuntime.state, action, grid);
  const nextStep = activeRuntime.step + 1;
  const hitMaxSteps = !envResult.done && nextStep >= hyperparams.maxStepsPerEpisode;
  const doneReason: DoneReason = hitMaxSteps ? "max_steps" : envResult.doneReason;
  const done = envResult.done || hitMaxSteps;

  let replayBuffer = addTransition(learner.replayBuffer, {
    state: activeRuntime.state,
    action,
    reward: envResult.reward,
    nextState: envResult.nextState,
    done,
    doneReason,
    muProbAtAction,
    episode: activeRuntime.episode,
    step: nextStep,
  });

  const transition = replayBuffer.items[replayBuffer.items.length - 1];
  const samples = sampleReplayBuffer(replayBuffer, hyperparams.batchSize);
  let qTable = learner.qTable;
  let targetPolicy = learner.targetPolicy;
  let updateInfo: UpdateInfo | undefined;
  const sampledIds = samples.map((sample) => sample.id);
  const rhos: number[] = [];

  for (const sample of samples) {
    targetPolicy = softmaxPolicyFromQ(qTable, hyperparams.temperature);
    const update = applyImportanceSamplingUpdate(qTable, targetPolicy, sample, hyperparams);
    qTable = update.qTable;
    updateInfo = update.updateInfo;
    rhos.push(update.updateInfo.rhoClipped);
  }

  targetPolicy = softmaxPolicyFromQ(qTable, hyperparams.temperature);
  const behaviorPolicy = behaviorPolicyFromTarget(targetPolicy, hyperparams.epsilon);
  const nextRuntime: EpisodeRuntime = {
    ...activeRuntime,
    step: nextStep,
    state: envResult.nextState,
    totalReward: activeRuntime.totalReward + envResult.reward,
    doneReason,
    trajectory: [...activeRuntime.trajectory, envResult.nextState],
    episodeRhos: [...activeRuntime.episodeRhos, ...rhos],
  };

  const completedEpisode = done
    ? {
        episode: activeRuntime.episode,
        reward: nextRuntime.totalReward,
        steps: nextStep,
        doneReason,
        avgRho: average(nextRuntime.episodeRhos),
      }
    : undefined;

  replayBuffer = { ...replayBuffer, capacity: hyperparams.replayBufferCapacity };

  return {
    learner: { qTable, targetPolicy, behaviorPolicy, replayBuffer },
    runtime: nextRuntime,
    transition,
    updateInfo,
    sampledIds,
    completedEpisode,
  };
}

export function trainEpisodesFast(
  learner: LearnerState,
  runtime: EpisodeRuntime,
  hyperparams: Hyperparams,
  episodeCount: number,
  grid: GridLayout,
): { learner: LearnerState; runtime: EpisodeRuntime; summaries: EpisodeSummary[]; lastResult?: TrainingStepResult } {
  let currentLearner = learner;
  let currentRuntime = runtime;
  const summaries: EpisodeSummary[] = [];
  let lastResult: TrainingStepResult | undefined;

  while (summaries.length < episodeCount) {
    lastResult = advanceTrainingStep(currentLearner, currentRuntime, hyperparams, grid);
    currentLearner = lastResult.learner;
    currentRuntime = lastResult.runtime;
    if (lastResult.completedEpisode) {
      summaries.push(lastResult.completedEpisode);
      currentRuntime = createEpisodeRuntime(currentRuntime.episode + 1);
    }
  }

  return { learner: currentLearner, runtime: currentRuntime, summaries, lastResult };
}
