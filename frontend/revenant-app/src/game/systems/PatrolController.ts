import { Enemy } from "@/game/entities/characters/Enemy";
import {
  PatrolDestinationGenerator,
  type PatrolDestination,
  type PatrolDestinationConfig,
} from "@/game/systems/PatrolDestinationGenerator";
import type { EnemyDirection } from "@/game/services/EnemyAnimationRegistrar";

/**
 * Patrol state representing the current phase of the patrol cycle.
 */
export type PatrolState = "idle" | "walking";

/**
 * Represents a 2D position in the game world.
 */
export interface PatrolOrigin {
  readonly x: number;
  readonly y: number;
}

/**
 * Patrol movement speed in pixels per second.
 * Controls how fast enemies move toward patrol destinations.
 */
export const PATROL_SPEED = 30;

/**
 * Distance threshold in pixels to consider a destination reached.
 * When the enemy is within this distance, movement stops.
 */
export const ARRIVAL_THRESHOLD = 2;

/**
 * Minimum idle duration in milliseconds between patrol movements.
 * The actual idle period is randomized between IDLE_DURATION_MIN and IDLE_DURATION_MAX.
 */
export const IDLE_DURATION_MIN = 1000;

/**
 * Maximum idle duration in milliseconds between patrol movements.
 * The actual idle period is randomized between IDLE_DURATION_MIN and IDLE_DURATION_MAX.
 */
export const IDLE_DURATION_MAX = 3000;

/**
 * PatrolController is the dedicated component responsible for autonomous
 * patrol behavior for a single enemy.
 *
 * Responsibilities:
 * - Initialize patrol behavior.
 * - Store the patrol origin (enemy spawn position).
 * - Select patrol destinations.
 * - Validate patrol destinations against the patrol area boundary.
 * - Regenerate invalid destinations automatically.
 * - Control idle timers (added in later tasks).
 * - Control enemy movement (added in later tasks).
 * - Update movement state.
 * - Update facing direction.
 *
 * The PatrolController follows the Single Responsibility Principle:
 * it manages ONLY patrol behavior and remains independent from
 * combat, player detection, pathfinding, and backend communication.
 *
 * Each enemy instance owns exactly one PatrolController.
 *
 * This controller is designed to be reusable by future AI modules
 * (Detection, Chase, Return, Combat) that may suspend or resume patrol.
 */
export class PatrolController {
  private readonly enemy: Enemy;
  private readonly origin: PatrolOrigin;
  private readonly destinationGenerator: PatrolDestinationGenerator;
  private patrolState: PatrolState;
  private active: boolean;
  private currentDestination: PatrolDestination | null;
  private idleTimer: number;
  private idleDuration: number;

  /**
   * Creates a PatrolController for the given enemy.
   *
   * The spawn position is captured at construction time and preserved
   * for the entire lifetime of the enemy. The patrol always begins
   * in the Idle state as required by Requirement 1.3.
   *
   * @param enemy - The enemy entity this controller manages.
   * @param spawnX - The world X coordinate where the enemy was spawned.
   * @param spawnY - The world Y coordinate where the enemy was spawned.
   * @param config - Optional configuration for the destination generator.
   */
  constructor(
    enemy: Enemy,
    spawnX: number,
    spawnY: number,
    config?: Partial<PatrolDestinationConfig>
  ) {
    this.enemy = enemy;
    this.origin = { x: spawnX, y: spawnY };
    this.destinationGenerator = new PatrolDestinationGenerator(config);
    this.patrolState = "idle";
    this.active = true;
    this.currentDestination = null;
    this.idleTimer = 0;
    this.idleDuration = this.generateIdleDuration();

    // Ensure the enemy starts in the Idle animation state (Requirement 1.3)
    this.enemy.setState("idle");
  }

  /**
   * Returns the patrol origin (enemy spawn position).
   *
   * The origin never changes during the enemy's lifetime.
   * This is used by the destination generator to calculate valid patrol points.
   */
  getOrigin(): PatrolOrigin {
    return this.origin;
  }

  /**
   * Returns the current patrol state.
   */
  getPatrolState(): PatrolState {
    return this.patrolState;
  }

  /**
   * Returns whether the patrol controller is currently active.
   *
   * When inactive, the update method is a no-op. Future AI modules
   * can suspend patrol by deactivating the controller.
   */
  isActive(): boolean {
    return this.active;
  }

  /**
   * Activates patrol behavior.
   *
   * Used by future AI systems to resume patrol after chase/combat ends.
   * When reactivated, the controller resets to idle with a new timer
   * to recover gracefully from interrupted patrol cycles (Requirement 8.3).
   */
  activate(): void {
    this.active = true;
    // Recover gracefully: reset to idle phase with a new timer
    this.patrolState = "idle";
    this.currentDestination = null;
    this.resetIdleTimer();
    this.enemy.setState("idle");
  }

  /**
   * Deactivates patrol behavior.
   *
   * When deactivated, the patrol controller stops processing updates.
   * The enemy remains in its current state. Used by future AI systems
   * to suspend patrol during detection, chase, or combat.
   */
  deactivate(): void {
    this.active = false;
  }

  /**
   * Returns the enemy entity managed by this controller.
   */
  getEnemy(): Enemy {
    return this.enemy;
  }

  /**
   * Returns the current patrol destination, or null if none is active.
   *
   * A destination is set when the controller successfully generates and
   * validates a patrol point within the patrol area.
   */
  getCurrentDestination(): PatrolDestination | null {
    return this.currentDestination;
  }

  /**
   * Returns the patrol destination generator used by this controller.
   *
   * Exposed for testing and future AI module integration.
   */
  getDestinationGenerator(): PatrolDestinationGenerator {
    return this.destinationGenerator;
  }

  /**
   * Returns the current idle timer value in milliseconds.
   *
   * Exposed for testing the idle delay mechanism.
   */
  getIdleTimer(): number {
    return this.idleTimer;
  }

  /**
   * Returns the current idle duration target in milliseconds.
   *
   * Exposed for testing the idle delay mechanism.
   */
  getIdleDuration(): number {
    return this.idleDuration;
  }

  /**
   * Generates a random idle duration between IDLE_DURATION_MIN and IDLE_DURATION_MAX.
   *
   * Called when the enemy transitions to idle to determine how long
   * it should wait before starting a new patrol cycle.
   *
   * Requirement 3.3: When idle period expires, begin a new patrol cycle.
   *
   * @returns A random duration in milliseconds within the configured range.
   */
  private generateIdleDuration(): number {
    return IDLE_DURATION_MIN + Math.random() * (IDLE_DURATION_MAX - IDLE_DURATION_MIN);
  }

  /**
   * Resets the idle timer and generates a new random idle duration.
   *
   * Called when transitioning to idle state (arrival at destination,
   * failed destination generation, or interruption recovery).
   *
   * Requirement 3.3: Begin a new patrol cycle after idle period expires.
   * Requirement 8.3: Patrol cycle restarts after idle period.
   */
  private resetIdleTimer(): void {
    this.idleTimer = 0;
    this.idleDuration = this.generateIdleDuration();
  }

  /**
   * Requests a new patrol destination and validates it against the patrol area.
   *
   * The destination generator produces a random point within the patrol radius.
   * If the generated point passes boundary validation, it becomes the current
   * destination. If generation fails after all retry attempts, the enemy
   * stays idle (Requirement 8.1).
   *
   * Requirement 4.1: Restrict destination to the patrol area.
   * Requirement 4.3: Invalid patrol points are discarded.
   * Requirement 8.2: If invalid position generated, generate another.
   *
   * @returns The validated destination, or null if generation failed.
   */
  requestNewDestination(): PatrolDestination | null {
    const destination = this.destinationGenerator.generate(this.origin);

    if (destination === null) {
      // All generation attempts exhausted — enemy remains idle (Requirement 8.1)
      this.currentDestination = null;
      this.patrolState = "idle";
      return null;
    }

    // Double-check boundary validation (Requirement 4.2: never intentionally leave patrol area)
    if (!this.isWithinPatrolArea(destination)) {
      this.currentDestination = null;
      this.patrolState = "idle";
      return null;
    }

    this.currentDestination = destination;
    return destination;
  }

  /**
   * Validates whether a position is within the patrol area.
   *
   * Uses the destination generator's boundary validation to check if
   * a point is within the configured patrol radius from the origin.
   *
   * Requirement 4.1: Restrict destination to the patrol area.
   * Requirement 4.2: Enemy shall never intentionally leave its patrol area.
   *
   * @param position - The position to validate.
   * @returns true if the position is within the patrol area.
   */
  isWithinPatrolArea(position: PatrolDestination): boolean {
    return this.destinationGenerator.isValidDestination(position, this.origin);
  }

  /**
   * Updates the patrol controller.
   *
   * This method is called every frame by the MainScene update loop.
   * It drives the patrol state machine: idle timers, destination selection,
   * movement, and state transitions.
   *
   * If the controller is inactive, this method does nothing (Requirement 8.4).
   *
   * Patrol cycle:
   * - IDLE: Count up the idle timer. When the timer reaches the idle duration,
   *   request a new destination and begin walking.
   * - WALKING: Move toward the destination. When arrived, transition to idle
   *   and reset the timer for a new cycle.
   *
   * Requirement 3.3: When idle period expires, begin a new patrol cycle.
   * Requirement 3.4: If patrol temporarily suspended, enemy remains idle.
   * Requirement 8.3: If movement cannot be completed, restart after idle period.
   *
   * @param delta - Time elapsed since the last frame in milliseconds.
   */
  update(delta: number): void {
    if (!this.active) {
      return;
    }

    if (this.patrolState === "idle") {
      // Count up the idle timer
      this.idleTimer += delta;

      // Only request a new destination when the idle duration has elapsed
      if (this.idleTimer >= this.idleDuration) {
        const destination = this.requestNewDestination();
        if (destination !== null) {
          this.patrolState = "walking";

          // Update state and facing direction simultaneously to avoid redundant
          // animation updates (Requirement 6.1 + Requirement 5.1)
          const newDirection = this.calculateDirection(
            this.enemy.getX(),
            this.enemy.getY(),
            destination.x,
            destination.y
          );
          this.enemy.setStateAndDirection("walking", newDirection);
        } else {
          // Destination generation failed — reset idle timer to avoid spamming
          // every frame (Requirement 8.1, Requirement 8.3)
          this.resetIdleTimer();
        }
      }
      return;
    }

    if (this.patrolState === "walking" && this.currentDestination !== null) {
      this.moveTowardDestination(delta);
    }
  }

  /**
   * Moves the enemy toward the current destination using frame-independent movement.
   *
   * Uses delta time to ensure consistent movement speed regardless of frame rate.
   * Checks arrival threshold to determine when the destination has been reached.
   *
   * Requirement 2.2: Enemy SHALL move toward the patrol point.
   * Requirement 2.3: When patrol point is reached, enemy SHALL stop moving.
   * Requirement 2.4: While moving, enemy SHALL remain in Walking state.
   *
   * @param delta - Time elapsed since the last frame in milliseconds.
   */
  private moveTowardDestination(delta: number): void {
    if (this.currentDestination === null) {
      return;
    }

    const currentX = this.enemy.getX();
    const currentY = this.enemy.getY();
    const targetX = this.currentDestination.x;
    const targetY = this.currentDestination.y;

    const dx = targetX - currentX;
    const dy = targetY - currentY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Check if destination has been reached
    if (distance <= ARRIVAL_THRESHOLD) {
      // Snap to destination and stop
      this.enemy.setPosition(targetX, targetY);
      this.patrolState = "idle";
      this.enemy.setState("idle");
      this.currentDestination = null;
      // Reset idle timer for next cycle (Requirement 3.1, 3.3)
      this.resetIdleTimer();
      return;
    }

    // Calculate normalized direction vector
    const dirX = dx / distance;
    const dirY = dy / distance;

    // Frame-independent movement: position += direction * speed * (delta / 1000)
    const moveDistance = PATROL_SPEED * (delta / 1000);

    // Prevent overshooting: clamp movement to remaining distance
    const actualMove = Math.min(moveDistance, distance);

    const newX = currentX + dirX * actualMove;
    const newY = currentY + dirY * actualMove;

    this.enemy.setPosition(newX, newY);

    // Update facing direction if it changed (Requirement 5.2)
    const newDirection = this.calculateDirection(currentX, currentY, targetX, targetY);
    if (newDirection !== this.enemy.getDirection()) {
      this.enemy.setDirection(newDirection);
    }
  }

  /**
   * Calculates the cardinal facing direction based on movement vector.
   *
   * Determines whether the enemy should face up, down, left, or right
   * based on the dominant axis of movement.
   *
   * - If abs(dx) > abs(dy): direction is "left" or "right"
   * - If abs(dy) >= abs(dx): direction is "up" or "down"
   *
   * Requirement 5.1: Update facing direction when movement begins.
   * Requirement 5.2: Update facing direction when movement direction changes.
   *
   * @param fromX - Current X position.
   * @param fromY - Current Y position.
   * @param toX - Target X position.
   * @param toY - Target Y position.
   * @returns The cardinal direction the enemy should face.
   */
  calculateDirection(fromX: number, fromY: number, toX: number, toY: number): EnemyDirection {
    const dx = toX - fromX;
    const dy = toY - fromY;

    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? "right" : "left";
    } else {
      return dy > 0 ? "down" : "up";
    }
  }
}
