import Phaser from "phaser";
import { EnemyType } from "@/game/config/EnemySpriteRegistry";
import { enemyAnimationRegistrar } from "@/game/services/EnemyAnimationRegistrar";
import type { EnemyAnimationState, EnemyDirection } from "@/game/services/EnemyAnimationRegistrar";

/** Valid animation states for validation */
const VALID_STATES: ReadonlySet<EnemyAnimationState> = new Set(["idle", "walking"]);

/** Valid facing directions for validation */
const VALID_DIRECTIONS: ReadonlySet<EnemyDirection> = new Set(["up", "down", "left", "right"]);

/**
 * Contract for enemy animation controllers.
 *
 * The controller is responsible for:
 * - Resolving animation keys based on enemy state and direction.
 * - Selecting Idle or Walking animations.
 * - Preventing unnecessary animation restarts.
 * - Delegating playback to Phaser's sprite animation system.
 *
 * Each enemy instance owns its own controller instance.
 * The controller contains ALL animation selection logic — neither MainScene
 * nor the Enemy entity should determine which animation to play.
 */
export interface EnemyAnimationControllerInterface {
  /**
   * Updates the animation based on the given state and direction.
   *
   * If the resolved animation key matches the currently playing animation,
   * the playback request is ignored to prevent unnecessary restarts.
   *
   * Invalid states or directions are silently ignored, preserving
   * the current animation.
   *
   * @param state - The current animation state (idle or walking).
   * @param direction - The current facing direction.
   */
  update(state: EnemyAnimationState, direction: EnemyDirection): void;

  /**
   * Returns the currently playing animation key, or an empty string
   * if no animation has been played yet.
   */
  getCurrentAnimationKey(): string;
}

/**
 * EnemyAnimationController manages animation selection for a single enemy sprite.
 *
 * It resolves animation keys using the EnemyAnimationRegistrar and plays them
 * on the associated Phaser sprite. The controller prevents unnecessary animation
 * restarts by tracking the current animation key internally.
 *
 * Error handling:
 * - If an invalid state is received, the current animation is preserved.
 * - If an invalid direction is received, the previous direction is preserved.
 * - If the resolved animation key does not exist in Phaser, the playback
 *   request is silently ignored without crashing.
 */
export class EnemyAnimationController implements EnemyAnimationControllerInterface {
  private readonly sprite: Phaser.GameObjects.Sprite;
  private readonly enemyType: EnemyType;
  private currentAnimationKey: string = "";

  /**
   * Creates an EnemyAnimationController for a specific sprite and enemy type.
   *
   * @param sprite - The Phaser sprite to play animations on.
   * @param enemyType - The enemy type used for resolving animation keys.
   */
  constructor(sprite: Phaser.GameObjects.Sprite, enemyType: EnemyType) {
    this.sprite = sprite;
    this.enemyType = enemyType;
  }

  /**
   * Updates the animation based on the given state and direction.
   *
   * Validates both state and direction before resolving the animation key.
   * If either value is invalid, the update is ignored and the current
   * animation continues playing.
   *
   * If the resolved key matches the current animation, no action is taken
   * (prevents unnecessary restart).
   *
   * If the resolved animation key does not exist in Phaser's Animation Manager,
   * the playback request is silently ignored.
   */
  update(state: EnemyAnimationState, direction: EnemyDirection): void {
    // Validate state — keep current animation if invalid
    if (!VALID_STATES.has(state)) {
      return;
    }

    // Validate direction — keep current animation if invalid
    if (!VALID_DIRECTIONS.has(direction)) {
      return;
    }

    // Resolve the animation key using the registrar
    const animationKey = enemyAnimationRegistrar.resolveAnimationKey(
      this.enemyType,
      state,
      direction
    );

    // Prevent unnecessary animation restart
    if (animationKey === this.currentAnimationKey) {
      return;
    }

    // Verify the animation exists before attempting playback
    if (!this.sprite.scene.anims.exists(animationKey)) {
      return;
    }

    // Play the animation and track the current key
    this.sprite.play(animationKey);
    this.currentAnimationKey = animationKey;
  }

  /**
   * Returns the currently playing animation key, or an empty string
   * if no animation has been played yet.
   */
  getCurrentAnimationKey(): string {
    return this.currentAnimationKey;
  }
}
