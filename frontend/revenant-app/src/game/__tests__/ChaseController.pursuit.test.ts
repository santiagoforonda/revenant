import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ChaseController,
  DEFAULT_CHASE_SPEED,
  CHASE_ARRIVAL_THRESHOLD,
} from "@/game/systems/ChaseController";
import type { Enemy } from "@/game/entities/characters/Enemy";
import type { Player } from "@/game/entities/characters/Player";

/**
 * Unit tests for ChaseController pursuit movement (Task 3).
 *
 * Validates:
 * - Enemy moves toward the player's current position.
 * - Chase target is continuously updated every frame.
 * - Movement stops when pursuit is inactive.
 * - Frame-independent movement using delta time.
 * - Overshooting prevention via arrival threshold.
 * - Multiple enemies can chase simultaneously and independently.
 */

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
 * Creates a mock Enemy with mutable position tracking.
 */
function createMockEnemy(startX: number = 100, startY: number = 100): Enemy {
  let x = startX;
  let y = startY;

  return {
    setState: vi.fn(),
    setDirection: vi.fn(),
    setStateAndDirection: vi.fn(),
    getState: vi.fn().mockReturnValue("idle"),
    getDirection: vi.fn().mockReturnValue("down"),
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

/**
 * Creates a mock Player with mutable position tracking.
 */
function createMockPlayer(startX: number = 300, startY: number = 300): Player {
  let x = startX;
  let y = startY;

  const player = {
    getX: vi.fn(() => x),
    getY: vi.fn(() => y),
    setX: (newX: number) => {
      x = newX;
    },
    setY: (newY: number) => {
      y = newY;
    },
    getSprite: vi.fn(),
    getBody: vi.fn(),
    move: vi.fn(),
    stop: vi.fn(),
    update: vi.fn(),
  } as unknown as Player;

  return player;
}

describe("ChaseController - Player Pursuit (Task 3)", () => {
  let mockEnemy: Enemy;
  let mockPlayer: Player;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEnemy = createMockEnemy(100, 100);
    mockPlayer = createMockPlayer(300, 100);
  });

  describe("Movement Toward Player", () => {
    it("should move the enemy toward the player position", () => {
      const controller = new ChaseController(mockEnemy, mockPlayer);
      controller.handleDetectionEvent("PlayerDetected");

      controller.update(1000); // 1 second at 60px/s = 60px moved

      // Enemy started at (100, 100), player at (300, 100) — purely horizontal
      // After 1 second: enemy should have moved 60px to the right
      expect(mockEnemy.setPosition).toHaveBeenCalled();
      const lastCall = (mockEnemy.setPosition as ReturnType<typeof vi.fn>).mock.calls[
        (mockEnemy.setPosition as ReturnType<typeof vi.fn>).mock.calls.length - 1
      ];
      expect(lastCall[0]).toBeCloseTo(160, 0); // 100 + 60
      expect(lastCall[1]).toBeCloseTo(100, 0); // no vertical movement
    });

    it("should use frame-independent movement based on delta", () => {
      const controller = new ChaseController(mockEnemy, mockPlayer);
      controller.handleDetectionEvent("PlayerDetected");

      // 16ms frame (~60fps), speed = 60px/s
      // Movement = 60 * (16 / 1000) = 0.96px
      controller.update(16);

      expect(mockEnemy.setPosition).toHaveBeenCalled();
      const call = (mockEnemy.setPosition as ReturnType<typeof vi.fn>).mock.calls[0];
      const expectedMove = DEFAULT_CHASE_SPEED * (16 / 1000); // 0.96
      expect(call[0]).toBeCloseTo(100 + expectedMove, 2);
      expect(call[1]).toBeCloseTo(100, 2);
    });

    it("should move diagonally when target is at an angle", () => {
      // Player at (300, 300), enemy at (100, 100) — 45° angle
      mockPlayer = createMockPlayer(300, 300);
      const controller = new ChaseController(mockEnemy, mockPlayer);
      controller.handleDetectionEvent("PlayerDetected");

      controller.update(1000);

      expect(mockEnemy.setPosition).toHaveBeenCalled();
      const call = (mockEnemy.setPosition as ReturnType<typeof vi.fn>).mock.calls[0];
      // Distance = sqrt(200^2 + 200^2) ≈ 282.84
      // Direction: (200/282.84, 200/282.84) ≈ (0.707, 0.707)
      // Move: 60 * 1 = 60px along that direction
      const expectedX = 100 + (200 / Math.sqrt(200 * 200 + 200 * 200)) * 60;
      const expectedY = 100 + (200 / Math.sqrt(200 * 200 + 200 * 200)) * 60;
      expect(call[0]).toBeCloseTo(expectedX, 1);
      expect(call[1]).toBeCloseTo(expectedY, 1);
    });

    it("should not overshoot when distance to target is less than move distance", () => {
      // Place enemy very close to player — just outside threshold
      mockEnemy = createMockEnemy(297, 100);
      mockPlayer = createMockPlayer(300, 100);
      const controller = new ChaseController(mockEnemy, mockPlayer);
      controller.handleDetectionEvent("PlayerDetected");

      // 1 second at 60px/s would normally move 60px, but only 3px away
      controller.update(1000);

      expect(mockEnemy.setPosition).toHaveBeenCalled();
      const call = (mockEnemy.setPosition as ReturnType<typeof vi.fn>).mock.calls[0];
      // Should clamp to remaining distance (3px), not overshoot
      expect(call[0]).toBeCloseTo(300, 1);
      expect(call[1]).toBeCloseTo(100, 1);
    });

    it("should not move when within arrival threshold", () => {
      // Place enemy within threshold distance of player
      mockEnemy = createMockEnemy(300, 100);
      mockPlayer = createMockPlayer(301, 100); // 1px away < CHASE_ARRIVAL_THRESHOLD (2)
      const controller = new ChaseController(mockEnemy, mockPlayer);
      controller.handleDetectionEvent("PlayerDetected");

      controller.update(16);

      // setPosition should NOT be called since within threshold
      expect(mockEnemy.setPosition).not.toHaveBeenCalled();
    });

    it("should respect custom chase speed", () => {
      const customSpeed = 120;
      const controller = new ChaseController(mockEnemy, mockPlayer, customSpeed);
      controller.handleDetectionEvent("PlayerDetected");

      controller.update(1000);

      expect(mockEnemy.setPosition).toHaveBeenCalled();
      const call = (mockEnemy.setPosition as ReturnType<typeof vi.fn>).mock.calls[0];
      // At 120px/s for 1 second, moves 120px toward (300, 100) from (100, 100)
      expect(call[0]).toBeCloseTo(220, 0); // 100 + 120
      expect(call[1]).toBeCloseTo(100, 0);
    });
  });

  describe("Continuous Target Update", () => {
    it("should recalculate movement toward the player every frame", () => {
      const controller = new ChaseController(mockEnemy, mockPlayer);
      controller.handleDetectionEvent("PlayerDetected");

      // First frame: move toward (300, 100)
      controller.update(16);

      // Player moves to a new position
      (mockPlayer as { setX: (x: number) => void }).setX(100);
      (mockPlayer as { setY: (y: number) => void }).setY(300);

      // Second frame: target should now be (100, 300)
      controller.update(16);

      const target = controller.getChaseTarget();
      expect(target).not.toBeNull();
      expect(target!.targetX).toBe(100);
      expect(target!.targetY).toBe(300);
    });

    it("should update chase target every update call", () => {
      const controller = new ChaseController(mockEnemy, mockPlayer);
      controller.handleDetectionEvent("PlayerDetected");

      controller.update(16);
      let target = controller.getChaseTarget();
      expect(target!.targetX).toBe(300);
      expect(target!.targetY).toBe(100);

      // Move the player
      (mockPlayer as { setX: (x: number) => void }).setX(500);
      (mockPlayer as { setY: (y: number) => void }).setY(500);

      controller.update(16);
      target = controller.getChaseTarget();
      expect(target!.targetX).toBe(500);
      expect(target!.targetY).toBe(500);
    });
  });

  describe("Stop Movement When Inactive", () => {
    it("should not move the enemy when chase state is Inactive", () => {
      const controller = new ChaseController(mockEnemy, mockPlayer);

      controller.update(16);

      expect(mockEnemy.setPosition).not.toHaveBeenCalled();
    });

    it("should stop moving after PlayerLost event", () => {
      const controller = new ChaseController(mockEnemy, mockPlayer);
      controller.handleDetectionEvent("PlayerDetected");

      // First frame: enemy moves
      controller.update(16);
      expect(mockEnemy.setPosition).toHaveBeenCalled();

      // Clear mock and stop pursuit
      (mockEnemy.setPosition as ReturnType<typeof vi.fn>).mockClear();
      controller.handleDetectionEvent("PlayerLost");

      // Next frame: enemy should NOT move
      controller.update(16);
      expect(mockEnemy.setPosition).not.toHaveBeenCalled();
    });

    it("should not update the chase target when inactive", () => {
      const controller = new ChaseController(mockEnemy, mockPlayer);

      controller.update(16);

      expect(controller.getChaseTarget()).toBeNull();
    });
  });

  describe("Multiple Enemies Simultaneous Pursuit", () => {
    it("should allow multiple enemies to chase independently", () => {
      const enemy1 = createMockEnemy(0, 0);
      const enemy2 = createMockEnemy(200, 200);

      const controller1 = new ChaseController(enemy1, mockPlayer);
      const controller2 = new ChaseController(enemy2, mockPlayer);

      controller1.handleDetectionEvent("PlayerDetected");
      controller2.handleDetectionEvent("PlayerDetected");

      controller1.update(16);
      controller2.update(16);

      // Both enemies should have moved
      expect(enemy1.setPosition).toHaveBeenCalled();
      expect(enemy2.setPosition).toHaveBeenCalled();

      // They should move toward different positions relative to their start
      const call1 = (enemy1.setPosition as ReturnType<typeof vi.fn>).mock.calls[0];
      const call2 = (enemy2.setPosition as ReturnType<typeof vi.fn>).mock.calls[0];

      // enemy1 starts at (0, 0), enemy2 starts at (200, 200) — they should be at different positions
      expect(call1[0]).not.toBeCloseTo(call2[0], 0);
    });

    it("should allow one enemy to stop while another continues", () => {
      const enemy1 = createMockEnemy(0, 0);
      const enemy2 = createMockEnemy(200, 200);

      const controller1 = new ChaseController(enemy1, mockPlayer);
      const controller2 = new ChaseController(enemy2, mockPlayer);

      controller1.handleDetectionEvent("PlayerDetected");
      controller2.handleDetectionEvent("PlayerDetected");

      // Stop enemy1
      controller1.handleDetectionEvent("PlayerLost");
      (enemy1.setPosition as ReturnType<typeof vi.fn>).mockClear();
      (enemy2.setPosition as ReturnType<typeof vi.fn>).mockClear();

      controller1.update(16);
      controller2.update(16);

      // Only enemy2 should move
      expect(enemy1.setPosition).not.toHaveBeenCalled();
      expect(enemy2.setPosition).toHaveBeenCalled();
    });
  });
});
