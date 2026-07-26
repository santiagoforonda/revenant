import { describe, it, expect, vi, beforeEach } from "vitest";
import { ChaseController, DEFAULT_CHASE_SPEED, CHASE_ARRIVAL_THRESHOLD } from "@/game/systems/ChaseController";
import type { Enemy } from "@/game/entities/characters/Enemy";
import type { Player } from "@/game/entities/characters/Player";

/**
 * Unit tests for ChaseController (Task 1).
 *
 * Validates:
 * - Chase initialization begins in Inactive state.
 * - Chase target is null when Inactive.
 * - Pursuit starts only after receiving PlayerDetected event.
 * - Pursuit stops after receiving PlayerLost event.
 * - Chase target stores the player's current position.
 * - Error handling for missing references and invalid targets.
 * - Duplicate state transitions are prevented.
 * - Chase speed configuration works correctly.
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
 * Creates a mock Enemy entity with the minimum interface needed by ChaseController.
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
 * Creates a mock Player entity with the minimum interface needed by ChaseController.
 */
function createMockPlayer(x: number = 300, y: number = 400): Player {
  return {
    getX: vi.fn().mockReturnValue(x),
    getY: vi.fn().mockReturnValue(y),
    getSprite: vi.fn(),
    getBody: vi.fn(),
    move: vi.fn(),
    stop: vi.fn(),
    update: vi.fn(),
  } as unknown as Player;
}

describe("ChaseController", () => {
  let mockEnemy: Enemy;
  let mockPlayer: Player;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEnemy = createMockEnemy(100, 200);
    mockPlayer = createMockPlayer(300, 400);
  });

  describe("Initialization", () => {
    it("should begin in the Inactive chase state", () => {
      const controller = new ChaseController(mockEnemy, mockPlayer);

      expect(controller.getChaseState()).toBe("Inactive");
    });

    it("should have no chase target when inactive", () => {
      const controller = new ChaseController(mockEnemy, mockPlayer);

      expect(controller.getChaseTarget()).toBeNull();
    });

    it("should preserve a reference to the enemy", () => {
      const controller = new ChaseController(mockEnemy, mockPlayer);

      expect(controller.getEnemy()).toBe(mockEnemy);
    });

    it("should preserve a reference to the player", () => {
      const controller = new ChaseController(mockEnemy, mockPlayer);

      expect(controller.getPlayer()).toBe(mockPlayer);
    });

    it("should use the default chase speed when none is provided", () => {
      const controller = new ChaseController(mockEnemy, mockPlayer);

      expect(controller.getChaseSpeed()).toBe(DEFAULT_CHASE_SPEED);
    });

    it("should accept a custom chase speed", () => {
      const controller = new ChaseController(mockEnemy, mockPlayer, 90);

      expect(controller.getChaseSpeed()).toBe(90);
    });

    it("should use the default chase speed for invalid values", () => {
      const controller = new ChaseController(mockEnemy, mockPlayer, -10);
      expect(controller.getChaseSpeed()).toBe(DEFAULT_CHASE_SPEED);

      const controller2 = new ChaseController(mockEnemy, mockPlayer, 0);
      expect(controller2.getChaseSpeed()).toBe(DEFAULT_CHASE_SPEED);

      const controller3 = new ChaseController(mockEnemy, mockPlayer, NaN);
      expect(controller3.getChaseSpeed()).toBe(DEFAULT_CHASE_SPEED);

      const controller4 = new ChaseController(mockEnemy, mockPlayer, Infinity);
      expect(controller4.getChaseSpeed()).toBe(DEFAULT_CHASE_SPEED);
    });

    it("should throw when enemy reference is missing", () => {
      expect(() => new ChaseController(null as unknown as Enemy, mockPlayer)).toThrow(
        "[ChaseController] Enemy reference is required."
      );
    });

    it("should throw when player reference is missing", () => {
      expect(() => new ChaseController(mockEnemy, null as unknown as Player)).toThrow(
        "[ChaseController] Player reference is required."
      );
    });
  });

  describe("Detection Event Handling", () => {
    it("should transition to Chasing state on PlayerDetected", () => {
      const controller = new ChaseController(mockEnemy, mockPlayer);

      controller.handleDetectionEvent("PlayerDetected");

      expect(controller.getChaseState()).toBe("Chasing");
    });

    it("should store the player position as chase target on PlayerDetected", () => {
      const controller = new ChaseController(mockEnemy, mockPlayer);

      controller.handleDetectionEvent("PlayerDetected");

      const target = controller.getChaseTarget();
      expect(target).not.toBeNull();
      expect(target!.targetX).toBe(300);
      expect(target!.targetY).toBe(400);
    });

    it("should transition to Inactive state on PlayerLost", () => {
      const controller = new ChaseController(mockEnemy, mockPlayer);
      controller.handleDetectionEvent("PlayerDetected");

      controller.handleDetectionEvent("PlayerLost");

      expect(controller.getChaseState()).toBe("Inactive");
    });

    it("should clear the chase target on PlayerLost", () => {
      const controller = new ChaseController(mockEnemy, mockPlayer);
      controller.handleDetectionEvent("PlayerDetected");

      controller.handleDetectionEvent("PlayerLost");

      expect(controller.getChaseTarget()).toBeNull();
    });

    it("should prevent duplicate PlayerDetected transitions", () => {
      const controller = new ChaseController(mockEnemy, mockPlayer);

      controller.handleDetectionEvent("PlayerDetected");
      controller.handleDetectionEvent("PlayerDetected");

      expect(controller.getChaseState()).toBe("Chasing");
    });

    it("should prevent duplicate PlayerLost transitions", () => {
      const controller = new ChaseController(mockEnemy, mockPlayer);

      // Already inactive — calling PlayerLost should not cause issues
      controller.handleDetectionEvent("PlayerLost");

      expect(controller.getChaseState()).toBe("Inactive");
    });

    it("should not start pursuit when player position is invalid", () => {
      (mockPlayer.getX as ReturnType<typeof vi.fn>).mockReturnValue(NaN);
      (mockPlayer.getY as ReturnType<typeof vi.fn>).mockReturnValue(NaN);

      const controller = new ChaseController(mockEnemy, mockPlayer);
      controller.handleDetectionEvent("PlayerDetected");

      // Should remain Inactive because player position is invalid
      expect(controller.getChaseState()).toBe("Inactive");
    });
  });

  describe("Update Behavior", () => {
    it("should be a no-op when chase state is Inactive", () => {
      const controller = new ChaseController(mockEnemy, mockPlayer);

      controller.update(16);

      expect(controller.getChaseTarget()).toBeNull();
    });

    it("should update chase target to current player position while chasing", () => {
      const controller = new ChaseController(mockEnemy, mockPlayer);
      controller.handleDetectionEvent("PlayerDetected");

      // Simulate player moving
      (mockPlayer.getX as ReturnType<typeof vi.fn>).mockReturnValue(500);
      (mockPlayer.getY as ReturnType<typeof vi.fn>).mockReturnValue(600);

      controller.update(16);

      const target = controller.getChaseTarget();
      expect(target).not.toBeNull();
      expect(target!.targetX).toBe(500);
      expect(target!.targetY).toBe(600);
    });

    it("should not throw when update is called while inactive", () => {
      const controller = new ChaseController(mockEnemy, mockPlayer);

      expect(() => controller.update(16)).not.toThrow();
    });

    it("should not throw when update is called while chasing", () => {
      const controller = new ChaseController(mockEnemy, mockPlayer);
      controller.handleDetectionEvent("PlayerDetected");

      expect(() => controller.update(16)).not.toThrow();
    });

    it("should handle invalid player position during update gracefully", () => {
      const controller = new ChaseController(mockEnemy, mockPlayer);
      controller.handleDetectionEvent("PlayerDetected");

      // Simulate invalid player position
      (mockPlayer.getX as ReturnType<typeof vi.fn>).mockReturnValue(NaN);
      (mockPlayer.getY as ReturnType<typeof vi.fn>).mockReturnValue(100);

      controller.update(16);

      // Target should be cleared but state should remain Chasing
      expect(controller.getChaseTarget()).toBeNull();
      expect(controller.getChaseState()).toBe("Chasing");
    });

    it("should be safe to call update multiple times", () => {
      const controller = new ChaseController(mockEnemy, mockPlayer);
      controller.handleDetectionEvent("PlayerDetected");

      for (let i = 0; i < 100; i++) {
        expect(() => controller.update(16)).not.toThrow();
      }
    });
  });

  describe("Multiple Controllers Independence", () => {
    it("should allow independent chase controllers for different enemies", () => {
      const enemy1 = createMockEnemy(100, 200);
      const enemy2 = createMockEnemy(500, 600);

      const controller1 = new ChaseController(enemy1, mockPlayer);
      const controller2 = new ChaseController(enemy2, mockPlayer);

      controller1.handleDetectionEvent("PlayerDetected");

      expect(controller1.getChaseState()).toBe("Chasing");
      expect(controller2.getChaseState()).toBe("Inactive");
    });

    it("should allow independent state transitions without affecting siblings", () => {
      const enemy1 = createMockEnemy(100, 200);
      const enemy2 = createMockEnemy(500, 600);

      const controller1 = new ChaseController(enemy1, mockPlayer);
      const controller2 = new ChaseController(enemy2, mockPlayer);

      controller1.handleDetectionEvent("PlayerDetected");
      controller2.handleDetectionEvent("PlayerDetected");
      controller1.handleDetectionEvent("PlayerLost");

      expect(controller1.getChaseState()).toBe("Inactive");
      expect(controller2.getChaseState()).toBe("Chasing");
    });
  });

  describe("Detection Listener Registration", () => {
    it("should provide handleDetectionEvent as a stable function reference", () => {
      const controller = new ChaseController(mockEnemy, mockPlayer);

      // The handler should be a stable reference suitable for registration
      expect(typeof controller.handleDetectionEvent).toBe("function");
      expect(controller.handleDetectionEvent).toBe(controller.handleDetectionEvent);
    });
  });

  describe("Animation Synchronization (Task 6)", () => {
    it("should set enemy to walking state when pursuit begins", () => {
      const controller = new ChaseController(mockEnemy, mockPlayer);

      controller.handleDetectionEvent("PlayerDetected");

      expect(mockEnemy.setState).toHaveBeenCalledWith("walking");
    });

    it("should set enemy to idle state when pursuit ends", () => {
      const controller = new ChaseController(mockEnemy, mockPlayer);
      controller.handleDetectionEvent("PlayerDetected");
      vi.clearAllMocks();

      controller.handleDetectionEvent("PlayerLost");

      expect(mockEnemy.setState).toHaveBeenCalledWith("idle");
    });

    it("should not call setState when pursuit start is redundant", () => {
      const controller = new ChaseController(mockEnemy, mockPlayer);
      controller.handleDetectionEvent("PlayerDetected");
      vi.clearAllMocks();

      // Second PlayerDetected should be no-op
      controller.handleDetectionEvent("PlayerDetected");

      expect(mockEnemy.setState).not.toHaveBeenCalled();
    });

    it("should not call setState when pursuit stop is redundant", () => {
      const controller = new ChaseController(mockEnemy, mockPlayer);

      // Already inactive — PlayerLost should be no-op
      controller.handleDetectionEvent("PlayerLost");

      expect(mockEnemy.setState).not.toHaveBeenCalled();
    });

    it("should call enemy.setState and NOT Phaser animation methods directly", () => {
      const controller = new ChaseController(mockEnemy, mockPlayer);

      controller.handleDetectionEvent("PlayerDetected");

      // Verify setState is the only animation-related call
      expect(mockEnemy.setState).toHaveBeenCalledWith("walking");
      // getSprite should not be called for animation purposes
      expect(mockEnemy.getSprite).not.toHaveBeenCalled();
    });

    it("should update facing direction via setDirection during movement", () => {
      const enemy = createMockEnemy(100, 200);
      const player = createMockPlayer(300, 200);
      const controller = new ChaseController(enemy, player);

      controller.handleDetectionEvent("PlayerDetected");
      controller.update(16);

      // Direction updated through the Enemy entity's high-level API
      expect(enemy.setDirection).toHaveBeenCalledWith("right");
    });

    it("should transition from walking to idle across a full chase cycle", () => {
      const controller = new ChaseController(mockEnemy, mockPlayer);

      // Start pursuit → walking
      controller.handleDetectionEvent("PlayerDetected");
      expect(mockEnemy.setState).toHaveBeenCalledWith("walking");

      vi.clearAllMocks();

      // Stop pursuit → idle
      controller.handleDetectionEvent("PlayerLost");
      expect(mockEnemy.setState).toHaveBeenCalledWith("idle");
    });

    it("should not set walking state if player position is invalid on detection", () => {
      (mockPlayer.getX as ReturnType<typeof vi.fn>).mockReturnValue(NaN);
      (mockPlayer.getY as ReturnType<typeof vi.fn>).mockReturnValue(NaN);

      const controller = new ChaseController(mockEnemy, mockPlayer);
      controller.handleDetectionEvent("PlayerDetected");

      // startPursuit should bail out before setState due to invalid position
      expect(mockEnemy.setState).not.toHaveBeenCalled();
      expect(controller.getChaseState()).toBe("Inactive");
    });
  });

  describe("Chase Direction Calculation", () => {
    it("should set direction to 'right' when player is to the right", () => {
      // Enemy at (100, 200), player at (300, 200) — directly right
      const enemy = createMockEnemy(100, 200);
      const player = createMockPlayer(300, 200);
      const controller = new ChaseController(enemy, player);

      controller.handleDetectionEvent("PlayerDetected");
      controller.update(16);

      expect(enemy.setDirection).toHaveBeenCalledWith("right");
    });

    it("should set direction to 'left' when player is to the left", () => {
      // Enemy at (300, 200), player at (100, 200) — directly left
      const enemy = createMockEnemy(300, 200);
      const player = createMockPlayer(100, 200);
      const controller = new ChaseController(enemy, player);

      controller.handleDetectionEvent("PlayerDetected");
      controller.update(16);

      expect(enemy.setDirection).toHaveBeenCalledWith("left");
    });

    it("should set direction to 'down' when player is below", () => {
      // Enemy at (200, 100), player at (200, 300) — directly below
      const enemy = createMockEnemy(200, 100);
      const player = createMockPlayer(200, 300);
      const controller = new ChaseController(enemy, player);

      controller.handleDetectionEvent("PlayerDetected");
      controller.update(16);

      expect(enemy.setDirection).toHaveBeenCalledWith("down");
    });

    it("should set direction to 'up' when player is above", () => {
      // Enemy at (200, 300), player at (200, 100) — directly above
      const enemy = createMockEnemy(200, 300);
      const player = createMockPlayer(200, 100);
      const controller = new ChaseController(enemy, player);

      controller.handleDetectionEvent("PlayerDetected");
      controller.update(16);

      expect(enemy.setDirection).toHaveBeenCalledWith("up");
    });

    it("should resolve diagonal movement to the dominant horizontal axis", () => {
      // Enemy at (100, 200), player at (250, 250) — dx=150, dy=50, horizontal dominates
      const enemy = createMockEnemy(100, 200);
      const player = createMockPlayer(250, 250);
      const controller = new ChaseController(enemy, player);

      controller.handleDetectionEvent("PlayerDetected");
      controller.update(16);

      expect(enemy.setDirection).toHaveBeenCalledWith("right");
    });

    it("should resolve diagonal movement to the dominant vertical axis", () => {
      // Enemy at (200, 100), player at (220, 300) — dx=20, dy=200, vertical dominates
      const enemy = createMockEnemy(200, 100);
      const player = createMockPlayer(220, 300);
      const controller = new ChaseController(enemy, player);

      controller.handleDetectionEvent("PlayerDetected");
      controller.update(16);

      expect(enemy.setDirection).toHaveBeenCalledWith("down");
    });

    it("should resolve to horizontal when dx and dy are equal", () => {
      // Enemy at (100, 100), player at (200, 200) — dx=100, dy=100, equal → horizontal wins
      const enemy = createMockEnemy(100, 100);
      const player = createMockPlayer(200, 200);
      const controller = new ChaseController(enemy, player);

      controller.handleDetectionEvent("PlayerDetected");
      controller.update(16);

      expect(enemy.setDirection).toHaveBeenCalledWith("right");
    });

    it("should not update direction when within arrival threshold", () => {
      // Enemy at (100, 100), player at (101, 100) — distance = 1, within threshold of 2
      const enemy = createMockEnemy(100, 100);
      const player = createMockPlayer(101, 100);
      const controller = new ChaseController(enemy, player);

      controller.handleDetectionEvent("PlayerDetected");
      controller.update(16);

      // setDirection should NOT be called because distance <= CHASE_ARRIVAL_THRESHOLD
      expect(enemy.setDirection).not.toHaveBeenCalled();
    });

    it("should update direction before position for visual consistency", () => {
      const enemy = createMockEnemy(100, 200);
      const player = createMockPlayer(300, 200);
      const controller = new ChaseController(enemy, player);

      const callOrder: string[] = [];
      (enemy.setDirection as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callOrder.push("setDirection");
      });
      (enemy.setPosition as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callOrder.push("setPosition");
      });

      controller.handleDetectionEvent("PlayerDetected");
      controller.update(16);

      expect(callOrder).toEqual(["setDirection", "setPosition"]);
    });
  });
});
