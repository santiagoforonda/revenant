import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CombatSystem } from "@/game/systems/CombatSystem";
import { eventBus } from "@/game/events";
import type { AttackRequest } from "@/game/interfaces/AttackRequest";
import type { CombatResolvedEvent, EnemyDefeatedEvent } from "@/game/interfaces/CombatEvents";
import type { Player } from "@/game/entities/characters/Player";
import type { Enemy } from "@/game/entities/characters/Enemy";
import type { EnemyResponse } from "@/game/interfaces/EnemyResponse";

/**
 * Integration tests for the Combat System.
 *
 * Validates: Requirements 1, 2, 3, 4, 5, 6, 7
 *
 * These tests verify the complete combat resolution workflow end-to-end,
 * ensuring the Event Bus → CombatSystem → DamageCalculator → Health Update →
 * Event Publication pipeline works correctly as an integrated unit.
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
  id: number,
  healthPoints: number,
  armorPoints: number = 5
): Enemy {
  const stats: EnemyResponse = {
    id,
    id_map: 1,
    healthPoints,
    damagePoints: 10,
    armorPoints,
    goldReward: 50,
    xpReward: 100,
    speedAttackPoints: 1,
    name: `Enemy_${id}`,
    description: "A test enemy",
  };

  return {
    getX: () => 200 + id * 50,
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

describe("CombatSystem Integration", () => {
  let system: CombatSystem;
  let player: Player;

  beforeEach(() => {
    system = new CombatSystem();
    system.start();
    player = createMockPlayer();
  });

  afterEach(() => {
    system.destroy();
    eventBus.removeAllListeners();
  });

  describe("Complete Combat Resolution Workflow", () => {
    it("should process an ATTACK_REQUEST emitted on the Event Bus end-to-end", () => {
      const combatResolvedHandler = vi.fn();
      eventBus.on("COMBAT_RESOLVED", combatResolvedHandler);

      // Emit an attack request via the Event Bus (simulating PlayerAttackSystem)
      const enemy = createMockEnemy(1, 30, 5);
      const request = createAttackRequest(player, [enemy]);
      eventBus.emit("ATTACK_REQUEST", request);

      // Verify the full pipeline executed:
      // 1. CombatSystem picked up the request
      // 2. Damage was calculated (10 attack - 5 armor = 5)
      // 3. Enemy health was updated (30 - 5 = 25)
      // 4. COMBAT_RESOLVED was emitted
      expect(combatResolvedHandler).toHaveBeenCalledTimes(1);

      const event: CombatResolvedEvent = combatResolvedHandler.mock.calls[0][0];
      expect(event.attacker).toBe(player);
      expect(event.target).toBe(enemy);
      expect(event.damage).toBe(5);
      expect(event.remainingHealth).toBe(25);
    });

    it("should emit ENEMY_DEFEATED only when enemy health reaches zero", () => {
      const defeatHandler = vi.fn();
      eventBus.on("ENEMY_DEFEATED", defeatHandler);

      // Enemy with 10 HP and 0 armor → one hit kills (10 - 0 = 10 damage)
      const enemy = createMockEnemy(2, 10, 0);
      const request = createAttackRequest(player, [enemy]);

      eventBus.emit("ATTACK_REQUEST", request);

      expect(defeatHandler).toHaveBeenCalledTimes(1);
      const event: EnemyDefeatedEvent = defeatHandler.mock.calls[0][0];
      expect(event.enemy).toBe(enemy);
      expect(event.attacker).toBe(player);
    });

    it("should NOT emit ENEMY_DEFEATED when enemy survives", () => {
      const defeatHandler = vi.fn();
      eventBus.on("ENEMY_DEFEATED", defeatHandler);

      // Enemy with 30 HP → survives one hit (10 - 5 = 5 damage, 25 HP left)
      const enemy = createMockEnemy(3, 30, 5);
      const request = createAttackRequest(player, [enemy]);

      eventBus.emit("ATTACK_REQUEST", request);

      expect(defeatHandler).not.toHaveBeenCalled();
    });

    it("should track enemy health decreasing across multiple attacks until death", () => {
      const combatResolvedHandler = vi.fn();
      const defeatHandler = vi.fn();
      eventBus.on("COMBAT_RESOLVED", combatResolvedHandler);
      eventBus.on("ENEMY_DEFEATED", defeatHandler);

      // Enemy with 15 HP, 5 armor → 5 damage per hit → dies on 3rd hit
      const enemy = createMockEnemy(4, 15, 5);
      const request = createAttackRequest(player, [enemy]);

      // Hit 1: 15 - 5 = 10 HP remaining
      eventBus.emit("ATTACK_REQUEST", request);
      expect(combatResolvedHandler).toHaveBeenCalledTimes(1);
      expect(combatResolvedHandler.mock.calls[0][0].remainingHealth).toBe(10);
      expect(defeatHandler).not.toHaveBeenCalled();

      // Hit 2: 10 - 5 = 5 HP remaining
      eventBus.emit("ATTACK_REQUEST", request);
      expect(combatResolvedHandler).toHaveBeenCalledTimes(2);
      expect(combatResolvedHandler.mock.calls[1][0].remainingHealth).toBe(5);
      expect(defeatHandler).not.toHaveBeenCalled();

      // Hit 3: 5 - 5 = 0 HP → defeated
      eventBus.emit("ATTACK_REQUEST", request);
      expect(combatResolvedHandler).toHaveBeenCalledTimes(3);
      expect(combatResolvedHandler.mock.calls[2][0].remainingHealth).toBe(0);
      expect(defeatHandler).toHaveBeenCalledTimes(1);
    });

    it("should not emit duplicate defeat events on subsequent attacks", () => {
      const defeatHandler = vi.fn();
      const combatResolvedHandler = vi.fn();
      eventBus.on("ENEMY_DEFEATED", defeatHandler);
      eventBus.on("COMBAT_RESOLVED", combatResolvedHandler);

      // Enemy dies in one hit
      const enemy = createMockEnemy(5, 10, 0);
      const request = createAttackRequest(player, [enemy]);

      // First attack defeats the enemy
      eventBus.emit("ATTACK_REQUEST", request);
      expect(defeatHandler).toHaveBeenCalledTimes(1);
      expect(combatResolvedHandler).toHaveBeenCalledTimes(1);

      // Subsequent attacks should be ignored (no duplicate events)
      eventBus.emit("ATTACK_REQUEST", request);
      eventBus.emit("ATTACK_REQUEST", request);

      expect(defeatHandler).toHaveBeenCalledTimes(1);
      expect(combatResolvedHandler).toHaveBeenCalledTimes(1);
    });

    it("should process multiple targets in a single attack request", () => {
      const combatResolvedHandler = vi.fn();
      const defeatHandler = vi.fn();
      eventBus.on("COMBAT_RESOLVED", combatResolvedHandler);
      eventBus.on("ENEMY_DEFEATED", defeatHandler);

      const enemy1 = createMockEnemy(6, 30, 5); // survives
      const enemy2 = createMockEnemy(7, 10, 0); // dies
      const enemy3 = createMockEnemy(8, 50, 8); // survives (10 - 8 = 2 dmg)
      const request = createAttackRequest(player, [enemy1, enemy2, enemy3]);

      eventBus.emit("ATTACK_REQUEST", request);

      // All 3 targets processed
      expect(combatResolvedHandler).toHaveBeenCalledTimes(3);

      // Only enemy2 was defeated
      expect(defeatHandler).toHaveBeenCalledTimes(1);
      expect(defeatHandler.mock.calls[0][0].enemy).toBe(enemy2);

      // Verify individual results
      expect(combatResolvedHandler.mock.calls[0][0].remainingHealth).toBe(25); // enemy1
      expect(combatResolvedHandler.mock.calls[1][0].remainingHealth).toBe(0);  // enemy2
      expect(combatResolvedHandler.mock.calls[2][0].remainingHealth).toBe(48); // enemy3
    });

    it("should handle empty attack request gracefully via Event Bus", () => {
      const combatResolvedHandler = vi.fn();
      const defeatHandler = vi.fn();
      eventBus.on("COMBAT_RESOLVED", combatResolvedHandler);
      eventBus.on("ENEMY_DEFEATED", defeatHandler);

      const request = createAttackRequest(player, []);
      eventBus.emit("ATTACK_REQUEST", request);

      expect(combatResolvedHandler).not.toHaveBeenCalled();
      expect(defeatHandler).not.toHaveBeenCalled();
    });
  });

  describe("No Backend Communication (Requirement 7)", () => {
    it("should not call global fetch during combat resolution", () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response()
      );

      const enemy = createMockEnemy(10, 30, 5);
      const request = createAttackRequest(player, [enemy]);

      // Perform multiple attacks
      eventBus.emit("ATTACK_REQUEST", request);
      eventBus.emit("ATTACK_REQUEST", request);
      eventBus.emit("ATTACK_REQUEST", request);

      expect(fetchSpy).not.toHaveBeenCalled();

      fetchSpy.mockRestore();
    });

    it("should not create XMLHttpRequest during combat resolution", () => {
      const xhrInstances: XMLHttpRequest[] = [];
      const OriginalXHR = globalThis.XMLHttpRequest;

      // Replace XMLHttpRequest with a spy constructor
      globalThis.XMLHttpRequest = vi.fn(() => {
        const instance = {
          open: vi.fn(),
          send: vi.fn(),
          setRequestHeader: vi.fn(),
          addEventListener: vi.fn(),
        } as unknown as XMLHttpRequest;
        xhrInstances.push(instance);
        return instance;
      }) as unknown as typeof XMLHttpRequest;

      const enemy = createMockEnemy(11, 30, 5);
      const request = createAttackRequest(player, [enemy]);

      eventBus.emit("ATTACK_REQUEST", request);
      eventBus.emit("ATTACK_REQUEST", request);

      expect(xhrInstances).toHaveLength(0);

      globalThis.XMLHttpRequest = OriginalXHR;
    });

    it("should not perform any network requests during a full combat sequence until enemy death", () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response()
      );

      // Enemy with 25 HP, 5 armor → 5 damage per hit → 5 hits to kill
      const enemy = createMockEnemy(12, 25, 5);
      const request = createAttackRequest(player, [enemy]);

      // Attack until enemy is defeated
      for (let i = 0; i < 5; i++) {
        eventBus.emit("ATTACK_REQUEST", request);
      }

      // Verify enemy is defeated
      expect(system.isDefeated(enemy)).toBe(true);

      // Verify no network communication occurred during entire combat sequence
      expect(fetchSpy).not.toHaveBeenCalled();

      fetchSpy.mockRestore();
    });

    it("should not perform network requests during multi-target combat", () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response()
      );

      const enemies = Array.from({ length: 5 }, (_, i) =>
        createMockEnemy(20 + i, 10, 0)
      );
      const request = createAttackRequest(player, enemies);

      // Single attack that defeats all 5 enemies
      eventBus.emit("ATTACK_REQUEST", request);

      // All enemies should be defeated
      enemies.forEach((enemy) => {
        expect(system.isDefeated(enemy)).toBe(true);
      });

      // No network requests occurred
      expect(fetchSpy).not.toHaveBeenCalled();

      fetchSpy.mockRestore();
    });
  });
});
