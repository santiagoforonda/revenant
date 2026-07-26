import type { Enemy } from "@/game/entities/characters/Enemy";

/**
 * Event payload published when an enemy has been completely removed from the game world.
 *
 * This event is published exactly once per removed enemy, after the death animation
 * completes and all Phaser resources have been released.
 *
 * Consumed by the Reward System for backend persistence.
 * This event MUST NOT perform any backend communication.
 */
export interface EnemyRemovedEvent {
  /** The enemy that was removed from the scene. */
  readonly enemy: Enemy;

  /** The timestamp (in milliseconds) when the enemy was removed. */
  readonly timestamp: number;
}
