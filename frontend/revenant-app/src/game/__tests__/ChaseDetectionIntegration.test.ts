import { describe, it, expect, vi, beforeEach } from "vitest";
import { DetectionController } from "@/game/systems/DetectionController";
import { ChaseController } from "@/game/systems/ChaseController";
import { PatrolController } from "@/game/systems/PatrolController";
import type { Enemy } from "@/game/entities/characters/Enemy";
import type { Player } from "@/game/entities/characters/Player";

/**
 * Integration tests for the Detection → Chase → Patrol coordination flow (Task 5).
 *
 * Validates:
 * - DetectionController fires PlayerDetected → ChaseController starts pursuit.
 * - DetectionController fires PlayerLost → ChaseController stops pursuit.
 * - Duplicate chase state transitions are prevented.
 * - DetectionController remains responsible only for detection events.
 * - PatrolController is deactivated during chase and reactivated after.
 * - Enemy moves toward player during active pursuit.
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
 * Creates a mock Enemy entity with position tracking.
 */
function createMockEnemy(x: number = 100, y: number = 100): Enemy {
  let posX = x;
  let posY = y;

  return {
    setState: vi.fn(),
    setDirection: vi.fn(),
    setStateAndDirection: vi.fn(),
    getState: vi.fn().mockReturnValue("idle"),
    getDirection: vi.fn().mockReturnValue("down"),
    getX: vi.fn(() => posX),
    getY: vi.fn(() => posY),
    setPosition: vi.fn((newX: number, newY: number) => {
      posX = newX;
      posY = newY;
    }),
    getSprite: vi.fn(),
    getStats: vi.fn(),
    getName: vi.fn().mockReturnValue("Skeleton"),
    getEnemyType: vi.fn(),
    getCurrentAnimationKey: vi.fn().mockReturnValue("skeleton-idle-down"),
  } as unknown as Enemy;
}

/**
 * Creates a mock Player entity with mutable position.
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

describe("Chase-Detection Integration", () => {
  let mockEnemy: Enemy;
  let mockPlayer: Player;
  let detectionController: DetectionController;
  let chaseController: ChaseController;
  let patrolController: PatrolController;

  beforeEach(() => {
    vi.clearAllMocks();

    // Enemy at (100, 100), player far away at (500, 500)
    mockEnemy = createMockEnemy(100, 100);
    mockPlayer = createMockPlayer(500, 500);

    // Create controllers as MainScene does
    detectionController = new DetectionController(mockEnemy, mockPlayer);
    chaseController = new ChaseController(mockEnemy, mockPlayer);
    patrolController = new PatrolController(mockEnemy, 100, 100);

    // Wire detection → chase (same as MainScene)
    detectionController.onDetectionChange(chaseController.handleDetectionEvent);

    // Wire detection → patrol coordination (same as MainScene Task 5)
    detectionController.onDetectionChange((event) => {
      if (event === "PlayerDetected") {
        patrolController.deactivate();
      } else if (event === "PlayerLost") {
        patrolController.activate();
      }
    });
  });

  describe("Start pursuit on PlayerDetected", () => {
    it("should transition ChaseController to Chasing when player enters detection radius", () => {
      // Move player inside detection radius (distance < 80)
      (mockPlayer.getX as ReturnType<typeof vi.fn>).mockReturnValue(150);
      (mockPlayer.getY as ReturnType<typeof vi.fn>).mockReturnValue(100);

      expect(chaseController.getChaseState()).toBe("Inactive");

      detectionController.update();

      expect(chaseController.getChaseState()).toBe("Chasing");
    });

    it("should set the chase target to the player's current position on detection", () => {
      (mockPlayer.getX as ReturnType<typeof vi.fn>).mockReturnValue(150);
      (mockPlayer.getY as ReturnType<typeof vi.fn>).mockReturnValue(120);

      detectionController.update();

      const target = chaseController.getChaseTarget();
      expect(target).not.toBeNull();
      expect(target!.targetX).toBe(150);
      expect(target!.targetY).toBe(120);
    });

    it("should deactivate patrol when player is detected", () => {
      (mockPlayer.getX as ReturnType<typeof vi.fn>).mockReturnValue(150);
      (mockPlayer.getY as ReturnType<typeof vi.fn>).mockReturnValue(100);

      expect(patrolController.isActive()).toBe(true);

      detectionController.update();

      expect(patrolController.isActive()).toBe(false);
    });
  });

  describe("Stop pursuit on PlayerLost", () => {
    it("should transition ChaseController to Inactive when player leaves detection radius", () => {
      // First: detect the player
      (mockPlayer.getX as ReturnType<typeof vi.fn>).mockReturnValue(150);
      (mockPlayer.getY as ReturnType<typeof vi.fn>).mockReturnValue(100);
      detectionController.update();
      expect(chaseController.getChaseState()).toBe("Chasing");

      // Then: player moves far away
      (mockPlayer.getX as ReturnType<typeof vi.fn>).mockReturnValue(500);
      (mockPlayer.getY as ReturnType<typeof vi.fn>).mockReturnValue(500);
      detectionController.update();

      expect(chaseController.getChaseState()).toBe("Inactive");
    });

    it("should clear the chase target when detection is lost", () => {
      // Detect
      (mockPlayer.getX as ReturnType<typeof vi.fn>).mockReturnValue(150);
      (mockPlayer.getY as ReturnType<typeof vi.fn>).mockReturnValue(100);
      detectionController.update();
      expect(chaseController.getChaseTarget()).not.toBeNull();

      // Lose detection
      (mockPlayer.getX as ReturnType<typeof vi.fn>).mockReturnValue(500);
      (mockPlayer.getY as ReturnType<typeof vi.fn>).mockReturnValue(500);
      detectionController.update();

      expect(chaseController.getChaseTarget()).toBeNull();
    });

    it("should reactivate patrol when detection is lost", () => {
      // Detect → patrol deactivated
      (mockPlayer.getX as ReturnType<typeof vi.fn>).mockReturnValue(150);
      (mockPlayer.getY as ReturnType<typeof vi.fn>).mockReturnValue(100);
      detectionController.update();
      expect(patrolController.isActive()).toBe(false);

      // Lose detection → patrol reactivated
      (mockPlayer.getX as ReturnType<typeof vi.fn>).mockReturnValue(500);
      (mockPlayer.getY as ReturnType<typeof vi.fn>).mockReturnValue(500);
      detectionController.update();

      expect(patrolController.isActive()).toBe(true);
    });
  });

  describe("Prevent duplicate chase state transitions", () => {
    it("should not re-enter Chasing state on repeated detection events", () => {
      // Detect the player
      (mockPlayer.getX as ReturnType<typeof vi.fn>).mockReturnValue(150);
      (mockPlayer.getY as ReturnType<typeof vi.fn>).mockReturnValue(100);
      detectionController.update();

      expect(chaseController.getChaseState()).toBe("Chasing");

      // Multiple updates while player remains inside — state should not toggle
      for (let i = 0; i < 10; i++) {
        detectionController.update();
        expect(chaseController.getChaseState()).toBe("Chasing");
      }
    });

    it("should not re-enter Inactive state on repeated loss events", () => {
      // Detect then lose
      (mockPlayer.getX as ReturnType<typeof vi.fn>).mockReturnValue(150);
      (mockPlayer.getY as ReturnType<typeof vi.fn>).mockReturnValue(100);
      detectionController.update();

      (mockPlayer.getX as ReturnType<typeof vi.fn>).mockReturnValue(500);
      (mockPlayer.getY as ReturnType<typeof vi.fn>).mockReturnValue(500);
      detectionController.update();

      expect(chaseController.getChaseState()).toBe("Inactive");

      // Multiple updates while player remains outside — no re-firing
      for (let i = 0; i < 10; i++) {
        detectionController.update();
        expect(chaseController.getChaseState()).toBe("Inactive");
      }
    });
  });

  describe("DetectionController remains responsible only for detection", () => {
    it("should not contain any chase logic references", () => {
      // DetectionController should not have chase-related methods
      expect((detectionController as Record<string, unknown>)["startPursuit"]).toBeUndefined();
      expect((detectionController as Record<string, unknown>)["stopPursuit"]).toBeUndefined();
      expect((detectionController as Record<string, unknown>)["chaseState"]).toBeUndefined();
    });

    it("should only fire detection events without knowledge of chase", () => {
      const detectionListener = vi.fn();
      detectionController.onDetectionChange(detectionListener);

      // Detect player
      (mockPlayer.getX as ReturnType<typeof vi.fn>).mockReturnValue(150);
      (mockPlayer.getY as ReturnType<typeof vi.fn>).mockReturnValue(100);
      detectionController.update();

      // DetectionController only emits detection events
      expect(detectionListener).toHaveBeenCalledWith("PlayerDetected");
      expect(detectionListener).not.toHaveBeenCalledWith("ChaseStarted");
    });
  });

  describe("Full pursuit flow: detect → chase → move → lose → stop", () => {
    it("should move the enemy toward the player during active pursuit", () => {
      // Place player inside detection radius
      (mockPlayer.getX as ReturnType<typeof vi.fn>).mockReturnValue(160);
      (mockPlayer.getY as ReturnType<typeof vi.fn>).mockReturnValue(100);

      // Trigger detection
      detectionController.update();
      expect(chaseController.getChaseState()).toBe("Chasing");

      // Record initial enemy position
      const initialX = mockEnemy.getX();

      // Run a chase update frame (16ms ~ 60fps)
      chaseController.update(16);

      // Enemy should have moved toward the player (rightward)
      const newX = mockEnemy.getX();
      expect(newX).toBeGreaterThan(initialX);
    });

    it("should stop enemy movement when detection is lost", () => {
      // Detect the player and run some chase frames
      (mockPlayer.getX as ReturnType<typeof vi.fn>).mockReturnValue(160);
      (mockPlayer.getY as ReturnType<typeof vi.fn>).mockReturnValue(100);
      detectionController.update();
      chaseController.update(16);

      // Record position after chase
      const positionAfterChase = mockEnemy.getX();

      // Player leaves detection radius
      (mockPlayer.getX as ReturnType<typeof vi.fn>).mockReturnValue(500);
      (mockPlayer.getY as ReturnType<typeof vi.fn>).mockReturnValue(500);
      detectionController.update();

      expect(chaseController.getChaseState()).toBe("Inactive");

      // Calling update should not move the enemy further
      chaseController.update(16);
      expect(mockEnemy.getX()).toBe(positionAfterChase);
    });

    it("should continuously track the player's updated position while chasing", () => {
      // Detect player at (160, 100)
      (mockPlayer.getX as ReturnType<typeof vi.fn>).mockReturnValue(160);
      (mockPlayer.getY as ReturnType<typeof vi.fn>).mockReturnValue(100);
      detectionController.update();

      // Chase a few frames
      chaseController.update(16);
      chaseController.update(16);

      // Player moves to a new position (still inside radius)
      (mockPlayer.getX as ReturnType<typeof vi.fn>).mockReturnValue(170);
      (mockPlayer.getY as ReturnType<typeof vi.fn>).mockReturnValue(110);

      // Chase target should update to new player position on next update
      chaseController.update(16);
      const target = chaseController.getChaseTarget();
      expect(target).not.toBeNull();
      expect(target!.targetX).toBe(170);
      expect(target!.targetY).toBe(110);
    });
  });
});
