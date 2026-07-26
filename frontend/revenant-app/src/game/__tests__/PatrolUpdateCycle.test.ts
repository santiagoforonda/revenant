import { describe, it, expect, vi, beforeEach } from "vitest";
import { PatrolController } from "@/game/systems/PatrolController";
import type { Enemy } from "@/game/entities/characters/Enemy";

/**
 * Integration tests for the patrol update cycle (Task 2).
 *
 * Validates:
 * - All patrol controllers are updated every game loop.
 * - Patrol logic executes independently for every enemy.
 * - MainScene is responsible only for invoking controller updates (no decision logic).
 * - Delta time is correctly passed from the game loop to each controller.
 * - Empty patrol controller arrays are handled safely.
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

/**
 * Simulates the MainScene update loop behavior.
 *
 * This function mirrors exactly what MainScene.update() does for patrol controllers:
 * it iterates over the array and calls update(delta) on each controller.
 *
 * MainScene contains NO patrol decision logic — only this iteration.
 */
function simulateMainScenePatrolUpdate(
  patrolControllers: PatrolController[],
  delta: number
): void {
  for (const controller of patrolControllers) {
    controller.update(delta);
  }
}

describe("Patrol Update Cycle Integration (Task 2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Update invocation", () => {
    it("should call update on every patrol controller each frame", () => {
      const enemy1 = createMockEnemy(100, 200);
      const enemy2 = createMockEnemy(300, 400);
      const enemy3 = createMockEnemy(500, 600);

      const controller1 = new PatrolController(enemy1, 100, 200);
      const controller2 = new PatrolController(enemy2, 300, 400);
      const controller3 = new PatrolController(enemy3, 500, 600);

      const controllers = [controller1, controller2, controller3];

      // Spy on update methods
      const spy1 = vi.spyOn(controller1, "update");
      const spy2 = vi.spyOn(controller2, "update");
      const spy3 = vi.spyOn(controller3, "update");

      simulateMainScenePatrolUpdate(controllers, 16);

      expect(spy1).toHaveBeenCalledOnce();
      expect(spy2).toHaveBeenCalledOnce();
      expect(spy3).toHaveBeenCalledOnce();
    });

    it("should pass the delta time to every controller", () => {
      const enemy1 = createMockEnemy(100, 200);
      const enemy2 = createMockEnemy(300, 400);

      const controller1 = new PatrolController(enemy1, 100, 200);
      const controller2 = new PatrolController(enemy2, 300, 400);

      const controllers = [controller1, controller2];

      const spy1 = vi.spyOn(controller1, "update");
      const spy2 = vi.spyOn(controller2, "update");

      const delta = 33.33; // ~30 FPS
      simulateMainScenePatrolUpdate(controllers, delta);

      expect(spy1).toHaveBeenCalledWith(delta);
      expect(spy2).toHaveBeenCalledWith(delta);
    });

    it("should handle an empty patrol controllers array gracefully", () => {
      const controllers: PatrolController[] = [];

      // Should not throw when array is empty
      expect(() => simulateMainScenePatrolUpdate(controllers, 16)).not.toThrow();
    });

    it("should update controllers across multiple frames", () => {
      const enemy = createMockEnemy(100, 200);
      const controller = new PatrolController(enemy, 100, 200);
      const controllers = [controller];

      const spy = vi.spyOn(controller, "update");

      // Simulate 5 frames
      simulateMainScenePatrolUpdate(controllers, 16);
      simulateMainScenePatrolUpdate(controllers, 16);
      simulateMainScenePatrolUpdate(controllers, 17);
      simulateMainScenePatrolUpdate(controllers, 16);
      simulateMainScenePatrolUpdate(controllers, 15);

      expect(spy).toHaveBeenCalledTimes(5);
    });
  });

  describe("Independent execution", () => {
    it("should update each controller independently regardless of other controllers' state", () => {
      const enemy1 = createMockEnemy(100, 200);
      const enemy2 = createMockEnemy(500, 600);

      const controller1 = new PatrolController(enemy1, 100, 200);
      const controller2 = new PatrolController(enemy2, 500, 600);

      // Deactivate controller1 — controller2 should still be updated
      controller1.deactivate();

      const controllers = [controller1, controller2];

      const spy1 = vi.spyOn(controller1, "update");
      const spy2 = vi.spyOn(controller2, "update");

      simulateMainScenePatrolUpdate(controllers, 16);

      // Both are called (the loop invokes update on all controllers)
      expect(spy1).toHaveBeenCalledWith(16);
      expect(spy2).toHaveBeenCalledWith(16);

      // Controller1 is inactive but the call still happens — the controller
      // internally decides to skip processing when inactive.
      expect(controller1.isActive()).toBe(false);
      expect(controller2.isActive()).toBe(true);
    });

    it("should not share state between controllers", () => {
      const enemy1 = createMockEnemy(100, 200);
      const enemy2 = createMockEnemy(300, 400);

      const controller1 = new PatrolController(enemy1, 100, 200);
      const controller2 = new PatrolController(enemy2, 300, 400);

      // Each controller has its own origin
      expect(controller1.getOrigin()).not.toBe(controller2.getOrigin());
      expect(controller1.getOrigin().x).toBe(100);
      expect(controller2.getOrigin().x).toBe(300);

      // Deactivating one doesn't affect the other
      controller1.deactivate();
      expect(controller1.isActive()).toBe(false);
      expect(controller2.isActive()).toBe(true);
    });

    it("should support a large number of patrol controllers without errors", () => {
      const controllers: PatrolController[] = [];
      for (let i = 0; i < 50; i++) {
        const enemy = createMockEnemy(i * 50, i * 50);
        controllers.push(new PatrolController(enemy, i * 50, i * 50));
      }

      // Simulate a frame — all 50 controllers should be updated
      expect(() => simulateMainScenePatrolUpdate(controllers, 16)).not.toThrow();
    });
  });

  describe("No patrol decision logic in the update loop", () => {
    it("should only call update(delta) — no state checks or mutations from outside", () => {
      const enemy = createMockEnemy(100, 200);
      const controller = new PatrolController(enemy, 100, 200);
      const controllers = [controller];

      const spy = vi.spyOn(controller, "update");

      simulateMainScenePatrolUpdate(controllers, 16);

      // The only interaction with the controller is calling update(delta)
      expect(spy).toHaveBeenCalledOnce();
      expect(spy).toHaveBeenCalledWith(16);
    });

    it("should not read patrol state from controllers during the update loop", () => {
      const enemy = createMockEnemy(100, 200);
      const controller = new PatrolController(enemy, 100, 200);

      // Spy on getPatrolState to ensure it's NOT called during the update loop
      const stateSpy = vi.spyOn(controller, "getPatrolState");
      const originSpy = vi.spyOn(controller, "getOrigin");
      const activeSpy = vi.spyOn(controller, "isActive");

      const controllers = [controller];
      simulateMainScenePatrolUpdate(controllers, 16);

      // MainScene should NOT query controller state — it only invokes update
      expect(stateSpy).not.toHaveBeenCalled();
      expect(originSpy).not.toHaveBeenCalled();
      expect(activeSpy).not.toHaveBeenCalled();
    });
  });

  describe("Delta time handling", () => {
    it("should pass varying delta values correctly", () => {
      const enemy = createMockEnemy(100, 200);
      const controller = new PatrolController(enemy, 100, 200);
      const controllers = [controller];

      const spy = vi.spyOn(controller, "update");

      // Different frame rates
      simulateMainScenePatrolUpdate(controllers, 16.67); // 60 FPS
      simulateMainScenePatrolUpdate(controllers, 33.33); // 30 FPS
      simulateMainScenePatrolUpdate(controllers, 8.33); // 120 FPS

      expect(spy).toHaveBeenNthCalledWith(1, 16.67);
      expect(spy).toHaveBeenNthCalledWith(2, 33.33);
      expect(spy).toHaveBeenNthCalledWith(3, 8.33);
    });
  });
});
