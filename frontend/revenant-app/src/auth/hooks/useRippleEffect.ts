import { useState, useCallback, useRef } from "react";

interface RippleState {
  x: number;
  y: number;
  id: number;
  startTime: number;
}

interface UseRippleEffectOptions {
  duration?: number;
}

interface UseRippleEffectReturn {
  ripples: RippleState[];
  triggerRipple: (event: React.MouseEvent | React.TouchEvent) => void;
}

/**
 * Hook that manages radial ripple effects for interactive elements.
 *
 * Tracks an array of active ripples with their position and timing,
 * and automatically removes them after the configured duration.
 *
 * @param options.duration - Time in ms before a ripple is removed (default 400ms)
 * @returns ripples array and a triggerRipple function to initiate new ripples
 */
export function useRippleEffect(
  options: UseRippleEffectOptions = {}
): UseRippleEffectReturn {
  const { duration = 400 } = options;

  const [ripples, setRipples] = useState<RippleState[]>([]);
  const idCounterRef = useRef<number>(0);

  const triggerRipple = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      const element = event.currentTarget as HTMLElement;
      const rect = element.getBoundingClientRect();

      let clientX: number;
      let clientY: number;

      if ("touches" in event) {
        const touch = event.touches[0] ?? event.changedTouches[0];
        clientX = touch.clientX;
        clientY = touch.clientY;
      } else {
        clientX = event.clientX;
        clientY = event.clientY;
      }

      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const id = idCounterRef.current++;
      const startTime = Date.now();

      const ripple: RippleState = { x, y, id, startTime };

      setRipples((prev) => [...prev, ripple]);

      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, duration);
    },
    [duration]
  );

  return { ripples, triggerRipple };
}
