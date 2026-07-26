import { Enemy } from "@/game/entities/characters/Enemy";
import { Player } from "@/game/entities/characters/Player";

/**
 * Detection state representing whether the player is currently detected.
 */
export type DetectionState = "NotDetected" | "Detected";

/**
 * Detection events emitted when the detection state changes.
 * Used by future AI systems (Chase, Return, Combat) to react to detection transitions.
 */
export type DetectionEvent = "PlayerDetected" | "PlayerLost";

/**
 * Callback type for detection state change listeners.
 */
export type DetectionListener = (event: DetectionEvent) => void;

/**
 * Default detection radius in pixels.
 * Controls how close the player must be for the enemy to detect them.
 */
export const DEFAULT_DETECTION_RADIUS = 80;

/**
 * DetectionController is the dedicated component responsible for determining
 * whether the player is inside an enemy's configurable detection radius.
 *
 * Responsibilities:
 * - Evaluate the distance between the enemy and the player every update cycle.
 * - Determine whether the player is inside the detection radius.
 * - Detect state transitions (NotDetected → Detected, Detected → NotDetected).
 * - Notify listeners when the detection state changes.
 * - Prevent duplicate detection events.
 *
 * The DetectionController follows the Single Responsibility Principle:
 * it manages ONLY detection state and remains independent from patrol,
 * combat, movement, pathfinding, and backend communication.
 *
 * Each enemy instance owns exactly one DetectionController.
 *
 * This controller is designed to be consumed by future AI modules
 * (Chase, Return, Combat) that react to detection state changes.
 */
export class DetectionController {
  private readonly enemy: Enemy;
  private readonly player: Player;
  private readonly detectionRadius: number;
  private detectionState: DetectionState;
  private active: boolean;
  private readonly listeners: DetectionListener[];

  /**
   * Creates a DetectionController for the given enemy.
   *
   * The controller begins in the NotDetected state as required by Requirement 1.3.
   * The detection radius is configurable per enemy (Requirement 5.2).
   *
   * @param enemy - The enemy entity this controller monitors.
   * @param player - The player entity whose position is evaluated.
   * @param detectionRadius - The maximum detection distance in pixels. Defaults to DEFAULT_DETECTION_RADIUS.
   */
  constructor(enemy: Enemy, player: Player, detectionRadius: number = DEFAULT_DETECTION_RADIUS) {
    this.enemy = enemy;
    this.player = player;
    this.listeners = [];

    // Validate detection radius (Requirement 5.3, 8.3)
    if (!Number.isFinite(detectionRadius) || detectionRadius <= 0) {
      this.detectionRadius = 0;
      this.active = false;
    } else {
      this.detectionRadius = detectionRadius;
      this.active = true;
    }

    // Always begin in the NotDetected state (Requirement 1.3)
    this.detectionState = "NotDetected";
  }

  /**
   * Returns the current detection state.
   */
  getDetectionState(): DetectionState {
    return this.detectionState;
  }

  /**
   * Returns the configured detection radius.
   */
  getDetectionRadius(): number {
    return this.detectionRadius;
  }

  /**
   * Returns whether the detection controller is currently active.
   *
   * When inactive, the update method is a no-op. The controller is disabled
   * when an invalid detection radius is configured (Requirement 8.3).
   */
  isActive(): boolean {
    return this.active;
  }

  /**
   * Activates detection evaluation.
   *
   * Used by future AI systems to resume detection after it has been suspended.
   * Only activates if the detection radius is valid.
   */
  activate(): void {
    if (this.detectionRadius > 0) {
      this.active = true;
    }
  }

  /**
   * Deactivates detection evaluation.
   *
   * When deactivated, the controller stops evaluating detection.
   * The current detection state is preserved.
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
   * Returns the player entity being tracked.
   */
  getPlayer(): Player {
    return this.player;
  }

  /**
   * Registers a listener for detection state change events.
   *
   * Listeners are notified when the detection state transitions between
   * NotDetected and Detected. Duplicate events are never emitted.
   *
   * @param listener - Callback to invoke on detection state changes.
   */
  onDetectionChange(listener: DetectionListener): void {
    this.listeners.push(listener);
  }

  /**
   * Removes a previously registered detection listener.
   *
   * @param listener - The listener to remove.
   */
  offDetectionChange(listener: DetectionListener): void {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Updates the detection controller.
   *
   * This method is called every frame by the MainScene update loop.
   * It evaluates the distance between the enemy and the player,
   * determines whether the player is inside the detection radius,
   * and emits detection events on state transitions.
   *
   * If the controller is inactive, this method does nothing (Requirement 8.3).
   * If the player reference is unavailable, detection is skipped (Requirement 8.1).
   *
   * Requirement 4.1: Evaluate every update cycle.
   * Requirement 4.2: Recalculate when player moves.
   * Requirement 4.3: Recalculate when enemy moves.
   * Requirement 2.4: Detection event occurs only once per transition.
   */
  update(): void {
    if (!this.active) {
      return;
    }

    const distance = this.calculateDistance();
    const isInsideRadius = distance <= this.detectionRadius;

    if (isInsideRadius && this.detectionState === "NotDetected") {
      // Player entered detection radius (Requirement 2.1)
      this.detectionState = "Detected";
      this.notifyListeners("PlayerDetected");
    } else if (!isInsideRadius && this.detectionState === "Detected") {
      // Player left detection radius (Requirement 3.1)
      this.detectionState = "NotDetected";
      this.notifyListeners("PlayerLost");
    }
    // If state hasn't changed, no event is emitted (prevents duplicates — Requirement 2.4, 4.4)
  }

  /**
   * Calculates the Euclidean distance between the enemy and the player.
   *
   * Uses current world positions from both entities.
   *
   * @returns The distance in pixels between enemy and player.
   */
  private calculateDistance(): number {
    const enemyX = this.enemy.getX();
    const enemyY = this.enemy.getY();
    const playerX = this.player.getX();
    const playerY = this.player.getY();

    const dx = playerX - enemyX;
    const dy = playerY - enemyY;

    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Notifies all registered listeners of a detection event.
   *
   * @param event - The detection event that occurred.
   */
  private notifyListeners(event: DetectionEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
