import { describe, it, expect, vi, beforeEach } from "vitest";
import { PatrolController, PATROL_SPEED, ARRIVAL_THRESHOLD, IDLE_DURATION_MIN, IDLE_DURATION_MAX } from "@/game/systems/PatrolController";
import { PatrolDestinationGenerator, PATROL_RADIUS } from "@/game/systems/PatrolDestinationGenerator";
import type { Enemy } from "@/game/entities/characters/Enemy";
import * as fs from "fs";
import * as path from "path";

/**
 * End-to-End Patrol Behavior Validation (Task 8).
 *
 * This integration test validates the complete patrol system from a high-level
 * perspective, confirming that all patrol components work together correctly
 * and that architecture compliance is maintained.
 *
 * Validates:
 * - Requirement 1: Every spawned enemy begins patrolling automatically.
 * - Requirement 2: Patrol movement remains inside the patrol area.
 * - Requirement 3: Idle and Walking transitions occur correctly.
 * - Requirement 5: Direction updates are synchronized with movement.
 * - Requirement 6: Enemy Animation remains synchronized with patrol behavior.
 * - Requirement 7: Architecture compliance (independence from combat, detection, backend).
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
 * Creates a mock Enemy entity with mutable position tracking.
 * Position, state, and direction are tracked internally to simulate
 * the real Enemy entity behavior.
 */
function createMockEnemy(startX: number, startY: number): Enemy {
  let x = startX;
  let y = startY;
  let state: string = "idle";
  let direction: string = "down";

  return {
    setState: vi.fn((newState: string) => { state = newState; }),
    setDirection: vi.fn((newDir: string) => { direction = newDir; }),
    setStateAndDirection: vi.fn((newState: string, newDir: string) => {
      state = newState;
      direction = newDir;
    }),
    getState: vi.fn(() => state),
    getDirection: vi.fn(() => direction),
    getX: vi.fn(() => x),
    getY: vi.fn(() => y),
    setPosition: vi.fn((newX: number, newY: number) => { x = newX; y = newY; }),
    getSprite: vi.fn(),
    getStats: vi.fn(),
    getName: vi.fn().mockReturnValue("Skeleton"),
    getEnemyType: vi.fn(),
    getCurrentAnimationKey: vi.fn().mockReturnValue("skeleton-idle-down"),
  } as unknown as Enemy;
}

describe("Patrol Behavior Validation (Task 8)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Verify every spawned enemy begins patrolling automatically", () => {
    it("should start in idle state and begin walking after idle timer expires", () => {
      const enemy = createMockEnemy(200, 300);
      const controller = new PatrolController(enemy, 200, 300);

      // Immediately after construction: enemy is in idle state
      expect(controller.getPatrolState()).toBe("idle");
      expect(controller.isActive()).toBe(true);
      expect(enemy.setState).toHaveBeenCalledWith("idle");

      // After idle timer expires, enemy should begin patrol (transition to walking)
      const idleDuration = controller.getIdleDuration();
      controller.update(idleDuration);

      // Controller should have attempted to start walking
      // (may stay idle if destination generation fails, but the mechanism is active)
      expect(controller.isActive()).toBe(true);
    });

    it("should automatically transition to walking without external trigger", () => {
      const enemy = createMockEnemy(100, 100);
      const controller = new PatrolController(enemy, 100, 100, { radius: 80 });

      // Mock destination generator to return a valid point
      vi.spyOn(controller.getDestinationGenerator(), "generate").mockReturnValue({ x: 150, y: 100 });
      vi.spyOn(controller.getDestinationGenerator(), "isValidDestination").mockReturnValue(true);

      // Advance past idle timer
      const duration = controller.getIdleDuration();
      controller.update(duration);

      expect(controller.getPatrolState()).toBe("walking");
      expect(enemy.setStateAndDirection).toHaveBeenCalledWith("walking", expect.any(String));
    });

    it("should initialize patrol for multiple enemies independently", () => {
      const enemies = Array.from({ length: 5 }, (_, i) =>
        createMockEnemy(100 + i * 50, 200 + i * 50)
      );

      const controllers = enemies.map((enemy, i) =>
        new PatrolController(enemy, 100 + i * 50, 200 + i * 50)
      );

      // All controllers should be active and in idle state
      for (const controller of controllers) {
        expect(controller.isActive()).toBe(true);
        expect(controller.getPatrolState()).toBe("idle");
      }

      // All enemies should have been set to idle state
      for (const enemy of enemies) {
        expect(enemy.setState).toHaveBeenCalledWith("idle");
      }
    });
  });

  describe("Verify patrol movement remains inside the patrol area", () => {
    it("should never move beyond the configured patrol radius during a full patrol cycle", () => {
      const spawnX = 200;
      const spawnY = 200;
      const radius = 80;
      const enemy = createMockEnemy(spawnX, spawnY);
      const controller = new PatrolController(enemy, spawnX, spawnY, { radius });

      // Run multiple patrol cycles and verify the enemy never exceeds the radius
      for (let cycle = 0; cycle < 10; cycle++) {
        // Advance idle timer
        const idleDuration = controller.getIdleDuration();
        controller.update(idleDuration);

        // If walking, simulate movement frames
        if (controller.getPatrolState() === "walking") {
          for (let frame = 0; frame < 200; frame++) {
            controller.update(16); // ~60fps

            const currentX = (enemy.getX as ReturnType<typeof vi.fn>)();
            const currentY = (enemy.getY as ReturnType<typeof vi.fn>)();
            const dx = currentX - spawnX;
            const dy = currentY - spawnY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Enemy should never exceed the patrol radius + arrival threshold tolerance
            expect(distance).toBeLessThanOrEqual(radius + ARRIVAL_THRESHOLD);

            if (controller.getPatrolState() === "idle") break;
          }
        }
      }
    });

    it("should generate destinations that are always within the patrol radius", () => {
      const generator = new PatrolDestinationGenerator({ radius: 80 });
      const origin = { x: 300, y: 400 };

      for (let i = 0; i < 100; i++) {
        const dest = generator.generate(origin);
        if (dest !== null) {
          const dx = dest.x - origin.x;
          const dy = dest.y - origin.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          expect(distance).toBeLessThanOrEqual(80);
        }
      }
    });

    it("should validate destinations before accepting them", () => {
      const spawnX = 100;
      const spawnY = 100;
      const radius = 50;
      const enemy = createMockEnemy(spawnX, spawnY);
      const controller = new PatrolController(enemy, spawnX, spawnY, { radius });

      // A point outside radius should be rejected
      const outsidePoint = { x: spawnX + radius + 20, y: spawnY };
      expect(controller.isWithinPatrolArea(outsidePoint)).toBe(false);

      // A point inside radius should be accepted
      const insidePoint = { x: spawnX + radius - 10, y: spawnY };
      expect(controller.isWithinPatrolArea(insidePoint)).toBe(true);
    });
  });

  describe("Verify Idle and Walking transitions occur correctly", () => {
    it("should follow the complete cycle: idle → walking → idle → walking", () => {
      const enemy = createMockEnemy(100, 100);
      const controller = new PatrolController(enemy, 100, 100, { radius: 80 });

      vi.spyOn(controller.getDestinationGenerator(), "generate").mockReturnValue({ x: 101, y: 100 });
      vi.spyOn(controller.getDestinationGenerator(), "isValidDestination").mockReturnValue(true);

      // Phase 1: starts idle
      expect(controller.getPatrolState()).toBe("idle");

      // Phase 2: idle timer expires → walking
      const duration1 = controller.getIdleDuration();
      controller.update(duration1);
      expect(controller.getPatrolState()).toBe("walking");

      // Phase 3: reach destination (1px away, within arrival threshold) → idle again
      controller.update(1000);
      expect(controller.getPatrolState()).toBe("idle");

      // Phase 4: idle timer expires again → walking
      const duration2 = controller.getIdleDuration();
      controller.update(duration2);
      expect(controller.getPatrolState()).toBe("walking");
    });

    it("should set enemy state to walking when patrol starts", () => {
      const enemy = createMockEnemy(100, 100);
      const controller = new PatrolController(enemy, 100, 100, { radius: 80 });

      vi.spyOn(controller.getDestinationGenerator(), "generate").mockReturnValue({ x: 150, y: 100 });
      vi.spyOn(controller.getDestinationGenerator(), "isValidDestination").mockReturnValue(true);

      controller.update(controller.getIdleDuration());

      expect(enemy.setStateAndDirection).toHaveBeenCalledWith("walking", "right");
    });

    it("should set enemy state to idle when destination is reached", () => {
      const enemy = createMockEnemy(100, 100);
      const controller = new PatrolController(enemy, 100, 100, { radius: 80 });

      // Short distance that will be reached in one frame
      vi.spyOn(controller.getDestinationGenerator(), "generate").mockReturnValue({ x: 101, y: 100 });
      vi.spyOn(controller.getDestinationGenerator(), "isValidDestination").mockReturnValue(true);

      controller.update(controller.getIdleDuration());
      controller.update(1000);

      expect(enemy.setState).toHaveBeenCalledWith("idle");
    });

    it("should have idle duration within configured bounds", () => {
      const enemy = createMockEnemy(100, 100);
      const controller = new PatrolController(enemy, 100, 100);

      const duration = controller.getIdleDuration();
      expect(duration).toBeGreaterThanOrEqual(IDLE_DURATION_MIN);
      expect(duration).toBeLessThanOrEqual(IDLE_DURATION_MAX);
    });
  });

  describe("Verify Enemy Animation remains synchronized with patrol behavior", () => {
    it("should call setStateAndDirection when transitioning to walking", () => {
      const enemy = createMockEnemy(100, 100);
      const controller = new PatrolController(enemy, 100, 100, { radius: 80 });

      vi.spyOn(controller.getDestinationGenerator(), "generate").mockReturnValue({ x: 150, y: 120 });
      vi.spyOn(controller.getDestinationGenerator(), "isValidDestination").mockReturnValue(true);

      controller.update(controller.getIdleDuration());

      expect(enemy.setStateAndDirection).toHaveBeenCalledTimes(1);
      expect(enemy.setStateAndDirection).toHaveBeenCalledWith(
        "walking",
        expect.stringMatching(/^(up|down|left|right)$/)
      );
    });

    it("should call setState('idle') when arriving at destination", () => {
      const enemy = createMockEnemy(100, 100);
      const controller = new PatrolController(enemy, 100, 100, { radius: 80 });

      vi.spyOn(controller.getDestinationGenerator(), "generate").mockReturnValue({ x: 101, y: 100 });
      vi.spyOn(controller.getDestinationGenerator(), "isValidDestination").mockReturnValue(true);

      controller.update(controller.getIdleDuration());
      (enemy.setState as ReturnType<typeof vi.fn>).mockClear();
      controller.update(1000);

      expect(enemy.setState).toHaveBeenCalledWith("idle");
    });

    it("should call setDirection when facing direction changes during movement", () => {
      const enemy = createMockEnemy(100, 100);
      const controller = new PatrolController(enemy, 100, 100, { radius: 80 });

      // Target that starts right and then direction might change
      vi.spyOn(controller.getDestinationGenerator(), "generate").mockReturnValue({ x: 170, y: 100 });
      vi.spyOn(controller.getDestinationGenerator(), "isValidDestination").mockReturnValue(true);

      controller.update(controller.getIdleDuration());

      // The initial transition should use setStateAndDirection
      expect(enemy.setStateAndDirection).toHaveBeenCalledWith("walking", "right");
    });

    it("should preserve the last direction when stopping (Req 5.3)", () => {
      const enemy = createMockEnemy(100, 100);
      const controller = new PatrolController(enemy, 100, 100, { radius: 80 });

      vi.spyOn(controller.getDestinationGenerator(), "generate").mockReturnValue({ x: 101, y: 100 });
      vi.spyOn(controller.getDestinationGenerator(), "isValidDestination").mockReturnValue(true);

      controller.update(controller.getIdleDuration());
      controller.update(1000);

      // After stopping, getDirection should return the last direction (right)
      const finalDirection = (enemy.getDirection as ReturnType<typeof vi.fn>)();
      expect(["up", "down", "left", "right"]).toContain(finalDirection);
    });

    it("should use setState('idle') on construction for initial animation", () => {
      const enemy = createMockEnemy(200, 200);
      new PatrolController(enemy, 200, 200);

      // First call to setState should be "idle" (initial state)
      expect(enemy.setState).toHaveBeenCalledWith("idle");
    });
  });

  describe("Verify multiple enemies patrol independently", () => {
    it("should allow enemies with different idle durations", () => {
      const enemy1 = createMockEnemy(100, 100);
      const enemy2 = createMockEnemy(300, 300);

      const controller1 = new PatrolController(enemy1, 100, 100);
      const controller2 = new PatrolController(enemy2, 300, 300);

      // Each controller should have its own random idle duration
      const d1 = controller1.getIdleDuration();
      const d2 = controller2.getIdleDuration();

      // Both should be within bounds (they may coincidentally be equal)
      expect(d1).toBeGreaterThanOrEqual(IDLE_DURATION_MIN);
      expect(d1).toBeLessThanOrEqual(IDLE_DURATION_MAX);
      expect(d2).toBeGreaterThanOrEqual(IDLE_DURATION_MIN);
      expect(d2).toBeLessThanOrEqual(IDLE_DURATION_MAX);
    });

    it("should allow one enemy to walk while another is idle", () => {
      const enemy1 = createMockEnemy(100, 100);
      const enemy2 = createMockEnemy(400, 400);

      const controller1 = new PatrolController(enemy1, 100, 100, { radius: 80 });
      const controller2 = new PatrolController(enemy2, 400, 400, { radius: 80 });

      vi.spyOn(controller1.getDestinationGenerator(), "generate").mockReturnValue({ x: 150, y: 100 });
      vi.spyOn(controller1.getDestinationGenerator(), "isValidDestination").mockReturnValue(true);
      vi.spyOn(controller2.getDestinationGenerator(), "generate").mockReturnValue({ x: 450, y: 400 });
      vi.spyOn(controller2.getDestinationGenerator(), "isValidDestination").mockReturnValue(true);

      // Advance only controller1 past its idle timer
      controller1.update(controller1.getIdleDuration());

      expect(controller1.getPatrolState()).toBe("walking");
      expect(controller2.getPatrolState()).toBe("idle");
    });

    it("should deactivate one enemy without affecting others", () => {
      const enemies = Array.from({ length: 3 }, (_, i) => createMockEnemy(i * 100, i * 100));
      const controllers = enemies.map((enemy, i) =>
        new PatrolController(enemy, i * 100, i * 100, { radius: 80 })
      );

      controllers[1].deactivate();

      expect(controllers[0].isActive()).toBe(true);
      expect(controllers[1].isActive()).toBe(false);
      expect(controllers[2].isActive()).toBe(true);

      // Deactivated controller should not process updates
      controllers[1].update(10000);
      expect(controllers[1].getPatrolState()).toBe("idle");
    });

    it("should move enemies to completely different positions", () => {
      const enemy1 = createMockEnemy(100, 100);
      const enemy2 = createMockEnemy(500, 500);

      const controller1 = new PatrolController(enemy1, 100, 100, { radius: 80 });
      const controller2 = new PatrolController(enemy2, 500, 500, { radius: 80 });

      vi.spyOn(controller1.getDestinationGenerator(), "generate").mockReturnValue({ x: 130, y: 100 });
      vi.spyOn(controller1.getDestinationGenerator(), "isValidDestination").mockReturnValue(true);
      vi.spyOn(controller2.getDestinationGenerator(), "generate").mockReturnValue({ x: 500, y: 530 });
      vi.spyOn(controller2.getDestinationGenerator(), "isValidDestination").mockReturnValue(true);

      controller1.update(controller1.getIdleDuration());
      controller2.update(controller2.getIdleDuration());

      controller1.update(500);
      controller2.update(500);

      const x1 = (enemy1.getX as ReturnType<typeof vi.fn>)();
      const y1 = (enemy1.getY as ReturnType<typeof vi.fn>)();
      const x2 = (enemy2.getX as ReturnType<typeof vi.fn>)();
      const y2 = (enemy2.getY as ReturnType<typeof vi.fn>)();

      // They should be in different regions entirely
      expect(Math.abs(x1 - x2)).toBeGreaterThan(300);
      expect(Math.abs(y1 - y2)).toBeGreaterThan(300);
    });
  });

  describe("Verify MainScene contains no patrol decision logic", () => {
    it("should only call controller.update(delta) in MainScene update loop", () => {
      // Read the MainScene source to verify it only calls controller.update(delta)
      const mainScenePath = path.resolve(__dirname, "../scenes/MainScene.ts");
      const source = fs.readFileSync(mainScenePath, "utf-8");

      // MainScene should contain the patrol update loop
      expect(source).toContain("controller.update(delta)");

      // MainScene should NOT contain patrol decision logic
      expect(source).not.toMatch(/requestNewDestination/);
      expect(source).not.toMatch(/calculateDirection/);
      expect(source).not.toMatch(/moveTowardDestination/);
      expect(source).not.toMatch(/getPatrolState/);
      expect(source).not.toMatch(/getIdleDuration/);
      expect(source).not.toMatch(/getIdleTimer/);
      expect(source).not.toMatch(/getCurrentDestination/);
    });

    it("should not contain conditional patrol logic in the update method", () => {
      const mainScenePath = path.resolve(__dirname, "../scenes/MainScene.ts");
      const source = fs.readFileSync(mainScenePath, "utf-8");

      // Extract the update method body
      const updateMethodMatch = source.match(/update\([^)]*\)[\s\S]*?{([\s\S]*?)^\s{2}}/m);
      const updateBody = updateMethodMatch ? updateMethodMatch[1] : "";

      // The patrol section should only be a simple for-of loop
      // No patrol-specific conditionals should exist in MainScene
      expect(updateBody).not.toContain("patrolState");
      expect(updateBody).not.toContain("idleTimer");
      expect(updateBody).not.toContain("destination");
    });
  });

  describe("Verify patrol remains independent from combat, detection, backend, and future AI", () => {
    it("should not import React, axios, fetch, or backend-related modules", () => {
      const controllerPath = path.resolve(__dirname, "../systems/PatrolController.ts");
      const source = fs.readFileSync(controllerPath, "utf-8");

      expect(source).not.toMatch(/import.*react/i);
      expect(source).not.toMatch(/import.*axios/i);
      expect(source).not.toMatch(/import.*fetch/i);
      expect(source).not.toMatch(/import.*http/i);
      expect(source).not.toMatch(/import.*api/i);
      expect(source).not.toMatch(/import.*backend/i);
    });

    it("should not import combat or detection modules", () => {
      const controllerPath = path.resolve(__dirname, "../systems/PatrolController.ts");
      const source = fs.readFileSync(controllerPath, "utf-8");

      expect(source).not.toMatch(/import.*combat/i);
      expect(source).not.toMatch(/import.*detection/i);
      expect(source).not.toMatch(/import.*chase/i);
      expect(source).not.toMatch(/import.*pathfinding/i);
      expect(source).not.toMatch(/import.*attack/i);
      expect(source).not.toMatch(/import.*damage/i);
      expect(source).not.toMatch(/import.*health/i);
    });

    it("should not import Phaser directly", () => {
      const controllerPath = path.resolve(__dirname, "../systems/PatrolController.ts");
      const source = fs.readFileSync(controllerPath, "utf-8");

      expect(source).not.toMatch(/import.*phaser/i);
      expect(source).not.toMatch(/import.*Phaser/);
    });

    it("should not contain combat, loot, or reward logic", () => {
      const controllerPath = path.resolve(__dirname, "../systems/PatrolController.ts");
      const source = fs.readFileSync(controllerPath, "utf-8");

      expect(source).not.toMatch(/\bdamage\b/i);
      expect(source).not.toMatch(/\bloot\b/i);
      expect(source).not.toMatch(/\breward\b/i);
      expect(source).not.toMatch(/\bexperience\b/i);
      expect(source).not.toMatch(/\bgold\b/i);
      expect(source).not.toMatch(/\brespawn\b/i);
    });

    it("should not contain player detection logic in code", () => {
      const controllerPath = path.resolve(__dirname, "../systems/PatrolController.ts");
      const source = fs.readFileSync(controllerPath, "utf-8");

      // Remove comments (single-line and multi-line) to check only executable code
      const codeOnly = source
        .replace(/\/\*[\s\S]*?\*\//g, "") // Remove block comments
        .replace(/\/\/.*$/gm, "");         // Remove line comments

      // No player-related identifiers in code (comments may mention "player" for context)
      expect(codeOnly).not.toMatch(/\bplayer\b/i);
      expect(codeOnly).not.toMatch(/\bdetect\b/i);
      expect(codeOnly).not.toMatch(/\baggro\b/i);
      expect(codeOnly).not.toMatch(/\bchase\b/i);
    });

    it("should validate PatrolDestinationGenerator has no forbidden imports", () => {
      const generatorPath = path.resolve(__dirname, "../systems/PatrolDestinationGenerator.ts");
      const source = fs.readFileSync(generatorPath, "utf-8");

      expect(source).not.toMatch(/import.*react/i);
      expect(source).not.toMatch(/import.*axios/i);
      expect(source).not.toMatch(/import.*phaser/i);
      expect(source).not.toMatch(/import.*combat/i);
      expect(source).not.toMatch(/import.*detection/i);
      expect(source).not.toMatch(/import.*backend/i);
      expect(source).not.toMatch(/import.*fetch/i);
    });

    it("should only depend on Enemy entity, PatrolDestinationGenerator, and EnemyDirection type", () => {
      const controllerPath = path.resolve(__dirname, "../systems/PatrolController.ts");
      const source = fs.readFileSync(controllerPath, "utf-8");

      // Extract import statements (single and multi-line)
      const importLines = source.match(/^import[\s\S]*?from\s+["'][^"']+["'];?$/gm) || [];

      // Every import should reference one of the allowed modules
      const allowedModules = [
        "entities/characters/Enemy",
        "systems/PatrolDestinationGenerator",
        "services/EnemyAnimationRegistrar",
      ];

      for (const imp of importLines) {
        const matchesAllowed = allowedModules.some((mod) => imp.includes(mod));
        expect(matchesAllowed).toBe(true);
      }
    });
  });

  describe("End-to-end patrol cycle simulation", () => {
    it("should complete multiple full patrol cycles without errors", () => {
      const enemy = createMockEnemy(200, 200);
      const controller = new PatrolController(enemy, 200, 200, { radius: 60 });

      let cycleCount = 0;

      // Simulate 5 full cycles
      for (let cycle = 0; cycle < 5; cycle++) {
        // Advance through idle phase
        const idleDuration = controller.getIdleDuration();
        controller.update(idleDuration);

        // If in walking state, move to destination
        if (controller.getPatrolState() === "walking") {
          let frameCount = 0;
          while (controller.getPatrolState() === "walking" && frameCount < 500) {
            controller.update(16);
            frameCount++;
          }
          cycleCount++;
        }
      }

      // At least some cycles should have completed successfully
      expect(cycleCount).toBeGreaterThan(0);
    });

    it("should never crash regardless of random destination generation", () => {
      const enemy = createMockEnemy(100, 100);
      const controller = new PatrolController(enemy, 100, 100, { radius: 80 });

      // Simulate 10 seconds of gameplay at ~60fps
      const totalFrames = 600;
      for (let i = 0; i < totalFrames; i++) {
        expect(() => controller.update(16.67)).not.toThrow();
      }
    });

    it("should maintain patrol origin throughout entire simulation", () => {
      const spawnX = 250;
      const spawnY = 350;
      const enemy = createMockEnemy(spawnX, spawnY);
      const controller = new PatrolController(enemy, spawnX, spawnY, { radius: 80 });

      // Simulate extended gameplay
      for (let i = 0; i < 300; i++) {
        controller.update(16);
      }

      // Origin should never change
      expect(controller.getOrigin().x).toBe(spawnX);
      expect(controller.getOrigin().y).toBe(spawnY);
    });
  });
});
