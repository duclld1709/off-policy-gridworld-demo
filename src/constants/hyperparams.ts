import type { Hyperparams } from "../types/rl";

export const DEFAULT_HYPERPARAMS: Hyperparams = {
  alpha: 0.1,
  gamma: 0.95,
  epsilon: 0.3,
  temperature: 0.7,
  rhoMax: 5,
  maxStepsPerEpisode: 50,
  replayBufferCapacity: 500,
  batchSize: 16,
};

export const DEFAULT_ANIMATION_SPEED_MS = 520;
