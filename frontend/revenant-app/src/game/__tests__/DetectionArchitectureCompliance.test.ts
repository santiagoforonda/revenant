import { describe, it, expect, vi, beforeEach } from "vitest";
import { DetectionController } from "@/game/systems/DetectionController";
import type { Enemy } from "@/game/entities/characters/Enemy";
import type { Player } from "@/game/entities/characters/Player";
import { readFileSync } from "fs";
import { resolve } from "path";

/**
 * Architecture Compliance Tests for Enemy Detection (Task 8).
 *
 * Validates:
 * - Detection events occur only once per state transition.
 * - Duplicate detection events never occur.
 * - MainScene contains no detection logic.
 * - Enemy Detection remains reusable by future Chase, Return, and Combat modules.
 * - The feature remains independent from backend communication, pathfinding, and combat.
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

describe("DetectionController - Architecture Compliance", () => {
  let mockEnemy: Enemy;
  let mockPlayer: Player;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEnemy = createMockEnemy(100, 100);
    mockPlayer = createMockPlayer(500, 500);
  });

  describe("Events occur once per state transition", () => {
    it("should emit PlayerDetected exactly once when player enters radius and update is called multiple times", () => {
      // Place player inside radius (distance = 50, radius = 80)
      const player = createMockPlayer(150, 100);
      const controller = new DetectionController(mockEnemy, player);
      const listener = vi.fn();
      controller.onDetectionChange(listener);

      // Call update 10 times with player inside
      for (let i = 0; i < 10; i++) {
        controller.update();
      }

      // PlayerDetected should be emitted exactly once
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith("PlayerDetected");
    });

    it("should emit PlayerLost exactly once when player leaves radius and update is called multiple times", () => {
      // Place player inside radius initially
      const player = createMockPlayer(150, 100);
      const controller = new DetectionController(mockEnemy, player);
      const listener = vi.fn();
      controller.onDetectionChange(listener);

      // Detect the player
      controller.update();
      expect(listener).toHaveBeenCalledWith("PlayerDetected");

      // Move player outside radius
      (player.getX as ReturnType<typeof vi.fn>).mockReturnValue(500);
      (player.getY as ReturnType<typeof vi.fn>).mockReturnValue(500);

      // Call update 10 times with player outside
      for (let i = 0; i < 10; i++) {
        controller.update();
      }

      // Should have been called exactly twice total: PlayerDetected + PlayerLost
      expect(listener).toHaveBeenCalledTimes(2);
      expect(listener).toHaveBeenNthCalledWith(1, "PlayerDetected");
      expect(listener).toHaveBeenNthCalledWith(2, "PlayerLost");
    });
  });

  describe("Duplicate detection events never occur", () => {
    it("should never emit consecutive duplicate events across rapid position alternations", () => {
      const player = createMockPlayer(150, 100);
      const controller = new DetectionController(mockEnemy, player);
      const events: string[] = [];
      controller.onDetectionChange((event) => events.push(event));

      // Rapidly alternate player position in/out across 100 frames
      for (let i = 0; i < 100; i++) {
        if (i % 2 === 0) {
          // Inside radius (distance ~50)
          (player.getX as ReturnType<typeof vi.fn>).mockReturnValue(150);
          (player.getY as ReturnType<typeof vi.fn>).mockReturnValue(100);
        } else {
          // Outside radius (distance ~566)
          (player.getX as ReturnType<typeof vi.fn>).mockReturnValue(500);
          (player.getY as ReturnType<typeof vi.fn>).mockReturnValue(500);
        }
        controller.update();
      }

      // Verify no consecutive duplicates: each PlayerDetected must be followed by PlayerLost
      for (let i = 1; i < events.length; i++) {
        expect(events[i]).not.toBe(events[i - 1]);
      }

      // Verify alternating pattern
      for (let i = 0; i < events.length; i++) {
        if (i % 2 === 0) {
          expect(events[i]).toBe("PlayerDetected");
        } else {
          expect(events[i]).toBe("PlayerLost");
        }
      }
    });
  });

  describe("MainScene contains no detection logic", () => {
    it("should not contain inline distance calculation in MainScene", () => {
      const mainScenePath = resolve(__dirname, "../scenes/MainScene.ts");
      const mainSceneSource = readFileSync(mainScenePath, "utf-8");

      // MainScene should NOT contain calculateDistance as an inline implementation
      expect(mainSceneSource).not.toMatch(/private\s+calculateDistance/);
      expect(mainSceneSource).not.toMatch(/protected\s+calculateDistance/);

      // MainScene should NOT perform inline Math.sqrt for detection purposes
      // It may use Math.sqrt for player movement normalization, but not for detection
      const updateMethod = mainSceneSource.match(
        /update\([^)]*\)[^{]*\{([\s\S]*?)^\s{2}\}/m
      );
      if (updateMethod) {
        const updateBody = updateMethod[1];
        // The update method should only call controller.update(), not inline detection
        expect(updateBody).not.toMatch(/detectionRadius/);
        expect(updateBody).not.toMatch(/isInsideRadius/);
        expect(updateBody).not.toMatch(/PlayerDetected/);
        expect(updateBody).not.toMatch(/PlayerLost/);
      }
    });

    it("should delegate detection entirely to DetectionController in the update loop", () => {
      const mainScenePath = resolve(__dirname, "../scenes/MainScene.ts");
      const mainSceneSource = readFileSync(mainScenePath, "utf-8");

      // MainScene should contain controller.update() calls
      expect(mainSceneSource).toContain("controller.update()");

      // MainScene should import DetectionController
      expect(mainSceneSource).toContain("DetectionController");
    });
  });

  describe("Reusable by future AI modules", () => {
    it("should accept a callback via onDetectionChange", () => {
      const controller = new DetectionController(mockEnemy, mockPlayer);
      const callback = vi.fn();

      // Should not throw when registering a listener
      expect(() => controller.onDetectionChange(callback)).not.toThrow();
    });

    it("should remove a callback via offDetectionChange", () => {
      const player = createMockPlayer(150, 100);
      const controller = new DetectionController(mockEnemy, player);
      const callback = vi.fn();

      controller.onDetectionChange(callback);
      controller.offDetectionChange(callback);

      // After removal, the callback should not be invoked
      controller.update();
      expect(callback).not.toHaveBeenCalled();
    });

    it("should support activate() and deactivate() for suspend/resume", () => {
      const player = createMockPlayer(150, 100);
      const controller = new DetectionController(mockEnemy, player);
      const callback = vi.fn();
      controller.onDetectionChange(callback);

      // Deactivate should suspend detection
      controller.deactivate();
      expect(controller.isActive()).toBe(false);
      controller.update();
      expect(callback).not.toHaveBeenCalled();

      // Activate should resume detection
      controller.activate();
      expect(controller.isActive()).toBe(true);
      controller.update();
      expect(callback).toHaveBeenCalledWith("PlayerDetected");
    });

    it("should expose current state via getDetectionState() for polling", () => {
      const player = createMockPlayer(150, 100);
      const controller = new DetectionController(mockEnemy, player);

      // Initial state
      expect(controller.getDetectionState()).toBe("NotDetected");

      // After detection
      controller.update();
      expect(controller.getDetectionState()).toBe("Detected");

      // After loss
      (player.getX as ReturnType<typeof vi.fn>).mockReturnValue(500);
      (player.getY as ReturnType<typeof vi.fn>).mockReturnValue(500);
      controller.update();
      expect(controller.getDetectionState()).toBe("NotDetected");
    });
  });

  describe("Independent from backend, pathfinding, and combat", () => {
    it("should only import Enemy and Player types in DetectionController", () => {
      const controllerPath = resolve(__dirname, "../systems/DetectionController.ts");
      const controllerSource = readFileSync(controllerPath, "utf-8");

      // Extract all import statements
      const importStatements = controllerSource.match(/^import\s+.*$/gm) || [];

      // Should only have imports from Enemy and Player
      for (const stmt of importStatements) {
        const isEnemyImport = stmt.includes("Enemy");
        const isPlayerImport = stmt.includes("Player");
        expect(isEnemyImport || isPlayerImport).toBe(true);
      }
    });

    it("should not contain HTTP, fetch, axios, or API references", () => {
      const controllerPath = resolve(__dirname, "../systems/DetectionController.ts");
      const controllerSource = readFileSync(controllerPath, "utf-8");

      // No HTTP-related references
      expect(controllerSource).not.toMatch(/\bfetch\b/);
      expect(controllerSource).not.toMatch(/\baxios\b/);
      expect(controllerSource).not.toMatch(/\bhttp\b/i);
      expect(controllerSource).not.toMatch(/\bAPI\b/);
      expect(controllerSource).not.toMatch(/\bXMLHttpRequest\b/);
    });

    it("should not contain pathfinding or combat functional code", () => {
      const controllerPath = resolve(__dirname, "../systems/DetectionController.ts");
      const controllerSource = readFileSync(controllerPath, "utf-8");

      // Strip comments (single-line and multi-line) to only check functional code
      const codeOnly = controllerSource
        .replace(/\/\*[\s\S]*?\*\//g, "") // Remove block comments
        .replace(/\/\/.*$/gm, "");         // Remove line comments

      // No pathfinding references in functional code
      expect(codeOnly).not.toMatch(/\bpathfind/i);
      expect(codeOnly).not.toMatch(/\bnavigation\b/i);
      expect(codeOnly).not.toMatch(/\bastar\b/i);

      // No combat references in functional code
      expect(codeOnly).not.toMatch(/\bdamage\b/i);
      expect(codeOnly).not.toMatch(/\battack\b/i);
      expect(codeOnly).not.toMatch(/\bhealth\b/i);

      // No combat-related imports
      expect(controllerSource).not.toMatch(/import.*Combat/);
      expect(controllerSource).not.toMatch(/import.*Pathfind/);
    });
  });
});
