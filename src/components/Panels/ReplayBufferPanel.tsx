import type { Hyperparams, PolicyTable, ReplayBuffer } from "../../types/rl";
import { getActionProb } from "../../rl/policies";
import { stateKey } from "../../rl/utils";
import { Card } from "../common/Card";

interface ReplayBufferPanelProps {
  replayBuffer: ReplayBuffer;
  targetPolicy: PolicyTable;
  hyperparams: Hyperparams;
  sampledIds: number[];
  activeUpdateId?: number;
}

export function ReplayBufferPanel({
  replayBuffer,
  targetPolicy,
  hyperparams,
  sampledIds,
  activeUpdateId,
}: ReplayBufferPanelProps) {
  const rows = replayBuffer.items.slice(-12).reverse();

  return (
    <Card title="Replay Buffer" eyebrow={`${replayBuffer.items.length}/${replayBuffer.capacity} transitions`}>
      <div className="table-wrap">
        <table className="buffer-table">
          <thead>
            <tr>
              <th>state</th>
              <th>action</th>
              <th>reward</th>
              <th>next</th>
              <th>done</th>
              <th>μ(a|s)</th>
              <th>π(a|s)</th>
              <th>ρ raw</th>
              <th>ρ clip</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((transition) => {
              const piProb = getActionProb(targetPolicy, transition.state, transition.action);
              const rhoRaw = piProb / Math.max(transition.muProbAtAction, 1e-9);
              const rhoClipped = Math.min(rhoRaw, hyperparams.rhoMax);
              const isSampled = sampledIds.includes(transition.id);
              const isActive = transition.id === activeUpdateId;

              return (
                <tr
                  key={transition.id}
                  className={`${isSampled ? "row-sampled" : ""} ${isActive ? "row-active" : ""} ${
                    rhoClipped > 1.4 ? "rho-high" : rhoClipped < 0.75 ? "rho-low" : ""
                  }`}
                >
                  <td>{stateKey(transition.state)}</td>
                  <td>{transition.action}</td>
                  <td>{transition.reward}</td>
                  <td>{stateKey(transition.nextState)}</td>
                  <td>{transition.done ? transition.doneReason : "no"}</td>
                  <td>{transition.muProbAtAction.toFixed(3)}</td>
                  <td>{piProb.toFixed(3)}</td>
                  <td>{rhoRaw.toFixed(3)}</td>
                  <td>{rhoClipped.toFixed(3)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && <div className="empty-state">Train one step to collect the first transition.</div>}
      </div>
    </Card>
  );
}
