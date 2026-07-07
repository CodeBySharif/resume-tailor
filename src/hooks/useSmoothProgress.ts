"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

function easeOutQuad(t: number): number {
  return t * (2 - t);
}

export function useSmoothProgress() {
  const [percent, setPercent] = useState(0);
  const [status, setStatus] = useState("");
  const percentRef = useRef(0);
  const targetRef = useRef(0);
  const creepingRef = useRef(false);
  const capRef = useRef(90);
  const creepFromRef = useRef(0);
  const creepStartRef = useRef<number | null>(null);
  const creepDurationRef = useRef(60_000);
  const rafRef = useRef<number | null>(null);

  const displayPercent = Math.min(100, Math.round(percent));

  const tickRef = useRef<() => void>(() => {});

  useLayoutEffect(() => {
    tickRef.current = () => {
      setPercent((prev) => {
        let target = targetRef.current;

        if (creepingRef.current && creepStartRef.current != null && prev < capRef.current) {
          const elapsed = performance.now() - creepStartRef.current;
          const span = capRef.current - creepFromRef.current;
          const t = Math.min(1, elapsed / creepDurationRef.current);
          const timeTarget =
            creepFromRef.current + easeOutQuad(t) * span;

          if (t >= 1 && prev < capRef.current) {
            const overtime = elapsed - creepDurationRef.current;
            const slowBump = Math.min(
              capRef.current,
              prev + overtime * 0.004
            );
            target = Math.max(target, timeTarget, slowBump);
          } else {
            target = Math.max(target, timeTarget);
          }

          targetRef.current = target;
        }

        const diff = target - prev;
        const next = Math.abs(diff) < 0.05 ? target : prev + diff * 0.18;
        percentRef.current = next;
        return next;
      });

      rafRef.current = requestAnimationFrame(() => tickRef.current());
    };
  });

  const startLoop = useCallback(() => {
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(() => tickRef.current());
    }
  }, []);

  const stopLoop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const setProgress = useCallback(
    (value: number) => {
      const clamped = Math.max(0, Math.min(100, value));
      targetRef.current = Math.max(targetRef.current, clamped);
      percentRef.current = Math.max(percentRef.current, clamped);
      setPercent((prev) => Math.max(prev, clamped));
      startLoop();
    },
    [startLoop]
  );

  const startTimedCreep = useCallback(
    (from: number, cap: number, durationMs: number) => {
      capRef.current = cap;
      creepFromRef.current = from;
      creepDurationRef.current = Math.max(1000, durationMs);
      creepStartRef.current = performance.now();
      creepingRef.current = true;
      targetRef.current = Math.max(targetRef.current, from);
      percentRef.current = Math.max(percentRef.current, from);
      setPercent((prev) => Math.max(prev, from));
      startLoop();
    },
    [startLoop]
  );

  const startCreep = useCallback(
    (from: number, cap = 90, durationMs = 60_000) => {
      startTimedCreep(from, cap, durationMs);
    },
    [startTimedCreep]
  );

  const stopCreep = useCallback(() => {
    creepingRef.current = false;
    creepStartRef.current = null;
  }, []);

  const complete = useCallback((): Promise<void> => {
    stopCreep();
    const from = percentRef.current;
    const start = performance.now();
    const duration = 450;

    return new Promise((resolve) => {
      const animate = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const value = from + (100 - from) * easeOutQuad(t);
        percentRef.current = value;
        targetRef.current = value;
        setPercent(value);

        if (t >= 1) {
          percentRef.current = 100;
          targetRef.current = 100;
          setPercent(100);
          resolve();
          return;
        }
        requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    });
  }, [stopCreep]);

  const reset = useCallback(() => {
    stopCreep();
    targetRef.current = 0;
    percentRef.current = 0;
    creepFromRef.current = 0;
    setPercent(0);
    setStatus("");
  }, [stopCreep]);

  useEffect(() => () => stopLoop(), [stopLoop]);

  return {
    percent: displayPercent,
    smoothPercent: percent,
    status,
    setStatus,
    setProgress,
    startCreep,
    startTimedCreep,
    complete,
    reset,
    stopCreep,
  };
}
