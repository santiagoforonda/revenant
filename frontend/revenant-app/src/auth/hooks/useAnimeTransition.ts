import { useRef, useCallback, useEffect } from "react";
import { animate } from "animejs";
import type { JSAnimation } from "animejs";
import { useReducedMotion } from "./useReducedMotion";

export interface TransitionConfig {
  /** Duration in milliseconds */
  duration: number;
  /** Easing function name (anime.js easing string) */
  easing: string;
  /** Initial opacity (0-1) */
  fromOpacity: number;
  /** Final opacity (0-1) */
  toOpacity: number;
  /** Initial scale factor */
  fromScale: number;
  /** Final scale factor */
  toScale: number;
}

export interface UseAnimeTransitionReturn {
  /** Ref to attach to the animated container element */
  ref: React.RefObject<HTMLDivElement | null>;
  /** Whether an animation is currently in progress */
  isAnimating: boolean;
  /** Plays the entrance animation; resolves when complete */
  animateIn: () => Promise<void>;
  /** Plays the exit animation; resolves when complete */
  animateOut: (config?: Partial<TransitionConfig>) => Promise<void>;
  /** Cancels any in-progress animation immediately */
  cancel: () => void;
}

export const ENTRANCE_DEFAULTS: TransitionConfig = {
  duration: 600,
  easing: "easeOutCubic",
  fromOpacity: 0,
  toOpacity: 1,
  fromScale: 0.85,
  toScale: 1,
};

export const EXIT_DEFAULTS: TransitionConfig = {
  duration: 400,
  easing: "easeInCubic",
  fromOpacity: 1,
  toOpacity: 0,
  fromScale: 1,
  toScale: 0.9,
};

export function useAnimeTransition(): UseAnimeTransitionReturn {
  const ref = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<JSAnimation | null>(null);
  const isAnimatingRef = useRef(false);
  const reducedMotion = useReducedMotion();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.cancel();
        animationRef.current = null;
      }
    };
  }, []);

  const cancel = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.cancel();
      animationRef.current = null;
    }
    isAnimatingRef.current = false;
  }, []);

  const animateIn = useCallback(async (): Promise<void> => {
    const el = ref.current;
    if (!el) return;

    if (reducedMotion) {
      el.style.opacity = "1";
      el.style.transform = "scale(1)";
      return;
    }

    cancel();
    isAnimatingRef.current = true;

    el.style.opacity = String(ENTRANCE_DEFAULTS.fromOpacity);
    el.style.transform = `scale(${ENTRANCE_DEFAULTS.fromScale})`;
    el.style.pointerEvents = "none";

    const anim = animate(el, {
      opacity: [ENTRANCE_DEFAULTS.fromOpacity, ENTRANCE_DEFAULTS.toOpacity],
      scale: [ENTRANCE_DEFAULTS.fromScale, ENTRANCE_DEFAULTS.toScale],
      duration: ENTRANCE_DEFAULTS.duration,
      easing: ENTRANCE_DEFAULTS.easing,
    });

    animationRef.current = anim;
    await anim;

    el.style.pointerEvents = "";
    isAnimatingRef.current = false;
    animationRef.current = null;
  }, [reducedMotion, cancel]);

  const animateOut = useCallback(
    async (config?: Partial<TransitionConfig>): Promise<void> => {
      const el = ref.current;
      if (!el) return;

      if (reducedMotion) {
        el.style.opacity = "0";
        el.style.transform = `scale(${EXIT_DEFAULTS.toScale})`;
        return;
      }

      cancel();
      isAnimatingRef.current = true;

      const merged = { ...EXIT_DEFAULTS, ...config };

      const anim = animate(el, {
        opacity: [merged.fromOpacity, merged.toOpacity],
        scale: [merged.fromScale, merged.toScale],
        duration: merged.duration,
        easing: merged.easing,
      });

      animationRef.current = anim;
      await anim;

      isAnimatingRef.current = false;
      animationRef.current = null;
    },
    [reducedMotion, cancel],
  );

  return {
    ref,
    isAnimating: isAnimatingRef.current,
    animateIn,
    animateOut,
    cancel,
  };
}
