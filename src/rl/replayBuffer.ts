import type { ReplayBuffer, Transition } from "../types/rl";

export function createReplayBuffer(capacity: number): ReplayBuffer {
  return { items: [], capacity, nextId: 1 };
}

export function addTransition(buffer: ReplayBuffer, transition: Omit<Transition, "id">): ReplayBuffer {
  const item: Transition = { ...transition, id: buffer.nextId };
  const items = [...buffer.items, item].slice(-buffer.capacity);
  return {
    ...buffer,
    items,
    nextId: buffer.nextId + 1,
  };
}

export function sampleReplayBuffer(buffer: ReplayBuffer, batchSize: number): Transition[] {
  if (buffer.items.length === 0) return [];
  const count = Math.min(batchSize, buffer.items.length);
  const copy = [...buffer.items];
  const samples: Transition[] = [];

  for (let index = 0; index < count; index += 1) {
    const pick = Math.floor(Math.random() * copy.length);
    samples.push(copy[pick]);
    copy.splice(pick, 1);
  }

  return samples;
}
