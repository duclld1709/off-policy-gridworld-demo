import type { MetricPoint } from "../../types/rl";
import { Card } from "../common/Card";

interface ChartsPanelProps {
  points: MetricPoint[];
}

interface MiniChartProps {
  title: string;
  values: number[];
  color: string;
  min?: number;
  max?: number;
  suffix?: string;
}

function MiniChart({ title, values, color, min, max, suffix = "" }: MiniChartProps) {
  const recent = values.slice(-40);
  const low = min ?? Math.min(...recent, 0);
  const high = max ?? Math.max(...recent, 1);
  const range = Math.max(1e-6, high - low);
  const points = recent
    .map((value, index) => {
      const x = recent.length <= 1 ? 0 : (index / (recent.length - 1)) * 100;
      const y = 42 - ((value - low) / range) * 34;
      return `${x},${y}`;
    })
    .join(" ");
  const latest = recent.at(-1) ?? 0;

  return (
    <div className="mini-chart">
      <div className="chart-title">
        <span>{title}</span>
        <strong>
          {latest.toFixed(title.includes("Success") ? 2 : 1)}
          {suffix}
        </strong>
      </div>
      <svg viewBox="0 0 100 46" preserveAspectRatio="none">
        <path d="M0 42H100" className="chart-axis" />
        <polyline points={points} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function ChartsPanel({ points }: ChartsPanelProps) {
  return (
    <Card title="Charts" eyebrow="Recent episodes">
      <div className="charts-grid">
        <MiniChart title="Episode reward" values={points.map((point) => point.reward)} color="#5eead4" />
        <MiniChart title="Success rate" values={points.map((point) => point.successRate)} color="#a3e635" min={0} max={1} />
        <MiniChart title="Avg importance ρ" values={points.map((point) => point.avgRho)} color="#fbbf24" />
        <MiniChart title="Trap hits" values={points.map((point) => point.trapHits)} color="#fb7185" />
      </div>
    </Card>
  );
}
