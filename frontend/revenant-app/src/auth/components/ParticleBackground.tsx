import { useRef, useEffect, useCallback } from "react";
import { useParticleEngine } from "@/auth/hooks/useParticleEngine";
import { useReducedMotion } from "@/auth/hooks/useReducedMotion";

interface ParticleBackgroundProps {
  particleCount?: number;
  colors?: string[];
  opacityRange?: [number, number];
  speedRange?: [number, number];
  oscillationMax?: number;
}

const DEFAULT_PARTICLE_COUNT = 60;
const MIN_PARTICLE_COUNT = 40;
const MAX_PARTICLE_COUNT = 80;

/**
 * Full-viewport canvas-based particle renderer that creates the ambient ash/ember atmosphere.
 *
 * Renders a fixed-position canvas behind all content with floating particles.
 * Falls back gracefully (renders nothing) if the canvas 2D context is unavailable.
 * Respects the user's reduced motion preference via the `useReducedMotion` hook.
 */
export function ParticleBackground({
  particleCount = DEFAULT_PARTICLE_COUNT,
  colors,
  opacityRange,
  speedRange,
  oscillationMax,
}: ParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion();

  // Clamp particle count within valid range
  const clampedParticleCount = Math.min(
    MAX_PARTICLE_COUNT,
    Math.max(MIN_PARTICLE_COUNT, particleCount)
  );

  const updateCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

  // Handle canvas sizing and window resize
  useEffect(() => {
    updateCanvasSize();

    window.addEventListener("resize", updateCanvasSize);
    return () => {
      window.removeEventListener("resize", updateCanvasSize);
    };
  }, [updateCanvasSize]);

  // Delegate all rendering logic to the particle engine hook
  useParticleEngine({
    canvasRef,
    particleCount: clampedParticleCount,
    colors,
    opacityRange,
    speedRange,
    oscillationMax,
    reducedMotion,
  });

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
