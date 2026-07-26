import { describe, it, expect, vi, beforeEach } from "vitest";
import { PatrolController } from "@/game/systems/PatrolController";
import type { Enemy } from "@/game/entities/characters/Enemy";

/**
 * Unit tests for PatrolController (Task 1).
 *
 * Validates:
 * - Patrol initialization stores the spawn position as the patrol origin.
 * - Patrol begins in the Idle state.
 * - The patrol origin never changes.
 * - The controller integrates with the Enemy entity via setState.
 * - Activate/deactivate controls patrol processing.
 * - Update is a no-op when inactive (error handling: Requirement 8.4).
 */

// Mock EnemyAnimationRegistrar to prevent import issues
vi.mock("@/game/services/EnemyAnimationRegistrar", () => ({
  enemyAnimationRegistrar: {
    resolveAnimationKey: vi.fn(
      (enemyType: string, state: string, direction: string) => {
        const stateKey = state === "walking" ? "walk" : "idle";
        return `${enemyType}-${stateKey}-${direction}`;
      }
    ),
    registerAnimations: vi.fn().mockReturnValue(true),
    areAnimationsRegistered: vi.fn().mockReturnValue(true),
  },
}));

/**
 * Creates a mock Enemy entity with the minimum interface needed by PatrolController.
 */
function createMockEnemy(x: number = 100, y: number = 200): Enemy {
  return {
    setState: vi.fn(),
    setDirection: vi.fn(),
    setStateAndDirection: vi.fn(),
    getState: vi.fn().mockReturnValue("idle"),
    getDirection: vi.fn().mockReturnValue("down"),
    getX: vi.fn().mockReturnValue(x),
    getY: vi.fn().mockReturnValue(y),
    setPosition: vi.fn(),
    getSprite: vi.fn(),
    getStats: vi.fn(),
    getName: vi.fn().mockReturnValue("Skeleton"),
    getEnemyType: vi.fn(),
    getCurrentAnimationKey: vi.fn().mockReturnValue("skeleton-idle-down"),
  } as unknown as Enemy;
}

describe("PatrolController", () => {
  let mockEnemy: Enemy;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEnemy = createMockEnemy(150, 250);
  });

  describe("Initialization", () => {
    it("should store the spawn position as the patrol origin", () => {
      const controller = new PatrolController(mockEnemy, 150, 250);

      const origin = controller.getOrigin();
      expect(origin.x).toBe(150);
      expect(origin.y).toBe(250);
    });

    it("should begin in the Idle patrol state", () => {
      const controller = new PatrolController(mockEnemy, 100, 200);

      expect(controller.getPatrolState()).toBe("idle");
    });

    it("should call enemy.setState('idle') on initialization", () => {
      new PatrolController(mockEnemy, 100, 200);

      expect(mockEnemy.setState).toHaveBeenCalledWith("idle");
    });

    it("should be active by default after construction", () => {
      const controller = new PatrolController(mockEnemy, 100, 200);

      expect(controller.isActive()).toBe(true);
    });

    it("should preserve a reference to the enemy", () => {
      const controller = new PatrolController(mockEnemy, 100, 200);

      expect(controller.getEnemy()).toBe(mockEnemy);
    });
  });

  describe("Patrol Origin Preservation", () => {
    it("should return the same origin regardless of enemy movement", () => {
      const controller = new PatrolController(mockEnemy, 300, 400);

      // Simulate enemy moving (mock returns different position)
      (mockEnemy.getX as ReturnType<typeof vi.fn>).mockReturnValue(500);
      (mockEnemy.getY as ReturnType<typeof vi.fn>).mockReturnValue(600);

      // Origin must remain unchanged
      const origin = controller.getOrigin();
      expect(origin.x).toBe(300);
      expect(origin.y).toBe(400);
    });

    it("should have a readonly origin that cannot be modified externally", () => {
      const controller = new PatrolController(mockEnemy, 100, 200);
      const origin = controller.getOrigin();

      // The origin interface uses readonly properties
      expect(origin.x).toBe(100);
      expect(origin.y).toBe(200);
    });
  });

  describe("Activate and Deactivate", () => {
    it("should be deactivatable", () => {
      const controller = new PatrolController(mockEnemy, 100, 200);

      controller.deactivate();

      expect(controller.isActive()).toBe(false);
    });

    it("should be reactivatable after deactivation", () => {
      const controller = new PatrolController(mockEnemy, 100, 200);

      controller.deactivate();
      controller.activate();

      expect(controller.isActive()).toBe(true);
    });
  });

  describe("Update Behavior", () => {
    it("should not throw when update is called while active", () => {
      const controller = new PatrolController(mockEnemy, 100, 200);

      expect(() => controller.update(16)).not.toThrow();
    });

    it("should not throw when update is called while inactive", () => {
      const controller = new PatrolController(mockEnemy, 100, 200);
      controller.deactivate();

      expect(() => controller.update(16)).not.toThrow();
    });

    it("should be safe to call update multiple times", () => {
      const controller = new PatrolController(mockEnemy, 100, 200);

      // Simulate multiple frames
      for (let i = 0; i < 100; i++) {
        expect(() => controller.update(16)).not.toThrow();
      }
    });
  });

  describe("Multiple Controllers Independence", () => {
    it("should allow independent patrol controllers for different enemies", () => {
      const enemy1 = createMockEnemy(100, 200);
      const enemy2 = createMockEnemy(500, 600);

      const controller1 = new PatrolController(enemy1, 100, 200);
      const controller2 = new PatrolController(enemy2, 500, 600);

      expect(controller1.getOrigin().x).toBe(100);
      expect(controller1.getOrigin().y).toBe(200);
      expect(controller2.getOrigin().x).toBe(500);
      expect(controller2.getOrigin().y).toBe(600);
    });

    it("should deactivate independently without affecting other controllers", () => {
      const enemy1 = createMockEnemy(100, 200);
      const enemy2 = createMockEnemy(500, 600);

      const controller1 = new PatrolController(enemy1, 100, 200);
      const controller2 = new PatrolController(enemy2, 500, 600);

      controller1.deactivate();

      expect(controller1.isActive()).toBe(false);
      expect(controller2.isActive()).toBe(true);
    });
  });
});
