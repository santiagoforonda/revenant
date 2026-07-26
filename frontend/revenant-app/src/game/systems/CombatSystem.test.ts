import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CombatSystem } from "./CombatSystem";
import { eventBus } from "@/game/events";
import type { AttackRequest } from "@/game/interfaces/AttackRequest";
import type { CombatResolvedEvent, EnemyDefeatedEvent } from "@/game/interfaces/CombatEvents";
import type { Player } from "@/game/entities/characters/Player";
import type { Enemy } from "@/game/entities/characters/Enemy";
import type { EnemyResponse } from "@/game/interfaces/EnemyResponse";

/**
 * Unit tests for the CombatSystem.
 *
 * These tests verify the complete combat resolution workflow:
 * - Event Bus subscription and unsubscription
 * - Damage calculation coordination
 * - Enemy health tracking
 * - Defeat detection
 * - Event publication (COMBAT_RESOLVED and ENEMY_DEFEATED)
 * - Multi-target support
 * - Error handling for invalid/defeated targets
 */

/** Creates a minimal mock Player. */
function createMockPlayer(): Player {
  return {
    getX: () => 100,
    getY: () => 100,
    getDirection: () => "right",
  } as unknown as Player;
}

/** Creates a minimal mock Enemy with given stats. */
function createMockEnemy(
  healthPoints: number = 30,
  armorPoints: number = 5
): Enemy {
  const stats: EnemyResponse = {
    id: 1,
    id_map: 1,
    healthPoints,
    damagePoints: 10,
    armorPoints,
    goldReward: 50,
    xpReward: 100,
    speedAttackPoints: 1,
    name: "Skeleton",
    description: "A skeletal warrior",
  };

  return {
    getX: () => 200,
    getY: () => 200,
    getStats: () => stats,
  } as unknown as Enemy;
}

/** Creates an AttackRequest for testing. */
function createAttackRequest(
  attacker: Player,
  targets: Enemy[]
): AttackRequest {
  return {
    attacker,
    targets,
    direction: "right",
    timestamp: Date.now(),
  };
}

describe("CombatSystem", () => {
  let system: CombatSystem;
  let player: Player;

  beforeEach(() => {
    system = new CombatSystem();
    player = createMockPlayer();
  });

  afterEach(() => {
    system.destroy();
    eventBus.removeAllListeners();
  });

  describe("Event Bus Subscription", () => {
    it("should subscribe to ATTACK_REQUEST on start", () => {
      const combatResolvedHandler = vi.fn();
      eventBus.on("COMBAT_RESOLVED", combatResolvedHandler);

      system.start();

      const enemy = createMockEnemy(30, 5);
      const request = createAttackRequest(player, [enemy]);
      eventBus.emit("ATTACK_REQUEST", request);

      expect(combatResolvedHandler).toHaveBeenCalledTimes(1);
    });

    it("should not process events before start is called", () => {
      const combatResolvedHandler = vi.fn();
      eventBus.on("COMBAT_RESOLVED", combatResolvedHandler);

      const enemy = createMockEnemy(30, 5);
      const request = createAttackRequest(player, [enemy]);
      eventBus.emit("ATTACK_REQUEST", request);

      expect(combatResolvedHandler).not.toHaveBeenCalled();
    });

    it("should unsubscribe from ATTACK_REQUEST on stop", () => {
      const combatResolvedHandler = vi.fn();
      eventBus.on("COMBAT_RESOLVED", combatResolvedHandler);

      system.start();
      system.stop();

      const enemy = createMockEnemy(30, 5);
      const request = createAttackRequest(player, [enemy]);
      eventBus.emit("ATTACK_REQUEST", request);

      expect(combatResolvedHandler).not.toHaveBeenCalled();
    });
  });

  describe("Damage Calculation", () => {
    it("should calculate damage as attack minus armor", () => {
      // PLAYER_BASE_ATTACK = 10, armor = 5 → finalDamage = 5
      const enemy = createMockEnemy(30, 5);
      const request = createAttackRequest(player, [enemy]);

      const results = system.resolveAttack(request);

      expect(results).toHaveLength(1);
      expect(results[0].damage).toBe(5);
    });

    it("should produce zero damage when armor exceeds attack", () => {
      // PLAYER_BASE_ATTACK = 10, armor = 15 → finalDamage = 0
      const enemy = createMockEnemy(30, 15);
      const request = createAttackRequest(player, [enemy]);

      const results = system.resolveAttack(request);

      expect(results).toHaveLength(1);
      expect(results[0].damage).toBe(0);
    });

    it("should produce zero damage when armor equals attack", () => {
      // PLAYER_BASE_ATTACK = 10, armor = 10 → finalDamage = 0
      const enemy = createMockEnemy(30, 10);
      const request = createAttackRequest(player, [enemy]);

      const results = system.resolveAttack(request);

      expect(results).toHaveLength(1);
      expect(results[0].damage).toBe(0);
    });
  });

  describe("Enemy Health Tracking", () => {
    it("should reduce enemy health by the calculated damage", () => {
      // health: 30, damage: 10 - 5 = 5 → remaining: 25
      const enemy = createMockEnemy(30, 5);
      const request = createAttackRequest(player, [enemy]);

      system.resolveAttack(request);

      expect(system.getEnemyHealth(enemy)).toBe(25);
    });

    it("should never let health go below zero", () => {
      // health: 3, damage: 10 - 0 = 10 → remaining: 0 (not -7)
      const enemy = createMockEnemy(3, 0);
      const request = createAttackRequest(player, [enemy]);

      system.resolveAttack(request);

      expect(system.getEnemyHealth(enemy)).toBe(0);
    });

    it("should track health across multiple attacks", () => {
      // health: 30, damage per attack: 10 - 5 = 5
      const enemy = createMockEnemy(30, 5);
      const request = createAttackRequest(player, [enemy]);

      system.resolveAttack(request); // 30 - 5 = 25
      system.resolveAttack(request); // 25 - 5 = 20

      expect(system.getEnemyHealth(enemy)).toBe(20);
    });

    it("should track each enemy's health independently", () => {
      const enemy1 = createMockEnemy(30, 5);
      const enemy2 = createMockEnemy(50, 0);

      const request = createAttackRequest(player, [enemy1, enemy2]);
      system.resolveAttack(request);

      expect(system.getEnemyHealth(enemy1)).toBe(25); // 30 - 5
      expect(system.getEnemyHealth(enemy2)).toBe(40); // 50 - 10
    });
  });

  describe("Defeat Detection", () => {
    it("should mark an enemy as defeated when health reaches zero", () => {
      // health: 10, damage: 10 - 0 = 10 → defeated
      const enemy = createMockEnemy(10, 0);
      const request = createAttackRequest(player, [enemy]);

      const results = system.resolveAttack(request);

      expect(results[0].defeated).toBe(true);
      expect(system.isDefeated(enemy)).toBe(true);
    });

    it("should not mark an enemy as defeated when health is above zero", () => {
      const enemy = createMockEnemy(30, 5);
      const request = createAttackRequest(player, [enemy]);

      const results = system.resolveAttack(request);

      expect(results[0].defeated).toBe(false);
      expect(system.isDefeated(enemy)).toBe(false);
    });

    it("should skip already defeated enemies", () => {
      const enemy = createMockEnemy(10, 0);
      const request = createAttackRequest(player, [enemy]);

      // First attack defeats the enemy
      system.resolveAttack(request);

      // Second attack should skip
      const results = system.resolveAttack(request);

      expect(results).toHaveLength(0);
    });
  });

  describe("Event Publication", () => {
    it("should emit COMBAT_RESOLVED for each processed target", () => {
      const handler = vi.fn();
      eventBus.on("COMBAT_RESOLVED", handler);

      const enemy = createMockEnemy(30, 5);
      const request = createAttackRequest(player, [enemy]);

      system.resolveAttack(request);

      expect(handler).toHaveBeenCalledTimes(1);
      const event: CombatResolvedEvent = handler.mock.calls[0][0];
      expect(event.attacker).toBe(player);
      expect(event.target).toBe(enemy);
      expect(event.damage).toBe(5);
      expect(event.remainingHealth).toBe(25);
    });

    it("should emit ENEMY_DEFEATED when an enemy is defeated", () => {
      const handler = vi.fn();
      eventBus.on("ENEMY_DEFEATED", handler);

      const enemy = createMockEnemy(10, 0);
      const request = createAttackRequest(player, [enemy]);

      system.resolveAttack(request);

      expect(handler).toHaveBeenCalledTimes(1);
      const event: EnemyDefeatedEvent = handler.mock.calls[0][0];
      expect(event.enemy).toBe(enemy);
      expect(event.attacker).toBe(player);
    });

    it("should not emit ENEMY_DEFEATED when enemy survives", () => {
      const handler = vi.fn();
      eventBus.on("ENEMY_DEFEATED", handler);

      const enemy = createMockEnemy(30, 5);
      const request = createAttackRequest(player, [enemy]);

      system.resolveAttack(request);

      expect(handler).not.toHaveBeenCalled();
    });

    it("should emit ENEMY_DEFEATED only once per enemy", () => {
      const handler = vi.fn();
      eventBus.on("ENEMY_DEFEATED", handler);

      const enemy = createMockEnemy(10, 0);
      const request = createAttackRequest(player, [enemy]);

      system.resolveAttack(request); // defeats the enemy
      system.resolveAttack(request); // already defeated, skipped

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("Multi-Target Support", () => {
    it("should process all targets in a single request", () => {
      const handler = vi.fn();
      eventBus.on("COMBAT_RESOLVED", handler);

      const enemy1 = createMockEnemy(30, 5);
      const enemy2 = createMockEnemy(20, 0);
      const request = createAttackRequest(player, [enemy1, enemy2]);

      const results = system.resolveAttack(request);

      expect(results).toHaveLength(2);
      expect(handler).toHaveBeenCalledTimes(2);
    });

    it("should continue processing when one target is defeated", () => {
      const enemy1 = createMockEnemy(5, 0); // will die (5 - 10 = dead)
      const enemy2 = createMockEnemy(30, 5); // survives
      const request = createAttackRequest(player, [enemy1, enemy2]);

      const results = system.resolveAttack(request);

      expect(results).toHaveLength(2);
      expect(results[0].defeated).toBe(true);
      expect(results[1].defeated).toBe(false);
    });

    it("should handle empty target array gracefully", () => {
      const handler = vi.fn();
      eventBus.on("COMBAT_RESOLVED", handler);

      const request = createAttackRequest(player, []);
      const results = system.resolveAttack(request);

      expect(results).toHaveLength(0);
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should return empty results for an empty targets array", () => {
      const combatHandler = vi.fn();
      const defeatHandler = vi.fn();
      eventBus.on("COMBAT_RESOLVED", combatHandler);
      eventBus.on("ENEMY_DEFEATED", defeatHandler);

      const request = createAttackRequest(player, []);
      const results = system.resolveAttack(request);

      expect(results).toHaveLength(0);
      expect(combatHandler).not.toHaveBeenCalled();
      expect(defeatHandler).not.toHaveBeenCalled();
    });

    it("should skip targets with invalid stats and continue processing", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const invalidEnemy = {
        getX: () => 200,
        getY: () => 200,
        getStats: () => {
          throw new Error("Stats unavailable");
        },
      } as unknown as Enemy;

      const validEnemy = createMockEnemy(30, 5);
      const request = createAttackRequest(player, [invalidEnemy, validEnemy]);

      const results = system.resolveAttack(request);

      expect(results).toHaveLength(1);
      expect(results[0].target).toBe(validEnemy);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should not process already defeated enemies", () => {
      const combatHandler = vi.fn();
      eventBus.on("COMBAT_RESOLVED", combatHandler);

      // First attack defeats the enemy (health: 10, damage: 10 - 0 = 10)
      const enemy = createMockEnemy(10, 0);
      const request = createAttackRequest(player, [enemy]);

      system.resolveAttack(request);
      expect(combatHandler).toHaveBeenCalledTimes(1);

      // Second attack on the same defeated enemy should be skipped
      const results = system.resolveAttack(request);

      expect(results).toHaveLength(0);
      // COMBAT_RESOLVED should not fire again for the defeated enemy
      expect(combatHandler).toHaveBeenCalledTimes(1);
    });

    it("should skip defeated enemies but process alive ones in the same request", () => {
      const enemy1 = createMockEnemy(10, 0); // Will be defeated first
      const enemy2 = createMockEnemy(30, 5); // Will remain alive

      // Defeat enemy1
      system.resolveAttack(createAttackRequest(player, [enemy1]));
      expect(system.isDefeated(enemy1)).toBe(true);

      // Now attack both — enemy1 should be skipped, enemy2 should be processed
      const results = system.resolveAttack(createAttackRequest(player, [enemy1, enemy2]));

      expect(results).toHaveLength(1);
      expect(results[0].target).toBe(enemy2);
    });

    it("should handle damage calculation failures gracefully", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      // Create an enemy with valid stats
      const enemy = createMockEnemy(30, 5);
      const request = createAttackRequest(player, [enemy]);

      // Mock the damage calculator to throw on the first call
      const calcSpy = vi
        .spyOn(system["damageCalculator"], "calculate")
        .mockImplementationOnce(() => {
          throw new Error("Calculation overflow");
        });

      const results = system.resolveAttack(request);

      expect(results).toHaveLength(0);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Damage calculation failure")
      );

      calcSpy.mockRestore();
      consoleSpy.mockRestore();
    });

    it("should continue processing other targets after a damage calculation failure", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const enemy1 = createMockEnemy(30, 5);
      const enemy2 = createMockEnemy(20, 0);
      const request = createAttackRequest(player, [enemy1, enemy2]);

      // Fail only on the first call, succeed on the second
      const calcSpy = vi
        .spyOn(system["damageCalculator"], "calculate")
        .mockImplementationOnce(() => {
          throw new Error("Calculation overflow");
        });

      const results = system.resolveAttack(request);

      // enemy1 skipped due to error, enemy2 processed normally
      expect(results).toHaveLength(1);
      expect(results[0].target).toBe(enemy2);
      expect(consoleSpy).toHaveBeenCalledTimes(1);

      calcSpy.mockRestore();
      consoleSpy.mockRestore();
    });

    it("should log errors without interrupting gameplay", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const invalidEnemy1 = {
        getX: () => 200,
        getY: () => 200,
        getStats: () => {
          throw new Error("Network error");
        },
      } as unknown as Enemy;

      const invalidEnemy2 = {
        getX: () => 300,
        getY: () => 300,
        getStats: () => {
          throw new Error("Corrupted data");
        },
      } as unknown as Enemy;

      const validEnemy = createMockEnemy(30, 5);
      const request = createAttackRequest(player, [invalidEnemy1, invalidEnemy2, validEnemy]);

      const results = system.resolveAttack(request);

      // Both invalid enemies skipped, valid enemy processed
      expect(results).toHaveLength(1);
      expect(results[0].target).toBe(validEnemy);

      // Both errors were logged
      expect(consoleSpy).toHaveBeenCalledTimes(2);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Network error")
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Corrupted data")
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Reset and Destroy", () => {
    it("should clear all state on reset", () => {
      const enemy = createMockEnemy(10, 0);
      const request = createAttackRequest(player, [enemy]);

      system.resolveAttack(request);
      expect(system.isDefeated(enemy)).toBe(true);

      system.reset();
      expect(system.isDefeated(enemy)).toBe(false);
      expect(system.getEnemyHealth(enemy)).toBeUndefined();
    });

    it("should unsubscribe and clear state on destroy", () => {
      const handler = vi.fn();
      eventBus.on("COMBAT_RESOLVED", handler);

      system.start();
      system.destroy();

      const enemy = createMockEnemy(30, 5);
      const request = createAttackRequest(player, [enemy]);
      eventBus.emit("ATTACK_REQUEST", request);

      expect(handler).not.toHaveBeenCalled();
    });
  });
});
