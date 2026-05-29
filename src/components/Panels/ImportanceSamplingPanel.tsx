import type { UpdateInfo } from "../../types/rl";
import { stateKey } from "../../rl/utils";
import { Card } from "../common/Card";

interface ImportanceSamplingPanelProps {
  update?: UpdateInfo;
}

export function ImportanceSamplingPanel({ update }: ImportanceSamplingPanelProps) {
  return (
    <Card title="Importance Sampling" eyebrow="Off-policy update">
      <div className="formula">ρ = π(a|s) / μ(a|s)</div>
      {update ? (
        <div className="importance-grid">
          <span>sampled transition</span>
          <strong>
            {stateKey(update.state)} -- {update.action} → {stateKey(update.nextState)}
          </strong>
          <span>μ(a|s)</span>
          <strong>{update.muProb.toFixed(4)}</strong>
          <span>π(a|s)</span>
          <strong>{update.piProb.toFixed(4)}</strong>
          <span>raw ρ</span>
          <strong>{update.rhoRaw.toFixed(4)}</strong>
          <span>clipped ρ</span>
          <strong>{update.rhoClipped.toFixed(4)}</strong>
          <span>TD target</span>
          <strong>{update.tdTarget.toFixed(3)}</strong>
          <span>TD error</span>
          <strong>{update.tdError.toFixed(3)}</strong>
          <span>update strength</span>
          <strong>{update.updateStrength.toFixed(3)}</strong>
          <span>Q before → after</span>
          <strong>
            {update.oldQ.toFixed(3)} → {update.newQ.toFixed(3)}
          </strong>
        </div>
      ) : (
        <div className="empty-state">No sampled update yet.</div>
      )}
      <p className="explain">
        Importance sampling controls how strongly a transition collected by behavior policy should affect the target
        policy update.
      </p>
    </Card>
  );
}
