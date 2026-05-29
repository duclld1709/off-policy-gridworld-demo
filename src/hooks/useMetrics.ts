import { useMemo } from "react";
import type { EpisodeSummary, MetricPoint } from "../types/rl";

export function buildMetricPoints(summaries: EpisodeSummary[]): MetricPoint[] {
  let trapHits = 0;
  return summaries.map((summary, index) => {
    if (summary.doneReason === "trap") trapHits += 1;
    const recent = summaries.slice(Math.max(0, index - 19), index + 1);
    const successes = recent.filter((item) => item.doneReason === "goal").length;
    const avgRho = recent.reduce((sum, item) => sum + item.avgRho, 0) / recent.length;

    return {
      episode: summary.episode,
      reward: summary.reward,
      successRate: successes / recent.length,
      avgRho,
      trapHits,
    };
  });
}

export function useMetrics(summaries: EpisodeSummary[]) {
  return useMemo(() => {
    const metricPoints = buildMetricPoints(summaries);
    const recent = summaries.slice(-20);
    const successRate =
      recent.length === 0 ? 0 : recent.filter((summary) => summary.doneReason === "goal").length / recent.length;
    const trapHitCount = summaries.filter((summary) => summary.doneReason === "trap").length;
    const averageReward =
      recent.length === 0 ? 0 : recent.reduce((sum, summary) => sum + summary.reward, 0) / recent.length;

    return { metricPoints, successRate, trapHitCount, averageReward };
  }, [summaries]);
}
