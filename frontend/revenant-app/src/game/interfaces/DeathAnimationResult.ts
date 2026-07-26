/**
 * Represents the result of playing an enemy death animation.
 *
 * Contains information about whether the animation completed successfully
 * and how long it took to execute.
 */
export interface DeathAnimationResult {
  /** Whether the death animation completed successfully. */
  readonly completed: boolean;

  /** The duration of the animation in milliseconds. */
  readonly duration: number;
}
