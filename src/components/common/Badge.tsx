import type { ReactNode } from "react";

interface BadgeProps {
  tone?: "blue" | "green" | "red" | "amber" | "neutral";
  children: ReactNode;
}

export function Badge({ tone = "neutral", children }: BadgeProps) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
