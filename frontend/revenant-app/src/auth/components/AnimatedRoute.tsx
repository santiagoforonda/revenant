import { useEffect, createContext, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAnimeTransition } from "../hooks/useAnimeTransition";
import { useReducedMotion } from "../hooks/useReducedMotion";

interface AnimatedRouteContextValue {
  navigateWithExit: (to: string) => Promise<void>;
  animateOut: () => Promise<void>;
}

const AnimatedRouteContext = createContext<AnimatedRouteContextValue | null>(
  null,
);

export function useAnimatedRoute(): AnimatedRouteContextValue {
  const ctx = useContext(AnimatedRouteContext);
  if (!ctx) {
    throw new Error("useAnimatedRoute must be used within an AnimatedRoute");
  }
  return ctx;
}

interface AnimatedRouteProps {
  children: React.ReactNode;
}

export function AnimatedRoute({ children }: AnimatedRouteProps) {
  const { ref, animateIn, animateOut, cancel } = useAnimeTransition();
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    animateIn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigateWithExit = useCallback(
    async (to: string): Promise<void> => {
      if (reducedMotion) {
        navigate(to);
        return;
      }

      cancel();
      await animateOut();
      navigate(to);
    },
    [navigate, animateOut, cancel, reducedMotion],
  );

  const contextValue: AnimatedRouteContextValue = {
    navigateWithExit,
    animateOut,
  };

  return (
    <AnimatedRouteContext.Provider value={contextValue}>
      <div ref={ref} className="w-full">
        {children}
      </div>
    </AnimatedRouteContext.Provider>
  );
}
