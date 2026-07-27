import { eventBus } from "@/game/events";
import { DeathAnimationController } from "@/game/services/DeathAnimationController";
import type { EnemyDefeatedEvent } from "@/game/interfaces/CombatEvents";
import type { EnemyRemovedEvent } from "@/game/interfaces/EnemyRemovedEvent";
import type { EnemyDeathState } from "@/game/interfaces/EnemyDeathState";
import type { Enemy } from "@/game/entities/characters/Enemy";

/**
 * EnemyDeathSystem — coordinates the complete enemy death lifecycle.
 *
 * Responsibilities:
 * - Subscribe to ENEMY_DEFEATED events from the Event Bus.
 * - Coordinate the death workflow: disable → animate → remove → publish ENEMY_REMOVED.
 * - Track which enemies are currently dying to ignore duplicate defeat events.
 * - Publish ENEMY_REMOVED exactly once per removed enemy.
 *
 * This system does NOT perform HTTP requests, render graphics, or import React.
 * Backend persistence is delegated to the Reward System via the ENEMY_REMOVED event.
 */
export class EnemyDeathSystem {
  /** Tracks enemies currently in the death sequence to prevent duplicates. */
  private readonly dyingEnemies: Map<Enemy, EnemyDeathState>;

  /** Tracks enemies that have already had their ENEMY_REMOVED event published. */
  private readonly removedEnemies: Set<Enemy>;

  /** Bound handler reference for event subscription/unsubscription. */
  private readonly handleEnemyDefeated: (event: EnemyDefeatedEvent) => void;

  constructor() {
    this.dyingEnemies = new Map();
    this.removedEnemies = new Set();
    this.handleEnemyDefeated = (event: EnemyDefeatedEvent) => {
      this.processDefeat(event);
    };
  }

  /**
   * Starts the EnemyDeathSystem by subscribing to ENEMY_DEFEATED events.
   */
  start(): void {
    eventBus.on("ENEMY_DEFEATED", this.handleEnemyDefeated);
  }

  /**
   * Stops the EnemyDeathSystem and unsubscribes from all events.
   */
  stop(): void {
    eventBus.off("ENEMY_DEFEATED", this.handleEnemyDefeated);
  }

  /**
   * Returns the current death state for an enemy, or undefined if not dying.
   */
  getDeathState(enemy: Enemy): EnemyDeathState | undefined {
    return this.dyingEnemies.get(enemy);
  }

  /**
   * Returns whether an enemy is currently in the death sequence.
   */
  isDying(enemy: Enemy): boolean {
    return this.dyingEnemies.has(enemy);
  }

  /**
   * Processes an EnemyDefeatedEvent.
   *
   * - If the enemy is already dying, the event is ignored (duplicate protection).
   * - If the enemy has already been removed, the event is ignored.
   * - Otherwise, begins the death sequence for the enemy.
   */
  private processDefeat(event: EnemyDefeatedEvent): void {
    const { enemy } = event;

    // Ignore duplicate defeat events for enemies currently dying
    if (this.dyingEnemies.has(enemy)) {
      console.warn(
        `[EnemyDeathSystem] Duplicate defeat event ignored for enemy "${enemy.getName()}".`
      );
      return;
    }

    // Ignore defeat events for enemies that have already been removed
    if (this.removedEnemies.has(enemy)) {
      console.warn(
        `[EnemyDeathSystem] Defeat event ignored for already removed enemy "${enemy.getName()}".`
      );
      return;
    }

    // Initialize death state
    const initialState: EnemyDeathState = {
      isDead: true,
      isRemoving: false,
      animationFinished: false,
      removed: false,
    };
    this.dyingEnemies.set(enemy, initialState);

    // Begin the death sequence asynchronously — errors are caught internally
    // so they never propagate to the caller or interrupt gameplay.
    this.executeDeathSequence(enemy).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `[EnemyDeathSystem] Unhandled error in death sequence for enemy "${enemy.getName()}": ${message}. Gameplay continues.`
      );
      // Ensure cleanup even on catastrophic failure
      this.dyingEnemies.delete(enemy);
    });
  }

  /**
   * Executes the complete death sequence for a defeated enemy.
   *
   * Steps:
   * 1. Disable enemy behavior (movement, AI, collisions, combat).
   * 2. Play the death animation.
   * 3. Remove the enemy from the active scene.
   * 4. Publish ENEMY_REMOVED event.
   *
   * Each step is independently guarded — a failure in any step does NOT
   * prevent subsequent steps from executing. The death sequence NEVER throws
   * to the caller; all errors are caught and logged as recoverable.
   */
  private async executeDeathSequence(enemy: Enemy): Promise<void> {
    try {
      // Step 1: Disable enemy behavior
      this.disableEnemy(enemy);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `[EnemyDeathSystem] Unexpected error disabling enemy "${enemy.getName()}": ${message}. Continuing death sequence.`
      );
    }

    try {
      // Step 2: Play death animation
      this.updateDeathState(enemy, { isRemoving: true });
      await this.playDeathAnimation(enemy);
      this.updateDeathState(enemy, { animationFinished: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `[EnemyDeathSystem] Unexpected error during animation for enemy "${enemy.getName()}": ${message}. Continuing with removal.`
      );
      this.updateDeathState(enemy, { animationFinished: true });
    }

    try {
      // Step 3: Remove enemy from scene (resource cleanup)
      this.removeEnemy(enemy);
      this.updateDeathState(enemy, { removed: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `[EnemyDeathSystem] Unexpected error removing enemy "${enemy.getName()}": ${message}. Continuing with event publication.`
      );
      this.updateDeathState(enemy, { removed: true });
    }

    // Cleanup complete — remove from dying tracking before publishing event
    this.dyingEnemies.delete(enemy);

    try {
      // Step 4: Publish ENEMY_REMOVED event (always attempted regardless of prior failures)
      this.publishEnemyRemoved(enemy);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `[EnemyDeathSystem] Failed to publish ENEMY_REMOVED for enemy "${enemy.getName()}": ${message}`
      );
    }
  }

  /**
   * Disables all enemy behavior at the start of the death sequence.
   *
   * This prevents the enemy from moving, attacking, or interacting
   * with the game world while the death animation plays.
   *
   * If the enemy is already dead (e.g., via a race condition), the operation
   * is a no-op and a warning is logged.
   */
  private disableEnemy(enemy: Enemy): void {
    try {
      // Skip if the enemy is already dead (redundant disable)
      if (enemy.isDead()) {
        console.warn(
          `[EnemyDeathSystem] Enemy "${enemy.getName()}" is already dead. Skipping disable.`
        );
        return;
      }

      enemy.disable();

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `[EnemyDeathSystem] Failed to disable enemy "${enemy.getName()}": ${message}. Continuing death sequence.`
      );
    }
  }

  /**
   * Plays the death animation for the enemy.
   *
   * If the animation fails or the key does not exist, the death sequence
   * continues without animation (the enemy is still removed).
   *
   * If the sprite has already been destroyed, the animation is skipped
   * and a warning is logged.
   */
  private async playDeathAnimation(enemy: Enemy): Promise<void> {
    try {
      const sprite = enemy.getSprite();

      // Guard: if sprite is already destroyed or inactive, skip animation
      if (!sprite || !sprite.active) {
        console.warn(
          `[EnemyDeathSystem] Sprite for enemy "${enemy.getName()}" is not available. Skipping death animation.`
        );
        return;
      }

      const animationKey = `${enemy.getEnemyType()}-death`;

      const controller = new DeathAnimationController(sprite, animationKey);
      await controller.playDeath();

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `[EnemyDeathSystem] Animation error for enemy "${enemy.getName()}": ${message}. Proceeding with removal.`
      );
    }
  }

  /**
   * Removes the enemy from the active scene.
   *
   * Delegates resource cleanup to the Enemy's destroy method,
   * which destroys the sprite and releases all Phaser resources.
   *
   * If the enemy has already been destroyed (sprite is null/undefined),
   * the removal is skipped and a warning is logged. This handles the case
   * where a prior error or external cleanup already removed the sprite.
   */
  private removeEnemy(enemy: Enemy): void {
    try {
      // Check if the enemy has already been destroyed
      const sprite = enemy.getSprite();
      if (!sprite || !sprite.active) {
        console.warn(
          `[EnemyDeathSystem] Enemy "${enemy.getName()}" sprite is already destroyed or inactive. Skipping removal.`
        );
        return;
      }

      enemy.destroy();

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `[EnemyDeathSystem] Failed to remove enemy "${enemy.getName()}": ${message}. Gameplay continues.`
      );
    }
  }

  /**
   * Publishes an ENEMY_REMOVED event after the enemy has been fully removed.
   *
   * Guards against duplicate publication — if the event was already published
   * for this enemy, logs a warning and returns early.
   */
  private publishEnemyRemoved(enemy: Enemy): void {
    if (this.removedEnemies.has(enemy)) {
      console.warn(
        `[EnemyDeathSystem] Duplicate ENEMY_REMOVED publication prevented for enemy "${enemy.getName()}".`
      );
      return;
    }

    const removedEvent: EnemyRemovedEvent = {
      enemy,
      timestamp: Date.now(),
    };

    eventBus.emit("ENEMY_REMOVED", removedEvent);
    this.removedEnemies.add(enemy);

  }

  /**
   * Updates the death state for an enemy with partial state changes.
   */
  private updateDeathState(
    enemy: Enemy,
    partial: Partial<EnemyDeathState>
  ): void {
    const current = this.dyingEnemies.get(enemy);
    if (current) {
      this.dyingEnemies.set(enemy, { ...current, ...partial });
    }
  }

  /**
   * Cleans up internal state. Useful for testing or scene transitions.
   */
  reset(): void {
    this.dyingEnemies.clear();
    this.removedEnemies.clear();
  }

  /**
   * Fully destroys the system: unsubscribes and resets state.
   */
  destroy(): void {
    this.stop();
    this.reset();
  }
}
