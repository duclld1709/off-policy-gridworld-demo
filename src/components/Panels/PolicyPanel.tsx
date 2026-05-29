import type { CSSProperties } from "react";
import { ACTIONS } from "../../constants/grid";
import type { GridLayout, Mode, PolicyTable, State } from "../../types/rl";
import { sameState } from "../../rl/utils";
import { Card } from "../common/Card";

const arrowByAction = {
  UP: "↑",
  DOWN: "↓",
  LEFT: "←",
  RIGHT: "→",
};

interface PolicyPanelProps {
  title: string;
  policy: PolicyTable;
  currentState: State;
  grid: GridLayout;
  mode: Mode;
  kind: "behavior" | "target";
}

export function PolicyPanel({ title, policy, currentState, grid, mode, kind }: PolicyPanelProps) {
  const active = (kind === "behavior" && mode === "Training") || (kind === "target" && mode === "Evaluation");
  const caption =
    kind === "behavior"
      ? "Behavior policy μ is used to act during training."
      : "Target policy π is learned and used during evaluation.";

  const policyGridStyle = { "--grid-size": grid.length } as CSSProperties;

  return (
    <Card title={title} eyebrow={active ? "Active now" : "Policy table"} className={active ? "policy-active" : ""}>
      <div className="policy-caption">{caption}</div>
      <div className="policy-grid" style={policyGridStyle}>
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const state = { row: rowIndex, col: colIndex };
            const isCurrent = sameState(currentState, state);
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`policy-cell ${cell === "X" ? "policy-trap" : ""} ${cell === "G" ? "policy-goal" : ""} ${isCurrent ? "policy-current" : ""}`}
              >
                {cell === "X" ? (
                  <span className="policy-terminal">TRAP</span>
                ) : cell === "G" ? (
                  <span className="policy-terminal">GOAL</span>
                ) : (
                  ACTIONS.map((action, index) => (
                    <span
                      key={action}
                      className={`policy-arrow arrow-${action.toLowerCase()}`}
                      style={{
                        opacity: 0.24 + policy[rowIndex][colIndex][index] * 0.85,
                        transform: `scale(${0.78 + policy[rowIndex][colIndex][index] * 1.35})`,
                      }}
                      title={`${action}: ${(policy[rowIndex][colIndex][index] * 100).toFixed(1)}%`}
                    >
                      {arrowByAction[action]}
                    </span>
                  ))
                )}
              </div>
            );
          }),
        )}
      </div>
    </Card>
  );
}
