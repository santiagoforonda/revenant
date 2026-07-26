import Phaser from "phaser";
import { EnemyType } from "@/game/config/EnemySpriteRegistry";
import { EnemyAnimationController } from "@/game/services/EnemyAnimationController";
import type { EnemyAnimationControllerInterface } from "@/game/services/EnemyAnimationController";
import type { EnemyAnimationState, EnemyDirection } from "@/game/services/EnemyAnimationRegistrar";

/**
 * Contract for the EnemySpriteComposer.
 *
 * The EnemySpriteComposer reuses the same architectural pattern as the Player's
 * DefaultSpriteComposer but is tailored for enemy entities which use a single
 * spritesheet rather than multiple equipment layers.
 *
 * Responsibilities:
 * - Coordinate visual synchronization for enemy entities.
 * - Receive animation requests (state + direction) from the Enemy entity.
 * - Delegate animation playback to the EnemyAnimationController.
 * - Keep rendering logic centralized — Enemy never invokes Phaser animations directly.
 * - Remain extensible for future enemy visual layers (health bars, status effects, etc.).
 */
export interface EnemySpriteComposerInterface {
  /**
   * Updates the enemy's visual representation based on state and direction.
   *
   * This is the sole entry point for animation changes. The Enemy entity
   * calls this method whenever its state or direction changes, and the
   * composer delegates to the EnemyAnimationController internally.
   *
   * @param state - The current animation state (idle or walking).
   * @param direction - The current facing direction.
   */
  updateAnimation(state: EnemyAnimationState, direction: EnemyDirection): void;

  /**
   * Returns the currently playing animation key.
   * Delegates to the underlying EnemyAnimationController.
   */
  getCurrentAnimationKey(): string;

  /**
   * Returns the enemy sprite managed by this composer.
   */
  getSprite(): Phaser.GameObjects.Sprite;
}

/**
 * EnemySpriteComposer coordinates enemy visual rendering.
 *
 * It follows the same composition pattern as the Player's DefaultSpriteComposer:
 * - Owns the sprite reference.
 * - Delegates animation selection and playback to the EnemyAnimationController.
 * - Provides a single entry point for state/direction changes.
 * - Prevents the Enemy entity from invoking Phaser animations directly.
 *
 * Each enemy instance owns its own EnemySpriteComposer instance.
 * The composer is extensible for future visual layers (health bars, damage numbers,
 * status effect overlays) without modifying the Enemy entity.
 */
export class EnemySpriteComposer implements EnemySpriteComposerInterface {
  private readonly sprite: Phaser.GameObjects.Sprite;
  private readonly animationController: EnemyAnimationControllerInterface;

  /**
   * Creates an EnemySpriteComposer for the given sprite and enemy type.
   *
   * Internally creates an EnemyAnimationController that handles all
   * animation key resolution and Phaser playback.
   *
   * @param sprite - The Phaser sprite to compose visuals for.
   * @param enemyType - The enemy type used for animation key resolution.
   */
  constructor(sprite: Phaser.GameObjects.Sprite, enemyType: EnemyType) {
    this.sprite = sprite;
    this.animationController = new EnemyAnimationController(sprite, enemyType);
  }

  /**
   * Updates the enemy's visual representation based on state and direction.
   *
   * Delegates entirely to the EnemyAnimationController which handles:
   * - Validation of state and direction.
   * - Animation key resolution via EnemyAnimationRegistrar.
   * - Duplicate playback prevention.
   * - Graceful handling of missing animations.
   */
  updateAnimation(state: EnemyAnimationState, direction: EnemyDirection): void {
    this.animationController.update(state, direction);
  }

  /**
   * Returns the currently playing animation key.
   */
  getCurrentAnimationKey(): string {
    return this.animationController.getCurrentAnimationKey();
  }

  /**
   * Returns the enemy sprite managed by this composer.
   */
  getSprite(): Phaser.GameObjects.Sprite {
    return this.sprite;
  }
}
