import catAgent from "../../assets/cat-agent-sticker.gif";
import type { State } from "../../types/rl";

interface AgentProps {
  position: State;
  duration: string;
  isGoal: boolean;
  isTrap: boolean;
}

export function Agent({ position, duration, isGoal, isTrap }: AgentProps) {
  return (
    <div
      className={`agent ${isGoal ? "agent-success" : ""} ${isTrap ? "agent-hit" : ""}`}
      style={{
        transform: `translate(calc(${position.col} * (100% + var(--grid-gap))), calc(${position.row} * (100% + var(--grid-gap))))`,
        transitionDuration: duration,
      }}
      aria-label="Cat meme agent"
    >
      <img src={catAgent} alt="" className="agent-sticker" draggable={false} />
    </div>
  );
}
