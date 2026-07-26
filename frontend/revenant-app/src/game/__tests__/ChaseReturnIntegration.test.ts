import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReturnController } from "@/game/systems/ReturnController";
import { ChaseController } from "@/game/systems/ChaseController";
import { DetectionController } from "@/game/systems/DetectionController";
import type { Enemy } from "@/game/entities/characters/Enemy";
import type { Player } from "@/game/entities/characters/Player";
import type { PatrolController } from "@/game/systems/PatrolController";

/**
 * Integration tests for Chase ↔ Return coordination (Task 5).
 *
 * Validates:
 * - PlayerLost transitions ReturnController to Returning and ChaseController to Inactive.
 * - PlayerDetected during return cancels the return and starts chase.
 * - Chase and Return are never both active simultaneously.
 * - Duplicate events don't cause issues.
 * - DetectionController correctly wires to both Chase and Return controllers.
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
 * Creates a mock Player entity with position tracking.
 */
function createMockPlayer(x: number = 50, y: number = 50): Player {
  let currentX = x;
  let currentY = y;

  return {
    getX: vi.fn(() => currentX),
    getY: vi.fn(() => currentY),
    setPosition: vi.fn((newX: number, newY: number) => {
      currentX = newX;
      currentY = newY;
    }),
    move: vi.fn(),
    stop: vi.fn(),
    getSprite: vi.fn(),
    getBody: vi.fn(),
    update: vi.fn(),
  } as unknown as Player;
}

/**
 * Creates a mock PatrolController.
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

describe("Chase ↔ Return Integration (Task 5)", () => {
  let mockEnemy: Enemy;
  let mockPlayer: Player;
  let mockPatrolController: PatrolController;
  let chaseController: ChaseController;
  let returnController: ReturnController;

  const spawnX = 500;
  const spawnY = 600;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEnemy = createMockEnemy(100, 200);
    mockPlayer = createMockPlayer(50, 50);
    mockPatrolController = createMockPatrolController();

    chaseController = new ChaseController(mockEnemy, mockPlayer);
    returnController = new ReturnController(mockEnemy, spawnX, spawnY, mockPatrolController);
  });

  describe("PlayerLost transitions", () => {
    it("should transition ReturnController to Returning and ChaseController to Inactive on PlayerLost", () => {
      // Simulate a chase first
      chaseController.handleDetectionEvent("PlayerDetected");
      expect(chaseController.getChaseState()).toBe("Chasing");
      expect(returnController.getReturnState()).toBe("Inactive");

      // Player escapes detection
      chaseController.handleDetectionEvent("PlayerLost");
      returnController.handleDetectionEvent("PlayerLost");

      expect(chaseController.getChaseState()).toBe("Inactive");
      expect(returnController.getReturnState()).toBe("Returning");
    });

    it("should set enemy to walking state when return starts after chase ends", () => {
      chaseController.handleDetectionEvent("PlayerDetected");
      (mockEnemy.setState as ReturnType<typeof vi.fn>).mockClear();

      chaseController.handleDetectionEvent("PlayerLost");
      returnController.handleDetectionEvent("PlayerLost");

      // ChaseController sets idle, then ReturnController sets walking
      expect(mockEnemy.setState).toHaveBeenCalledWith("idle");
      expect(mockEnemy.setState).toHaveBeenCalledWith("walking");
    });
  });

  describe("PlayerDetected during return", () => {
    it("should cancel return and start chase when PlayerDetected fires during return", () => {
      // Start returning
      returnController.handleDetectionEvent("PlayerLost");
      expect(returnController.getReturnState()).toBe("Returning");

      // Player re-detected
      chaseController.handleDetectionEvent("PlayerDetected");
      returnController.handleDetectionEvent("PlayerDetected");

      expect(chaseController.getChaseState()).toBe("Chasing");
      expect(returnController.getReturnState()).toBe("Inactive");
    });

    it("should stop return movement when chase resumes", () => {
      returnController.handleDetectionEvent("PlayerLost");
      returnController.update(16); // Move a bit

      (mockEnemy.setPosition as ReturnType<typeof vi.fn>).mockClear();

      // Player re-detected: cancel return
      returnController.handleDetectionEvent("PlayerDetected");
      returnController.update(16);

      // No more movement from return controller
      expect(mockEnemy.setPosition).not.toHaveBeenCalled();
    });
  });

  describe("Mutual exclusivity", () => {
    it("should never have both Chase and Return active simultaneously", () => {
      // Initial state: both inactive
      expect(chaseController.getChaseState()).toBe("Inactive");
      expect(returnController.getReturnState()).toBe("Inactive");

      // Chase starts
      chaseController.handleDetectionEvent("PlayerDetected");
      returnController.handleDetectionEvent("PlayerDetected");
      expect(chaseController.getChaseState()).toBe("Chasing");
      expect(returnController.getReturnState()).toBe("Inactive");

      // Chase ends, return starts
      chaseController.handleDetectionEvent("PlayerLost");
      returnController.handleDetectionEvent("PlayerLost");
      expect(chaseController.getChaseState()).toBe("Inactive");
      expect(returnController.getReturnState()).toBe("Returning");

      // Player re-detected: return cancels, chase starts
      chaseController.handleDetectionEvent("PlayerDetected");
      returnController.handleDetectionEvent("PlayerDetected");
      expect(chaseController.getChaseState()).toBe("Chasing");
      expect(returnController.getReturnState()).toBe("Inactive");
    });

    it("should maintain exclusivity across multiple chase-return cycles", () => {
      for (let i = 0; i < 5; i++) {
        // Start chase
        chaseController.handleDetectionEvent("PlayerDetected");
        returnController.handleDetectionEvent("PlayerDetected");
        expect(chaseController.getChaseState()).toBe("Chasing");
        expect(returnController.getReturnState()).toBe("Inactive");

        // End chase, start return
        chaseController.handleDetectionEvent("PlayerLost");
        returnController.handleDetectionEvent("PlayerLost");
        expect(chaseController.getChaseState()).toBe("Inactive");
        expect(returnController.getReturnState()).toBe("Returning");
      }
    });
  });

  describe("Duplicate events", () => {
    it("should handle duplicate PlayerLost events without issues", () => {
      chaseController.handleDetectionEvent("PlayerLost");
      returnController.handleDetectionEvent("PlayerLost");

      // Fire duplicate
      chaseController.handleDetectionEvent("PlayerLost");
      returnController.handleDetectionEvent("PlayerLost");

      expect(chaseController.getChaseState()).toBe("Inactive");
      expect(returnController.getReturnState()).toBe("Returning");

      // setState should only be called once for each controller (guards prevent duplicates)
      const setStateCalls = (mockEnemy.setState as ReturnType<typeof vi.fn>).mock.calls;
      const walkingCalls = setStateCalls.filter((c: string[]) => c[0] === "walking");
      expect(walkingCalls.length).toBe(1);
    });

    it("should handle duplicate PlayerDetected events without issues", () => {
      chaseController.handleDetectionEvent("PlayerDetected");
      returnController.handleDetectionEvent("PlayerDetected");

      // Fire duplicate
      chaseController.handleDetectionEvent("PlayerDetected");
      returnController.handleDetectionEvent("PlayerDetected");

      expect(chaseController.getChaseState()).toBe("Chasing");
      expect(returnController.getReturnState()).toBe("Inactive");
    });

    it("should handle rapid alternating events without corrupting state", () => {
      const events: Array<"PlayerDetected" | "PlayerLost"> = [
        "PlayerDetected",
        "PlayerLost",
        "PlayerDetected",
        "PlayerLost",
        "PlayerDetected",
      ];

      for (const event of events) {
        chaseController.handleDetectionEvent(event);
        returnController.handleDetectionEvent(event);
      }

      // Final state after PlayerDetected
      expect(chaseController.getChaseState()).toBe("Chasing");
      expect(returnController.getReturnState()).toBe("Inactive");
    });
  });

  describe("DetectionController wiring", () => {
    it("should correctly route PlayerDetected to chase and return via DetectionController", () => {
      const detectionController = new DetectionController(mockEnemy, mockPlayer, 80);

      // Wire detection → chase and detection → return (mirrors MainScene)
      detectionController.onDetectionChange(chaseController.handleDetectionEvent);
      detectionController.onDetectionChange(returnController.handleDetectionEvent);

      // Simulate player entering detection radius
      // Place player within range
      (mockPlayer.getX as ReturnType<typeof vi.fn>).mockReturnValue(110);
      (mockPlayer.getY as ReturnType<typeof vi.fn>).mockReturnValue(210);
      detectionController.update();

      expect(chaseController.getChaseState()).toBe("Chasing");
      expect(returnController.getReturnState()).toBe("Inactive");
    });

    it("should correctly route PlayerLost to chase and return via DetectionController", () => {
      const detectionController = new DetectionController(mockEnemy, mockPlayer, 80);

      detectionController.onDetectionChange(chaseController.handleDetectionEvent);
      detectionController.onDetectionChange(returnController.handleDetectionEvent);

      // First detect the player
      (mockPlayer.getX as ReturnType<typeof vi.fn>).mockReturnValue(110);
      (mockPlayer.getY as ReturnType<typeof vi.fn>).mockReturnValue(210);
      detectionController.update();

      expect(chaseController.getChaseState()).toBe("Chasing");

      // Now player moves out of range
      (mockPlayer.getX as ReturnType<typeof vi.fn>).mockReturnValue(1000);
      (mockPlayer.getY as ReturnType<typeof vi.fn>).mockReturnValue(1000);
      detectionController.update();

      expect(chaseController.getChaseState()).toBe("Inactive");
      expect(returnController.getReturnState()).toBe("Returning");
    });

    it("should coordinate patrol deactivation with detection wiring", () => {
      const detectionController = new DetectionController(mockEnemy, mockPlayer, 80);

      detectionController.onDetectionChange(chaseController.handleDetectionEvent);
      detectionController.onDetectionChange(returnController.handleDetectionEvent);
      detectionController.onDetectionChange((event) => {
        if (event === "PlayerDetected") {
          mockPatrolController.deactivate();
        }
      });

      // Detect player
      (mockPlayer.getX as ReturnType<typeof vi.fn>).mockReturnValue(110);
      (mockPlayer.getY as ReturnType<typeof vi.fn>).mockReturnValue(210);
      detectionController.update();

      expect(mockPatrolController.deactivate).toHaveBeenCalled();
      expect(chaseController.getChaseState()).toBe("Chasing");
      expect(returnController.getReturnState()).toBe("Inactive");
    });
  });

  describe("ChaseController responsibility isolation", () => {
    it("should not contain any return logic in ChaseController", () => {
      // ChaseController only has chase-related methods
      expect(chaseController.getChaseState).toBeDefined();
      expect(chaseController.getChaseTarget).toBeDefined();
      expect(chaseController.getChaseSpeed).toBeDefined();
      expect(chaseController.handleDetectionEvent).toBeDefined();

      // No return-related properties
      expect((chaseController as Record<string, unknown>)["returnState"]).toBeUndefined();
      expect((chaseController as Record<string, unknown>)["returnTarget"]).toBeUndefined();
      expect((chaseController as Record<string, unknown>)["startReturn"]).toBeUndefined();
      expect((chaseController as Record<string, unknown>)["cancelReturn"]).toBeUndefined();
    });

    it("should only manage pursuit — stops on PlayerLost without initiating return", () => {
      chaseController.handleDetectionEvent("PlayerDetected");
      expect(chaseController.getChaseState()).toBe("Chasing");

      chaseController.handleDetectionEvent("PlayerLost");
      expect(chaseController.getChaseState()).toBe("Inactive");
      expect(chaseController.getChaseTarget()).toBeNull();

      // ChaseController does nothing further — return is ReturnController's job
    });
  });
});
