import Phaser from "phaser";
import type { DeathAnimationResult } from "@/game/interfaces/DeathAnimationResult";

/**
 * Contract for death animation controllers.
 *
 * The controller is responsible for:
 * - Playing the configured death animation on the enemy sprite.
 * - Notifying callers when the animation finishes via a resolved Promise.
 * - Preventing additional animations from being triggered during the death sequence.
 *
 * The controller does NOT remove the enemy from the scene — it only manages
 * the death animation lifecycle.
 *
 * Validates: Requirement 3 (Play Death Animation)
 */
export interface DeathAnimationControllerInterface {
  /**
   * Plays the death animation on the enemy sprite.
   *
   * Returns a Promise that resolves with a DeathAnimationResult when the animation finishes.
   * If a death animation is already playing, resolves immediately with completed: false.
   * If the animation key does not exist, resolves immediately with completed: false.
   */
  playDeath(): Promise<DeathAnimationResult>;

  /**
   * Returns whether a death animation is currently playing.
   */
  isPlaying(): boolean;
}

/**
 * DeathAnimationController manages the death animation lifecycle for a single enemy.
 *
 * It plays the configured death animation on the enemy sprite and resolves a Promise
 * when the animation completes. The controller ensures:
 * - Only one death animation plays at a time (overlap prevention).
 * - The caller is notified via Promise resolution with a DeathAnimationResult.
 * - If the animation key doesn't exist, it handles gracefully with completed: false.
 *
 * This controller does NOT remove the enemy or disable behavior — it only manages
 * the animation playback and notifies the caller of the result.
 *
 * Validates: Requirement 3 (Play Death Animation)
 */
export class DeathAnimationController implements DeathAnimationControllerInterface {
  private readonly sprite: Phaser.GameObjects.Sprite;
  private readonly animationKey: string;
  private playing: boolean = false;

  /**
   * Creates a DeathAnimationController for a specific enemy sprite.
   *
   * @param sprite - The Phaser sprite to play the death animation on.
   * @param animationKey - The animation key to use for the death animation.
   */
  constructor(sprite: Phaser.GameObjects.Sprite, animationKey: string) {
    this.sprite = sprite;
    this.animationKey = animationKey;
  }

  /**
   * Plays the death animation on the enemy sprite.
   *
   * - If a death animation is already playing, resolves with completed: false and duration: 0.
   * - If the animation key is not registered in Phaser, logs an error and resolves with completed: false.
   * - On success, plays the animation once and resolves with completed: true and the elapsed duration.
   *
   * Uses Phaser's `sprite.once('animationcomplete', callback)` pattern for one-shot detection.
   */
  playDeath(): Promise<DeathAnimationResult> {
    if (this.playing) {
      return Promise.resolve({ completed: false, duration: 0 });
    }

    if (!this.sprite.scene || !this.sprite.scene.anims.exists(this.animationKey)) {
      console.error(
        `[DeathAnimationController] Animation key "${this.animationKey}" not found. ` +
        `Death animation cannot be played.`
      );
      return Promise.resolve({ completed: false, duration: 0 });
    }

    this.playing = true;
    const startTime = Date.now();

    return new Promise<DeathAnimationResult>((resolve) => {
      this.sprite.once("animationcomplete", () => {
        this.playing = false;
        const duration = Date.now() - startTime;
        resolve({ completed: true, duration });
      });

      this.sprite.play({ key: this.animationKey, repeat: 0 });
    });
  }

  /**
   * Returns whether a death animation is currently playing.
   */
  isPlaying(): boolean {
    return this.playing;
  }
}
