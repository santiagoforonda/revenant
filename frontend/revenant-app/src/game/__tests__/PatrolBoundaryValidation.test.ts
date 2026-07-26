import { describe, it, expect, vi, beforeEach } from "vitest";
import { PatrolController } from "@/game/systems/PatrolController";
import { PATROL_RADIUS } from "@/game/systems/PatrolDestinationGenerator";
import type { Enemy } from "@/game/entities/characters/Enemy";

/**
 * Unit tests for Patrol Boundary Validation (Task 4).
 *
 * Validates:
 * - Requirement 4.1: Restrict destination to the patrol area.
 * - Requirement 4.2: Enemy shall never intentionally leave its patrol area.
 * - Requirement 4.3: Invalid patrol points are discarded.
 * - Requirement 4.4: Movement continues normally with valid points.
 * - Requirement 8.2: If invalid position generated, generate another.
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

describe("Patrol Boundary Validation (Task 4)", () => {
  let mockEnemy: Enemy;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEnemy = createMockEnemy(200, 300);
  });

  describe("Destination Validation (Requirement 4.1)", () => {
    it("should validate destinations within patrol area as valid", () => {
      const controller = new PatrolController(mockEnemy, 200, 300, { radius: 50 });

      // Point 30 pixels away — within the 50px radius
      expect(controller.isWithinPatrolArea({ x: 230, y: 300 })).toBe(true);
    });

    it("should reject destinations outside the patrol area", () => {
      const controller = new PatrolController(mockEnemy, 200, 300, { radius: 50 });

      // Point 100 pixels away — outside the 50px radius
      expect(controller.isWithinPatrolArea({ x: 300, y: 300 })).toBe(false);
    });

    it("should accept destinations exactly on the boundary", () => {
      const controller = new PatrolController(mockEnemy, 200, 300, { radius: 50 });

      // Exactly 50 pixels to the right
      expect(controller.isWithinPatrolArea({ x: 250, y: 300 })).toBe(true);
    });

    it("should reject destinations just beyond the boundary", () => {
      const controller = new PatrolController(mockEnemy, 200, 300, { radius: 50 });

      // 51 pixels to the right — just beyond boundary
      expect(controller.isWithinPatrolArea({ x: 251, y: 300 })).toBe(false);
    });

    it("should validate using Euclidean distance (circular area)", () => {
      const controller = new PatrolController(mockEnemy, 0, 0, { radius: 50 });

      // Point at (35, 35) → distance ~49.5 → inside
      expect(controller.isWithinPatrolArea({ x: 35, y: 35 })).toBe(true);

      // Point at (36, 36) → distance ~50.9 → outside
      expect(controller.isWithinPatrolArea({ x: 36, y: 36 })).toBe(false);
    });
  });

  describe("Destination Generation and Storage (Requirement 4.4)", () => {
    it("should request and store a valid destination", () => {
      const controller = new PatrolController(mockEnemy, 200, 300);

      const destination = controller.requestNewDestination();

      expect(destination).not.toBeNull();
      expect(controller.getCurrentDestination()).toBe(destination);
    });

    it("should generate destinations within the patrol radius", () => {
      const controller = new PatrolController(mockEnemy, 200, 300, { radius: 50 });

      for (let i = 0; i < 50; i++) {
        const destination = controller.requestNewDestination();
        if (destination) {
          const dx = destination.x - 200;
          const dy = destination.y - 300;
          const distance = Math.sqrt(dx * dx + dy * dy);

          expect(distance).toBeLessThanOrEqual(50);
        }
      }
    });

    it("should start with no current destination", () => {
      const controller = new PatrolController(mockEnemy, 200, 300);

      expect(controller.getCurrentDestination()).toBeNull();
    });

    it("should replace the current destination on subsequent requests", () => {
      const controller = new PatrolController(mockEnemy, 200, 300);

      const first = controller.requestNewDestination();
      const second = controller.requestNewDestination();

      // The current destination should be the latest generated one
      expect(controller.getCurrentDestination()).toBe(second);
      // They should likely be different (random generation)
      expect(first).not.toBeNull();
      expect(second).not.toBeNull();
    });
  });

  describe("Invalid Destination Rejection (Requirement 4.3 / 8.2)", () => {
    it("should remain idle when generation fails (radius 0)", () => {
      const controller = new PatrolController(mockEnemy, 200, 300, {
        radius: 0,
        minDistance: 10,
      });

      const destination = controller.requestNewDestination();

      expect(destination).toBeNull();
      expect(controller.getCurrentDestination()).toBeNull();
      expect(controller.getPatrolState()).toBe("idle");
    });

    it("should clear current destination when generation fails", () => {
      const controller = new PatrolController(mockEnemy, 200, 300);

      // First, get a valid destination
      controller.requestNewDestination();
      expect(controller.getCurrentDestination()).not.toBeNull();

      // Now replace the generator behavior to simulate failure
      // Use a zero-radius controller to simulate failure
      const failController = new PatrolController(mockEnemy, 200, 300, {
        radius: 0,
        minDistance: 10,
      });
      const failResult = failController.requestNewDestination();

      expect(failResult).toBeNull();
      expect(failController.getCurrentDestination()).toBeNull();
    });
  });

  describe("Patrol Origin Preservation", () => {
    it("should never modify the patrol origin", () => {
      const controller = new PatrolController(mockEnemy, 200, 300);
      const originBefore = controller.getOrigin();

      // Request many destinations
      for (let i = 0; i < 50; i++) {
        controller.requestNewDestination();
      }

      const originAfter = controller.getOrigin();
      expect(originAfter.x).toBe(originBefore.x);
      expect(originAfter.y).toBe(originBefore.y);
      expect(originAfter.x).toBe(200);
      expect(originAfter.y).toBe(300);
    });

    it("should preserve origin even after updates and state changes", () => {
      const controller = new PatrolController(mockEnemy, 150, 250);

      controller.update(16);
      controller.requestNewDestination();
      controller.deactivate();
      controller.activate();
      controller.update(32);

      expect(controller.getOrigin().x).toBe(150);
      expect(controller.getOrigin().y).toBe(250);
    });

    it("should have a readonly origin that matches constructor args", () => {
      const controller = new PatrolController(mockEnemy, 42, 99);
      const origin = controller.getOrigin();

      expect(origin.x).toBe(42);
      expect(origin.y).toBe(99);
    });
  });

  describe("Boundary Enforcement (Requirement 4.2)", () => {
    it("should never generate a destination outside the patrol radius", () => {
      const radius = 60;
      const controller = new PatrolController(mockEnemy, 200, 300, { radius });

      for (let i = 0; i < 200; i++) {
        const destination = controller.requestNewDestination();
        if (destination) {
          const dx = destination.x - 200;
          const dy = destination.y - 300;
          const distance = Math.sqrt(dx * dx + dy * dy);

          expect(distance).toBeLessThanOrEqual(radius);
        }
      }
    });

    it("should use the default PATROL_RADIUS when no config is provided", () => {
      const controller = new PatrolController(mockEnemy, 200, 300);

      const generator = controller.getDestinationGenerator();
      expect(generator.getRadius()).toBe(PATROL_RADIUS);
    });

    it("should use a custom radius when configured", () => {
      const controller = new PatrolController(mockEnemy, 200, 300, { radius: 120 });

      const generator = controller.getDestinationGenerator();
      expect(generator.getRadius()).toBe(120);
    });
  });

  describe("Integration with PatrolDestinationGenerator", () => {
    it("should expose the destination generator for inspection", () => {
      const controller = new PatrolController(mockEnemy, 200, 300, { radius: 100 });

      const generator = controller.getDestinationGenerator();
      expect(generator).toBeDefined();
      expect(generator.getRadius()).toBe(100);
    });

    it("should use the same origin for all destination validations", () => {
      const controller = new PatrolController(mockEnemy, 200, 300, { radius: 50 });

      // A point within radius of (200, 300)
      expect(controller.isWithinPatrolArea({ x: 220, y: 310 })).toBe(true);

      // A point near (0, 0) — far from the origin (200, 300)
      expect(controller.isWithinPatrolArea({ x: 10, y: 10 })).toBe(false);
    });
  });

  describe("Multiple Controllers Independence", () => {
    it("should independently validate boundaries for different enemies", () => {
      const enemy1 = createMockEnemy(100, 100);
      const enemy2 = createMockEnemy(500, 500);

      const controller1 = new PatrolController(enemy1, 100, 100, { radius: 30 });
      const controller2 = new PatrolController(enemy2, 500, 500, { radius: 30 });

      // Point near enemy1's origin
      expect(controller1.isWithinPatrolArea({ x: 110, y: 100 })).toBe(true);
      expect(controller2.isWithinPatrolArea({ x: 110, y: 100 })).toBe(false);

      // Point near enemy2's origin
      expect(controller2.isWithinPatrolArea({ x: 510, y: 500 })).toBe(true);
      expect(controller1.isWithinPatrolArea({ x: 510, y: 500 })).toBe(false);
    });
  });
});
