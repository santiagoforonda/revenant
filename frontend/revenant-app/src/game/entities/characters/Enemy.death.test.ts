import { describe, it, expect, vi, beforeEach } from "vitest";
import { EnemyType } from "@/game/config/EnemySpriteRegistry";
import type { EnemyResponse } from "../../interfaces/EnemyResponse";

/**
 * Unit tests for Enemy entity death-related methods: disable(), destroy(), isDead().
 *
 * Validates: Requirements 2, 4, 6 (Disable behavior, Remove Enemy, Gameplay Consistency)
 *
 * These tests verify:
 * - disable() zeroes velocity, disables body, marks dead
 * - destroy() stops animations, disables physics, destroys sprite
 * - isDead() returns correct values
 * - Calling disable on already-dead enemy is safe
 */

// Mock EnemySpriteComposer to avoid Phaser animation complexity
vi.mock("@/game/services/EnemySpriteComposer", () => ({
  EnemySpriteComposer: class MockEnemySpriteComposer {
    updateAnimation = vi.fn();
    getCurrentAnimationKey() { return "skeleton-idle-down"; }
    getSprite = vi.fn();
  },
}));

import { Enemy } from "./Enemy";

/** Creates a mock Phaser body */
function createMockBody() {
  return {
    setVelocity: vi.fn(),
    enable: true,
  };
}

/** Creates a mock Phaser sprite with physics body */
function createMockSprite() {
  const body = createMockBody();
  return {
    x: 100,
    y: 200,
    active: true,
    setDepth: vi.fn(),
    setImmovable: vi.fn(),
    setPosition: vi.fn(),
    play: vi.fn(),
    on: vi.fn(),
    once: vi.fn(),
    off: vi.fn(),
    anims: { stop: vi.fn() },
    body,
    destroy: vi.fn(),
  };
}

/** Creates a mock Phaser scene that returns our controlled sprite */
function createMockScene(sprite: ReturnType<typeof createMockSprite>) {
  return {
    physics: {
      add: {
        sprite: vi.fn(() => sprite),
      },
    },
  } as unknown as Phaser.Scene;
}

/** Creates test enemy stats */
function createStats(): EnemyResponse {
  return {
    id: 1,
    id_map: 1,
    healthPoints: 30,
    damagePoints: 10,
    armorPoints: 5,
    goldReward: 50,
    xpReward: 100,
    speedAttackPoints: 1,
    name: "TestSkeleton",
    description: "A test skeleton",
  };
}

describe("Enemy - Death Methods", () => {
  let mockSprite: ReturnType<typeof createMockSprite>;
  let scene: Phaser.Scene;
  let enemy: Enemy;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSprite = createMockSprite();
    scene = createMockScene(mockSprite);
    enemy = new Enemy(scene, 100, 200, createStats(), "skeleton-sheet", EnemyType.Skeleton);
  });

  describe("isDead()", () => {
    it("should return false for a newly created enemy", () => {
      expect(enemy.isDead()).toBe(false);
    });

    it("should return true after disable() is called", () => {
      enemy.disable();
      expect(enemy.isDead()).toBe(true);
    });

    it("should return true after destroy() is called", () => {
      enemy.destroy();
      expect(enemy.isDead()).toBe(true);
    });
  });

  describe("disable()", () => {
    it("should mark the enemy as dead", () => {
      enemy.disable();
      expect(enemy.isDead()).toBe(true);
    });

    it("should zero the velocity on the physics body", () => {
      enemy.disable();
      expect(mockSprite.body.setVelocity).toHaveBeenCalledWith(0, 0);
    });

    it("should disable the physics body", () => {
      enemy.disable();
      expect(mockSprite.body.enable).toBe(false);
    });

    it("should be safe to call on an already-dead enemy", () => {
      enemy.disable();
      // Calling disable a second time should not throw
      expect(() => enemy.disable()).not.toThrow();
      expect(enemy.isDead()).toBe(true);
    });

    it("should reset animation state to idle", () => {
      enemy.disable();
      expect(enemy.getState()).toBe("idle");
    });
  });

  describe("destroy()", () => {
    it("should mark the enemy as dead", () => {
      enemy.destroy();
      expect(enemy.isDead()).toBe(true);
    });

    it("should stop sprite animations before destruction", () => {
      enemy.destroy();
      expect(mockSprite.anims.stop).toHaveBeenCalled();
    });

    it("should disable the physics body before sprite destruction", () => {
      // Track order: body disable should happen before sprite.destroy
      const callOrder: string[] = [];
      const bodySetVelocity = mockSprite.body.setVelocity;
      bodySetVelocity.mockImplementation(() => { callOrder.push("body.setVelocity"); });

      Object.defineProperty(mockSprite.body, "enable", {
        set: () => { callOrder.push("body.enable=false"); },
        get: () => true,
      });

      mockSprite.destroy.mockImplementation(() => { callOrder.push("sprite.destroy"); });

      enemy.destroy();

      // Physics body should be disabled before sprite is destroyed
      const bodyIdx = callOrder.indexOf("body.setVelocity");
      const destroyIdx = callOrder.indexOf("sprite.destroy");
      expect(bodyIdx).toBeLessThan(destroyIdx);
    });

    it("should destroy the sprite (remove from scene)", () => {
      enemy.destroy();
      expect(mockSprite.destroy).toHaveBeenCalled();
    });

    it("should zero velocity before destroying", () => {
      enemy.destroy();
      expect(mockSprite.body.setVelocity).toHaveBeenCalledWith(0, 0);
    });

    it("should disable the physics body", () => {
      enemy.destroy();
      expect(mockSprite.body.enable).toBe(false);
    });
  });

  describe("disable() followed by destroy()", () => {
    it("should handle the full disable→destroy lifecycle without errors", () => {
      expect(() => {
        enemy.disable();
        enemy.destroy();
      }).not.toThrow();

      expect(enemy.isDead()).toBe(true);
      expect(mockSprite.destroy).toHaveBeenCalled();
    });
  });
});
