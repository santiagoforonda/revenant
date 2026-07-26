import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

/**
 * Architecture Compliance Tests for Enemy Return (Task 8).
 *
 * Validates:
 * - ReturnController never performs player detection.
 * - ReturnController never initiates combat.
 * - MainScene contains no return logic.
 * - Enemy Return remains reusable by future Combat modules.
 * - Feature remains independent from backend, pathfinding, damage, and attack logic.
 *
 * Approach: Read source files and assert structural properties about imports,
 * methods, and code patterns.
 */

const ROOT = resolve(__dirname, "../..");
const RETURN_CONTROLLER_PATH = resolve(ROOT, "game/systems/ReturnController.ts");
const MAIN_SCENE_PATH = resolve(ROOT, "game/scenes/MainScene.ts");

const returnControllerSource = readFileSync(RETURN_CONTROLLER_PATH, "utf-8");
const mainSceneSource = readFileSync(MAIN_SCENE_PATH, "utf-8");

describe("Architecture Compliance: ReturnController never performs player detection", () => {
  it("should not import Player entity", () => {
    // ReturnController must not reference the Player class
    expect(returnControllerSource).not.toMatch(/import.*\bPlayer\b/);
  });

  it("should not contain distance-to-player calculations", () => {
    // No variable or method referencing player distance
    expect(returnControllerSource).not.toMatch(/distanceToPlayer/i);
    expect(returnControllerSource).not.toMatch(/playerDistance/i);
    expect(returnControllerSource).not.toMatch(/getPlayer\(/);
  });

  it("should not contain detection radius logic", () => {
    expect(returnControllerSource).not.toMatch(/detectionRadius/i);
    expect(returnControllerSource).not.toMatch(/detectPlayer/i);
    expect(returnControllerSource).not.toMatch(/isPlayerInRange/i);
    expect(returnControllerSource).not.toMatch(/playerInRange/i);
  });

  it("should not store a player reference in class properties", () => {
    // Check for player-typed fields (private player, readonly player, etc.)
    expect(returnControllerSource).not.toMatch(/private\s+(readonly\s+)?player\s*:/);
    expect(returnControllerSource).not.toMatch(/protected\s+(readonly\s+)?player\s*:/);
    expect(returnControllerSource).not.toMatch(/public\s+(readonly\s+)?player\s*:/);
  });
});

describe("Architecture Compliance: ReturnController never initiates combat", () => {
  it("should not contain combat-related methods", () => {
    expect(returnControllerSource).not.toMatch(/attack\(/i);
    expect(returnControllerSource).not.toMatch(/startCombat/i);
    expect(returnControllerSource).not.toMatch(/initiateCombat/i);
    expect(returnControllerSource).not.toMatch(/enterCombat/i);
    expect(returnControllerSource).not.toMatch(/beginAttack/i);
  });

  it("should not contain damage calculations", () => {
    expect(returnControllerSource).not.toMatch(/calculateDamage/i);
    expect(returnControllerSource).not.toMatch(/applyDamage/i);
    expect(returnControllerSource).not.toMatch(/takeDamage/i);
    expect(returnControllerSource).not.toMatch(/dealDamage/i);
    expect(returnControllerSource).not.toMatch(/damageAmount/i);
  });

  it("should not contain attack logic", () => {
    expect(returnControllerSource).not.toMatch(/attackSpeed/i);
    expect(returnControllerSource).not.toMatch(/attackRange/i);
    expect(returnControllerSource).not.toMatch(/attackCooldown/i);
    expect(returnControllerSource).not.toMatch(/isAttacking/i);
    expect(returnControllerSource).not.toMatch(/canAttack/i);
  });

  it("should not import combat-related types", () => {
    expect(returnControllerSource).not.toMatch(/import.*Combat/i);
    expect(returnControllerSource).not.toMatch(/import.*Damage/i);
    expect(returnControllerSource).not.toMatch(/import.*Attack/i);
  });
});

describe("Architecture Compliance: MainScene contains no return logic", () => {
  it("should only create ReturnControllers (delegation pattern)", () => {
    // MainScene should instantiate ReturnController
    expect(mainSceneSource).toMatch(/new ReturnController\(/);
  });

  it("should only call update() on return controllers", () => {
    // Verify that MainScene iterates over returnControllers calling update
    expect(mainSceneSource).toMatch(/for\s*\(.*returnControllers\)/s);
    expect(mainSceneSource).toMatch(/controller\.update\(delta\)/);
  });

  it("should not contain if/else branching on return state", () => {
    // MainScene must not check return state inline
    expect(mainSceneSource).not.toMatch(/getReturnState\(\)\s*===\s*["']Returning["']/);
    expect(mainSceneSource).not.toMatch(/returnState\s*===\s*["']Returning["']/);
    expect(mainSceneSource).not.toMatch(/if\s*\(.*return.*state/i);
  });

  it("should not contain return-related movement calculations", () => {
    // No direct movement-toward-spawn logic in MainScene
    expect(mainSceneSource).not.toMatch(/moveTowardSpawn/);
    expect(mainSceneSource).not.toMatch(/returnSpeed/);
    expect(mainSceneSource).not.toMatch(/RETURN_ARRIVAL_THRESHOLD/);
  });

  it("should not contain return-related distance checks", () => {
    // MainScene must delegate distance checks to ReturnController
    expect(mainSceneSource).not.toMatch(/distanceToSpawn/i);
    expect(mainSceneSource).not.toMatch(/hasReachedSpawn/i);
    expect(mainSceneSource).not.toMatch(/arrivedAtSpawn/i);
  });
});

describe("Architecture Compliance: Reusable by future Combat modules", () => {
  it("should expose handleDetectionEvent as a public method", () => {
    // handleDetectionEvent must be accessible for external consumers
    expect(returnControllerSource).toMatch(/handleDetectionEvent\s*=/);
  });

  it("should expose getReturnState as a public method", () => {
    // Future modules can check whether return is active
    expect(returnControllerSource).toMatch(/getReturnState\(\):\s*ReturnState/);
  });

  it("should export the ReturnState type", () => {
    // Type must be available for external consumers
    expect(returnControllerSource).toMatch(/export\s+type\s+ReturnState/);
  });

  it("should export the ReturnTarget interface", () => {
    // Interface available for consumers that need to inspect the target
    expect(returnControllerSource).toMatch(/export\s+interface\s+ReturnTarget/);
  });

  it("should export the ReturnController class", () => {
    expect(returnControllerSource).toMatch(/export\s+class\s+ReturnController/);
  });

  it("should expose getReturnTarget for state inspection", () => {
    expect(returnControllerSource).toMatch(/getReturnTarget\(\):\s*ReturnTarget/);
  });

  it("should expose getReturnSpeed for configuration inspection", () => {
    expect(returnControllerSource).toMatch(/getReturnSpeed\(\):\s*number/);
  });
});

describe("Architecture Compliance: Independent from backend, pathfinding, damage, and attack", () => {
  it("should not import HTTP/API modules", () => {
    expect(returnControllerSource).not.toMatch(/import.*fetch/i);
    expect(returnControllerSource).not.toMatch(/import.*axios/i);
    expect(returnControllerSource).not.toMatch(/import.*RevenantApi/);
    expect(returnControllerSource).not.toMatch(/import.*HttpClient/i);
    expect(returnControllerSource).not.toMatch(/import.*ApiService/i);
  });

  it("should not import backend types", () => {
    expect(returnControllerSource).not.toMatch(/import.*EnemyResponse/);
    expect(returnControllerSource).not.toMatch(/import.*ApiResponse/);
    expect(returnControllerSource).not.toMatch(/import.*BackendDto/i);
    expect(returnControllerSource).not.toMatch(/import.*from\s+["']@\/api/);
  });

  it("should not import pathfinding libraries", () => {
    expect(returnControllerSource).not.toMatch(/import.*pathfind/i);
    expect(returnControllerSource).not.toMatch(/import.*astar/i);
    expect(returnControllerSource).not.toMatch(/import.*navmesh/i);
    expect(returnControllerSource).not.toMatch(/import.*dijkstra/i);
  });

  it("should not import combat or damage types", () => {
    expect(returnControllerSource).not.toMatch(/import.*Combat/);
    expect(returnControllerSource).not.toMatch(/import.*Damage/);
    expect(returnControllerSource).not.toMatch(/import.*Attack/);
    expect(returnControllerSource).not.toMatch(/import.*Weapon/);
    expect(returnControllerSource).not.toMatch(/import.*Health/);
  });

  it("should not use fetch or XMLHttpRequest", () => {
    expect(returnControllerSource).not.toMatch(/\bfetch\s*\(/);
    expect(returnControllerSource).not.toMatch(/XMLHttpRequest/);
    expect(returnControllerSource).not.toMatch(/\.get\s*\(\s*["'`]http/);
    expect(returnControllerSource).not.toMatch(/\.post\s*\(\s*["'`]http/);
  });

  it("should only import game-related local modules", () => {
    // Extract all import paths
    const importPaths = returnControllerSource.match(/from\s+["']([^"']+)["']/g) || [];

    for (const importLine of importPaths) {
      const path = importLine.replace(/from\s+["']/, "").replace(/["']$/, "");
      // All imports should be from @/game/ (local game modules)
      expect(path).toMatch(/^@\/game\//);
    }
  });
});
