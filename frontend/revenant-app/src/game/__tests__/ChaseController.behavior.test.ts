import { describe, it, expect, vi, beforeEach } from "vitest";
import { DetectionController } from "@/game/systems/DetectionController";
import {
  ChaseController,
  DEFAULT_CHASE_SPEED,
} from "@/game/systems/ChaseController";
import type { Enemy } from "@/game/entities/characters/Enemy";
import type { Player } from "@/game/entities/characters/Player";

/**
 * End-to-end behavioral validation tests for Enemy Chase (Task 7).
 *
 * Validates the 5 key behavioral scenarios:
 * a) Enemies begin chasing immediately after detection.
 * b) Pursuit continuously follows the player's current position.
 * c) Pursuit stops immediately after detection loss.
 * d) Multiple enemies chase the player independently.
 * e) Movement remains smooth during continuous player movement.
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
 * Creates a mock Enemy entity with mutable position tracking.
 */
function createMockEnemy(startX: number, startY: number): Enemy {
  let posX = startX;
  let posY = startY;

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
 * Creates a mock Player entity with mutable position via mock return values.
 */
function createMockPlayer(startX: number, startY: number): Player {
  let posX = startX;
  let posY = startY;

  const player = {
    getX: vi.fn(() => posX),
    getY: vi.fn(() => posY),
    _setPos: (x: number, y: number) => {
      posX = x;
      posY = y;
    },
    getSprite: vi.fn(),
    getBody: vi.fn(),
    move: vi.fn(),
    stop: vi.fn(),
    update: vi.fn(),
  } as unknown as Player & { _setPos: (x: number, y: number) => void };

  return player;
}

describe("Chase Behavior Validation (Task 7)", () => {
  describe("a) Enemies begin chasing immediately after detection", () => {
    it("should transition to Chasing and move enemy on the very next update after detection", () => {
      const enemy = createMockEnemy(100, 100);
      const player = createMockPlayer(130, 100);
      const detectionController = new DetectionController(enemy, player, 80);
      const chaseController = new ChaseController(enemy, player);

      // Wire detection → chase
      detectionController.onDetectionChange(chaseController.handleDetectionEvent);

      // Verify initial state
      expect(chaseController.getChaseState()).toBe("Inactive");

      // Player is at distance 30 (within radius 80) → detection fires
      detectionController.update();

      // Chase state should immediately be Chasing
      expect(chaseController.getChaseState()).toBe("Chasing");
      expect(chaseController.getChaseTarget()).not.toBeNull();

      // Enemy position starts moving on the very next update
      const initialX = enemy.getX();
      chaseController.update(16);

      expect(enemy.getX()).toBeGreaterThan(initialX);
    });

    it("should set enemy to walking state immediately on detection", () => {
      const enemy = createMockEnemy(100, 100);
      const player = createMockPlayer(150, 100);
      const detectionController = new DetectionController(enemy, player, 80);
      const chaseController = new ChaseController(enemy, player);

      detectionController.onDetectionChange(chaseController.handleDetectionEvent);

      detectionController.update();

      expect(enemy.setState).toHaveBeenCalledWith("walking");
    });

    it("should store the player's current position as chase target at the moment of detection", () => {
      const enemy = createMockEnemy(100, 100);
      const player = createMockPlayer(140, 120);
      const detectionController = new DetectionController(enemy, player, 80);
      const chaseController = new ChaseController(enemy, player);

      detectionController.onDetectionChange(chaseController.handleDetectionEvent);

      detectionController.update();

      const target = chaseController.getChaseTarget();
      expect(target).not.toBeNull();
      expect(target!.targetX).toBe(140);
      expect(target!.targetY).toBe(120);
    });
  });

  describe("b) Pursuit continuously follows the player's current position", () => {
    it("should update chase target every frame as the player moves", () => {
      const enemy = createMockEnemy(100, 100);
      const player = createMockPlayer(150, 100) as Player & { _setPos: (x: number, y: number) => void };
      const detectionController = new DetectionController(enemy, player, 80);
      const chaseController = new ChaseController(enemy, player);

      detectionController.onDetectionChange(chaseController.handleDetectionEvent);
      detectionController.update();

      // Run multiple frames with player moving each frame
      const playerPositions: Array<{ x: number; y: number }> = [
        { x: 160, y: 100 },
        { x: 170, y: 110 },
        { x: 180, y: 120 },
        { x: 190, y: 130 },
        { x: 200, y: 140 },
      ];

      for (const pos of playerPositions) {
        player._setPos(pos.x, pos.y);
        chaseController.update(16);

        const target = chaseController.getChaseTarget();
        expect(target).not.toBeNull();
        expect(target!.targetX).toBe(pos.x);
        expect(target!.targetY).toBe(pos.y);
      }
    });

    it("should converge enemy toward the moving player over multiple frames", () => {
      const enemy = createMockEnemy(100, 100);
      const player = createMockPlayer(200, 100) as Player & { _setPos: (x: number, y: number) => void };
      const detectionController = new DetectionController(enemy, player, 150);
      const chaseController = new ChaseController(enemy, player);

      detectionController.onDetectionChange(chaseController.handleDetectionEvent);
      detectionController.update();

      // Run 30 frames — enemy should get closer to the player
      const initialDistance = Math.abs(enemy.getX() - 200);

      for (let i = 0; i < 30; i++) {
        chaseController.update(16);
      }

      const finalDistance = Math.abs(enemy.getX() - 200);
      expect(finalDistance).toBeLessThan(initialDistance);
    });

    it("should continuously track future player movement even after reaching initial position", () => {
      const enemy = createMockEnemy(100, 100);
      // Player starts close so enemy can reach it quickly
      const player = createMockPlayer(105, 100) as Player & { _setPos: (x: number, y: number) => void };
      const detectionController = new DetectionController(enemy, player, 80);
      const chaseController = new ChaseController(enemy, player);

      detectionController.onDetectionChange(chaseController.handleDetectionEvent);
      detectionController.update();

      // Let enemy reach initial target (within arrival threshold)
      chaseController.update(1000);

      // Move player to a new position
      player._setPos(200, 200);
      chaseController.update(16);

      // Chase target should be updated to new position
      const target = chaseController.getChaseTarget();
      expect(target).not.toBeNull();
      expect(target!.targetX).toBe(200);
      expect(target!.targetY).toBe(200);
    });
  });

  describe("c) Pursuit stops immediately after detection loss", () => {
    it("should stop chase state immediately when player leaves detection radius", () => {
      const enemy = createMockEnemy(100, 100);
      const player = createMockPlayer(150, 100) as Player & { _setPos: (x: number, y: number) => void };
      const detectionController = new DetectionController(enemy, player, 80);
      const chaseController = new ChaseController(enemy, player);

      detectionController.onDetectionChange(chaseController.handleDetectionEvent);

      // Detect player
      detectionController.update();
      expect(chaseController.getChaseState()).toBe("Chasing");

      // Player leaves detection radius (moves far away)
      player._setPos(500, 500);
      detectionController.update();

      // Chase should stop immediately
      expect(chaseController.getChaseState()).toBe("Inactive");
      expect(chaseController.getChaseTarget()).toBeNull();
    });

    it("should not move enemy on subsequent updates after detection loss", () => {
      const enemy = createMockEnemy(100, 100);
      const player = createMockPlayer(150, 100) as Player & { _setPos: (x: number, y: number) => void };
      const detectionController = new DetectionController(enemy, player, 80);
      const chaseController = new ChaseController(enemy, player);

      detectionController.onDetectionChange(chaseController.handleDetectionEvent);

      // Detect and chase a bit
      detectionController.update();
      chaseController.update(16);

      // Lose detection
      player._setPos(500, 500);
      detectionController.update();

      // Record position after loss
      const posAfterLoss = { x: enemy.getX(), y: enemy.getY() };

      // Run multiple subsequent update frames
      for (let i = 0; i < 10; i++) {
        chaseController.update(16);
      }

      // Enemy should not have moved
      expect(enemy.getX()).toBe(posAfterLoss.x);
      expect(enemy.getY()).toBe(posAfterLoss.y);
    });

    it("should set enemy back to idle state on detection loss", () => {
      const enemy = createMockEnemy(100, 100);
      const player = createMockPlayer(150, 100) as Player & { _setPos: (x: number, y: number) => void };
      const detectionController = new DetectionController(enemy, player, 80);
      const chaseController = new ChaseController(enemy, player);

      detectionController.onDetectionChange(chaseController.handleDetectionEvent);

      // Detect
      detectionController.update();
      expect(enemy.setState).toHaveBeenCalledWith("walking");

      vi.clearAllMocks();

      // Lose detection
      player._setPos(500, 500);
      detectionController.update();

      expect(enemy.setState).toHaveBeenCalledWith("idle");
    });
  });

  describe("d) Multiple enemies chase the player independently", () => {
    it("should only chase with detected enemies, not undetected ones", () => {
      const player = createMockPlayer(200, 200) as Player & { _setPos: (x: number, y: number) => void };

      // Enemy1: close to player (within radius 80)
      const enemy1 = createMockEnemy(160, 200);
      // Enemy2: far from player (outside radius 80)
      const enemy2 = createMockEnemy(400, 400);
      // Enemy3: close to player (within radius 80)
      const enemy3 = createMockEnemy(200, 160);

      const detection1 = new DetectionController(enemy1, player, 80);
      const detection2 = new DetectionController(enemy2, player, 80);
      const detection3 = new DetectionController(enemy3, player, 80);

      const chase1 = new ChaseController(enemy1, player);
      const chase2 = new ChaseController(enemy2, player);
      const chase3 = new ChaseController(enemy3, player);

      detection1.onDetectionChange(chase1.handleDetectionEvent);
      detection2.onDetectionChange(chase2.handleDetectionEvent);
      detection3.onDetectionChange(chase3.handleDetectionEvent);

      // Update all detection controllers
      detection1.update();
      detection2.update();
      detection3.update();

      // Only enemy1 and enemy3 should be chasing
      expect(chase1.getChaseState()).toBe("Chasing");
      expect(chase2.getChaseState()).toBe("Inactive");
      expect(chase3.getChaseState()).toBe("Chasing");

      // Update chase controllers
      chase1.update(16);
      chase2.update(16);
      chase3.update(16);

      // Only enemy1 and enemy3 should have moved
      expect(enemy1.setPosition).toHaveBeenCalled();
      expect(enemy2.setPosition).not.toHaveBeenCalled();
      expect(enemy3.setPosition).toHaveBeenCalled();
    });

    it("should allow one enemy to stop chasing while others continue", () => {
      const player = createMockPlayer(200, 200) as Player & { _setPos: (x: number, y: number) => void };

      // All three enemies close to player
      const enemy1 = createMockEnemy(160, 200);
      const enemy2 = createMockEnemy(200, 160);
      const enemy3 = createMockEnemy(240, 200);

      const detection1 = new DetectionController(enemy1, player, 80);
      const detection2 = new DetectionController(enemy2, player, 80);
      const detection3 = new DetectionController(enemy3, player, 80);

      const chase1 = new ChaseController(enemy1, player);
      const chase2 = new ChaseController(enemy2, player);
      const chase3 = new ChaseController(enemy3, player);

      detection1.onDetectionChange(chase1.handleDetectionEvent);
      detection2.onDetectionChange(chase2.handleDetectionEvent);
      detection3.onDetectionChange(chase3.handleDetectionEvent);

      // Detect all three
      detection1.update();
      detection2.update();
      detection3.update();

      expect(chase1.getChaseState()).toBe("Chasing");
      expect(chase2.getChaseState()).toBe("Chasing");
      expect(chase3.getChaseState()).toBe("Chasing");

      // Now enemy2 loses detection (simulate by manually firing event)
      chase2.handleDetectionEvent("PlayerLost");

      // Clear setPosition mocks
      (enemy1.setPosition as ReturnType<typeof vi.fn>).mockClear();
      (enemy2.setPosition as ReturnType<typeof vi.fn>).mockClear();
      (enemy3.setPosition as ReturnType<typeof vi.fn>).mockClear();

      // Run update on all chase controllers
      chase1.update(16);
      chase2.update(16);
      chase3.update(16);

      // Enemy2 should have stopped, others continue
      expect(chase1.getChaseState()).toBe("Chasing");
      expect(chase2.getChaseState()).toBe("Inactive");
      expect(chase3.getChaseState()).toBe("Chasing");

      expect(enemy1.setPosition).toHaveBeenCalled();
      expect(enemy2.setPosition).not.toHaveBeenCalled();
      expect(enemy3.setPosition).toHaveBeenCalled();
    });

    it("should allow each enemy to have independent chase targets", () => {
      const player = createMockPlayer(200, 200) as Player & { _setPos: (x: number, y: number) => void };

      const enemy1 = createMockEnemy(100, 200);
      const enemy2 = createMockEnemy(200, 300);

      const detection1 = new DetectionController(enemy1, player, 150);
      const detection2 = new DetectionController(enemy2, player, 150);

      const chase1 = new ChaseController(enemy1, player);
      const chase2 = new ChaseController(enemy2, player);

      detection1.onDetectionChange(chase1.handleDetectionEvent);
      detection2.onDetectionChange(chase2.handleDetectionEvent);

      detection1.update();
      detection2.update();

      chase1.update(16);
      chase2.update(16);

      // Both should have the same target (the player)
      const target1 = chase1.getChaseTarget();
      const target2 = chase2.getChaseTarget();
      expect(target1!.targetX).toBe(200);
      expect(target1!.targetY).toBe(200);
      expect(target2!.targetX).toBe(200);
      expect(target2!.targetY).toBe(200);

      // But their positions should differ since they started at different locations
      expect(enemy1.getX()).not.toBe(enemy2.getX());
    });
  });

  describe("e) Movement remains smooth during continuous player movement", () => {
    it("should move the enemy consistently every frame over 60 frames", () => {
      const enemy = createMockEnemy(0, 0);
      // Player far enough that enemy won't reach it in 60 frames
      const player = createMockPlayer(500, 0) as Player & { _setPos: (x: number, y: number) => void };
      const detectionController = new DetectionController(enemy, player, 600);
      const chaseController = new ChaseController(enemy, player);

      detectionController.onDetectionChange(chaseController.handleDetectionEvent);
      detectionController.update();

      const deltaMs = 16.67; // ~60fps
      const expectedMovePerFrame = DEFAULT_CHASE_SPEED * (deltaMs / 1000);
      const tolerance = 0.5; // small tolerance for floating-point precision

      let previousX = enemy.getX();

      for (let frame = 0; frame < 60; frame++) {
        chaseController.update(deltaMs);

        const currentX = enemy.getX();
        const frameDelta = currentX - previousX;

        // Movement should be approximately consistent each frame
        expect(frameDelta).toBeGreaterThan(0);
        expect(frameDelta).toBeCloseTo(expectedMovePerFrame, 0);
        expect(Math.abs(frameDelta - expectedMovePerFrame)).toBeLessThanOrEqual(tolerance);

        previousX = currentX;
      }
    });

    it("should produce no NaN values during 60 frames of movement", () => {
      const enemy = createMockEnemy(100, 100);
      const player = createMockPlayer(400, 300) as Player & { _setPos: (x: number, y: number) => void };
      const detectionController = new DetectionController(enemy, player, 500);
      const chaseController = new ChaseController(enemy, player);

      detectionController.onDetectionChange(chaseController.handleDetectionEvent);
      detectionController.update();

      // Simulate player moving each frame
      let playerX = 400;
      let playerY = 300;

      for (let frame = 0; frame < 60; frame++) {
        // Move player slightly each frame
        playerX += 2;
        playerY += 1;
        player._setPos(playerX, playerY);

        chaseController.update(16.67);

        const enemyX = enemy.getX();
        const enemyY = enemy.getY();

        expect(Number.isNaN(enemyX)).toBe(false);
        expect(Number.isNaN(enemyY)).toBe(false);
        expect(Number.isFinite(enemyX)).toBe(true);
        expect(Number.isFinite(enemyY)).toBe(true);
      }
    });

    it("should produce no teleportation jumps during continuous movement", () => {
      const enemy = createMockEnemy(0, 0);
      const player = createMockPlayer(300, 300) as Player & { _setPos: (x: number, y: number) => void };
      const detectionController = new DetectionController(enemy, player, 500);
      const chaseController = new ChaseController(enemy, player);

      detectionController.onDetectionChange(chaseController.handleDetectionEvent);
      detectionController.update();

      const deltaMs = 16.67;
      // Maximum distance the enemy can move in one frame
      const maxFrameDistance = DEFAULT_CHASE_SPEED * (deltaMs / 1000) + 0.01; // small epsilon

      let prevX = enemy.getX();
      let prevY = enemy.getY();

      // Move player each frame to simulate continuous player movement
      let playerX = 300;
      let playerY = 300;

      for (let frame = 0; frame < 60; frame++) {
        playerX += 1.5;
        playerY -= 0.5;
        player._setPos(playerX, playerY);

        chaseController.update(deltaMs);

        const currX = enemy.getX();
        const currY = enemy.getY();

        const frameDist = Math.sqrt(
          (currX - prevX) * (currX - prevX) + (currY - prevY) * (currY - prevY)
        );

        // No teleportation: distance per frame should not exceed max possible move
        expect(frameDist).toBeLessThanOrEqual(maxFrameDistance);

        prevX = currX;
        prevY = currY;
      }
    });

    it("should maintain approximately consistent speed throughout 60 frames", () => {
      const enemy = createMockEnemy(0, 0);
      const player = createMockPlayer(1000, 0) as Player & { _setPos: (x: number, y: number) => void };
      const detectionController = new DetectionController(enemy, player, 1200);
      const chaseController = new ChaseController(enemy, player);

      detectionController.onDetectionChange(chaseController.handleDetectionEvent);
      detectionController.update();

      const deltaMs = 16.67;
      const expectedDistance = DEFAULT_CHASE_SPEED * (deltaMs / 1000);
      const frameMoves: number[] = [];

      let prevX = enemy.getX();
      let prevY = enemy.getY();

      for (let frame = 0; frame < 60; frame++) {
        chaseController.update(deltaMs);

        const currX = enemy.getX();
        const currY = enemy.getY();
        const dist = Math.sqrt(
          (currX - prevX) * (currX - prevX) + (currY - prevY) * (currY - prevY)
        );
        frameMoves.push(dist);

        prevX = currX;
        prevY = currY;
      }

      // All frame movements should be approximately equal
      for (const move of frameMoves) {
        expect(move).toBeCloseTo(expectedDistance, 1);
      }
    });
  });
});
