import { Enemy } from "@/game/entities/characters/Enemy";
import { Player } from "@/game/entities/characters/Player";
import type { DetectionEvent } from "@/game/systems/DetectionController";
import type { EnemyDirection } from "@/game/services/EnemyAnimationRegistrar";

/**
 * Chase state representing whether the enemy is currently pursuing the player.
 */
export type ChaseState = "Inactive" | "Chasing";

/**
 * Represents the player's current world position used as the chase target.
 */
export interface ChaseTarget {
  readonly targetX: number;
  readonly targetY: number;
}

/**
 * Default chase speed in pixels per second.
 * Faster than patrol speed (30) to represent urgent pursuit behavior.
 */
export const DEFAULT_CHASE_SPEED = 60;

/**
 * Distance threshold in pixels to consider the chase target reached.
 * When the enemy is within this distance, movement stops.
 * Set to a comfortable melee range so enemies stop near the player
 * without overlapping their sprite.
 */
export const CHASE_ARRIVAL_THRESHOLD = 20;

/**
 * ChaseController is the dedicated component responsible for pursuing the
 * detected player.
 *
 * Responsibilities:
 * - Listen for detection state changes from the DetectionController.
 * - Start pursuit when the player is detected.
 * - Stop pursuit when detection is lost.
 * - Continuously track the player's current position as the chase target.
 * - Update enemy position toward the chase target every frame.
 * - Update enemy movement state and facing direction.
 *
 * The ChaseController follows the Single Responsibility Principle:
 * it manages ONLY pursuit behavior and remains independent from
 * patrol, combat, pathfinding, and backend communication.
 *
 * Each enemy instance owns exactly one ChaseController.
 *
 * This controller is designed to be consumed by future AI modules
 * (Return, Combat) that react to chase state changes.
 */
export class ChaseController {
  private readonly enemy: Enemy;
  private readonly player: Player;
  private readonly chaseSpeed: number;
  private chaseState: ChaseState;
  private chaseTarget: ChaseTarget | null;

  /**
   * Creates a ChaseController for the given enemy.
   *
   * The controller begins in the Inactive state. Pursuit only starts
   * after receiving a PlayerDetected event from the DetectionController.
   *
   * @param enemy - The enemy entity this controller manages.
   * @param player - The player entity whose position is tracked.
   * @param chaseSpeed - Movement speed in pixels per second during pursuit. Defaults to DEFAULT_CHASE_SPEED.
   *
   * @throws Error if enemy or player reference is missing.
   */
  constructor(enemy: Enemy, player: Player, chaseSpeed: number = DEFAULT_CHASE_SPEED) {
    if (!enemy) {
      throw new Error("[ChaseController] Enemy reference is required.");
    }
    if (!player) {
      throw new Error("[ChaseController] Player reference is required.");
    }

    this.enemy = enemy;
    this.player = player;

    // Validate chase speed — use default if invalid (Requirement 8.3)
    if (!Number.isFinite(chaseSpeed) || chaseSpeed <= 0) {
      this.chaseSpeed = DEFAULT_CHASE_SPEED;
    } else {
      this.chaseSpeed = chaseSpeed;
    }

    // Always begin in the Inactive state (Requirement 1.1 — pursuit starts only after detection)
    this.chaseState = "Inactive";
    this.chaseTarget = null;
  }

  /**
   * Returns the current chase state.
   */
  getChaseState(): ChaseState {
    return this.chaseState;
  }

  /**
   * Returns the current chase target, or null if no target is set.
   */
  getChaseTarget(): ChaseTarget | null {
    return this.chaseTarget;
  }

  /**
   * Returns the configured chase speed in pixels per second.
   */
  getChaseSpeed(): number {
    return this.chaseSpeed;
  }

  /**
   * Returns the enemy entity managed by this controller.
   */
  getEnemy(): Enemy {
    return this.enemy;
  }

  /**
   * Returns the player entity being tracked.
   */
  getPlayer(): Player {
    return this.player;
  }

  /**
   * Handles detection events from the DetectionController.
   *
   * This method is designed to be registered as a DetectionListener via
   * `detectionController.onDetectionChange(chaseController.handleDetectionEvent)`.
   *
   * - PlayerDetected: Initializes pursuit, sets chase state to Chasing,
   *   and stores the player's current position as the chase target.
   * - PlayerLost: Stops pursuit, sets chase state to Inactive,
   *   and clears the chase target.
   *
   * Requirement 1.1: Initialize pursuit after detection.
   * Requirement 4.1: Stop pursuit when detection is lost.
   * Requirement 6.1: React only to Detection Controller events.
   *
   * @param event - The detection event received from the DetectionController.
   */
  handleDetectionEvent = (event: DetectionEvent): void => {
    if (event === "PlayerDetected") {
      this.startPursuit();
    } else if (event === "PlayerLost") {
      this.stopPursuit();
    }
  };

  /**
   * Updates the chase controller.
   *
   * This method is called every frame by the MainScene update loop.
   * When chasing, it continuously updates the chase target to the player's
   * current position and moves the enemy toward it using frame-independent movement.
   *
   * If the controller is inactive, this method does nothing.
   * If the player reference becomes invalid, pursuit stops safely (Requirement 8.1).
   *
   * Requirement 2.1: Continuously move toward the player's current position.
   * Requirement 2.2: Update chase target when the player moves.
   * Requirement 5.1: Evaluate the player's position every update cycle.
   *
   * @param delta - Time elapsed since the last frame in milliseconds.
   */
  update(delta: number): void {
    if (this.chaseState === "Inactive") {
      return;
    }

    // Safety check: if player reference is somehow invalid, stop pursuit (Requirement 8.1)
    if (!this.player) {
      this.stopPursuit();
      return;
    }

    // Update chase target to the player's current position (Requirement 5.1)
    const playerX = this.player.getX();
    const playerY = this.player.getY();

    // Validate target coordinates (Requirement 8.3)
    if (!Number.isFinite(playerX) || !Number.isFinite(playerY)) {
      // Invalid target — stop movement but remain in chase state
      this.chaseTarget = null;
      return;
    }

    this.chaseTarget = { targetX: playerX, targetY: playerY };

    // Move toward the chase target
    this.moveTowardTarget(delta);
  }

  /**
   * Moves the enemy toward the current chase target using frame-independent movement.
   *
   * Calculates the direction vector from the enemy to the target, normalizes it,
   * and applies movement scaled by delta time for consistent speed regardless of frame rate.
   *
   * If the enemy is already within the arrival threshold, no movement is applied
   * to prevent overshooting.
   *
   * Requirement 2.1: Continuously move toward the player's current position.
   * Requirement 2.3: Update enemy position continuously.
   *
   * @param delta - Time elapsed since the last frame in milliseconds.
   */
  private moveTowardTarget(delta: number): void {
    if (this.chaseTarget === null) {
      return;
    }

    const currentX = this.enemy.getX();
    const currentY = this.enemy.getY();
    const targetX = this.chaseTarget.targetX;
    const targetY = this.chaseTarget.targetY;

    const dx = targetX - currentX;
    const dy = targetY - currentY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If within arrival threshold, stop and idle
    if (distance <= CHASE_ARRIVAL_THRESHOLD) {
      this.enemy.setState("idle");
      return;
    }

    // Calculate normalized direction vector
    const dirX = dx / distance;
    const dirY = dy / distance;

    // Update facing direction BEFORE position for visual consistency (Requirement 3.1, 3.2)
    const facingDirection = this.calculateDirection(dx, dy);
    this.enemy.setDirection(facingDirection);

    // Frame-independent movement: distance = speed * (delta / 1000)
    const moveDistance = this.chaseSpeed * (delta / 1000);

    // Prevent overshooting: clamp movement to remaining distance
    const actualMove = Math.min(moveDistance, distance);

    const newX = currentX + dirX * actualMove;
    const newY = currentY + dirY * actualMove;

    this.enemy.setPosition(newX, newY);
  }

  /**
   * Calculates the enemy's facing direction based on the movement vector.
   *
   * Resolves the direction to the dominant axis: if the horizontal component
   * is greater than or equal to the vertical component, the direction is
   * left/right. Otherwise, it is up/down.
   *
   * This matches the PatrolController's direction resolution logic.
   *
   * Requirement 3.1: Facing direction updated during pursuit.
   * Requirement 3.2: Facing direction recalculated on direction change.
   *
   * @param dx - Horizontal distance from enemy to target (positive = right).
   * @param dy - Vertical distance from enemy to target (positive = down).
   * @returns The resolved EnemyDirection.
   */
  private calculateDirection(dx: number, dy: number): EnemyDirection {
    if (Math.abs(dx) >= Math.abs(dy)) {
      return dx >= 0 ? "right" : "left";
    }
    return dy >= 0 ? "down" : "up";
  }

  /**
   * Starts pursuit of the player.
   *
   * Sets the chase state to Chasing, captures the player's current
   * position as the initial chase target, and switches the enemy to
   * the walking animation state.
   *
   * Requirement 1.2: Enemy enters Chase state when pursuit begins.
   * Requirement 1.3: Use the player's current position as the chase target.
   * Requirement 1.4: If initialization fails, remain in previous state.
   * Requirement 3.4: Walking animation matches current direction while chasing.
   */
  private startPursuit(): void {
    // Prevent redundant state transitions
    if (this.chaseState === "Chasing") {
      return;
    }

    // Validate player reference before starting (Requirement 1.4)
    if (!this.player) {
      return;
    }

    const playerX = this.player.getX();
    const playerY = this.player.getY();

    // Validate initial target (Requirement 8.3)
    if (!Number.isFinite(playerX) || !Number.isFinite(playerY)) {
      return;
    }

    this.chaseState = "Chasing";
    this.chaseTarget = { targetX: playerX, targetY: playerY };

    // Synchronize with Enemy Animation: enter walking state (Requirement 3.4)
    this.enemy.setState("walking");
  }

  /**
   * Stops pursuit of the player.
   *
   * Sets the chase state to Inactive, clears the chase target, and
   * switches the enemy back to the idle animation state.
   *
   * Requirement 4.1: Stop pursuit when detection is lost.
   * Requirement 4.2: Exit the Chase state.
   * Requirement 4.3: Stop moving toward the player.
   * Requirement 3.3: Last facing direction is preserved (setState does not reset direction).
   */
  private stopPursuit(): void {
    // Prevent redundant state transitions
    if (this.chaseState === "Inactive") {
      return;
    }

    this.chaseState = "Inactive";
    this.chaseTarget = null;

    // Synchronize with Enemy Animation: return to idle state (Requirement 4.2)
    this.enemy.setState("idle");
  }
}
