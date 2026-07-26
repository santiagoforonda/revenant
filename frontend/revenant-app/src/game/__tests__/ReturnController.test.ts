import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ReturnController,
  DEFAULT_RETURN_SPEED,
  RETURN_ARRIVAL_THRESHOLD,
} from "@/game/systems/ReturnController";
import type { Enemy } from "@/game/entities/characters/Enemy";
import type { PatrolController } from "@/game/systems/PatrolController";

/**
 * Unit tests for ReturnController (Tasks 1, 3, 4).
 *
 * Validates:
 * - Return initialization begins in Inactive state.
 * - Return target stores the enemy's original spawn position.
 * - Return starts only after receiving PlayerLost detection event.
 * - Return does not start on PlayerDetected event.
 * - Error handling for missing references and invalid spawn positions.
 * - Duplicate state transitions are prevented.
 * - Return speed configuration works correctly.
 * - Movement toward spawn position (Task 4).
 * - Direction calculation during return (Task 4).
 * - Arrival detection and patrol reactivation (Task 4).
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
 * Creates a mock Enemy entity with the minimum interface needed by ReturnController.
 */
function createMockEnemy(x: number = 100, y: number = 200): Enemy {
  let currentX = x;
  let currentY = y;

  return {
    setState: vi.fn(),
    setDirection: vi.fn(),
    setStateAndDirection: vi.fn(),
    getState: vi.fn().mockReturnValue("idle"),
    getDirection: vi.fn().mockReturnValue("down"),
    getX: vi.fn(() => currentX),
    getY: vi.fn(() => currentY),
    setPosition: vi.fn((newX: number, newY: number) => {
      currentX = newX;
      currentY = newY;
    }),
    getSprite: vi.fn(),
    getStats: vi.fn(),
    getName: vi.fn().mockReturnValue("Skeleton"),
    getEnemyType: vi.fn(),
    getCurrentAnimationKey: vi.fn().mockReturnValue("skeleton-idle-down"),
  } as unknown as Enemy;
}

/**
 * Creates a mock PatrolController with the minimum interface needed by ReturnController.
 */
function createMockPatrolController(): PatrolController {
  return {
    activate: vi.fn(),
    deactivate: vi.fn(),
    isActive: vi.fn().mockReturnValue(false),
    getOrigin: vi.fn().mockReturnValue({ x: 0, y: 0 }),
    getPatrolState: vi.fn().mockReturnValue("idle"),
    getEnemy: vi.fn(),
    update: vi.fn(),
  } as unknown as PatrolController;
}

describe("ReturnController", () => {
  let mockEnemy: Enemy;
  let mockPatrolController: PatrolController;
  const spawnX = 500;
  const spawnY = 600;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEnemy = createMockEnemy(100, 200);
    mockPatrolController = createMockPatrolController();
  });

  describe("Initialization", () => {
    it("should begin in the Inactive return state", () => {
      const controller = new ReturnController(mockEnemy, spawnX, spawnY, mockPatrolController);

      expect(controller.getReturnState()).toBe("Inactive");
    });

    it("should store the spawn position as the return target", () => {
      const controller = new ReturnController(mockEnemy, spawnX, spawnY, mockPatrolController);

      const target = controller.getReturnTarget();
      expect(target.targetX).toBe(spawnX);
      expect(target.targetY).toBe(spawnY);
    });

    it("should preserve a reference to the enemy", () => {
      const controller = new ReturnController(mockEnemy, spawnX, spawnY, mockPatrolController);

      expect(controller.getEnemy()).toBe(mockEnemy);
    });

    it("should use the default return speed when none is provided", () => {
      const controller = new ReturnController(mockEnemy, spawnX, spawnY, mockPatrolController);

      expect(controller.getReturnSpeed()).toBe(DEFAULT_RETURN_SPEED);
    });

    it("should accept a custom return speed", () => {
      const controller = new ReturnController(mockEnemy, spawnX, spawnY, mockPatrolController, 80);

      expect(controller.getReturnSpeed()).toBe(80);
    });

    it("should use the default return speed for invalid values", () => {
      const controller1 = new ReturnController(mockEnemy, spawnX, spawnY, mockPatrolController, -10);
      expect(controller1.getReturnSpeed()).toBe(DEFAULT_RETURN_SPEED);

      const controller2 = new ReturnController(mockEnemy, spawnX, spawnY, mockPatrolController, 0);
      expect(controller2.getReturnSpeed()).toBe(DEFAULT_RETURN_SPEED);

      const controller3 = new ReturnController(mockEnemy, spawnX, spawnY, mockPatrolController, NaN);
      expect(controller3.getReturnSpeed()).toBe(DEFAULT_RETURN_SPEED);

      const controller4 = new ReturnController(mockEnemy, spawnX, spawnY, mockPatrolController, Infinity);
      expect(controller4.getReturnSpeed()).toBe(DEFAULT_RETURN_SPEED);
    });

    it("should throw when enemy reference is missing", () => {
      expect(
        () => new ReturnController(null as unknown as Enemy, spawnX, spawnY, mockPatrolController)
      ).toThrow("[ReturnController] Enemy reference is required.");
    });

    it("should handle invalid spawn position gracefully without throwing", () => {
      expect(
        () => new ReturnController(mockEnemy, NaN, NaN, mockPatrolController)
      ).not.toThrow();

      const controller = new ReturnController(mockEnemy, NaN, NaN, mockPatrolController);
      expect(controller.getReturnState()).toBe("Inactive");
    });

    it("should store NaN target when spawn position is invalid", () => {
      const controller = new ReturnController(mockEnemy, NaN, 100, mockPatrolController);

      const target = controller.getReturnTarget();
      expect(Number.isNaN(target.targetX)).toBe(true);
    });
  });

  describe("Detection Event Handling", () => {
    it("should transition to Returning state on PlayerLost", () => {
      const controller = new ReturnController(mockEnemy, spawnX, spawnY, mockPatrolController);

      controller.handleDetectionEvent("PlayerLost");

      expect(controller.getReturnState()).toBe("Returning");
    });

    it("should set enemy to walking state on PlayerLost", () => {
      const controller = new ReturnController(mockEnemy, spawnX, spawnY, mockPatrolController);

      controller.handleDetectionEvent("PlayerLost");

      expect(mockEnemy.setState).toHaveBeenCalledWith("walking");
    });

    it("should NOT transition on PlayerDetected", () => {
      const controller = new ReturnController(mockEnemy, spawnX, spawnY, mockPatrolController);

      controller.handleDetectionEvent("PlayerDetected");

      expect(controller.getReturnState()).toBe("Inactive");
    });

    it("should prevent duplicate Returning transitions", () => {
      const controller = new ReturnController(mockEnemy, spawnX, spawnY, mockPatrolController);

      controller.handleDetectionEvent("PlayerLost");
      controller.handleDetectionEvent("PlayerLost");

      expect(controller.getReturnState()).toBe("Returning");
      // setState should only be called once (no redundant transitions)
      expect(mockEnemy.setState).toHaveBeenCalledTimes(1);
    });

    it("should not start return when spawn position is invalid", () => {
      const controller = new ReturnController(mockEnemy, NaN, NaN, mockPatrolController);

      controller.handleDetectionEvent("PlayerLost");

      expect(controller.getReturnState()).toBe("Inactive");
    });

    it("should cancel return on PlayerDetected while Returning", () => {
      const controller = new ReturnController(mockEnemy, spawnX, spawnY, mockPatrolController);

      controller.handleDetectionEvent("PlayerLost");
      expect(controller.getReturnState()).toBe("Returning");

      controller.handleDetectionEvent("PlayerDetected");
      expect(controller.getReturnState()).toBe("Inactive");
    });

    it("should provide handleDetectionEvent as a stable function reference", () => {
      const controller = new ReturnController(mockEnemy, spawnX, spawnY, mockPatrolController);

      expect(typeof controller.handleDetectionEvent).toBe("function");
      expect(controller.handleDetectionEvent).toBe(controller.handleDetectionEvent);
    });
  });

  describe("Update Behavior", () => {
    it("should be a no-op when return state is Inactive", () => {
      const controller = new ReturnController(mockEnemy, spawnX, spawnY, mockPatrolController);

      controller.update(16);

      expect(controller.getReturnState()).toBe("Inactive");
      expect(mockEnemy.setPosition).not.toHaveBeenCalled();
    });

    it("should not throw when update is called while Inactive", () => {
      const controller = new ReturnController(mockEnemy, spawnX, spawnY, mockPatrolController);

      expect(() => controller.update(16)).not.toThrow();
    });

    it("should not throw when update is called while Returning", () => {
      const controller = new ReturnController(mockEnemy, spawnX, spawnY, mockPatrolController);
      controller.handleDetectionEvent("PlayerLost");

      expect(() => controller.update(16)).not.toThrow();
    });

    it("should be safe to call update multiple times", () => {
      const controller = new ReturnController(mockEnemy, spawnX, spawnY, mockPatrolController);
      controller.handleDetectionEvent("PlayerLost");

      for (let i = 0; i < 100; i++) {
        expect(() => controller.update(16)).not.toThrow();
      }
    });

    it("should stop safely if spawn position becomes invalid during return", () => {
      const controller = new ReturnController(mockEnemy, NaN, NaN, mockPatrolController);

      // The controller won't enter Returning state with invalid target
      controller.handleDetectionEvent("PlayerLost");
      expect(controller.getReturnState()).toBe("Inactive");
    });
  });

  describe("Return Movement (Task 4)", () => {
    it("should move enemy toward spawn position when returning", () => {
      // Enemy at (100, 200), spawn at (500, 600)
      const controller = new ReturnController(mockEnemy, spawnX, spawnY, mockPatrolController);
      controller.handleDetectionEvent("PlayerLost");

      controller.update(1000); // 1 second = should move exactly returnSpeed pixels

      // After 1 second at 45px/s, the enemy should have moved 45 pixels toward target
      expect(mockEnemy.setPosition).toHaveBeenCalled();
    });

    it("should use frame-independent movement", () => {
      // Enemy at (100, 200), spawn at (500, 200) — pure horizontal for easy math
      const enemy = createMockEnemy(100, 200);
      const controller = new ReturnController(enemy, 500, 200, mockPatrolController);
      controller.handleDetectionEvent("PlayerLost");

      // Move for 1000ms (1 second) at 45px/s
      controller.update(1000);

      // Expected: moved 45 pixels to the right
      const calls = (enemy.setPosition as ReturnType<typeof vi.fn>).mock.calls;
      expect(calls.length).toBe(1);
      expect(calls[0][0]).toBeCloseTo(145, 1); // 100 + 45
      expect(calls[0][1]).toBeCloseTo(200, 1); // no vertical movement
    });

    it("should calculate normalized movement vector", () => {
      // Enemy at (0, 0), spawn at (300, 400) — 3-4-5 triangle scaled by 100
      const enemy = createMockEnemy(0, 0);
      const controller = new ReturnController(enemy, 300, 400, mockPatrolController);
      controller.handleDetectionEvent("PlayerLost");

      controller.update(1000); // 1 second at 45px/s

      // Distance = 500, direction = (0.6, 0.8)
      // Expected position = (0 + 0.6*45, 0 + 0.8*45) = (27, 36)
      const calls = (enemy.setPosition as ReturnType<typeof vi.fn>).mock.calls;
      expect(calls[0][0]).toBeCloseTo(27, 1);
      expect(calls[0][1]).toBeCloseTo(36, 1);
    });

    it("should prevent overshooting when close to destination", () => {
      // Enemy at (499, 600), spawn at (500, 600) — only 1 pixel away
      const enemy = createMockEnemy(499, 600);
      const controller = new ReturnController(enemy, 500, 600, mockPatrolController);
      controller.handleDetectionEvent("PlayerLost");

      // Distance is 1, which is less than RETURN_ARRIVAL_THRESHOLD (2)
      // So it should complete the return immediately
      controller.update(1000);

      // Should snap to spawn position
      const calls = (enemy.setPosition as ReturnType<typeof vi.fn>).mock.calls;
      expect(calls[0][0]).toBe(500);
      expect(calls[0][1]).toBe(600);
    });

    it("should stop movement immediately after reaching destination", () => {
      // Enemy at (499, 600), spawn at (500, 600) — within threshold
      const enemy = createMockEnemy(499, 600);
      const controller = new ReturnController(enemy, 500, 600, mockPatrolController);
      controller.handleDetectionEvent("PlayerLost");

      controller.update(16);

      // State should be Inactive after arrival
      expect(controller.getReturnState()).toBe("Inactive");
    });

    it("should snap to exact spawn position on arrival", () => {
      // Enemy at (501, 601), spawn at (500, 600) — within threshold (distance ~1.41)
      const enemy = createMockEnemy(501, 601);
      const controller = new ReturnController(enemy, 500, 600, mockPatrolController);
      controller.handleDetectionEvent("PlayerLost");

      controller.update(16);

      const calls = (enemy.setPosition as ReturnType<typeof vi.fn>).mock.calls;
      expect(calls[0][0]).toBe(500);
      expect(calls[0][1]).toBe(600);
    });

    it("should set enemy to idle on arrival", () => {
      const enemy = createMockEnemy(501, 600);
      const controller = new ReturnController(enemy, 500, 600, mockPatrolController);
      controller.handleDetectionEvent("PlayerLost");

      // Clear the setState call from startReturn
      (enemy.setState as ReturnType<typeof vi.fn>).mockClear();

      controller.update(16);

      expect(enemy.setState).toHaveBeenCalledWith("idle");
    });

    it("should reactivate patrol controller on arrival", () => {
      const enemy = createMockEnemy(501, 600);
      const controller = new ReturnController(enemy, 500, 600, mockPatrolController);
      controller.handleDetectionEvent("PlayerLost");

      controller.update(16);

      expect(mockPatrolController.activate).toHaveBeenCalledTimes(1);
    });

    it("should apply configured return speed", () => {
      // Custom speed of 90px/s, enemy at (100, 200), spawn at (500, 200)
      const enemy = createMockEnemy(100, 200);
      const controller = new ReturnController(enemy, 500, 200, mockPatrolController, 90);
      controller.handleDetectionEvent("PlayerLost");

      controller.update(1000); // 1 second

      // Expected: moved 90 pixels to the right
      const calls = (enemy.setPosition as ReturnType<typeof vi.fn>).mock.calls;
      expect(calls[0][0]).toBeCloseTo(190, 1); // 100 + 90
      expect(calls[0][1]).toBeCloseTo(200, 1);
    });

    it("should update facing direction while moving", () => {
      // Enemy at (100, 200), spawn at (500, 200) — moving right
      const enemy = createMockEnemy(100, 200);
      const controller = new ReturnController(enemy, 500, 200, mockPatrolController);
      controller.handleDetectionEvent("PlayerLost");

      controller.update(16);

      expect(enemy.setDirection).toHaveBeenCalledWith("right");
    });

    it("should face left when moving left", () => {
      // Enemy at (500, 200), spawn at (100, 200) — moving left
      const enemy = createMockEnemy(500, 200);
      const controller = new ReturnController(enemy, 100, 200, mockPatrolController);
      controller.handleDetectionEvent("PlayerLost");

      controller.update(16);

      expect(enemy.setDirection).toHaveBeenCalledWith("left");
    });

    it("should face down when moving down", () => {
      // Enemy at (200, 100), spawn at (200, 500) — moving down
      const enemy = createMockEnemy(200, 100);
      const controller = new ReturnController(enemy, 200, 500, mockPatrolController);
      controller.handleDetectionEvent("PlayerLost");

      controller.update(16);

      expect(enemy.setDirection).toHaveBeenCalledWith("down");
    });

    it("should face up when moving up", () => {
      // Enemy at (200, 500), spawn at (200, 100) — moving up
      const enemy = createMockEnemy(200, 500);
      const controller = new ReturnController(enemy, 200, 100, mockPatrolController);
      controller.handleDetectionEvent("PlayerLost");

      controller.update(16);

      expect(enemy.setDirection).toHaveBeenCalledWith("up");
    });

    it("should not move after return is cancelled", () => {
      const controller = new ReturnController(mockEnemy, spawnX, spawnY, mockPatrolController);
      controller.handleDetectionEvent("PlayerLost");
      controller.handleDetectionEvent("PlayerDetected"); // cancel

      // Clear any calls from start/cancel
      (mockEnemy.setPosition as ReturnType<typeof vi.fn>).mockClear();

      controller.update(16);

      expect(mockEnemy.setPosition).not.toHaveBeenCalled();
    });

    it("should not reactivate patrol if return is cancelled before arrival", () => {
      const controller = new ReturnController(mockEnemy, spawnX, spawnY, mockPatrolController);
      controller.handleDetectionEvent("PlayerLost");
      controller.handleDetectionEvent("PlayerDetected"); // cancel

      controller.update(16);

      expect(mockPatrolController.activate).not.toHaveBeenCalled();
    });
  });

  describe("Multiple Controllers Independence", () => {
    it("should allow independent return controllers for different enemies", () => {
      const enemy1 = createMockEnemy(100, 200);
      const enemy2 = createMockEnemy(300, 400);
      const patrol1 = createMockPatrolController();
      const patrol2 = createMockPatrolController();

      const controller1 = new ReturnController(enemy1, 500, 600, patrol1);
      const controller2 = new ReturnController(enemy2, 700, 800, patrol2);

      controller1.handleDetectionEvent("PlayerLost");

      expect(controller1.getReturnState()).toBe("Returning");
      expect(controller2.getReturnState()).toBe("Inactive");
    });

    it("should allow independent state transitions without affecting siblings", () => {
      const enemy1 = createMockEnemy(100, 200);
      const enemy2 = createMockEnemy(300, 400);
      const patrol1 = createMockPatrolController();
      const patrol2 = createMockPatrolController();

      const controller1 = new ReturnController(enemy1, 500, 600, patrol1);
      const controller2 = new ReturnController(enemy2, 700, 800, patrol2);

      controller1.handleDetectionEvent("PlayerLost");
      controller2.handleDetectionEvent("PlayerLost");

      expect(controller1.getReturnState()).toBe("Returning");
      expect(controller2.getReturnState()).toBe("Returning");

      // Each controller targets its own spawn position
      expect(controller1.getReturnTarget().targetX).toBe(500);
      expect(controller2.getReturnTarget().targetX).toBe(700);
    });
  });

  describe("Spawn Position Preservation (Task 3)", () => {
    it("should preserve the spawn position as immutable return target", () => {
      const controller = new ReturnController(mockEnemy, spawnX, spawnY, mockPatrolController);

      // Even after starting return, target should remain the same
      controller.handleDetectionEvent("PlayerLost");

      const target = controller.getReturnTarget();
      expect(target.targetX).toBe(spawnX);
      expect(target.targetY).toBe(spawnY);
    });

    it("should not change the return target regardless of enemy movement", () => {
      const controller = new ReturnController(mockEnemy, spawnX, spawnY, mockPatrolController);

      // Simulate enemy moving to different positions via update
      controller.handleDetectionEvent("PlayerLost");
      controller.update(16);

      const target = controller.getReturnTarget();
      expect(target.targetX).toBe(spawnX);
      expect(target.targetY).toBe(spawnY);
    });

    it("should expose spawn position via getReturnTarget", () => {
      const controller = new ReturnController(mockEnemy, 123, 456, mockPatrolController);

      const target = controller.getReturnTarget();
      expect(target.targetX).toBe(123);
      expect(target.targetY).toBe(456);
    });

    it("should validate that every enemy has a valid return target at construction", () => {
      // Valid spawn position
      const validController = new ReturnController(mockEnemy, 100, 200, mockPatrolController);
      const validTarget = validController.getReturnTarget();
      expect(Number.isFinite(validTarget.targetX)).toBe(true);
      expect(Number.isFinite(validTarget.targetY)).toBe(true);

      // Invalid spawn position — stored as NaN
      const invalidController = new ReturnController(mockEnemy, NaN, NaN, mockPatrolController);
      const invalidTarget = invalidController.getReturnTarget();
      expect(Number.isNaN(invalidTarget.targetX)).toBe(true);
      expect(Number.isNaN(invalidTarget.targetY)).toBe(true);
    });

    it("should keep spawn position readonly (interface enforces immutability)", () => {
      const controller = new ReturnController(mockEnemy, spawnX, spawnY, mockPatrolController);

      const target = controller.getReturnTarget();
      // TypeScript readonly enforcement: target.targetX = 999 would be a compile error
      // Runtime verification: the target object always returns the original values
      expect(target.targetX).toBe(spawnX);
      expect(target.targetY).toBe(spawnY);
    });
  });
});
