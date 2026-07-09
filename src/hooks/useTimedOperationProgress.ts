"use client";

import { useCallback } from "react";
import { useSmoothProgress } from "./useSmoothProgress";

/** Progress for long-running API ops (tailor, ATS fix). Creeps to 90%, then completes to 100%. */
export function useTimedOperationProgress(durationMs: number) {
  const {
    smoothPercent,
    status,
    setStatus,
    startCreep,
    complete,
    reset,
    stopCreep,
  } = useSmoothProgress();

  const start = useCallback(() => {
    reset();
    startCreep(0, 90, durationMs);
  }, [reset, startCreep, durationMs]);

  const finish = useCallback(async () => {
    stopCreep();
    await complete();
  }, [stopCreep, complete]);

  return {
    value: smoothPercent,
    status,
    setStatus,
    start,
    finish,
    reset,
  };
}
