import type { Player } from "@/game/entities/characters/Player";
import type { Enemy } from "@/game/entities/characters/Enemy";

/**
 * Event payload published after combat is resolved against a single target.
 *
 * One CombatResolvedEvent is emitted for every target processed in an AttackRequest.
 */
export interface CombatResolvedEvent {
  /** The player who initiated the attack. */
  readonly attacker: Player;

  /** The enemy that was attacked. */
  readonly target: Enemy;

  /** The final damage dealt after armor reduction. */
  readonly damage: number;

  /** The enemy's remaining health after damage was applied. */
  readonly remainingHealth: number;
}

/**
 * Event payload published when an enemy is defeated.
 *
 * Exactly one EnemyDefeatedEvent is emitted per enemy death.
 * Consumed by the Reward System for backend persistence.
 */
export interface EnemyDefeatedEvent {
  /** The enemy that was defeated. */
  readonly enemy: Enemy;

  /** The player who defeated the enemy. */
  readonly attacker: Player;
}
