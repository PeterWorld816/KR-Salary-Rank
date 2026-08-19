"use client";
// Animates a displayed number from its previous value up to `target` on an
// ease-out curve — used for the ratio-headline percent so it reads as a
// small "reveal" instead of popping in static. Respects
// prefers-reduced-motion the same way globals.css's .fade-up does: skip the
// animation and jump straight to the final value.
import { useEffect, useRef, useState } from "react";

export function useCountUp(target: number, duration = 700): number {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(target);
      fromRef.current = target;
      return;
    }

    const from = fromRef.current;
    const startTime = performance.now();
    let raf = 0;

    function tick(now: number) {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (target - from) * eased);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return display;
}
