import { eventBus } from "@/game/events";
import { DamageCalculator } from "@/game/services/DamageCalculator";
import type { AttackRequest } from "@/game/interfaces/AttackRequest";
import type { CombatResult } from "@/game/interfaces/CombatResult";
import type { CombatResolvedEvent, EnemyDefeatedEvent } from "@/game/interfaces/CombatEvents";
import type { Enemy } from "@/game/entities/characters/Enemy";

/**
 * Fallback player base attack value.
 *
 * Used only if no strongPoints value is provided to the constructor.
 */
const DEFAULT_PLAYER_ATTACK = 80;

/**
 * CombatSystem — central combat engine.
 *
 * Responsibilities:
 * - Subscribe to ATTACK_REQUEST events from the Event Bus.
 * - Process every target contained in the request independently.
 * - Coordinate the combat resolution workflow:
 *   damage calculation → health update → death detection → event publication.
 * - Track enemy health using an internal Map (since Enemy entity does not expose takeDamage/isDead).
 * - Publish COMBAT_RESOLVED for every processed target.
 * - Publish ENEMY_DEFEATED for every defeated enemy (exactly once).
 *
 * This system does not render graphics, manage scenes, or perform backend communication.
 * Backend persistence is delegated to the Reward System via events.
 */
export class CombatSystem {
  private readonly damageCalculator: DamageCalculator;
  private readonly healthMap: Map<Enemy, number>;
  private readonly defeatedSet: Set<Enemy>;
  private readonly handleAttackRequest: (request: AttackRequest) => void;
  private playerAttackPoints: number;
  private playerExperience= 0;
  private gold=100;

  /**
   * Creates the CombatSystem.
   *
   * @param playerAttackPoints - The player's strongPoints from the login response.
   *                             Determines damage dealt to enemies.
   */
  constructor(playerAttackPoints?: number, playerExperience=0,gold=100) {
    this.damageCalculator = new DamageCalculator();
    this.healthMap = new Map();
    this.defeatedSet = new Set();
    this.playerAttackPoints = playerAttackPoints ?? DEFAULT_PLAYER_ATTACK;
    this.handleAttackRequest = (request: AttackRequest) => {
      this.resolveAttack(request);
    };
    this.playerExperience=playerExperience;
    this.gold=gold;
  }

  /**
   * Updates the player's attack value.
   * Called when player stats change (level up, equipment, etc.)
   */
  setPlayerAttackPoints(points: number): void {
    this.playerAttackPoints = points;
  }

  /**
   * Starts the CombatSystem by subscribing to ATTACK_REQUEST events.
   */
  start(): void {
    eventBus.on("ATTACK_REQUEST", this.handleAttackRequest);
  }

  /**
   * Stops the CombatSystem and unsubscribes from all events.
   */
  stop(): void {
    eventBus.off("ATTACK_REQUEST", this.handleAttackRequest);
  }

  /**
   * Resolves an AttackRequest by processing every target independently.
   *
   * For each target:
   * 1. Skip if already defeated.
   * 2. Initialize health tracking if first encounter.
   * 3. Calculate damage using DamageCalculator.
   * 4. Apply damage (health never goes below 0).
   * 5. Detect defeat (health reaches 0).
   * 6. Publish COMBAT_RESOLVED event.
   * 7. Publish ENEMY_DEFEATED event if enemy was just defeated.
   *
   * Empty target arrays complete successfully without processing.
   * Invalid targets are skipped without interrupting remaining targets.
   */
  resolveAttack(request: AttackRequest): CombatResult[] {
    const results: CombatResult[] = [];

    for (const target of request.targets) {
      const result = this.resolveTarget(request, target);
      if (result !== null) {
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Returns the current tracked health for an enemy.
   * Returns undefined if the enemy has not been encountered.
   */
  getEnemyHealth(enemy: Enemy): number | undefined {
    return this.healthMap.get(enemy);
  }

  /**
   * Returns whether an enemy has been defeated.
   */
  isDefeated(enemy: Enemy): boolean {
    return this.defeatedSet.has(enemy);
  }

  /**
   * Resolves combat against a single target.
   *
   * Returns null if the target is invalid or already defeated.
   */
  private resolveTarget(request: AttackRequest, target: Enemy): CombatResult | null {
    // Skip already defeated enemies
    if (this.defeatedSet.has(target)) {
      return null;
    }

    // Validate target
    let stats;
    try {
      stats = target.getStats();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[CombatSystem] Invalid target — skipping. ${message}`);
      return null;
    }

    // Initialize health tracking on first encounter
    if (!this.healthMap.has(target)) {
      this.healthMap.set(target, stats.healthPoints);
    }

    const currentHealth = this.healthMap.get(target)!;

    // Calculate damage
    const attackValue = this.playerAttackPoints;
    const armorValue = stats.armorPoints;
    let damageCalc;
    try {
      damageCalc = this.damageCalculator.calculate(attackValue, armorValue);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[CombatSystem] Damage calculation failure — skipping target. ${message}`);
      return null;
    }

    // Apply damage — health never goes below 0
    const remainingHealth = Math.max(0, currentHealth - damageCalc.finalDamage);
    this.healthMap.set(target, remainingHealth);

    // Detect defeat
    const defeated = remainingHealth === 0;
    if (defeated) {
      this.defeatedSet.add(target);
    }

    // Build CombatResult
    const result: CombatResult = {
      target,
      damage: damageCalc.finalDamage,
      remainingHealth,
      defeated,
    };

    // Publish COMBAT_RESOLVED event
    const combatResolvedEvent: CombatResolvedEvent = {
      attacker: request.attacker,
      target,
      damage: damageCalc.finalDamage,
      remainingHealth,
    };
    eventBus.emit("COMBAT_RESOLVED", combatResolvedEvent);

    // Publish ENEMY_DEFEATED event if enemy was just defeated
    if (defeated) {
      const enemyDefeatedEvent: EnemyDefeatedEvent = {
        enemy: target,
        attacker: request.attacker,
      };
      eventBus.emit("ENEMY_DEFEATED", enemyDefeatedEvent);
      const enemyExperience = target.getStats().xpReward;
      this.playerExperience+=enemyExperience;
      const goldReward=target.getStats().goldReward;
      this.gold+=goldReward;
      eventBus.emit("PLAYER_STATS_UPDATED",{experience:this.playerExperience,gold:this.gold})
      if(this.playerExperience>=100){
        eventBus.emit("PLAYER_STATS_UPDATED",{level:2});
      }
    }

    return result;
  }

  /**
   * Cleans up internal state. Useful for testing or scene transitions.
   */
  reset(): void {
    this.healthMap.clear();
    this.defeatedSet.clear();
  }

  /**
   * Fully destroys the system: unsubscribes and resets state.
   */
  destroy(): void {
    this.stop();
    this.reset();
  }
}
