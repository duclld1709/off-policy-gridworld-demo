import { useMemo } from "react";

export function useAnimation(speedMs: number) {
  return useMemo(
    () => ({
      transitionDuration: `${Math.max(120, speedMs * 0.55)}ms`,
    }),
    [speedMs],
  );
}
