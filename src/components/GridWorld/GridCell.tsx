import { Flame, Flag, Home } from "lucide-react";
import type { CellType, State } from "../../types/rl";

interface GridCellProps {
  cell: CellType;
  state: State;
  isCurrent: boolean;
  canEditTraps: boolean;
  onTrapDragStart: (state: State) => void;
  onGoalDragStart: (state: State) => void;
  onTrapDrop: (state: State) => void;
  onGoalDrop: (state: State) => void;
  onToggleTrap: (state: State) => void;
}

export function GridCell({
  cell,
  state,
  isCurrent,
  canEditTraps,
  onTrapDragStart,
  onGoalDragStart,
  onTrapDrop,
  onGoalDrop,
  onToggleTrap,
}: GridCellProps) {
  const isDraggableTrap = canEditTraps && cell === "X";
  const isDraggableGoal = canEditTraps && cell === "G";
  const isToggleableTrapCell = canEditTraps && (cell === "." || cell === "X");
  const isDropTarget = canEditTraps && cell === ".";
  const className = [
    "grid-cell",
    cell === "X" && "cell-trap",
    cell === "G" && "cell-goal",
    cell === "S" && "cell-start",
    isCurrent && "cell-current",
    (isDraggableTrap || isDraggableGoal) && "cell-draggable",
    isDropTarget && "cell-drop-target",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={className}
      draggable={isDraggableTrap || isDraggableGoal}
      onDragOver={(event) => {
        if (!isDropTarget) return;
        event.preventDefault();
      }}
      onDragStart={() => {
        if (isDraggableTrap) onTrapDragStart(state);
        if (isDraggableGoal) onGoalDragStart(state);
      }}
      onDrop={(event) => {
        if (!isDropTarget) return;
        event.preventDefault();
        onTrapDrop(state);
        onGoalDrop(state);
      }}
      onDoubleClick={() => {
        if (isToggleableTrapCell) onToggleTrap(state);
      }}
      style={{ gridRow: state.row + 1, gridColumn: state.col + 1 }}
      title={
        isDraggableTrap
          ? "Trap: drag to move it to a safe cell, or double-click to remove it."
          : isDraggableGoal
            ? "Goal: drag to move it to a safe cell."
          : isDropTarget
            ? "Safe cell: double-click to create a trap here, or drop a dragged trap or goal here."
            : undefined
      }
    >
      {cell === "S" && <Home size={22} />}
      {cell === "X" && <Flame size={24} />}
      {cell === "G" && <Flag size={25} />}
      {cell === "." && <span className="cell-dot" />}
      <span className="cell-coord">
        {state.row},{state.col}
      </span>
    </div>
  );
}
