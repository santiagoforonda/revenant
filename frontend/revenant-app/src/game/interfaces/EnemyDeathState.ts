/**
 * Tracks the lifecycle of a dying enemy throughout the death sequence.
 *
 * The death sequence progresses through the following stages:
 * 1. isDead — the enemy has been defeated and the death sequence has begun.
 * 2. isRemoving — the death animation is playing and the enemy is being removed.
 * 3. animationFinished — the death animation has completed.
 * 4. removed — the enemy has been fully removed from the scene.
 */
export interface EnemyDeathState {
  /** Whether the enemy has been defeated and the death sequence has started. */
  readonly isDead: boolean;

  /** Whether the enemy is currently being removed (animation in progress). */
  readonly isRemoving: boolean;

  /** Whether the death animation has finished playing. */
  readonly animationFinished: boolean;

  /** Whether the enemy has been fully removed from the active scene. */
  readonly removed: boolean;
}
