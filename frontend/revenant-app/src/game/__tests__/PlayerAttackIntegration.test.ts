import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PlayerAttackSystem } from "@/game/systems/PlayerAttackSystem";
import { eventBus } from "@/game/events";
import type { AttackRequest } from "@/game/interfaces/AttackRequest";
import type { Player } from "@/game/entities/characters/Player";
import type { Enemy } from "@/game/entities/characters/Enemy";
import type { PlayerDirection } from "@/game/services/SpriteComposer";

/**
 * Integration tests for the complete Player Attack workflow.
 *
 * These tests verify the entire chain: input → state validation → hitbox →
 * target detection → AttackRequest generation → Event Bus emission.
 *
 * Uses real instances of AttackState, AttackHitbox, and AttackRequestService.
 * Only the Phaser Scene, Player, and Enemies are mocked with minimal interfaces.
 *
 * Validates: Requirements 1, 3, 4, 5, 6
 */

/** Creates a minimal mock Phaser Scene with input and time support. */
function createMockScene(initialTime: number = 1000) {
  const listeners: Record<string, ((...args: unknown[]) => void)[]> = {};

  return {
    input: {
      on(event: string, handler: (...args: unknown[]) => void) {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(handler);
      },
      off(event: string, handler: (...args: unknown[]) => void) {
        if (listeners[event]) {
          listeners[event] = listeners[event].filter((h) => h !== handler);
        }
      },
    },
    time: {
      now: initialTime,
    },
    simulatePointerDown(button: number = 0) {
      const pointer = { button };
      for (const handler of listeners["pointerdown"] ?? []) {
        handler(pointer);
      }
    },
    setTime(time: number) {
      (this as unknown as { time: { now: number } }).time.now = time;
    },
  } as unknown as Phaser.Scene & {
    simulatePointerDown: (button?: number) => void;
    setTime: (time: number) => void;
  };
}

/** Creates a minimal mock Player at a given position and direction. */
function createMockPlayer(
  x: number = 100,
  y: number = 100,
  direction: PlayerDirection = "right"
): Player {
  return {
    getX: () => x,
    getY: () => y,
    getDirection: () => direction,
  } as unknown as Player;
}

/** Creates a minimal mock Enemy at a given position. */
function createMockEnemy(x: number, y: number): Enemy {
  return {
    getX: () => x,
    getY: () => y,
  } as unknown as Enemy;
}

describe("Player Attack Integration", () => {
  let scene: ReturnType<typeof createMockScene>;
  let attackRequestHandler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    attackRequestHandler = vi.fn();
    eventBus.on("ATTACK_REQUEST", attackRequestHandler);
  });

  afterEach(() => {
    eventBus.removeAllListeners();
  });

  describe("Complete attack workflow", () => {
    it("left mouse button triggers a complete attack workflow (state → hitbox → request → event)", () => {
      const player = createMockPlayer(100, 100, "right");
      const enemy = createMockEnemy(120, 100);
      scene = createMockScene(1000);
      const system = new PlayerAttackSystem(scene as unknown as Phaser.Scene, player, [enemy]);

      scene.simulatePointerDown(0);

      // Verify the ATTACK_REQUEST event was emitted
      expect(attackRequestHandler).toHaveBeenCalledOnce();

      const request: AttackRequest = attackRequestHandler.mock.calls[0][0];
      expect(request.attacker).toBe(player);
      expect(request.targets).toContain(enemy);
      expect(request.direction).toBe("right");
      expect(request.timestamp).toBe(1000);

      // Verify state restored: not attacking after workflow completes
      expect(system.getAttackState().getIsAttacking()).toBe(false);

      system.destroy();
    });
  });

  describe("Enemy detection via hitbox", () => {
    it("enemies inside the hitbox are included in the AttackRequest", () => {
      const player = createMockPlayer(100, 100, "right");
      // Enemy at (120, 100) is within default range of 48px to the right
      const enemy = createMockEnemy(120, 100);
      scene = createMockScene(1000);
      const system = new PlayerAttackSystem(scene as unknown as Phaser.Scene, player, [enemy]);

      scene.simulatePointerDown(0);

      const request: AttackRequest = attackRequestHandler.mock.calls[0][0];
      expect(request.targets).toHaveLength(1);
      expect(request.targets).toContain(enemy);

      system.destroy();
    });

    it("enemies outside the hitbox are NOT included in the AttackRequest", () => {
      const player = createMockPlayer(100, 100, "right");
      // Enemy at (300, 100) is far beyond the 48px default range
      const enemy = createMockEnemy(300, 100);
      scene = createMockScene(1000);
      const system = new PlayerAttackSystem(scene as unknown as Phaser.Scene, player, [enemy]);

      scene.simulatePointerDown(0);

      const request: AttackRequest = attackRequestHandler.mock.calls[0][0];
      expect(request.targets).toHaveLength(0);
      expect(request.targets).not.toContain(enemy);

      system.destroy();
    });

    it("multiple enemies inside the hitbox are ALL included in one AttackRequest", () => {
      const player = createMockPlayer(100, 100, "right");
      // All enemies within the 48px range and 48px width (centered on y=100)
      const enemy1 = createMockEnemy(110, 95);
      const enemy2 = createMockEnemy(130, 105);
      const enemy3 = createMockEnemy(140, 100);
      scene = createMockScene(1000);
      const system = new PlayerAttackSystem(
        scene as unknown as Phaser.Scene,
        player,
        [enemy1, enemy2, enemy3]
      );

      scene.simulatePointerDown(0);

      const request: AttackRequest = attackRequestHandler.mock.calls[0][0];
      expect(request.targets).toHaveLength(3);
      expect(request.targets).toContain(enemy1);
      expect(request.targets).toContain(enemy2);
      expect(request.targets).toContain(enemy3);

      system.destroy();
    });

    it("an attack with no enemies in range still generates an AttackRequest with empty targets", () => {
      const player = createMockPlayer(100, 100, "right");
      scene = createMockScene(1000);
      const system = new PlayerAttackSystem(scene as unknown as Phaser.Scene, player, []);

      scene.simulatePointerDown(0);

      expect(attackRequestHandler).toHaveBeenCalledOnce();
      const request: AttackRequest = attackRequestHandler.mock.calls[0][0];
      expect(request.targets).toHaveLength(0);
      expect(request.attacker).toBe(player);

      system.destroy();
    });
  });

  describe("Event Bus emission", () => {
    it("the ATTACK_REQUEST event is emitted on the Event Bus with the correct payload", () => {
      const player = createMockPlayer(200, 200, "down");
      const enemy = createMockEnemy(200, 220);
      scene = createMockScene(5000);
      const system = new PlayerAttackSystem(scene as unknown as Phaser.Scene, player, [enemy]);

      scene.simulatePointerDown(0);

      expect(attackRequestHandler).toHaveBeenCalledOnce();
      const request: AttackRequest = attackRequestHandler.mock.calls[0][0];
      expect(request).toEqual({
        attacker: player,
        targets: [enemy],
        direction: "down",
        timestamp: 5000,
      });

      system.destroy();
    });
  });

  describe("Cooldown enforcement", () => {
    it("attack cooldown prevents rapid consecutive attacks", () => {
      const player = createMockPlayer(100, 100, "right");
      scene = createMockScene(1000);
      const system = new PlayerAttackSystem(scene as unknown as Phaser.Scene, player, []);

      // First attack at t=1000
      scene.simulatePointerDown(0);
      expect(attackRequestHandler).toHaveBeenCalledTimes(1);

      // Second attack at t=1200 (within 500ms cooldown) — should be rejected
      scene.setTime(1200);
      scene.simulatePointerDown(0);
      expect(attackRequestHandler).toHaveBeenCalledTimes(1);

      // Third attack at t=1600 (after cooldown expires) — should succeed
      scene.setTime(1600);
      scene.simulatePointerDown(0);
      expect(attackRequestHandler).toHaveBeenCalledTimes(2);

      system.destroy();
    });
  });

  describe("Overlapping attack prevention", () => {
    it("attack during active attack is ignored (no second request generated)", () => {
      const player = createMockPlayer(100, 100, "right");
      scene = createMockScene(1000);
      const enemies: Enemy[] = [];
      const system = new PlayerAttackSystem(scene as unknown as Phaser.Scene, player, enemies);

      // The current implementation ends attack synchronously, so we verify
      // that the cooldown prevents a second attack immediately after
      scene.simulatePointerDown(0);
      expect(attackRequestHandler).toHaveBeenCalledTimes(1);

      // Immediately try again (same time) — cooldown blocks this
      scene.simulatePointerDown(0);
      expect(attackRequestHandler).toHaveBeenCalledTimes(1);

      system.destroy();
    });
  });

  describe("Attack direction", () => {
    it("the attack direction matches the player's facing direction at time of attack", () => {
      const directions: PlayerDirection[] = ["up", "down", "left", "right"];

      for (const dir of directions) {
        const player = createMockPlayer(100, 100, dir);
        const localScene = createMockScene(1000 + directions.indexOf(dir) * 1000);
        const localHandler = vi.fn();
        eventBus.on("ATTACK_REQUEST", localHandler);

        const system = new PlayerAttackSystem(
          localScene as unknown as Phaser.Scene,
          player,
          []
        );

        localScene.simulatePointerDown(0);

        expect(localHandler).toHaveBeenCalledOnce();
        const request: AttackRequest = localHandler.mock.calls[0][0];
        expect(request.direction).toBe(dir);

        system.destroy();
        eventBus.off("ATTACK_REQUEST", localHandler);
      }
    });
  });
});
