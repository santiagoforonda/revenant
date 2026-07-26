import Phaser from "phaser";
import type { PlayerDirection } from "@/game/services/SpriteComposer";
import type { ClassSpriteConfig } from "@/game/config/ClassSpriteRegistry";

/**
 * Contract for attack animation controllers.
 *
 * The controller is responsible for:
 * - Playing the correct attack animation based on the player's facing direction.
 * - Preventing multiple attack animations from overlapping.
 * - Notifying callers when the animation completes so state can be restored.
 *
 * The controller does NOT modify player movement state — it only manages
 * the visual animation lifecycle.
 *
 * Validates: Requirement 2 (Play Attack Animation)
 */
export interface AttackAnimationControllerInterface {
  /**
   * Plays the attack animation for the given direction.
   *
   * Returns a Promise that resolves when the animation finishes.
   * If an attack animation is already playing, the Promise rejects immediately.
   * If the animation key is not registered, logs an error and resolves immediately.
   *
   * @param direction - The player's current facing direction.
   */
  playAttack(direction: PlayerDirection): Promise<void>;

  /**
   * Returns whether an attack animation is currently playing.
   */
  isPlaying(): boolean;
}

/**
 * AttackAnimationController manages the attack animation lifecycle for the player.
 *
 * It plays attack animations on the body sprite using the key pattern:
 * `{classId}-body-attack-{direction}`
 *
 * The controller ensures:
 * - Only one attack animation plays at a time (overlap prevention).
 * - The caller is notified via Promise resolution when the animation finishes.
 * - If the animation key doesn't exist (spritesheet not loaded), it handles gracefully.
 *
 * This controller does NOT restore movement/idle state itself — it simply resolves
 * the Promise so the caller (e.g., PlayerAttackSystem) can handle state transitions.
 *
 * Validates: Requirement 2 (Play Attack Animation), Requirement 6 (Attack State Management)
 */
export class AttackAnimationController implements AttackAnimationControllerInterface {
  private readonly bodySprite: Phaser.Physics.Arcade.Sprite;
  private readonly classConfig: ClassSpriteConfig;
  private playing: boolean = false;

  /**
   * Creates an AttackAnimationController for the player's body sprite.
   *
   * @param bodySprite - The player's physics-enabled body sprite.
   * @param classConfig - The current class sprite configuration (provides classId).
   */
  constructor(
    bodySprite: Phaser.Physics.Arcade.Sprite,
    classConfig: ClassSpriteConfig
  ) {
    this.bodySprite = bodySprite;
    this.classConfig = classConfig;
  }

  /**
   * Plays the attack animation for the given direction.
   *
   * - If an attack animation is already playing, rejects with an error.
   * - If the animation key is not registered in Phaser, logs an error and resolves immediately.
   * - On success, plays the body animation (and weapon if available) and resolves when body completes.
   *
   * Uses Phaser's `sprite.once('animationcomplete', callback)` pattern for one-shot detection.
   *
   * @param direction - The player's current facing direction.
   */
  playAttack(direction: PlayerDirection): Promise<void> {
    if (this.playing) {
      return Promise.reject(new Error("Attack animation already in progress"));
    }

    const animKey = this.resolveAttackAnimationKey(direction);

    // Verify the animation exists before attempting playback
    if (!this.bodySprite.scene.anims.exists(animKey)) {
      console.error(
        `[AttackAnimationController] Animation key "${animKey}" not found. ` +
        `Attack spritesheet may not be loaded.`
      );
      return Promise.resolve();
    }

    this.playing = true;

    return new Promise<void>((resolve) => {
      this.bodySprite.once("animationcomplete", () => {
        this.playing = false;
        resolve();
      });

      this.bodySprite.play(animKey);
    });
  }

  /**
   * Returns whether an attack animation is currently playing.
   */
  isPlaying(): boolean {
    return this.playing;
  }

  /**
   * Resolves the body attack animation key for a given direction.
   *
   * Pattern: `{classId}-body-attack-{direction}`
   *
   * @param direction - The facing direction.
   */
  private resolveAttackAnimationKey(direction: PlayerDirection): string {
    return `${this.classConfig.classId}-body-attack-${direction}`;
  }
}
