import { useRef, type CSSProperties } from "react";
import type { DoneReason, GridLayout, State } from "../../types/rl";
import { sameState } from "../../rl/utils";
import { useAnimation } from "../../hooks/useAnimation";
import { Agent } from "./Agent";
import { GridCell } from "./GridCell";
import { Trajectory } from "./Trajectory";

interface GridWorldProps {
  currentState: State;
  trajectory: State[];
  doneReason: DoneReason;
  speedMs: number;
  grid: GridLayout;
  lastAction?: string;
  lastReward?: number;
  canEditTraps: boolean;
  onMoveTrap: (from: State, to: State) => void;
  onMoveGoal: (from: State, to: State) => void;
  onToggleTrap: (state: State) => void;
}

export function GridWorld({
  currentState,
  trajectory,
  doneReason,
  speedMs,
  grid,
  lastAction,
  lastReward,
  canEditTraps,
  onMoveTrap,
  onMoveGoal,
  onToggleTrap,
}: GridWorldProps) {
  const animation = useAnimation(speedMs);
  const draggedTrapRef = useRef<State | null>(null);
  const draggedGoalRef = useRef<State | null>(null);
  const gridSize = grid.length;
  const boardStyle = {
    "--grid-size": gridSize,
    "--grid-gap-total": `calc(${Math.max(0, gridSize - 1)} * var(--grid-gap))`,
  } as CSSProperties;
  const feedbackKey = `${trajectory.length}-${currentState.row}-${currentState.col}-${lastAction ?? "none"}-${lastReward ?? "none"}`;
  const shouldShowStepFeedback = Boolean(lastAction) && lastReward !== undefined && trajectory.length > 1;

  return (
    <div className={`grid-stage done-${doneReason} ${canEditTraps ? "grid-editable" : ""}`}>
      <div className="grid-board" style={boardStyle}>
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <GridCell
              key={`${rowIndex}-${colIndex}`}
              cell={cell}
              state={{ row: rowIndex, col: colIndex }}
              isCurrent={sameState(currentState, { row: rowIndex, col: colIndex })}
              canEditTraps={canEditTraps}
              onTrapDragStart={(state) => {
                draggedTrapRef.current = state;
                draggedGoalRef.current = null;
              }}
              onGoalDragStart={(state) => {
                draggedGoalRef.current = state;
                draggedTrapRef.current = null;
              }}
              onTrapDrop={(state) => {
                if (!draggedTrapRef.current) return;
                onMoveTrap(draggedTrapRef.current, state);
                draggedTrapRef.current = null;
              }}
              onGoalDrop={(state) => {
                if (!draggedGoalRef.current) return;
                onMoveGoal(draggedGoalRef.current, state);
                draggedGoalRef.current = null;
              }}
              onToggleTrap={onToggleTrap}
            />
          )),
        )}
        <Trajectory trajectory={trajectory} />
        {shouldShowStepFeedback && (
          <div
            key={`reward-${feedbackKey}`}
            className={`reward-feedback ${(lastReward ?? 0) >= 0 ? "reward-positive" : "reward-negative"}`}
            style={{ gridRow: currentState.row + 1, gridColumn: currentState.col + 1 }}
            aria-hidden="true"
          >
            {(lastReward ?? 0) > 0 ? "+" : ""}
            {lastReward}
          </div>
        )}
        <Agent
          position={currentState}
          duration={animation.transitionDuration}
          isGoal={doneReason === "goal"}
          isTrap={doneReason === "trap"}
        />
      </div>
      <div className="legend">
        <span><i className="legend-start" /> Start</span>
        <span><i className="legend-safe" /> Safe</span>
        <span><i className="legend-trap" /> Trap</span>
        <span><i className="legend-goal" /> Goal</span>
      </div>
      {canEditTraps && (
        <div className="grid-edit-hint">Drag trap or goal cells, or double-click safe/trap cells to add or remove traps.</div>
      )}
    </div>
  );
}
