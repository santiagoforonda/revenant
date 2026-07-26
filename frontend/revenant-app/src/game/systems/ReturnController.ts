import { Enemy } from "@/game/entities/characters/Enemy";
import { PatrolController } from "@/game/systems/PatrolController";
import type { DetectionEvent } from "@/game/systems/DetectionController";
import type { EnemyDirection } from "@/game/services/EnemyAnimationRegistrar";

/**
 * Return state representing whether the enemy is currently returning to its spawn position.
 */
export type ReturnState = "Inactive" | "Returning";

/**
 * Represents the enemy's original spawn position used as the return target.
 */
export interface ReturnTarget {
  readonly targetX: number;
  readonly targetY: number;
}

/**
 * Default return speed in pixels per second.
 * Slower than chase speed (60) but faster than patrol speed (30)
 * to represent purposeful but non-urgent movement.
 */
export const DEFAULT_RETURN_SPEED = 45;

/**
 * Distance threshold in pixels to consider the return destination reached.
 * When the enemy is within this distance, movement stops to prevent overshooting.
 */
export const RETURN_ARRIVAL_THRESHOLD = 2;

/**
 * ReturnController is the dedicated component responsible for returning
 * an enemy to its original spawn position after pursuit has ended.
 *
 * Responsibilities:
 * - Listen for detection state changes (PlayerLost) indicating chase has ended.
 * - Start the return process when the Chase Controller stops pursuit.
 * - Store the enemy's original spawn position as the return target.
 * - Move the enemy toward the return target every frame.
 * - Stop movement after reaching the destination.
 * - Transfer control back to the Patrol Controller.
 *
 * The ReturnController follows the Single Responsibility Principle:
 * it manages ONLY return behavior and remains independent from
 * patrol, combat, detection, pathfinding, and backend communication.
 *
 * Each enemy instance owns exactly one ReturnController.
 *
 * This controller is designed to be consumed by future AI modules
 * (Combat) that may interrupt or override return behavior.
 */
export class ReturnController {
  private readonly enemy: Enemy;
  private readonly returnTarget: ReturnTarget;
  private readonly returnSpeed: number;
  private readonly patrolController: PatrolController;
  private returnState: ReturnState;

  /**
   * Creates a ReturnController for the given enemy.
   *
   * The controller begins in the Inactive state. The return process starts
   * only after receiving a PlayerLost event from the DetectionController,
   * indicating that the Chase Controller has stopped pursuit.
   *
   * The spawn position is captured at construction time and preserved
   * as the immutable return target for the entire lifetime of the enemy.
   *
   * @param enemy - The enemy entity this controller manages.
   * @param spawnX - The world X coordinate where the enemy was originally spawned.
   * @param spawnY - The world Y coordinate where the enemy was originally spawned.
   * @param patrolController - The patrol controller to reactivate after return completes.
   * @param returnSpeed - Movement speed in pixels per second during return. Defaults to DEFAULT_RETURN_SPEED.
   *
   * @throws Error if enemy reference is missing.
   */
  constructor(
    enemy: Enemy,
    spawnX: number,
    spawnY: number,
    patrolController: PatrolController,
    returnSpeed: number = DEFAULT_RETURN_SPEED
  ) {
    if (!enemy) {
      throw new Error("[ReturnController] Enemy reference is required.");
    }

    this.enemy = enemy;
    this.patrolController = patrolController;

    // Validate spawn position — if invalid, store NaN to be handled gracefully during return
    if (!Number.isFinite(spawnX) || !Number.isFinite(spawnY)) {
      this.returnTarget = { targetX: NaN, targetY: NaN };
    } else {
      this.returnTarget = { targetX: spawnX, targetY: spawnY };
    }

    // Validate return speed — use default if invalid (Requirement 8)
    if (!Number.isFinite(returnSpeed) || returnSpeed <= 0) {
      this.returnSpeed = DEFAULT_RETURN_SPEED;
    } else {
      this.returnSpeed = returnSpeed;
    }

    // Always begin in the Inactive state (Requirement 1.1 — return starts only after chase ends)
    this.returnState = "Inactive";
  }

  /**
   * Returns the current return state.
   */
  getReturnState(): ReturnState {
    return this.returnState;
  }

  /**
   * Returns the return target (enemy's original spawn position).
   */
  getReturnTarget(): ReturnTarget {
    return this.returnTarget;
  }

  /**
   * Returns the configured return speed in pixels per second.
   */
  getReturnSpeed(): number {
    return this.returnSpeed;
  }

  /**
   * Returns the enemy entity managed by this controller.
   */
  getEnemy(): Enemy {
    return this.enemy;
  }

  /**
   * Handles detection events from the DetectionController.
   *
   * This method is designed to be registered as a DetectionListener via
   * `detectionController.onDetectionChange(returnController.handleDetectionEvent)`.
   *
   * - PlayerLost: Initializes the return process, setting return state to Returning.
   * - PlayerDetected: Cancels any in-progress return (chase takes priority).
   *
   * Requirement 1.1: Initialize return after Chase Controller reports pursuit has ended.
   * Requirement 5.1: Start after Chase Controller reports PlayerLost.
   * Requirement 7.5: React only to Chase Controller state changes.
   *
   * @param event - The detection event received from the DetectionController.
   */
  handleDetectionEvent = (event: DetectionEvent): void => {
    if (event === "PlayerLost") {
      this.startReturn();
    } else if (event === "PlayerDetected") {
      this.cancelReturn();
    }
  };

  /**
   * Updates the return controller.
   *
   * This method is called every frame by the MainScene update loop.
   * When returning, it moves the enemy toward its spawn position
   * using frame-independent movement.
   *
   * If the controller is inactive, this method does nothing.
   *
   * Requirement 4.1: Evaluate remaining distance every update cycle.
   *
   * @param delta - Time elapsed since the last frame in milliseconds.
   */
  update(delta: number): void {
    if (this.returnState === "Inactive") {
      return;
    }

    // Safety check: validate enemy reference (Requirement 8.1)
    if (!this.enemy) {
      this.returnState = "Inactive";
      return;
    }

    // Safety check: validate return target (Requirement 8.2, 8.3)
    if (
      !Number.isFinite(this.returnTarget.targetX) ||
      !Number.isFinite(this.returnTarget.targetY)
    ) {
      this.returnState = "Inactive";
      return;
    }

    // Move toward the spawn position
    this.moveTowardSpawn(delta);
  }

  /**
   * Moves the enemy toward the stored spawn position using frame-independent movement.
   *
   * Calculates the direction vector from the enemy to the return target, normalizes it,
   * and applies movement scaled by delta time for consistent speed regardless of frame rate.
   *
   * If the enemy is within the arrival threshold, the return is completed:
   * - Snap to exact spawn position.
   * - Set state to Inactive.
   * - Set enemy to idle.
   * - Reactivate patrol.
   *
   * Requirement 2.1: Continuously move toward the stored spawn position.
   * Requirement 4.1: Stop movement immediately after reaching the destination.
   *
   * @param delta - Time elapsed since the last frame in milliseconds.
   */
  private moveTowardSpawn(delta: number): void {
    const currentX = this.enemy.getX();
    const currentY = this.enemy.getY();
    const targetX = this.returnTarget.targetX;
    const targetY = this.returnTarget.targetY;

    const dx = targetX - currentX;
    const dy = targetY - currentY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Check if destination has been reached
    if (distance <= RETURN_ARRIVAL_THRESHOLD) {
      this.completeReturn();
      return;
    }

    // Calculate normalized direction vector
    const dirX = dx / distance;
    const dirY = dy / distance;

    // Update facing direction BEFORE position for visual consistency
    const facingDirection = this.calculateDirection(dx, dy);
    this.enemy.setDirection(facingDirection);

    // Frame-independent movement: distance = speed * (delta / 1000)
    const moveDistance = this.returnSpeed * (delta / 1000);

    // Prevent overshooting: clamp movement to remaining distance
    const actualMove = Math.min(moveDistance, distance);

    const newX = currentX + dirX * actualMove;
    const newY = currentY + dirY * actualMove;

    this.enemy.setPosition(newX, newY);
  }

  /**
   * Completes the return process.
   *
   * Snaps the enemy to the exact spawn position, transitions to Inactive state,
   * sets the enemy to idle, and reactivates the Patrol Controller.
   *
   * Requirement 4.1: Stop movement immediately after reaching the destination.
   * Requirement 6.1: Resume the Patrol Controller after return completes.
   */
  private completeReturn(): void {
    // Snap to exact spawn position
    this.enemy.setPosition(this.returnTarget.targetX, this.returnTarget.targetY);

    // Transition to Inactive
    this.returnState = "Inactive";

    // Set enemy to idle animation state
    this.enemy.setState("idle");

    // Reactivate patrol behavior
    this.patrolController.activate();
  }

  /**
   * Calculates the enemy's facing direction based on the movement vector.
   *
   * Resolves the direction to the dominant axis: if the horizontal component
   * is greater than or equal to the vertical component, the direction is
   * left/right. Otherwise, it is up/down.
   *
   * This matches the ChaseController's direction resolution logic.
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
   * Starts the return process.
   *
   * Sets the return state to Returning and switches the enemy to walking
   * animation state. The enemy will begin moving toward its original spawn
   * position on subsequent update calls.
   *
   * If the return target is invalid, the controller remains inactive
   * to handle the error gracefully (Requirement 8.2).
   *
   * Requirement 1.1: Initialize return after chase ends.
   * Requirement 1.2: Enemy enters Return state.
   * Requirement 1.3: Use original spawn position as return target.
   * Requirement 1.4: If initialization fails, remain idle.
   * Requirement 6.2: Switch to Walking state while returning.
   */
  private startReturn(): void {
    // Prevent redundant state transitions
    if (this.returnState === "Returning") {
      return;
    }

    // Validate return target before starting (Requirement 1.4, 8.2)
    if (
      !Number.isFinite(this.returnTarget.targetX) ||
      !Number.isFinite(this.returnTarget.targetY)
    ) {
      return;
    }

    // Validate enemy reference (Requirement 8.1)
    if (!this.enemy) {
      return;
    }

    this.returnState = "Returning";

    // Synchronize with Enemy Animation: enter walking state (Requirement 6.2)
    this.enemy.setState("walking");
  }

  /**
   * Cancels an in-progress return (e.g., when the player is detected again).
   *
   * Sets the return state back to Inactive. The Chase Controller
   * will take over movement responsibility.
   *
   * Requirement 5.2: Prevent Chase and Return from running simultaneously.
   */
  private cancelReturn(): void {
    if (this.returnState === "Inactive") {
      return;
    }

    this.returnState = "Inactive";
  }
}
