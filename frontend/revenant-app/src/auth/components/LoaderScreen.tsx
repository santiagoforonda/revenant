import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { animate } from "animejs";
import type { JSAnimation } from "animejs";
import { eventBus } from "@/game/events";
import { useReducedMotion } from "../hooks/useReducedMotion";

const TIMEOUT_MS = 15_000;
const FADE_IN_MS = 400;
const FADE_OUT_MS = 300;

export function LoaderScreen() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animRef = useRef<JSAnimation | null>(null);
  const reducedMotion = useReducedMotion();
  const [showTimeout, setShowTimeout] = useState(false);

  const fadeOutAndNavigate = useCallback(async () => {
    const el = containerRef.current;
    if (!el) {
      navigate("/game");
      return;
    }

    if (reducedMotion) {
      navigate("/game");
      return;
    }

    const anim = animate(el, {
      opacity: [1, 0],
      duration: FADE_OUT_MS,
      easing: "easeInCubic",
    });
    animRef.current = anim;
    await anim;
    navigate("/game");
  }, [navigate, reducedMotion]);

  // Listen for GAME_READY
  useEffect(() => {
    const handleReady = () => {
      fadeOutAndNavigate();
    };

    eventBus.on("GAME_READY", handleReady);
    return () => {
      eventBus.off("GAME_READY", handleReady);
    };
  }, [fadeOutAndNavigate]);

  // Timeout after 15 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTimeout(true);
    }, TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, []);

  // Fade-in on mount
  useEffect(() => {
    const el = containerRef.current;
    if (!el || reducedMotion) return;

    el.style.opacity = "0";
    const anim = animate(el, {
      opacity: [0, 1],
      duration: FADE_IN_MS,
      easing: "easeOutCubic",
    });
    animRef.current = anim;

    return () => {
      if (animRef.current) {
        animRef.current.cancel();
        animRef.current = null;
      }
    };
  }, [reducedMotion]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#000000]"
      aria-live="polite"
      aria-label="Loading game"
    >
      {/* Pulsing loading indicator */}
      <div className="w-8 h-8 rounded-full border-2 border-[#E1DCC9] border-t-transparent animate-spin" />
      <p className="mt-4 text-sm text-[#E1DCC9]/70 font-medium">
        Entrando al mundo...
      </p>

      {showTimeout && (
        <p className="mt-4 text-xs text-[#E1DCC9]/50" role="alert">
          Esto está tomando más tiempo de lo esperado. Por favor espera...
        </p>
      )}
    </div>
  );
}
