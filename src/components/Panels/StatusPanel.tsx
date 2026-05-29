import { Badge } from "../common/Badge";
import { Card } from "../common/Card";
import type { DoneReason, EvaluationStrategy, Mode, State } from "../../types/rl";
import { stateKey } from "../../rl/utils";

interface StatusPanelProps {
  mode: Mode;
  episode: number;
  currentStep: number;
  currentState: State;
  lastAction?: string;
  lastReward?: number;
  doneReason: DoneReason;
  evaluationStrategy: EvaluationStrategy;
  totalReward: number;
  replayBufferSize: number;
  successRate: number;
  trapHitCount: number;
  batchSummary?: string;
}

function toneForDone(doneReason: DoneReason) {
  if (doneReason === "goal") return "green";
  if (doneReason === "trap") return "red";
  if (doneReason === "max_steps") return "amber";
  return "neutral";
}

export function StatusPanel({
  mode,
  episode,
  currentStep,
  currentState,
  lastAction,
  lastReward,
  doneReason,
  evaluationStrategy,
  totalReward,
  replayBufferSize,
  successRate,
  trapHitCount,
  batchSummary,
}: StatusPanelProps) {
  return (
    <Card
      title="Status"
      eyebrow="Run state"
      right={<Badge tone={mode === "Training" ? "blue" : "green"}>{mode}</Badge>}
    >
      <div className="status-grid">
        <span>Episode</span>
        <strong>{episode}</strong>
        <span>Step</span>
        <strong>{currentStep}</strong>
        <span>Current state</span>
        <strong>{stateKey(currentState)}</strong>
        <span>Last action</span>
        <strong>{lastAction ?? "-"}</strong>
        <span>Last reward</span>
        <strong>{lastReward ?? "-"}</strong>
        <span>Done reason</span>
        <strong>
          <Badge tone={toneForDone(doneReason)}>{doneReason}</Badge>
        </strong>
        {mode === "Evaluation" && (
          <>
            <span>Eval strategy</span>
            <strong>{evaluationStrategy === "greedy" ? "Greedy" : "Non-greedy"}</strong>
          </>
        )}
        <span>Episode reward</span>
        <strong>{totalReward.toFixed(1)}</strong>
        <span>Replay buffer</span>
        <strong>{replayBufferSize}</strong>
        <span>Recent success</span>
        <strong>{(successRate * 100).toFixed(0)}%</strong>
        <span>Trap hits</span>
        <strong>{trapHitCount}</strong>
      </div>
      {batchSummary && <div className="batch-summary">{batchSummary}</div>}
    </Card>
  );
}
