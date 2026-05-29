import type { State } from "../../types/rl";

interface TrajectoryProps {
  trajectory: State[];
}

export function Trajectory({ trajectory }: TrajectoryProps) {
  return (
    <>
      {trajectory.map((state, index) => (
        <div
          // The trajectory may revisit a cell, so index is part of the visual event identity.
          key={`${state.row}-${state.col}-${index}`}
          className="trajectory-dot"
          style={{
            gridRow: state.row + 1,
            gridColumn: state.col + 1,
            opacity: Math.min(0.85, 0.18 + index / Math.max(trajectory.length, 1)),
          }}
        />
      ))}
    </>
  );
}
