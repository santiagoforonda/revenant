import { describe, it, expect, vi, beforeEach } from "vitest";
import { DetectionController, DEFAULT_DETECTION_RADIUS } from "@/game/systems/DetectionController";
import type { Enemy } from "@/game/entities/characters/Enemy";
import type { Player } from "@/game/entities/characters/Player";

/**
 * Unit tests for DetectionController (Task 7).
 *
 * Validates:
 * - Every enemy initializes a Detection Controller.
 * - Detection updates execute every frame.
 * - Player detection occurs when entering the configured radius.
 * - Detection loss occurs when leaving the configured radius.
 * - Multiple enemies evaluate detection independently.
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
 * Creates a mock Enemy entity with the minimum interface needed by DetectionController.
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
 * Creates a mock Player entity with the minimum interface needed by DetectionController.
 */
function createMockPlayer(x: number = 0, y: number = 0): Player {
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

describe("DetectionController - Behavior Validation", () => {
  let mockEnemy: Enemy;
  let mockPlayer: Player;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEnemy = createMockEnemy(100, 100);
    mockPlayer = createMockPlayer(500, 500);
  });

  describe("Initialization", () => {
    it("should initialize in NotDetected state", () => {
      const controller = new DetectionController(mockEnemy, mockPlayer);

      expect(controller.getDetectionState()).toBe("NotDetected");
    });

    it("should use the default detection radius when none is specified", () => {
      const controller = new DetectionController(mockEnemy, mockPlayer);

      expect(controller.getDetectionRadius()).toBe(DEFAULT_DETECTION_RADIUS);
    });

    it("should use a custom detection radius when provided", () => {
      const controller = new DetectionController(mockEnemy, mockPlayer, 150);

      expect(controller.getDetectionRadius()).toBe(150);
    });

    it("should be active after construction with valid radius", () => {
      const controller = new DetectionController(mockEnemy, mockPlayer);

      expect(controller.isActive()).toBe(true);
    });

    it("should preserve references to enemy and player", () => {
      const controller = new DetectionController(mockEnemy, mockPlayer);

      expect(controller.getEnemy()).toBe(mockEnemy);
      expect(controller.getPlayer()).toBe(mockPlayer);
    });
  });

  describe("Detection on frame update", () => {
    it("should detect the player when inside the detection radius", () => {
      // Place player inside the detection radius (distance = 50, radius = 80)
      const player = createMockPlayer(150, 100);
      const controller = new DetectionController(mockEnemy, player);

      controller.update();

      expect(controller.getDetectionState()).toBe("Detected");
    });

    it("should not detect the player when outside the detection radius", () => {
      // Player is far away (distance > 80)
      const controller = new DetectionController(mockEnemy, mockPlayer);

      controller.update();

      expect(controller.getDetectionState()).toBe("NotDetected");
    });

    it("should detect the player when exactly on the radius boundary", () => {
      // Place player exactly at detection radius distance (80 pixels away)
      const player = createMockPlayer(180, 100);
      const controller = new DetectionController(mockEnemy, player);

      controller.update();

      expect(controller.getDetectionState()).toBe("Detected");
    });
  });

  describe("Detection loss", () => {
    it("should lose detection when player moves outside the radius", () => {
      // Start with player inside detection radius
      const player = createMockPlayer(150, 100);
      const controller = new DetectionController(mockEnemy, player);

      // First update: player inside → Detected
      controller.update();
      expect(controller.getDetectionState()).toBe("Detected");

      // Move player outside detection radius
      (player.getX as ReturnType<typeof vi.fn>).mockReturnValue(500);
      (player.getY as ReturnType<typeof vi.fn>).mockReturnValue(500);

      // Second update: player outside → NotDetected
      controller.update();
      expect(controller.getDetectionState()).toBe("NotDetected");
    });

    it("should emit PlayerLost event on detection loss", () => {
      const player = createMockPlayer(150, 100);
      const controller = new DetectionController(mockEnemy, player);
      const listener = vi.fn();
      controller.onDetectionChange(listener);

      // Detect
      controller.update();
      expect(listener).toHaveBeenCalledWith("PlayerDetected");

      // Move player out
      (player.getX as ReturnType<typeof vi.fn>).mockReturnValue(500);
      (player.getY as ReturnType<typeof vi.fn>).mockReturnValue(500);

      // Lose detection
      controller.update();
      expect(listener).toHaveBeenCalledWith("PlayerLost");
    });
  });

  describe("Updates every frame", () => {
    it("should remain in Detected state across multiple updates when player stays inside", () => {
      const player = createMockPlayer(150, 100);
      const controller = new DetectionController(mockEnemy, player);

      // Call update multiple times
      for (let i = 0; i < 10; i++) {
        controller.update();
        expect(controller.getDetectionState()).toBe("Detected");
      }
    });

    it("should not emit duplicate detection events on repeated updates", () => {
      const player = createMockPlayer(150, 100);
      const controller = new DetectionController(mockEnemy, player);
      const listener = vi.fn();
      controller.onDetectionChange(listener);

      // Call update multiple times with player inside
      for (let i = 0; i < 10; i++) {
        controller.update();
      }

      // PlayerDetected should be emitted only once
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith("PlayerDetected");
    });

    it("should not throw on rapid successive updates", () => {
      const player = createMockPlayer(150, 100);
      const controller = new DetectionController(mockEnemy, player);

      for (let i = 0; i < 100; i++) {
        expect(() => controller.update()).not.toThrow();
      }
    });
  });

  describe("Multiple enemies independence", () => {
    it("should detect independently for different enemies", () => {
      const enemy1 = createMockEnemy(100, 100);
      const enemy2 = createMockEnemy(500, 500);
      const player = createMockPlayer(150, 100); // Close to enemy1, far from enemy2

      const controller1 = new DetectionController(enemy1, player);
      const controller2 = new DetectionController(enemy2, player);

      controller1.update();
      controller2.update();

      // Only controller1 should detect (player is near enemy1)
      expect(controller1.getDetectionState()).toBe("Detected");
      expect(controller2.getDetectionState()).toBe("NotDetected");
    });

    it("should emit events independently for each controller", () => {
      const enemy1 = createMockEnemy(100, 100);
      const enemy2 = createMockEnemy(500, 500);
      const player = createMockPlayer(150, 100);

      const controller1 = new DetectionController(enemy1, player);
      const controller2 = new DetectionController(enemy2, player);

      const listener1 = vi.fn();
      const listener2 = vi.fn();
      controller1.onDetectionChange(listener1);
      controller2.onDetectionChange(listener2);

      controller1.update();
      controller2.update();

      expect(listener1).toHaveBeenCalledWith("PlayerDetected");
      expect(listener2).not.toHaveBeenCalled();
    });

    it("should allow one enemy to detect while another loses detection", () => {
      const enemy1 = createMockEnemy(100, 100);
      const enemy2 = createMockEnemy(300, 300);
      // Player starts near enemy1
      const player = createMockPlayer(150, 100);

      const controller1 = new DetectionController(enemy1, player);
      const controller2 = new DetectionController(enemy2, player);

      controller1.update();
      controller2.update();

      expect(controller1.getDetectionState()).toBe("Detected");
      expect(controller2.getDetectionState()).toBe("NotDetected");

      // Move player near enemy2 and away from enemy1
      (player.getX as ReturnType<typeof vi.fn>).mockReturnValue(300);
      (player.getY as ReturnType<typeof vi.fn>).mockReturnValue(300);

      controller1.update();
      controller2.update();

      expect(controller1.getDetectionState()).toBe("NotDetected");
      expect(controller2.getDetectionState()).toBe("Detected");
    });
  });
});
