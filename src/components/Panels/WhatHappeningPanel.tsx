import { Card } from "../common/Card";

export function WhatHappeningPanel() {
  return (
    <Card title="What is happening?" eyebrow="Learning flow">
      <ul className="flow-list">
        <li>During training, the robot acts using behavior policy μ.</li>
        <li>The collected experience is stored in replay buffer.</li>
        <li>The target policy π is updated from sampled experiences.</li>
        <li>Because the data came from μ but we learn π, importance sampling weight ρ = π(a|s) / μ(a|s) adjusts the update strength.</li>
        <li>During evaluation, the robot acts only using target policy π.</li>
      </ul>
    </Card>
  );
}
