import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { ChaseController } from "@/game/systems/ChaseController";
import type { Enemy } from "@/game/entities/characters/Enemy";
import type { Player } from "@/game/entities/characters/Player";
import type { DetectionEvent } from "@/game/systems/DetectionController";

/**
 * Architecture Compliance Tests for Enemy Chase (Task 8).
 *
 * Validates:
 * - Chase Controller never performs player detection.
 * - Chase Controller never starts combat.
 * - MainScene contains no chase logic.
 * - Enemy Chase remains reusable by future Return and Combat modules.
 * - The feature remains independent from backend communication, pathfinding,
 *   attack logic, and reward systems.
 *
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 9.1, 9.2, 9.3, 9.4
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

/** Read ChaseController source for static analysis tests. */
const chaseControllerPath = resolve(__dirname, "../systems/ChaseController.ts");
const chaseControllerSource = readFileSync(chaseControllerPath, "utf-8");

/** Read MainScene source for architecture boundary tests. */
const mainScenePath = resolve(__dirname, "../scenes/MainScene.ts");
const mainSceneSource = readFileSync(mainScenePath, "utf-8");

/**
 * Strip comments from source to inspect only functional code.
 */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "") // Remove block comments
    .replace(/\/\/.*$/gm, "");         // Remove line comments
}

const chaseControllerCode = stripComments(chaseControllerSource);

/**
 * Creates a mock Enemy for interface/contract tests.
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
 * Creates a mock Player for interface/contract tests.
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

describe("ChaseController - Architecture Compliance", () => {
  describe("Chase Controller never performs player detection", () => {
    it("should not contain detection radius references in functional code", () => {
      expect(chaseControllerCode).not.toMatch(/detectionRadius/i);
      expect(chaseControllerCode).not.toMatch(/detection_radius/i);
    });

    it("should not determine whether the player is inside any radius", () => {
      expect(chaseControllerCode).not.toMatch(/isInsideRadius/i);
      expect(chaseControllerCode).not.toMatch(/isInRadius/i);
      expect(chaseControllerCode).not.toMatch(/isDetected/i);
      expect(chaseControllerCode).not.toMatch(/checkDetection/i);
      expect(chaseControllerCode).not.toMatch(/detectPlayer/i);
    });

    it("should not import DetectionController class directly (only the type)", () => {
      // ChaseController should import the DetectionEvent TYPE but not the class itself
      const classImportRegex = /import\s+\{[^}]*\bDetectionController\b[^}]*\}\s+from/;
      expect(chaseControllerSource).not.toMatch(classImportRegex);
    });

    it("should import DetectionEvent as a type only", () => {
      // Must use `import type { DetectionEvent }` — a type-only import
      expect(chaseControllerSource).toMatch(/import\s+type\s+\{[^}]*DetectionEvent[^}]*\}/);
    });

    it("should only react to detection events, not calculate detection", () => {
      // The controller must have handleDetectionEvent but no detection calculation methods
      expect(chaseControllerCode).toMatch(/handleDetectionEvent/);
      expect(chaseControllerCode).not.toMatch(/calculateDetection/i);
      expect(chaseControllerCode).not.toMatch(/evaluateDetection/i);
      expect(chaseControllerCode).not.toMatch(/checkPlayerDistance/i);
    });
  });

  describe("Chase Controller never starts combat", () => {
    it("should not contain combat-related methods in functional code", () => {
      expect(chaseControllerCode).not.toMatch(/\battack\b/i);
      expect(chaseControllerCode).not.toMatch(/\bdamage\b/i);
      expect(chaseControllerCode).not.toMatch(/\bhit\b/i);
      expect(chaseControllerCode).not.toMatch(/\bcombat\b/i);
      expect(chaseControllerCode).not.toMatch(/\bfight\b/i);
    });

    it("should not import any combat-related modules", () => {
      expect(chaseControllerSource).not.toMatch(/import.*[Cc]ombat/);
      expect(chaseControllerSource).not.toMatch(/import.*[Aa]ttack/);
      expect(chaseControllerSource).not.toMatch(/import.*[Dd]amage/);
      expect(chaseControllerSource).not.toMatch(/import.*[Ww]eapon/);
    });

    it("should not contain combat state transitions in functional code", () => {
      expect(chaseControllerCode).not.toMatch(/setState\s*\(\s*["']attack/i);
      expect(chaseControllerCode).not.toMatch(/setState\s*\(\s*["']combat/i);
      expect(chaseControllerCode).not.toMatch(/setState\s*\(\s*["']fighting/i);
      expect(chaseControllerCode).not.toMatch(/setState\s*\(\s*["']dead/i);
    });

    it("should not contain health or mana references in functional code", () => {
      expect(chaseControllerCode).not.toMatch(/\bhealth\b/i);
      expect(chaseControllerCode).not.toMatch(/\bmana\b/i);
      expect(chaseControllerCode).not.toMatch(/\bhp\b/);
    });
  });

  describe("MainScene contains no chase logic", () => {
    it("should not calculate chase direction in MainScene", () => {
      // Extract the update method body from MainScene
      const updateMatch = mainSceneSource.match(
        /update\([^)]*\)[^{]*\{([\s\S]*?)^\s{2}\}/m
      );
      if (updateMatch) {
        const updateBody = updateMatch[1];
        // No chase-specific direction or movement calculations
        expect(updateBody).not.toMatch(/chaseDirection/i);
        expect(updateBody).not.toMatch(/chaseTarget/i);
        expect(updateBody).not.toMatch(/moveToward/i);
        expect(updateBody).not.toMatch(/pursuitVector/i);
      }
    });

    it("should not calculate enemy movement toward the player in MainScene", () => {
      const mainSceneCode = stripComments(mainSceneSource);
      // MainScene should not directly calculate normalized directions for chasing
      expect(mainSceneCode).not.toMatch(/chaseSpeed/i);
      expect(mainSceneCode).not.toMatch(/pursuitSpeed/i);
    });

    it("should not check detection state inside MainScene update loop", () => {
      const updateMatch = mainSceneSource.match(
        /update\([^)]*\)[^{]*\{([\s\S]*?)^\s{2}\}/m
      );
      if (updateMatch) {
        const updateBody = updateMatch[1];
        expect(updateBody).not.toMatch(/PlayerDetected/);
        expect(updateBody).not.toMatch(/PlayerLost/);
        expect(updateBody).not.toMatch(/isDetected/);
      }
    });

    it("should only invoke controller.update(delta) for chase in the update loop", () => {
      // MainScene should have the pattern of iterating chaseControllers and calling update
      expect(mainSceneSource).toMatch(/chaseControllers/);
      expect(mainSceneSource).toMatch(/controller\.update\(delta\)/);
    });

    it("should not update enemy state or direction based on chase in MainScene", () => {
      const updateMatch = mainSceneSource.match(
        /update\([^)]*\)[^{]*\{([\s\S]*?)^\s{2}\}/m
      );
      if (updateMatch) {
        const updateBody = updateMatch[1];
        // MainScene should not set enemy direction or state in the update loop
        expect(updateBody).not.toMatch(/enemy\.setDirection/);
        expect(updateBody).not.toMatch(/enemy\.setState/);
        expect(updateBody).not.toMatch(/enemy\.setPosition/);
      }
    });

    it("should delegate chase creation to ChaseController constructor only", () => {
      // MainScene should create ChaseControllers via `new ChaseController(...)`
      expect(mainSceneSource).toMatch(/new ChaseController\(/);
      // It should not contain any inline chase logic
      const mainSceneCode = stripComments(mainSceneSource);
      expect(mainSceneCode).not.toMatch(/calculateDirection.*chase/i);
    });
  });

  describe("Enemy Chase remains reusable by future modules", () => {
    it("should expose chase state via getChaseState()", () => {
      const enemy = createMockEnemy();
      const player = createMockPlayer();
      const controller = new ChaseController(enemy, player);

      expect(controller.getChaseState()).toBe("Inactive");
    });

    it("should expose chase target via getChaseTarget()", () => {
      const enemy = createMockEnemy();
      const player = createMockPlayer(300, 400);
      const controller = new ChaseController(enemy, player);

      // Initially null
      expect(controller.getChaseTarget()).toBeNull();

      // After detection event, target is set
      controller.handleDetectionEvent("PlayerDetected");
      expect(controller.getChaseTarget()).toEqual({
        targetX: 300,
        targetY: 400,
      });
    });

    it("should expose chase speed via getChaseSpeed()", () => {
      const enemy = createMockEnemy();
      const player = createMockPlayer();
      const controller = new ChaseController(enemy, player, 80);

      expect(controller.getChaseSpeed()).toBe(80);
    });

    it("should not depend on PatrolController", () => {
      expect(chaseControllerSource).not.toMatch(/import.*PatrolController/);
      expect(chaseControllerCode).not.toMatch(/\bPatrolController\b/);
    });

    it("should not depend on any combat system", () => {
      expect(chaseControllerSource).not.toMatch(/import.*[Cc]ombat/);
      expect(chaseControllerCode).not.toMatch(/\bCombatController\b/);
      expect(chaseControllerCode).not.toMatch(/\bCombatSystem\b/);
    });

    it("should accept generic DetectionEvent type via handleDetectionEvent", () => {
      const enemy = createMockEnemy();
      const player = createMockPlayer(50, 50);
      const controller = new ChaseController(enemy, player);

      // handleDetectionEvent should accept DetectionEvent without coupling to DetectionController
      const event: DetectionEvent = "PlayerDetected";
      expect(() => controller.handleDetectionEvent(event)).not.toThrow();

      const lostEvent: DetectionEvent = "PlayerLost";
      expect(() => controller.handleDetectionEvent(lostEvent)).not.toThrow();
    });

    it("should expose enemy and player references for external module consumption", () => {
      const enemy = createMockEnemy();
      const player = createMockPlayer();
      const controller = new ChaseController(enemy, player);

      expect(controller.getEnemy()).toBe(enemy);
      expect(controller.getPlayer()).toBe(player);
    });
  });

  describe("Feature independence from external systems", () => {
    it("should not import axios, fetch, or any API service", () => {
      expect(chaseControllerSource).not.toMatch(/import.*axios/i);
      expect(chaseControllerSource).not.toMatch(/import.*fetch/i);
      expect(chaseControllerSource).not.toMatch(/import.*[Aa]pi[Ss]ervice/);
      expect(chaseControllerSource).not.toMatch(/import.*[Hh]ttp/);
      expect(chaseControllerSource).not.toMatch(/import.*[Rr]equest/);
    });

    it("should not import any pathfinding module", () => {
      expect(chaseControllerSource).not.toMatch(/import.*[Pp]athfind/);
      expect(chaseControllerSource).not.toMatch(/import.*[Nn]avigation/);
      expect(chaseControllerSource).not.toMatch(/import.*[Aa]star/);
      expect(chaseControllerSource).not.toMatch(/import.*[Gg]raph/);
    });

    it("should not contain HTTP calls or backend URLs in functional code", () => {
      expect(chaseControllerCode).not.toMatch(/\bfetch\s*\(/);
      expect(chaseControllerCode).not.toMatch(/\baxios\b/);
      expect(chaseControllerCode).not.toMatch(/https?:\/\//);
      expect(chaseControllerCode).not.toMatch(/\bXMLHttpRequest\b/);
      expect(chaseControllerCode).not.toMatch(/\.get\s*\(\s*["'`]http/);
      expect(chaseControllerCode).not.toMatch(/\.post\s*\(\s*["'`]http/);
    });

    it("should not contain pathfinding algorithms in functional code", () => {
      expect(chaseControllerCode).not.toMatch(/\bastar\b/i);
      expect(chaseControllerCode).not.toMatch(/\bnavMesh\b/i);
      expect(chaseControllerCode).not.toMatch(/\bwaypoint\b/i);
      expect(chaseControllerCode).not.toMatch(/\bpathfind\b/i);
      expect(chaseControllerCode).not.toMatch(/\bnavigat/i);
    });

    it("should not contain attack logic in functional code", () => {
      expect(chaseControllerCode).not.toMatch(/\battack\b/i);
      expect(chaseControllerCode).not.toMatch(/\bdamage\b/i);
      expect(chaseControllerCode).not.toMatch(/\bweapon\b/i);
      expect(chaseControllerCode).not.toMatch(/\bprojectile\b/i);
    });

    it("should not contain reward or loot calculations in functional code", () => {
      expect(chaseControllerCode).not.toMatch(/\breward\b/i);
      expect(chaseControllerCode).not.toMatch(/\bloot\b/i);
      expect(chaseControllerCode).not.toMatch(/\bexperience\b/i);
      expect(chaseControllerCode).not.toMatch(/\bgold\b/i);
      expect(chaseControllerCode).not.toMatch(/\bdrop\b/i);
    });

    it("should only import Enemy, Player, DetectionEvent type, and EnemyDirection type", () => {
      // Extract all import statements
      const importStatements = chaseControllerSource.match(/^import\s+.*$/gm) || [];

      const allowedImports = [
        "Enemy",
        "Player",
        "DetectionEvent",
        "DetectionController", // type-only import path reference
        "EnemyDirection",
        "EnemyAnimationRegistrar",
      ];

      for (const stmt of importStatements) {
        const hasAllowedImport = allowedImports.some((allowed) =>
          stmt.includes(allowed)
        );
        expect(hasAllowedImport).toBe(true);
      }
    });
  });
});
