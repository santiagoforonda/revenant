import type { PatrolOrigin } from "@/game/systems/PatrolController";

/**
 * Default patrol radius in pixels.
 * Determines how far an enemy can wander from its spawn position.
 */
export const PATROL_RADIUS = 80;

/**
 * Maximum number of generation attempts before returning null (enemy stays idle).
 */
const MAX_GENERATION_ATTEMPTS = 10;

/**
 * Represents a valid patrol destination in world coordinates.
 */
export interface PatrolDestination {
  readonly x: number;
  readonly y: number;
}

/**
 * Configuration for the destination generator.
 * Allows future AI behaviors to customize patrol parameters.
 */
export interface PatrolDestinationConfig {
  /** Maximum distance from the origin in pixels. */
  readonly radius: number;
  /** Minimum distance from the origin to avoid trivial movements. */
  readonly minDistance?: number;
}

/**
 * Generates valid patrol destinations within a circular patrol area.
 *
 * Responsibilities:
 * - Generate valid patrol destinations using uniform random distribution in a circle.
 * - Restrict generated positions to the patrol area defined by origin + radius.
 * - Reject invalid destinations outside the patrol area.
 * - Produce randomized, natural-looking movement patterns.
 *
 * This component remains deterministic with respect to the configured patrol radius:
 * every generated destination is guaranteed to be within the radius.
 *
 * Designed to be reusable by future AI behaviors (Detection, Chase, Return, Combat).
 */
export class PatrolDestinationGenerator {
  private readonly config: PatrolDestinationConfig;

  /**
   * Creates a PatrolDestinationGenerator with the given configuration.
   *
   * @param config - Optional configuration. Defaults to PATROL_RADIUS.
   */
  constructor(config?: Partial<PatrolDestinationConfig>) {
    this.config = {
      radius: config?.radius ?? PATROL_RADIUS,
      minDistance: config?.minDistance ?? 0,
    };
  }

  /**
   * Returns the configured patrol radius.
   */
  getRadius(): number {
    return this.config.radius;
  }

  /**
   * Returns the configured minimum distance.
   */
  getMinDistance(): number {
    return this.config.minDistance ?? 0;
  }

  /**
   * Generates a random patrol destination within the patrol area.
   *
   * Uses uniform random point-in-circle algorithm:
   * - Random angle in [0, 2π)
   * - Random radius using sqrt distribution for uniform area coverage
   *
   * Validates the generated point is within bounds. If generation fails
   * after MAX_GENERATION_ATTEMPTS, returns null (enemy remains idle per Requirement 8.1).
   *
   * @param origin - The patrol origin (enemy spawn position).
   * @returns A valid PatrolDestination, or null if generation fails.
   */
  generate(origin: PatrolOrigin): PatrolDestination | null {
    for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
      const destination = this.generateRandomPoint(origin);

      if (destination === null) {
        return null;
      }

      if (this.isValidDestination(destination, origin)) {
        return destination;
      }
    }

    // Requirement 8.1: If a destination cannot be generated, return null (enemy stays idle).
    return null;
  }

  /**
   * Validates whether a destination is within the patrol area.
   *
   * A destination is valid if its distance from the origin is less than or
   * equal to the configured patrol radius.
   *
   * Requirement 4.1: Restrict the destination to the patrol area.
   * Requirement 4.3: If a patrol point falls outside the patrol area, discard it.
   *
   * @param destination - The point to validate.
   * @param origin - The patrol origin.
   * @returns true if the destination is within the patrol area.
   */
  isValidDestination(destination: PatrolDestination, origin: PatrolOrigin): boolean {
    const dx = destination.x - origin.x;
    const dy = destination.y - origin.y;
    const distanceSquared = dx * dx + dy * dy;
    const radiusSquared = this.config.radius * this.config.radius;

    if (distanceSquared > radiusSquared) {
      return false;
    }

    // Check minimum distance if configured
    const minDistance = this.config.minDistance ?? 0;
    if (minDistance > 0) {
      const minDistanceSquared = minDistance * minDistance;
      if (distanceSquared < minDistanceSquared) {
        return false;
      }
    }

    return true;
  }

  /**
   * Generates a random point within the circular patrol area using
   * uniform distribution (sqrt-based radius scaling).
   *
   * This algorithm ensures points are evenly distributed across the circle area
   * rather than being clustered near the center, producing natural movement.
   *
   * @param origin - The center of the patrol area.
   * @returns A candidate patrol destination, or null if radius is zero.
   */
  private generateRandomPoint(origin: PatrolOrigin): PatrolDestination | null {
    if (this.config.radius <= 0) {
      return null;
    }

    const angle = Math.random() * 2 * Math.PI;

    // sqrt distribution ensures uniform coverage across the circle area
    const minDistance = this.config.minDistance ?? 0;
    const minRatio = minDistance / this.config.radius;
    const randomRadius =
      this.config.radius * Math.sqrt(minRatio * minRatio + Math.random() * (1 - minRatio * minRatio));

    const x = origin.x + randomRadius * Math.cos(angle);
    const y = origin.y + randomRadius * Math.sin(angle);

    return { x, y };
  }
}
