import { useState, useCallback, useRef, useEffect } from "react";

type Direction = "left" | "right" | null;

type UseCarouselReturn = {
  currentIndex: number;
  direction: Direction;
  isAnimating: boolean;
  goNext: () => void;
  goPrev: () => void;
  goTo: (index: number) => void;
  releaseAnimation: () => void;
};

/**
 * Computes the circular index using modular arithmetic.
 * Handles negative values correctly by adding totalItems before modulo.
 */
function circularIndex(index: number, totalItems: number): number {
  return ((index % totalItems) + totalItems) % totalItems;
}

/**
 * Hook for managing carousel state with circular navigation.
 *
 * - Wraps at boundaries using modular arithmetic
 * - Tracks animation direction for CSS transition class selection
 * - Locks navigation during animation via isAnimating flag
 * - Respects prefers-reduced-motion: releases lock immediately when active
 * - Exposes releaseAnimation callback for transitionend event binding
 */
export function useCarousel(
  totalItems: number,
  initialIndex: number = 0
): UseCarouselReturn {
  const [currentIndex, setCurrentIndex] = useState<number>(
    circularIndex(initialIndex, totalItems)
  );
  const [direction, setDirection] = useState<Direction>(null);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  const prefersReducedMotionRef = useRef<boolean>(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    prefersReducedMotionRef.current = mediaQuery.matches;

    const handler = (event: MediaQueryListEvent) => {
      prefersReducedMotionRef.current = event.matches;
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const releaseAnimation = useCallback(() => {
    setIsAnimating(false);
    setDirection(null);
  }, []);

  const startTransition = useCallback(
    (nextIndex: number, newDirection: Direction) => {
      setDirection(newDirection);
      setCurrentIndex(nextIndex);
      setIsAnimating(true);

      if (prefersReducedMotionRef.current) {
        // Release lock immediately for reduced motion users
        setIsAnimating(false);
        setDirection(null);
      }
    },
    []
  );

  const goNext = useCallback(() => {
    if (isAnimating) return;
    const nextIndex = circularIndex(currentIndex + 1, totalItems);
    startTransition(nextIndex, "left");
  }, [isAnimating, currentIndex, totalItems, startTransition]);

  const goPrev = useCallback(() => {
    if (isAnimating) return;
    const nextIndex = circularIndex(currentIndex - 1, totalItems);
    startTransition(nextIndex, "right");
  }, [isAnimating, currentIndex, totalItems, startTransition]);

  const goTo = useCallback(
    (index: number) => {
      if (isAnimating) return;
      const targetIndex = circularIndex(index, totalItems);
      if (targetIndex === currentIndex) return;

      const newDirection: Direction =
        targetIndex > currentIndex ? "left" : "right";
      startTransition(targetIndex, newDirection);
    },
    [isAnimating, currentIndex, totalItems, startTransition]
  );

  return {
    currentIndex,
    direction,
    isAnimating,
    goNext,
    goPrev,
    goTo,
    releaseAnimation,
  };
}
