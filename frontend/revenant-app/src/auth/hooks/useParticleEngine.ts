import { useEffect, useRef, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  opacity: number;
  speed: number;
  oscillationOffset: number;
  oscillationSpeed: number;
}

interface UseParticleEngineOptions {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  particleCount?: number;
  colors?: string[];
  opacityRange?: [number, number];
  speedRange?: [number, number];
  oscillationMax?: number;
  reducedMotion: boolean;
}

const DEFAULT_PARTICLE_COUNT = 60;
const DEFAULT_COLORS = ["#412D15", "#E1DCC9"];
const DEFAULT_OPACITY_RANGE: [number, number] = [0.3, 0.6];
const DEFAULT_SPEED_RANGE: [number, number] = [10, 30];
const DEFAULT_OSCILLATION_MAX = 5;
const FPS_THRESHOLD = 30;
const PARTICLE_REDUCTION_FACTOR = 0.8;
const MIN_PARTICLE_SIZE = 1;
const MAX_PARTICLE_SIZE = 4;

/**
 * Generates a random number within a range (inclusive).
 */
function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Creates a single particle with random properties within the configured ranges.
 */
function createParticle(
  canvasWidth: number,
  canvasHeight: number,
  colors: string[],
  opacityRange: [number, number],
  speedRange: [number, number]
): Particle {
  return {
    x: Math.random() * canvasWidth,
    y: Math.random() * canvasHeight,
    size: randomInRange(MIN_PARTICLE_SIZE, MAX_PARTICLE_SIZE),
    color: colors[Math.floor(Math.random() * colors.length)],
    opacity: randomInRange(opacityRange[0], opacityRange[1]),
    speed: randomInRange(speedRange[0], speedRange[1]),
    oscillationOffset: Math.random() * Math.PI * 2,
    oscillationSpeed: randomInRange(0.5, 2),
  };
}

/**
 * Hook that manages a canvas-based particle engine for the ambient ash/ember effect.
 *
 * Renders particles moving upward with horizontal oscillation. Uses requestAnimationFrame
 * with delta-time accumulation for frame-rate-independent movement. Particles that exit
 * the top respawn at the bottom with a new random x-position.
 *
 * When `reducedMotion` is true, particles render once in their initial positions
 * without starting the animation loop.
 *
 * Dynamically reduces particle count by 20% if the frame rate drops below 30fps.
 */
export function useParticleEngine({
  canvasRef,
  particleCount = DEFAULT_PARTICLE_COUNT,
  colors = DEFAULT_COLORS,
  opacityRange = DEFAULT_OPACITY_RANGE,
  speedRange = DEFAULT_SPEED_RANGE,
  oscillationMax = DEFAULT_OSCILLATION_MAX,
  reducedMotion,
}: UseParticleEngineOptions): void {
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number>(0);
  const activeParticleCountRef = useRef<number>(particleCount);
  const frameTimesRef = useRef<number[]>([]);

  const initializeParticles = useCallback(
    (width: number, height: number, count: number) => {
      const particles: Particle[] = [];
      for (let i = 0; i < count; i++) {
        particles.push(
          createParticle(width, height, colors, opacityRange, speedRange)
        );
      }
      return particles;
    },
    [colors, opacityRange, speedRange]
  );

  const renderParticles = useCallback(
    (ctx: CanvasRenderingContext2D, particles: Particle[]) => {
      const { width, height } = ctx.canvas;
      ctx.clearRect(0, 0, width, height);

      const count = activeParticleCountRef.current;
      for (let i = 0; i < count && i < particles.length; i++) {
        const particle = particles[i];
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.opacity;
        ctx.fill();
      }

      ctx.globalAlpha = 1;
    },
    []
  );

  const checkFrameRate = useCallback(
    (deltaTime: number) => {
      const frameTimes = frameTimesRef.current;
      frameTimes.push(deltaTime);

      // Keep a rolling window of the last 60 frame times
      if (frameTimes.length > 60) {
        frameTimes.shift();
      }

      // Only check once we have enough samples
      if (frameTimes.length < 30) {
        return;
      }

      const averageDelta =
        frameTimes.reduce((sum, t) => sum + t, 0) / frameTimes.length;
      const averageFps = 1 / averageDelta;

      if (averageFps < FPS_THRESHOLD) {
        const reducedCount = Math.floor(
          activeParticleCountRef.current * PARTICLE_REDUCTION_FACTOR
        );
        // Don't reduce below 80% of original configured count
        const minCount = Math.floor(particleCount * PARTICLE_REDUCTION_FACTOR);
        activeParticleCountRef.current = Math.max(reducedCount, minCount);
        // Reset frame times after reduction to re-evaluate
        frameTimesRef.current = [];
      }
    },
    [particleCount]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    activeParticleCountRef.current = particleCount;
    frameTimesRef.current = [];
    particlesRef.current = initializeParticles(width, height, particleCount);

    // When reduced motion is active, render particles once and stop
    if (reducedMotion) {
      renderParticles(ctx, particlesRef.current);
      return;
    }

    lastTimestampRef.current = 0;

    const animate = (timestamp: number) => {
      if (lastTimestampRef.current === 0) {
        lastTimestampRef.current = timestamp;
      }

      const deltaTime = (timestamp - lastTimestampRef.current) / 1000;
      lastTimestampRef.current = timestamp;

      // Skip very large deltas (e.g. tab was backgrounded)
      if (deltaTime > 0.1) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      checkFrameRate(deltaTime);

      const particles = particlesRef.current;
      const canvasWidth = ctx.canvas.width;
      const canvasHeight = ctx.canvas.height;

      // Update particle positions
      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];

        // Move upward (subtract from y since canvas y-axis is top-down)
        particle.y -= particle.speed * deltaTime;

        // Horizontal oscillation
        particle.x +=
          Math.sin(
            particle.oscillationOffset +
              timestamp * 0.001 * particle.oscillationSpeed
          ) *
          oscillationMax *
          deltaTime;

        // Respawn at bottom when particle exits the top
        if (particle.y + particle.size < 0) {
          particle.y = canvasHeight + particle.size;
          particle.x = Math.random() * canvasWidth;
          particle.oscillationOffset = Math.random() * Math.PI * 2;
        }

        // Wrap horizontal position
        if (particle.x < 0) {
          particle.x = canvasWidth;
        } else if (particle.x > canvasWidth) {
          particle.x = 0;
        }
      }

      renderParticles(ctx, particles);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [
    canvasRef,
    particleCount,
    colors,
    opacityRange,
    speedRange,
    oscillationMax,
    reducedMotion,
    initializeParticles,
    renderParticles,
    checkFrameRate,
  ]);
}
