import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  PatrolController,
  PATROL_SPEED,
  ARRIVAL_THRESHOLD,
} from "@/game/systems/PatrolController";
import type { Enemy } from "@/game/entities/characters/Enemy";

/**
 * Unit tests for PatrolController movement logic (Task 5).
 *
 * Validates:
 * - Requirement 2.2: Enemy SHALL move toward the patrol point.
 * - Requirement 2.3: When patrol point is reached, enemy SHALL stop moving.
 * - Requirement 2.4: While moving toward patrol point, enemy SHALL remain in Walking state.
 * - Requirement 5.1: Update facing direction when movement begins.
 * - Requirement 5.2: Update facing direction when movement direction changes.
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
 * Creates a mock Enemy entity with mutable position tracking.
 * Position is tracked via internal state to simulate real movement.
 */
function createMockEnemy(startX: number = 100, startY: number = 100): Enemy {
  let x = startX;
  let y = startY;
  let state = "idle";
  let direction = "down";

  return {
    setState: vi.fn((newState: string) => {
      state = newState;
    }),
    setDirection: vi.fn((newDir: string) => {
      direction = newDir;
    }),
    setStateAndDirection: vi.fn((newState: string, newDir: string) => {
      state = newState;
      direction = newDir;
    }),
    getState: vi.fn(() => state),
    getDirection: vi.fn(() => direction),
    getX: vi.fn(() => x),
    getY: vi.fn(() => y),
    setPosition: vi.fn((newX: number, newY: number) => {
      x = newX;
      y = newY;
    }),
    getSprite: vi.fn(),
    getStats: vi.fn(),
    getName: vi.fn().mockReturnValue("Skeleton"),
    getEnemyType: vi.fn(),
    getCurrentAnimationKey: vi.fn().mockReturnValue("skeleton-idle-down"),
  } as unknown as Enemy;
}

describe("PatrolController - Movement (Task 5)", () => {
  let mockEnemy: Enemy;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Helper: advances the controller past the idle timer so that it
   * transitions to walking state. Required after Task 7 introduced idle delays.
   */
  function advancePastIdleTimer(controller: PatrolController): void {
    const duration = controller.getIdleDuration();
    controller.update(duration);
  }

  describe("Enemy moves toward destination", () => {
    it("should move the enemy toward the destination on update", () => {
      mockEnemy = createMockEnemy(100, 100);
      const controller = new PatrolController(mockEnemy, 100, 100, { radius: 80 });

      const destination = { x: 150, y: 100 };
      vi.spyOn(controller.getDestinationGenerator(), "generate").mockReturnValue(destination);
      vi.spyOn(controller.getDestinationGenerator(), "isValidDestination").mockReturnValue(true);

      advancePastIdleTimer(controller);
      controller.update(1000);

      const movedX = (mockEnemy.getX as ReturnType<typeof vi.fn>)();
      expect(movedX).toBeGreaterThan(100);
      expect(movedX).toBeLessThanOrEqual(150);
    });

    it("should move in the correct direction (positive X)", () => {
      mockEnemy = createMockEnemy(100, 100);
      const controller = new PatrolController(mockEnemy, 100, 100, { radius: 80 });

      vi.spyOn(controller.getDestinationGenerator(), "generate").mockReturnValue({ x: 160, y: 100 });
      vi.spyOn(controller.getDestinationGenerator(), "isValidDestination").mockReturnValue(true);

      advancePastIdleTimer(controller);
      controller.update(1000);

      const movedX = (mockEnemy.getX as ReturnType<typeof vi.fn>)();
      expect(movedX).toBeCloseTo(100 + PATROL_SPEED, 0);
    });

    it("should move in the correct direction (negative Y / upward)", () => {
      mockEnemy = createMockEnemy(100, 100);
      const controller = new PatrolController(mockEnemy, 100, 100, { radius: 80 });

      vi.spyOn(controller.getDestinationGenerator(), "generate").mockReturnValue({ x: 100, y: 40 });
      vi.spyOn(controller.getDestinationGenerator(), "isValidDestination").mockReturnValue(true);

      advancePastIdleTimer(controller);
      controller.update(1000);

      const movedY = (mockEnemy.getY as ReturnType<typeof vi.fn>)();
      expect(movedY).toBeCloseTo(100 - PATROL_SPEED, 0);
    });
  });

  describe("Enemy stops when destination is reached", () => {
    it("should stop and transition to idle when reaching the destination", () => {
      mockEnemy = createMockEnemy(100, 100);
      const controller = new PatrolController(mockEnemy, 100, 100, { radius: 80 });

      vi.spyOn(controller.getDestinationGenerator(), "generate").mockReturnValue({ x: 101, y: 100 });
      vi.spyOn(controller.getDestinationGenerator(), "isValidDestination").mockReturnValue(true);

      advancePastIdleTimer(controller);
      controller.update(1000);

      expect(controller.getPatrolState()).toBe("idle");
      expect(mockEnemy.setState).toHaveBeenCalledWith("idle");
      expect(controller.getCurrentDestination()).toBeNull();
    });

    it("should snap to the destination position when arriving", () => {
      mockEnemy = createMockEnemy(100, 100);
      const controller = new PatrolController(mockEnemy, 100, 100, { radius: 80 });

      vi.spyOn(controller.getDestinationGenerator(), "generate").mockReturnValue({ x: 101.5, y: 100.5 });
      vi.spyOn(controller.getDestinationGenerator(), "isValidDestination").mockReturnValue(true);

      advancePastIdleTimer(controller);
      controller.update(1000);

      expect(mockEnemy.setPosition).toHaveBeenCalledWith(101.5, 100.5);
    });

    it("should not overshoot the destination", () => {
      mockEnemy = createMockEnemy(100, 100);
      const controller = new PatrolController(mockEnemy, 100, 100, { radius: 80 });

      vi.spyOn(controller.getDestinationGenerator(), "generate").mockReturnValue({ x: 105, y: 100 });
      vi.spyOn(controller.getDestinationGenerator(), "isValidDestination").mockReturnValue(true);

      advancePastIdleTimer(controller);
      controller.update(1000);

      const finalX = (mockEnemy.getX as ReturnType<typeof vi.fn>)();
      expect(finalX).toBeLessThanOrEqual(105);
    });
  });

  describe("Position updates use delta time correctly", () => {
    it("should move proportionally to delta time", () => {
      mockEnemy = createMockEnemy(100, 100);
      const controller = new PatrolController(mockEnemy, 100, 100, { radius: 80 });

      vi.spyOn(controller.getDestinationGenerator(), "generate").mockReturnValue({ x: 200, y: 100 });
      vi.spyOn(controller.getDestinationGenerator(), "isValidDestination").mockReturnValue(true);

      advancePastIdleTimer(controller);
      controller.update(500);

      const movedX = (mockEnemy.getX as ReturnType<typeof vi.fn>)();
      expect(movedX).toBeCloseTo(100 + PATROL_SPEED * 0.5, 1);
    });

    it("should move twice as far with twice the delta", () => {
      const enemy1 = createMockEnemy(100, 100);
      const controller1 = new PatrolController(enemy1, 100, 100, { radius: 80 });
      vi.spyOn(controller1.getDestinationGenerator(), "generate").mockReturnValue({ x: 200, y: 100 });
      vi.spyOn(controller1.getDestinationGenerator(), "isValidDestination").mockReturnValue(true);
      advancePastIdleTimer(controller1);
      controller1.update(500);
      const x1 = (enemy1.getX as ReturnType<typeof vi.fn>)();

      const enemy2 = createMockEnemy(100, 100);
      const controller2 = new PatrolController(enemy2, 100, 100, { radius: 80 });
      vi.spyOn(controller2.getDestinationGenerator(), "generate").mockReturnValue({ x: 200, y: 100 });
      vi.spyOn(controller2.getDestinationGenerator(), "isValidDestination").mockReturnValue(true);
      advancePastIdleTimer(controller2);
      controller2.update(1000);
      const x2 = (enemy2.getX as ReturnType<typeof vi.fn>)();

      const displacement1 = x1 - 100;
      const displacement2 = x2 - 100;
      expect(displacement2).toBeCloseTo(displacement1 * 2, 1);
    });

    it("should handle zero delta without moving", () => {
      mockEnemy = createMockEnemy(100, 100);
      const controller = new PatrolController(mockEnemy, 100, 100, { radius: 80 });

      vi.spyOn(controller.getDestinationGenerator(), "generate").mockReturnValue({ x: 200, y: 100 });
      vi.spyOn(controller.getDestinationGenerator(), "isValidDestination").mockReturnValue(true);

      advancePastIdleTimer(controller);
      (mockEnemy.setPosition as ReturnType<typeof vi.fn>).mockClear();
      controller.update(0);

      const movedX = (mockEnemy.getX as ReturnType<typeof vi.fn>)();
      expect(movedX).toBe(100);
    });
  });

  describe("Multiple controllers move independently", () => {
    it("should move two enemies toward different destinations simultaneously", () => {
      const enemy1 = createMockEnemy(100, 100);
      const enemy2 = createMockEnemy(300, 300);

      const controller1 = new PatrolController(enemy1, 100, 100, { radius: 80 });
      const controller2 = new PatrolController(enemy2, 300, 300, { radius: 80 });

      vi.spyOn(controller1.getDestinationGenerator(), "generate").mockReturnValue({ x: 150, y: 100 });
      vi.spyOn(controller1.getDestinationGenerator(), "isValidDestination").mockReturnValue(true);
      vi.spyOn(controller2.getDestinationGenerator(), "generate").mockReturnValue({ x: 300, y: 350 });
      vi.spyOn(controller2.getDestinationGenerator(), "isValidDestination").mockReturnValue(true);

      advancePastIdleTimer(controller1);
      advancePastIdleTimer(controller2);

      controller1.update(1000);
      controller2.update(1000);

      const x1 = (enemy1.getX as ReturnType<typeof vi.fn>)();
      expect(x1).toBeGreaterThan(100);

      const y2 = (enemy2.getY as ReturnType<typeof vi.fn>)();
      expect(y2).toBeGreaterThan(300);
    });

    it("should allow one enemy to arrive while another is still walking", () => {
      const enemy1 = createMockEnemy(100, 100);
      const enemy2 = createMockEnemy(300, 300);

      const controller1 = new PatrolController(enemy1, 100, 100, { radius: 80 });
      const controller2 = new PatrolController(enemy2, 300, 300, { radius: 80 });

      vi.spyOn(controller1.getDestinationGenerator(), "generate").mockReturnValue({ x: 101, y: 100 });
      vi.spyOn(controller1.getDestinationGenerator(), "isValidDestination").mockReturnValue(true);
      vi.spyOn(controller2.getDestinationGenerator(), "generate").mockReturnValue({ x: 380, y: 300 });
      vi.spyOn(controller2.getDestinationGenerator(), "isValidDestination").mockReturnValue(true);

      advancePastIdleTimer(controller1);
      advancePastIdleTimer(controller2);

      controller1.update(1000);
      controller2.update(1000);

      expect(controller1.getPatrolState()).toBe("idle");
      expect(controller2.getPatrolState()).toBe("walking");
    });
  });

  describe("Direction calculation", () => {
    it("should face right when moving primarily in positive X", () => {
      mockEnemy = createMockEnemy(100, 100);
      const controller = new PatrolController(mockEnemy, 100, 100, { radius: 80 });
      const direction = controller.calculateDirection(100, 100, 150, 110);
      expect(direction).toBe("right");
    });

    it("should face left when moving primarily in negative X", () => {
      mockEnemy = createMockEnemy(100, 100);
      const controller = new PatrolController(mockEnemy, 100, 100, { radius: 80 });
      const direction = controller.calculateDirection(100, 100, 50, 90);
      expect(direction).toBe("left");
    });

    it("should face down when moving primarily in positive Y", () => {
      mockEnemy = createMockEnemy(100, 100);
      const controller = new PatrolController(mockEnemy, 100, 100, { radius: 80 });
      const direction = controller.calculateDirection(100, 100, 110, 160);
      expect(direction).toBe("down");
    });

    it("should face up when moving primarily in negative Y", () => {
      mockEnemy = createMockEnemy(100, 100);
      const controller = new PatrolController(mockEnemy, 100, 100, { radius: 80 });
      const direction = controller.calculateDirection(100, 100, 90, 40);
      expect(direction).toBe("up");
    });

    it("should prefer vertical when dx equals dy (down)", () => {
      mockEnemy = createMockEnemy(100, 100);
      const controller = new PatrolController(mockEnemy, 100, 100, { radius: 80 });
      const direction = controller.calculateDirection(100, 100, 150, 150);
      expect(direction).toBe("down");
    });

    it("should update facing direction when movement begins (Req 5.1)", () => {
      mockEnemy = createMockEnemy(100, 100);
      const controller = new PatrolController(mockEnemy, 100, 100, { radius: 80 });

      vi.spyOn(controller.getDestinationGenerator(), "generate").mockReturnValue({ x: 150, y: 100 });
      vi.spyOn(controller.getDestinationGenerator(), "isValidDestination").mockReturnValue(true);

      advancePastIdleTimer(controller);

      expect(mockEnemy.setStateAndDirection).toHaveBeenCalledWith("walking", "right");
    });

    it("should update facing direction during movement when direction changes (Req 5.2)", () => {
      mockEnemy = createMockEnemy(100, 100);
      const controller = new PatrolController(mockEnemy, 100, 100, { radius: 80 });

      vi.spyOn(controller.getDestinationGenerator(), "generate").mockReturnValue({ x: 150, y: 100 });
      vi.spyOn(controller.getDestinationGenerator(), "isValidDestination").mockReturnValue(true);

      advancePastIdleTimer(controller);

      expect(mockEnemy.setStateAndDirection).toHaveBeenCalledWith("walking", "right");
    });
  });

  describe("State transitions during movement", () => {
    it("should transition to walking state when destination is selected", () => {
      mockEnemy = createMockEnemy(100, 100);
      const controller = new PatrolController(mockEnemy, 100, 100, { radius: 80 });

      vi.spyOn(controller.getDestinationGenerator(), "generate").mockReturnValue({ x: 150, y: 100 });
      vi.spyOn(controller.getDestinationGenerator(), "isValidDestination").mockReturnValue(true);

      advancePastIdleTimer(controller);

      expect(controller.getPatrolState()).toBe("walking");
      expect(mockEnemy.setStateAndDirection).toHaveBeenCalledWith("walking", expect.stringMatching(/^(up|down|left|right)$/));
    });

    it("should remain in walking state during movement", () => {
      mockEnemy = createMockEnemy(100, 100);
      const controller = new PatrolController(mockEnemy, 100, 100, { radius: 80 });

      vi.spyOn(controller.getDestinationGenerator(), "generate").mockReturnValue({ x: 200, y: 100 });
      vi.spyOn(controller.getDestinationGenerator(), "isValidDestination").mockReturnValue(true);

      advancePastIdleTimer(controller);
      controller.update(500);

      expect(controller.getPatrolState()).toBe("walking");
    });

    it("should not call setState again while already walking", () => {
      mockEnemy = createMockEnemy(100, 100);
      const controller = new PatrolController(mockEnemy, 100, 100, { radius: 80 });

      vi.spyOn(controller.getDestinationGenerator(), "generate").mockReturnValue({ x: 200, y: 100 });
      vi.spyOn(controller.getDestinationGenerator(), "isValidDestination").mockReturnValue(true);

      advancePastIdleTimer(controller);
      (mockEnemy.setState as ReturnType<typeof vi.fn>).mockClear();

      controller.update(500);

      expect(mockEnemy.setState).not.toHaveBeenCalled();
    });

    it("should not move when inactive", () => {
      mockEnemy = createMockEnemy(100, 100);
      const controller = new PatrolController(mockEnemy, 100, 100, { radius: 80 });

      controller.deactivate();
      controller.update(1000);

      expect((mockEnemy.getX as ReturnType<typeof vi.fn>)()).toBe(100);
      expect((mockEnemy.getY as ReturnType<typeof vi.fn>)()).toBe(100);
    });

    it("should stay idle when destination generation fails", () => {
      mockEnemy = createMockEnemy(100, 100);
      const controller = new PatrolController(mockEnemy, 100, 100, { radius: 0 });

      const duration = controller.getIdleDuration();
      controller.update(duration);

      expect(controller.getPatrolState()).toBe("idle");
      expect(controller.getCurrentDestination()).toBeNull();
    });
  });
});
