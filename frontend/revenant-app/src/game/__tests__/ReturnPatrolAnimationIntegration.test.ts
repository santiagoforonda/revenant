import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ReturnController,
  DEFAULT_RETURN_SPEED,
  RETURN_ARRIVAL_THRESHOLD,
} from "@/game/systems/ReturnController";
import type { Enemy } from "@/game/entities/characters/Enemy";
import type { PatrolController } from "@/game/systems/PatrolController";

/**
 * Integration tests for ReturnController ↔ PatrolController ↔ Animation.
 *
 * Validates Task 6 — Integrate with Enemy Patrol and Animation:
 * - Patrol resumes after enemy arrives at spawn (patrolController.activate() is called).
 * - Enemy is set to "walking" state when return begins.
 * - Enemy is set to "idle" state when return completes (arrival at spawn).
 * - Direction updates during return use the same setDirection mechanism.
 * - No direct Phaser animation calls are made by ReturnController.
 * - After patrol resumes, patrol controller is active and functions normally.
 * - ReturnController only uses enemy.setState(), enemy.setDirection(), enemy.setPosition().
 * - Complete Chase → Return → Patrol cycle.
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
 * Creates a mock Enemy entity that tracks ALL method calls for verification.
 * This allows us to assert that ReturnController never calls unexpected methods.
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
 * Creates a mock PatrolController that tracks activation and state.
 */
function createMockPatrolController(): PatrolController {
  let active = false;

  return {
    activate: vi.fn(() => {
      active = true;
    }),
    deactivate: vi.fn(() => {
      active = false;
    }),
    isActive: vi.fn(() => active),
    getOrigin: vi.fn().mockReturnValue({ x: 0, y: 0 }),
    getPatrolState: vi.fn().mockReturnValue("idle"),
    getEnemy: vi.fn(),
    update: vi.fn(),
  } as unknown as PatrolController;
}

describe("ReturnController — Patrol & Animation Integration (Task 6)", () => {
  let mockEnemy: Enemy;
  let mockPatrolController: PatrolController;
  const spawnX = 500;
  const spawnY = 600;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEnemy = createMockEnemy(100, 200);
    mockPatrolController = createMockPatrolController();
  });

  describe("Patrol Resume After Return Completes", () => {
    it("should call patrolController.activate() when enemy arrives at spawn", () => {
      // Place enemy within arrival threshold of spawn
      const enemy = createMockEnemy(501, 600);
      const controller = new ReturnController(enemy, spawnX, spawnY, mockPatrolController);
      controller.handleDetectionEvent("PlayerLost");

      controller.update(16);

      expect(mockPatrolController.activate).toHaveBeenCalledTimes(1);
    });

    it("should set patrol controller to active after return completes", () => {
      const enemy = createMockEnemy(501, 600);
      const controller = new ReturnController(enemy, spawnX, spawnY, mockPatrolController);
      controller.handleDetectionEvent("PlayerLost");

      controller.update(16);

      expect(mockPatrolController.isActive()).toBe(true);
    });

    it("should not activate patrol while return is still in progress", () => {
      // Enemy is far from spawn — return won't complete in one frame
      const controller = new ReturnController(mockEnemy, spawnX, spawnY, mockPatrolController);
      controller.handleDetectionEvent("PlayerLost");

      controller.update(16);

      expect(mockPatrolController.activate).not.toHaveBeenCalled();
    });

    it("should allow patrol controller to function normally after activation", () => {
      const enemy = createMockEnemy(501, 600);
      const controller = new ReturnController(enemy, spawnX, spawnY, mockPatrolController);
      controller.handleDetectionEvent("PlayerLost");

      controller.update(16);

      // Patrol controller was activated — verify it's active and can update
      expect(mockPatrolController.isActive()).toBe(true);
      mockPatrolController.update(16);
      expect(mockPatrolController.update).toHaveBeenCalledWith(16);
    });
  });

  describe("Walking State While Returning", () => {
    it("should set enemy to walking state when return begins", () => {
      const controller = new ReturnController(mockEnemy, spawnX, spawnY, mockPatrolController);

      controller.handleDetectionEvent("PlayerLost");

      expect(mockEnemy.setState).toHaveBeenCalledWith("walking");
    });

    it("should set walking state exactly once on return start", () => {
      const controller = new ReturnController(mockEnemy, spawnX, spawnY, mockPatrolController);

      controller.handleDetectionEvent("PlayerLost");

      // Only one setState call for "walking"
      const setStateCalls = (mockEnemy.setState as ReturnType<typeof vi.fn>).mock.calls;
      expect(setStateCalls).toHaveLength(1);
      expect(setStateCalls[0][0]).toBe("walking");
    });

    it("should remain in walking state during movement updates", () => {
      const controller = new ReturnController(mockEnemy, spawnX, spawnY, mockPatrolController);
      controller.handleDetectionEvent("PlayerLost");

      // Clear initial setState call
      (mockEnemy.setState as ReturnType<typeof vi.fn>).mockClear();

      // Multiple update frames — should not redundantly set walking state
      controller.update(16);
      controller.update(16);
      controller.update(16);

      // setState should NOT be called again during normal movement
      // (only setDirection and setPosition are called during movement)
      const setStateCalls = (mockEnemy.setState as ReturnType<typeof vi.fn>).mock.calls;
      const walkingCalls = setStateCalls.filter((call) => call[0] === "walking");
      expect(walkingCalls).toHaveLength(0);
    });
  });

  describe("Idle State Upon Arrival", () => {
    it("should set enemy to idle state when return completes", () => {
      const enemy = createMockEnemy(501, 600);
      const controller = new ReturnController(enemy, spawnX, spawnY, mockPatrolController);
      controller.handleDetectionEvent("PlayerLost");

      // Clear the "walking" setState call from startReturn
      (enemy.setState as ReturnType<typeof vi.fn>).mockClear();

      controller.update(16);

      expect(enemy.setState).toHaveBeenCalledWith("idle");
    });

    it("should set idle state before activating patrol", () => {
      const enemy = createMockEnemy(501, 600);
      const callOrder: string[] = [];

      (enemy.setState as ReturnType<typeof vi.fn>).mockImplementation((state: string) => {
        callOrder.push(`setState:${state}`);
      });
      (mockPatrolController.activate as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callOrder.push("patrol:activate");
      });

      const controller = new ReturnController(enemy, spawnX, spawnY, mockPatrolController);
      controller.handleDetectionEvent("PlayerLost");

      // Reset to capture only the completion calls
      callOrder.length = 0;

      controller.update(16);

      // idle should be set before patrol activation
      const idleIndex = callOrder.indexOf("setState:idle");
      const activateIndex = callOrder.indexOf("patrol:activate");
      expect(idleIndex).toBeGreaterThanOrEqual(0);
      expect(activateIndex).toBeGreaterThanOrEqual(0);
      expect(idleIndex).toBeLessThan(activateIndex);
    });
  });

  describe("Direction Updates via setDirection", () => {
    it("should use enemy.setDirection() for facing direction updates", () => {
      const controller = new ReturnController(mockEnemy, spawnX, spawnY, mockPatrolController);
      controller.handleDetectionEvent("PlayerLost");

      controller.update(16);

      expect(mockEnemy.setDirection).toHaveBeenCalled();
    });

    it("should update direction before position during movement", () => {
      const callOrder: string[] = [];

      (mockEnemy.setDirection as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callOrder.push("setDirection");
      });
      (mockEnemy.setPosition as ReturnType<typeof vi.fn>).mockImplementation((x: number, y: number) => {
        callOrder.push("setPosition");
      });

      const controller = new ReturnController(mockEnemy, spawnX, spawnY, mockPatrolController);
      controller.handleDetectionEvent("PlayerLost");
      callOrder.length = 0;

      controller.update(16);

      const dirIndex = callOrder.indexOf("setDirection");
      const posIndex = callOrder.indexOf("setPosition");
      expect(dirIndex).toBeGreaterThanOrEqual(0);
      expect(posIndex).toBeGreaterThanOrEqual(0);
      expect(dirIndex).toBeLessThan(posIndex);
    });

    it("should resolve direction correctly for horizontal movement", () => {
      // Enemy at (100, 600), spawn at (500, 600) — moving right
      const enemy = createMockEnemy(100, 600);
      const controller = new ReturnController(enemy, spawnX, spawnY, mockPatrolController);
      controller.handleDetectionEvent("PlayerLost");

      controller.update(16);

      expect(enemy.setDirection).toHaveBeenCalledWith("right");
    });

    it("should resolve direction correctly for vertical movement", () => {
      // Enemy at (500, 200), spawn at (500, 600) — moving down
      const enemy = createMockEnemy(500, 200);
      const controller = new ReturnController(enemy, spawnX, spawnY, mockPatrolController);
      controller.handleDetectionEvent("PlayerLost");

      controller.update(16);

      expect(enemy.setDirection).toHaveBeenCalledWith("down");
    });
  });

  describe("No Direct Phaser Animation Calls", () => {
    it("should never call getSprite() during the return process", () => {
      const controller = new ReturnController(mockEnemy, spawnX, spawnY, mockPatrolController);
      controller.handleDetectionEvent("PlayerLost");

      // Simulate several frames of return movement
      for (let i = 0; i < 10; i++) {
        controller.update(16);
      }

      expect(mockEnemy.getSprite).not.toHaveBeenCalled();
    });

    it("should only use setState, setDirection, setPosition, getX, getY on enemy", () => {
      const enemy = createMockEnemy(100, 200);
      const controller = new ReturnController(enemy, spawnX, spawnY, mockPatrolController);
      controller.handleDetectionEvent("PlayerLost");

      // Simulate return movement
      for (let i = 0; i < 5; i++) {
        controller.update(16);
      }

      // These are the ONLY methods ReturnController should call on Enemy
      expect(enemy.setState).toHaveBeenCalled();
      expect(enemy.setDirection).toHaveBeenCalled();
      expect(enemy.setPosition).toHaveBeenCalled();
      expect(enemy.getX).toHaveBeenCalled();
      expect(enemy.getY).toHaveBeenCalled();

      // These should NEVER be called by ReturnController
      expect(enemy.getSprite).not.toHaveBeenCalled();
      expect(enemy.getStats).not.toHaveBeenCalled();
      expect(enemy.getName).not.toHaveBeenCalled();
      expect(enemy.getEnemyType).not.toHaveBeenCalled();
      expect(enemy.getCurrentAnimationKey).not.toHaveBeenCalled();
      expect(enemy.setStateAndDirection).not.toHaveBeenCalled();
    });

    it("should delegate animation entirely through setState and setDirection", () => {
      // This verifies the architectural constraint: ReturnController → Enemy.setState/setDirection
      // → EnemySpriteComposer → EnemyAnimationController → Phaser
      const enemy = createMockEnemy(501, 600);
      const controller = new ReturnController(enemy, spawnX, spawnY, mockPatrolController);
      controller.handleDetectionEvent("PlayerLost");

      controller.update(16); // arrives

      // Full lifecycle: walking on start, idle on completion
      const setStateCalls = (enemy.setState as ReturnType<typeof vi.fn>).mock.calls;
      expect(setStateCalls[0][0]).toBe("walking");
      expect(setStateCalls[1][0]).toBe("idle");

      // No sprite manipulation
      expect(enemy.getSprite).not.toHaveBeenCalled();
    });
  });

  describe("Complete Chase → Return → Patrol Cycle", () => {
    it("should transition through the full cycle: chase ends → return → patrol", () => {
      // Setup: enemy is far from spawn (simulating post-chase position)
      const enemy = createMockEnemy(100, 600);
      const controller = new ReturnController(enemy, spawnX, spawnY, mockPatrolController);

      // 1. Chase ends (PlayerLost event)
      controller.handleDetectionEvent("PlayerLost");
      expect(controller.getReturnState()).toBe("Returning");
      expect(enemy.setState).toHaveBeenCalledWith("walking");

      // 2. Enemy moves toward spawn over multiple frames
      // At 45px/s, 400px horizontal distance → ~8.9 seconds
      // Simulate frames at 16ms intervals until arrival
      let frames = 0;
      const maxFrames = 1000; // Safety limit
      while (controller.getReturnState() === "Returning" && frames < maxFrames) {
        controller.update(16);
        frames++;
      }

      // 3. Return completed — verify end state
      expect(controller.getReturnState()).toBe("Inactive");
      expect(enemy.setState).toHaveBeenCalledWith("idle");
      expect(mockPatrolController.activate).toHaveBeenCalledTimes(1);
      expect(mockPatrolController.isActive()).toBe(true);
    });

    it("should handle chase interruption during return correctly", () => {
      const controller = new ReturnController(mockEnemy, spawnX, spawnY, mockPatrolController);

      // Start return
      controller.handleDetectionEvent("PlayerLost");
      expect(controller.getReturnState()).toBe("Returning");

      // Move a few frames
      controller.update(16);
      controller.update(16);

      // Player detected again — chase interrupts return
      controller.handleDetectionEvent("PlayerDetected");
      expect(controller.getReturnState()).toBe("Inactive");

      // Patrol should NOT have been activated (return was interrupted)
      expect(mockPatrolController.activate).not.toHaveBeenCalled();
    });

    it("should allow re-entry into return after chase interruption", () => {
      const controller = new ReturnController(mockEnemy, spawnX, spawnY, mockPatrolController);

      // First return attempt
      controller.handleDetectionEvent("PlayerLost");
      controller.update(16);

      // Chase interrupts
      controller.handleDetectionEvent("PlayerDetected");
      expect(controller.getReturnState()).toBe("Inactive");

      // Clear mocks for clean verification
      (mockEnemy.setState as ReturnType<typeof vi.fn>).mockClear();

      // Second return attempt
      controller.handleDetectionEvent("PlayerLost");
      expect(controller.getReturnState()).toBe("Returning");
      expect(mockEnemy.setState).toHaveBeenCalledWith("walking");
    });

    it("should complete the full cycle with position snapping at spawn", () => {
      // Enemy very close to spawn — will arrive in one frame
      const enemy = createMockEnemy(501, 601);
      const controller = new ReturnController(enemy, spawnX, spawnY, mockPatrolController);

      controller.handleDetectionEvent("PlayerLost");
      controller.update(16);

      // Should be snapped to exact spawn position
      const positionCalls = (enemy.setPosition as ReturnType<typeof vi.fn>).mock.calls;
      const lastCall = positionCalls[positionCalls.length - 1];
      expect(lastCall[0]).toBe(spawnX);
      expect(lastCall[1]).toBe(spawnY);

      // Full cycle complete
      expect(controller.getReturnState()).toBe("Inactive");
      expect(mockPatrolController.isActive()).toBe(true);
    });

    it("should handle multiple chase-return cycles for the same enemy", () => {
      // Place enemy close enough to arrive quickly
      const enemy = createMockEnemy(501, 600);
      const controller = new ReturnController(enemy, spawnX, spawnY, mockPatrolController);

      // First cycle
      controller.handleDetectionEvent("PlayerLost");
      controller.update(16); // arrives
      expect(mockPatrolController.activate).toHaveBeenCalledTimes(1);

      // Simulate patrol being deactivated for chase
      (mockPatrolController.activate as ReturnType<typeof vi.fn>).mockClear();

      // Second cycle (enemy hasn't moved far since it just arrived at spawn)
      controller.handleDetectionEvent("PlayerLost");
      controller.update(16); // arrives immediately (already at spawn)
      expect(mockPatrolController.activate).toHaveBeenCalledTimes(1);
    });
  });

  describe("Animation Infrastructure Reuse", () => {
    it("should use the same setState mechanism used by PatrolController", () => {
      // The key verification: ReturnController calls enemy.setState("walking")
      // and enemy.setState("idle"), which are the same methods used by
      // PatrolController — demonstrating animation infrastructure reuse.
      const enemy = createMockEnemy(501, 600);
      const controller = new ReturnController(enemy, spawnX, spawnY, mockPatrolController);

      controller.handleDetectionEvent("PlayerLost");
      controller.update(16);

      // Verify setState was called with the standard animation states
      const calls = (enemy.setState as ReturnType<typeof vi.fn>).mock.calls;
      const states = calls.map((c) => c[0]);
      expect(states).toContain("walking");
      expect(states).toContain("idle");
    });

    it("should use the same setDirection mechanism used by PatrolController", () => {
      // ReturnController calls enemy.setDirection() with standard EnemyDirection values
      const enemy = createMockEnemy(100, 600);
      const controller = new ReturnController(enemy, spawnX, spawnY, mockPatrolController);
      controller.handleDetectionEvent("PlayerLost");

      controller.update(16);

      // Verify setDirection was called with a valid EnemyDirection
      const dirCalls = (enemy.setDirection as ReturnType<typeof vi.fn>).mock.calls;
      expect(dirCalls.length).toBeGreaterThan(0);
      const validDirections = ["up", "down", "left", "right"];
      expect(validDirections).toContain(dirCalls[0][0]);
    });

    it("should never duplicate animation logic (no play/stop/resume calls)", () => {
      const enemy = createMockEnemy(100, 200);

      // Add spies for methods that would indicate direct Phaser animation usage
      const unexpectedMethods = [
        "play",
        "stop",
        "resume",
        "anims",
        "chain",
        "playReverse",
      ];

      // Attach dummy methods to track if they're ever called
      unexpectedMethods.forEach((method) => {
        (enemy as Record<string, unknown>)[method] = vi.fn();
      });

      const controller = new ReturnController(enemy, spawnX, spawnY, mockPatrolController);
      controller.handleDetectionEvent("PlayerLost");

      for (let i = 0; i < 10; i++) {
        controller.update(16);
      }

      // None of the Phaser-specific animation methods should have been called
      unexpectedMethods.forEach((method) => {
        expect((enemy as Record<string, ReturnType<typeof vi.fn>>)[method]).not.toHaveBeenCalled();
      });
    });
  });
});
