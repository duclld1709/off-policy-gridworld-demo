export type CellType = "S" | "." | "X" | "G";
export type Action = "UP" | "DOWN" | "LEFT" | "RIGHT";
export type DoneReason = "none" | "goal" | "trap" | "max_steps";
export type Mode = "Training" | "Evaluation";
export type EvaluationStrategy = "greedy" | "non_greedy";
export type GridLayout = CellType[][];

export interface State {
  row: number;
  col: number;
}

export interface StepResult {
  nextState: State;
  reward: number;
  done: boolean;
  doneReason: DoneReason;
}

export interface Transition {
  id: number;
  state: State;
  action: Action;
  reward: number;
  nextState: State;
  done: boolean;
  doneReason: DoneReason;
  muProbAtAction: number;
  episode: number;
  step: number;
}

export interface ReplayBuffer {
  items: Transition[];
  capacity: number;
  nextId: number;
}

export type QTable = number[][][];
export type PolicyTable = number[][][];

export interface Hyperparams {
  alpha: number;
  gamma: number;
  epsilon: number;
  temperature: number;
  rhoMax: number;
  maxStepsPerEpisode: number;
  replayBufferCapacity: number;
  batchSize: number;
}

export interface UpdateInfo {
  transitionId: number;
  state: State;
  action: Action;
  reward: number;
  nextState: State;
  done: boolean;
  muProb: number;
  piProb: number;
  rhoRaw: number;
  rhoClipped: number;
  tdTarget: number;
  tdError: number;
  updateStrength: number;
  oldQ: number;
  newQ: number;
}

export interface EpisodeSummary {
  episode: number;
  reward: number;
  steps: number;
  doneReason: DoneReason;
  avgRho: number;
}

export interface MetricPoint {
  episode: number;
  reward: number;
  successRate: number;
  avgRho: number;
  trapHits: number;
}
