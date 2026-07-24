import { useState, useEffect } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Hook that reactively tracks the user's reduced motion preference.
 *
 * Returns `true` when the operating system has `prefers-reduced-motion: reduce` active,
 * and `false` otherwise. Handles SSR and environments where `matchMedia` is unavailable
 * by defaulting to `false`.
 *
 * Listens for `change` events on the media query so the value updates dynamically
 * if the user toggles their system preference while the app is running.
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(
    () => {
      if (typeof window === "undefined" || !window.matchMedia) {
        return false;
      }
      return window.matchMedia(REDUCED_MOTION_QUERY).matches;
    }
  );

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);

    // Sync state in case it changed between initial render and effect
    setPrefersReducedMotion(mediaQuery.matches);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return prefersReducedMotion;
}
