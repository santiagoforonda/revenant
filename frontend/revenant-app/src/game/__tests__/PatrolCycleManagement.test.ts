import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  PatrolController,
  IDLE_DURATION_MIN,
  IDLE_DURATION_MAX,
  PATROL_SPEED,
  ARRIVAL_THRESHOLD,
} from "@/game/systems/PatrolController";
import type { Enemy } from "@/game/entities/characters/Enemy";

/**
 * Unit tests for Patrol Cycle Management (Task 7).
 *
 * Validates:
 * - Requirement 3.3: When idle period expires, begin a new patrol cycle.
 * - Requirement 3.4: If patrol temporarily suspended, enemy remains idle.
 * - Requirement 8.3: If movement cannot be completed, patrol cycle restarts after idle period.
 *
 * Tests cover:
 * - Idle delay between patrol movements.
 * - Idle timer counting with delta time.
 * - New patrol cycle starts after idle period expires.
 * - Patrol repeats continuously.
 * - Graceful recovery from interrupted patrol cycles.
 * - Random idle durations within configured range.
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

describe("PatrolController - Patrol Cycle Management (Task 7)", () => {
  let mockEnemy: Enemy;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEnemy = createMockEnemy(100, 200);
  });

  describe("Idle Delay Between Patrol Movements", () => {
    it("should NOT immediately pick a new destination after arriving", () => {
      const controller = new PatrolController(mockEnemy, 100, 200);

      // Single frame update with 16ms delta — should NOT trigger walking
      controller.update(16);

      expect(controller.getPatrolState()).toBe("idle");
      expect(controller.getCurrentDestination()).toBeNull();
    });

    it("should remain idle when timer has not reached duration", () => {
      const controller = new PatrolController(mockEnemy, 100, 200);
      const duration = controller.getIdleDuration();

      // Update with less time than required
      controller.update(duration - 100);

      expect(controller.getPatrolState()).toBe("idle");
      expect(controller.getCurrentDestination()).toBeNull();
    });

    it("should start walking only after idle duration has elapsed", () => {
      const controller = new PatrolController(mockEnemy, 100, 200);
      const duration = controller.getIdleDuration();

      // Update with exactly enough time to trigger
      controller.update(duration);

      // Should have transitioned to walking (destination generated)
      expect(controller.getPatrolState()).toBe("walking");
      expect(controller.getCurrentDestination()).not.toBeNull();
    });
  });

  describe("Idle Timer Counting", () => {
    it("should count up the idle timer with delta time", () => {
      const controller = new PatrolController(mockEnemy, 100, 200);

      controller.update(100);
      expect(controller.getIdleTimer()).toBe(100);

      controller.update(200);
      expect(controller.getIdleTimer()).toBe(300);

      controller.update(50);
      expect(controller.getIdleTimer()).toBe(350);
    });

    it("should accumulate delta over multiple frames", () => {
      const controller = new PatrolController(mockEnemy, 100, 200);
      const duration = controller.getIdleDuration();

      // Simulate many small frames that don't individually exceed the duration
      const frameTime = 16;
      const framesBeforeExpiry = Math.ceil(duration / frameTime) - 2;

      for (let i = 0; i < framesBeforeExpiry; i++) {
        controller.update(frameTime);
      }

      // Should still be idle (not enough time accumulated)
      expect(controller.getPatrolState()).toBe("idle");

      // Now push the accumulated timer past the duration
      const remaining = duration - controller.getIdleTimer();
      controller.update(remaining + 1);
      expect(controller.getPatrolState()).toBe("walking");
    });

    it("should not increment idle timer when in walking state", () => {
      const controller = new PatrolController(mockEnemy, 100, 200);
      const duration = controller.getIdleDuration();

      // Trigger walking
      controller.update(duration);
      expect(controller.getPatrolState()).toBe("walking");

      // The idle timer should not keep incrementing while walking
      const timerAfterWalkStart = controller.getIdleTimer();
      controller.update(16);
      // Timer stays the same because the update goes into moveTowardDestination
      expect(controller.getIdleTimer()).toBe(timerAfterWalkStart);
    });
  });

  describe("New Patrol Cycle After Idle Period", () => {
    it("should generate a new idle duration after arriving at destination", () => {
      const controller = new PatrolController(mockEnemy, 100, 200);
      const firstDuration = controller.getIdleDuration();

      // Trigger walking
      controller.update(firstDuration);
      expect(controller.getPatrolState()).toBe("walking");

      // Force arrival by moving enemy close to destination
      const dest = controller.getCurrentDestination()!;
      (mockEnemy.getX as ReturnType<typeof vi.fn>).mockReturnValue(dest.x);
      (mockEnemy.getY as ReturnType<typeof vi.fn>).mockReturnValue(dest.y);

      // Next update should detect arrival and reset idle timer
      controller.update(16);
      expect(controller.getPatrolState()).toBe("idle");
      expect(controller.getIdleTimer()).toBe(0);
      // A new duration was generated (may or may not differ from first due to randomness)
      expect(controller.getIdleDuration()).toBeGreaterThanOrEqual(IDLE_DURATION_MIN);
      expect(controller.getIdleDuration()).toBeLessThanOrEqual(IDLE_DURATION_MAX);
    });

    it("should reset timer to 0 when transitioning to idle", () => {
      const controller = new PatrolController(mockEnemy, 100, 200);
      const duration = controller.getIdleDuration();

      // Trigger walking
      controller.update(duration);
      expect(controller.getPatrolState()).toBe("walking");

      // Force arrival
      const dest = controller.getCurrentDestination()!;
      (mockEnemy.getX as ReturnType<typeof vi.fn>).mockReturnValue(dest.x);
      (mockEnemy.getY as ReturnType<typeof vi.fn>).mockReturnValue(dest.y);

      controller.update(16);
      expect(controller.getIdleTimer()).toBe(0);
    });
  });

  describe("Continuous Patrol Cycle", () => {
    it("should complete a full patrol cycle (idle → walk → idle → walk)", () => {
      const controller = new PatrolController(mockEnemy, 100, 200);

      // Phase 1: Wait for idle to expire
      const duration1 = controller.getIdleDuration();
      controller.update(duration1);
      expect(controller.getPatrolState()).toBe("walking");

      // Phase 2: Arrive at destination
      const dest1 = controller.getCurrentDestination()!;
      (mockEnemy.getX as ReturnType<typeof vi.fn>).mockReturnValue(dest1.x);
      (mockEnemy.getY as ReturnType<typeof vi.fn>).mockReturnValue(dest1.y);
      controller.update(16);
      expect(controller.getPatrolState()).toBe("idle");

      // Phase 3: Wait for second idle to expire
      const duration2 = controller.getIdleDuration();
      controller.update(duration2);
      expect(controller.getPatrolState()).toBe("walking");
      expect(controller.getCurrentDestination()).not.toBeNull();
    });

    it("should work over many cycles without error", () => {
      const controller = new PatrolController(mockEnemy, 100, 200);

      for (let cycle = 0; cycle < 10; cycle++) {
        // Wait for idle
        const duration = controller.getIdleDuration();
        controller.update(duration);
        expect(controller.getPatrolState()).toBe("walking");

        // Force arrival
        const dest = controller.getCurrentDestination()!;
        (mockEnemy.getX as ReturnType<typeof vi.fn>).mockReturnValue(dest.x);
        (mockEnemy.getY as ReturnType<typeof vi.fn>).mockReturnValue(dest.y);
        controller.update(16);
        expect(controller.getPatrolState()).toBe("idle");
      }
    });
  });

  describe("Interrupted Patrol Recovery", () => {
    it("should reset idle timer when reactivated after deactivation during walk", () => {
      const controller = new PatrolController(mockEnemy, 100, 200);
      const duration = controller.getIdleDuration();

      // Start walking
      controller.update(duration);
      expect(controller.getPatrolState()).toBe("walking");

      // Interrupt mid-walk
      controller.deactivate();
      expect(controller.isActive()).toBe(false);

      // Reactivate — should reset to idle with new timer
      controller.activate();
      expect(controller.isActive()).toBe(true);
      expect(controller.getPatrolState()).toBe("idle");
      expect(controller.getIdleTimer()).toBe(0);
      expect(controller.getCurrentDestination()).toBeNull();
    });

    it("should resume patrol cycle after interruption recovery", () => {
      const controller = new PatrolController(mockEnemy, 100, 200);
      const duration = controller.getIdleDuration();

      // Start walking
      controller.update(duration);
      expect(controller.getPatrolState()).toBe("walking");

      // Interrupt and reactivate
      controller.deactivate();
      controller.activate();

      // Should be able to start a new patrol cycle after new idle period
      const newDuration = controller.getIdleDuration();
      controller.update(newDuration);
      expect(controller.getPatrolState()).toBe("walking");
      expect(controller.getCurrentDestination()).not.toBeNull();
    });

    it("should remain idle when deactivated (Requirement 3.4)", () => {
      const controller = new PatrolController(mockEnemy, 100, 200);

      controller.deactivate();

      // Even with large delta, should not change state
      controller.update(10000);
      expect(controller.getPatrolState()).toBe("idle");
      expect(controller.getCurrentDestination()).toBeNull();
    });

    it("should reset idle timer when destination generation fails", () => {
      const controller = new PatrolController(mockEnemy, 100, 200, {
        radius: 0, // Force generation failure with 0 radius
      });

      const duration = controller.getIdleDuration();
      controller.update(duration);

      // Generation should fail, and timer should reset
      expect(controller.getPatrolState()).toBe("idle");
      expect(controller.getIdleTimer()).toBe(0);
    });
  });

  describe("Random Idle Duration Range", () => {
    it("should generate idle duration within configured range", () => {
      // Run multiple times to check randomness stays in range
      for (let i = 0; i < 50; i++) {
        const enemy = createMockEnemy(100, 200);
        const controller = new PatrolController(enemy, 100, 200);
        const duration = controller.getIdleDuration();

        expect(duration).toBeGreaterThanOrEqual(IDLE_DURATION_MIN);
        expect(duration).toBeLessThanOrEqual(IDLE_DURATION_MAX);
      }
    });

    it("should export correct constant values", () => {
      expect(IDLE_DURATION_MIN).toBe(1000);
      expect(IDLE_DURATION_MAX).toBe(3000);
    });
  });
});
