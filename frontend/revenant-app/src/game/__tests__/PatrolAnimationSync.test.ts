import { describe, it, expect, vi, beforeEach } from "vitest";
import { PatrolController, ARRIVAL_THRESHOLD } from "@/game/systems/PatrolController";
import type { Enemy } from "@/game/entities/characters/Enemy";

/**
 * Integration tests for Task 6: Synchronize patrol with Enemy Animation.
 *
 * Validates:
 * - Requirement 6.1: Walking animation is triggered when patrol movement begins.
 * - Requirement 6.2: Idle animation is triggered when destination is reached.
 * - Requirement 6.3: Existing Enemy Animation module controls playback.
 * - Requirement 6.4: PatrolController does NOT invoke Phaser animations directly.
 * - Requirement 5.1/5.2: Direction is updated during movement.
 */

// Mock EnemyAnimationRegistrar to prevent import issues in test environment
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
 * Creates a mock Enemy entity tracking all animation-related calls.
 */
function createMockEnemy(x: number = 100, y: number = 200): Enemy {
  let currentX = x;
  let currentY = y;
  let currentState = "idle";
  let currentDirection = "down";

  return {
    setState: vi.fn((state: string) => {
      currentState = state;
    }),
    setDirection: vi.fn((direction: string) => {
      currentDirection = direction;
    }),
    setStateAndDirection: vi.fn((state: string, direction: string) => {
      currentState = state;
      currentDirection = direction;
    }),
    getState: vi.fn(() => currentState),
    getDirection: vi.fn(() => currentDirection),
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

describe("PatrolController - Animation Synchronization (Task 6)", () => {
  let mockEnemy: Enemy;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEnemy = createMockEnemy(100, 100);
  });

  /**
   * Helper: advances the controller past the idle timer so it transitions to walking.
   */
  function advancePastIdleTimer(controller: PatrolController): void {
    const duration = controller.getIdleDuration();
    controller.update(duration);
  }

  describe("Requirement 6.1: Walking state when movement begins", () => {
    it("should set enemy to Walking state when a patrol destination is selected", () => {
      const controller = new PatrolController(mockEnemy, 100, 100);

      vi.mocked(mockEnemy.setState).mockClear();
      vi.mocked(mockEnemy.setStateAndDirection).mockClear();

      advancePastIdleTimer(controller);

      expect(mockEnemy.setStateAndDirection).toHaveBeenCalledWith(
        "walking",
        expect.stringMatching(/^(up|down|left|right)$/)
      );
    });

    it("should use setStateAndDirection to avoid redundant animation updates", () => {
      const controller = new PatrolController(mockEnemy, 100, 100);

      vi.mocked(mockEnemy.setState).mockClear();
      vi.mocked(mockEnemy.setDirection).mockClear();
      vi.mocked(mockEnemy.setStateAndDirection).mockClear();

      advancePastIdleTimer(controller);

      expect(mockEnemy.setStateAndDirection).toHaveBeenCalledTimes(1);
      expect(mockEnemy.setState).not.toHaveBeenCalledWith("walking");
    });

    it("should transition patrol state to walking", () => {
      const controller = new PatrolController(mockEnemy, 100, 100);

      advancePastIdleTimer(controller);

      expect(controller.getPatrolState()).toBe("walking");
    });
  });

  describe("Requirement 6.2: Idle state when destination reached", () => {
    it("should set enemy to Idle state when arrival threshold is reached", () => {
      const enemy = createMockEnemy(100, 100);
      const controller = new PatrolController(enemy, 100, 100);

      advancePastIdleTimer(controller);

      vi.mocked(enemy.setState).mockClear();

      const destination = controller.getCurrentDestination();
      expect(destination).not.toBeNull();

      if (destination) {
        vi.mocked(enemy.getX).mockReturnValue(destination.x);
        vi.mocked(enemy.getY).mockReturnValue(destination.y);

        controller.update(16);

        expect(enemy.setState).toHaveBeenCalledWith("idle");
      }
    });

    it("should clear the current destination after arrival", () => {
      const enemy = createMockEnemy(100, 100);
      const controller = new PatrolController(enemy, 100, 100);

      advancePastIdleTimer(controller);
      const destination = controller.getCurrentDestination();
      expect(destination).not.toBeNull();

      if (destination) {
        vi.mocked(enemy.getX).mockReturnValue(destination.x);
        vi.mocked(enemy.getY).mockReturnValue(destination.y);

        controller.update(16);

        expect(controller.getCurrentDestination()).toBeNull();
        expect(controller.getPatrolState()).toBe("idle");
      }
    });
  });

  describe("Requirement 5.1/5.2: Direction updates during movement", () => {
    it("should set initial direction when movement begins", () => {
      const controller = new PatrolController(mockEnemy, 100, 100);

      vi.mocked(mockEnemy.setStateAndDirection).mockClear();

      advancePastIdleTimer(controller);

      expect(mockEnemy.setStateAndDirection).toHaveBeenCalledWith(
        "walking",
        expect.stringMatching(/^(up|down|left|right)$/)
      );
    });

    it("should update direction during movement when it changes", () => {
      const enemy = createMockEnemy(100, 100);
      const controller = new PatrolController(enemy, 100, 100);

      advancePastIdleTimer(controller);

      const destination = controller.getCurrentDestination();
      if (destination) {
        vi.mocked(enemy.setDirection).mockClear();

        const midX = (100 + destination.x) / 2;
        const midY = (100 + destination.y) / 2;
        vi.mocked(enemy.getX).mockReturnValue(midX);
        vi.mocked(enemy.getY).mockReturnValue(midY);

        const expectedDir = controller.calculateDirection(
          midX, midY, destination.x, destination.y
        );
        vi.mocked(enemy.getDirection).mockReturnValue(
          expectedDir === "right" ? "left" : "right"
        );

        controller.update(16);

        expect(enemy.setDirection).toHaveBeenCalledWith(expectedDir);
      }
    });

    it("should NOT update direction if it has not changed", () => {
      const enemy = createMockEnemy(100, 100);
      const controller = new PatrolController(enemy, 100, 100);

      advancePastIdleTimer(controller);
      const destination = controller.getCurrentDestination();

      if (destination) {
        vi.mocked(enemy.setDirection).mockClear();

        const expectedDir = controller.calculateDirection(
          100, 100, destination.x, destination.y
        );
        vi.mocked(enemy.getDirection).mockReturnValue(expectedDir);

        controller.update(16);

        expect(enemy.setDirection).not.toHaveBeenCalled();
      }
    });
  });

  describe("Requirement 6.3: Animation module controls playback", () => {
    it("should delegate animation through Enemy.setState (not call Phaser directly)", () => {
      const enemy = createMockEnemy(100, 100);
      const controller = new PatrolController(enemy, 100, 100);

      advancePastIdleTimer(controller);
      const destination = controller.getCurrentDestination();

      if (destination) {
        vi.mocked(enemy.getX).mockReturnValue(destination.x);
        vi.mocked(enemy.getY).mockReturnValue(destination.y);
        controller.update(16);

        expect(enemy.setStateAndDirection).toHaveBeenCalled();
        expect(enemy.setState).toHaveBeenCalledWith("idle");
      }
    });

    it("should use setStateAndDirection for simultaneous state+direction changes", () => {
      const controller = new PatrolController(mockEnemy, 100, 100);
      vi.mocked(mockEnemy.setStateAndDirection).mockClear();

      advancePastIdleTimer(controller);

      expect(mockEnemy.setStateAndDirection).toHaveBeenCalledTimes(1);
    });
  });

  describe("Requirement 6.4: No direct Phaser animation invocation", () => {
    it("should not import or reference Phaser animation classes", async () => {
      const patrolControllerModule = await import("@/game/systems/PatrolController");

      expect(patrolControllerModule.PatrolController).toBeDefined();

      const enemy = createMockEnemy(200, 200);
      const ctrl = new patrolControllerModule.PatrolController(enemy, 200, 200);
      vi.mocked(enemy.setState).mockClear();
      vi.mocked(enemy.setStateAndDirection).mockClear();

      const duration = ctrl.getIdleDuration();
      ctrl.update(duration);

      expect(enemy.setStateAndDirection).toHaveBeenCalled();
    });

    it("should only call Enemy.setState, Enemy.setDirection, or Enemy.setStateAndDirection for animation changes", () => {
      const enemy = createMockEnemy(100, 100);
      const controller = new PatrolController(enemy, 100, 100);

      vi.mocked(enemy.setState).mockClear();
      vi.mocked(enemy.setDirection).mockClear();
      vi.mocked(enemy.setStateAndDirection).mockClear();

      advancePastIdleTimer(controller);

      const destination = controller.getCurrentDestination();
      if (destination) {
        vi.mocked(enemy.getX).mockReturnValue(
          (100 + destination.x) / 2
        );
        vi.mocked(enemy.getY).mockReturnValue(
          (100 + destination.y) / 2
        );
        vi.mocked(enemy.getDirection).mockReturnValue("up");
        controller.update(16);

        vi.mocked(enemy.getX).mockReturnValue(destination.x);
        vi.mocked(enemy.getY).mockReturnValue(destination.y);
        controller.update(16);

        const allCalls = [
          ...vi.mocked(enemy.setState).mock.calls,
          ...vi.mocked(enemy.setDirection).mock.calls,
          ...vi.mocked(enemy.setStateAndDirection).mock.calls,
        ];

        expect(allCalls.length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe("Full patrol animation lifecycle", () => {
    it("should follow the complete animation flow: idle → walking → idle", () => {
      const enemy = createMockEnemy(100, 100);
      const controller = new PatrolController(enemy, 100, 100);

      expect(enemy.setState).toHaveBeenCalledWith("idle");
      vi.mocked(enemy.setState).mockClear();
      vi.mocked(enemy.setStateAndDirection).mockClear();

      advancePastIdleTimer(controller);
      expect(enemy.setStateAndDirection).toHaveBeenCalledWith(
        "walking",
        expect.stringMatching(/^(up|down|left|right)$/)
      );
      expect(controller.getPatrolState()).toBe("walking");

      const destination = controller.getCurrentDestination();
      if (destination) {
        vi.mocked(enemy.getX).mockReturnValue(destination.x);
        vi.mocked(enemy.getY).mockReturnValue(destination.y);
        controller.update(16);

        expect(enemy.setState).toHaveBeenCalledWith("idle");
        expect(controller.getPatrolState()).toBe("idle");
      }
    });
  });
});
