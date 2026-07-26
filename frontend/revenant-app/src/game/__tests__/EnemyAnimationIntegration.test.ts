import { describe, it, expect, vi, beforeEach } from "vitest";
import { EnemyType } from "@/game/config/EnemySpriteRegistry";
import { EnemySpriteComposer } from "@/game/services/EnemySpriteComposer";
import { EnemyAnimationController } from "@/game/services/EnemyAnimationController";
import type { EnemyAnimationState, EnemyDirection } from "@/game/services/EnemyAnimationRegistrar";
import * as fs from "fs";
import * as path from "path";

/**
 * Integration tests for Enemy Animation gameplay integration (Task 8).
 *
 * Validates:
 * - Every spawned Skeleton displays the correct Idle animation.
 * - Walking animations synchronize with enemy movement.
 * - Multiple Skeletons animate simultaneously.
 * - SpriteComposer coordinates enemy rendering correctly.
 * - MainScene contains no animation selection logic.
 * - The implementation remains consistent with the Player rendering architecture.
 */

// Mock the EnemyAnimationRegistrar to provide resolveAnimationKey
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

/** Set of animation keys that "exist" in the mock scene */
let registeredKeys: Set<string>;

/** Creates a mock Phaser sprite with a mock scene (simulates full Phaser sprite) */
function createMockSprite() {
  return {
    play: vi.fn(),
    setDepth: vi.fn(),
    setImmovable: vi.fn(),
    scene: {
      anims: {
        exists: vi.fn((key: string) => registeredKeys.has(key)),
      },
    },
  } as unknown as Phaser.GameObjects.Sprite;
}

/** Creates a mock Phaser scene with physics for Enemy construction */
function createMockScene() {
  const sprite = createMockSprite();

  return {
    physics: {
      add: {
        sprite: vi.fn(() => sprite),
      },
    },
    anims: {
      exists: vi.fn((key: string) => registeredKeys.has(key)),
    },
    _mockSprite: sprite,
  } as unknown as Phaser.Scene & { _mockSprite: ReturnType<typeof createMockSprite> };
}

describe("Enemy Animation Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // All standard Skeleton animations are available
    registeredKeys = new Set([
      "skeleton-idle-up",
      "skeleton-idle-down",
      "skeleton-idle-left",
      "skeleton-idle-right",
      "skeleton-walk-up",
      "skeleton-walk-down",
      "skeleton-walk-left",
      "skeleton-walk-right",
    ]);
  });

  describe("Spawned Skeleton displays correct Idle animation", () => {
    it("should initialize with idle-down animation key via SpriteComposer", () => {
      const sprite = createMockSprite();
      const composer = new EnemySpriteComposer(sprite, EnemyType.Skeleton);

      // Simulate what the Enemy constructor does
      composer.updateAnimation("idle", "down");

      expect(composer.getCurrentAnimationKey()).toBe("skeleton-idle-down");
      expect(sprite.play).toHaveBeenCalledWith("skeleton-idle-down");
    });

    it("should play idle animation immediately upon creation", () => {
      const sprite = createMockSprite();
      const composer = new EnemySpriteComposer(sprite, EnemyType.Skeleton);

      composer.updateAnimation("idle", "down");

      // Verify it was played exactly once (not restarted)
      expect(sprite.play).toHaveBeenCalledTimes(1);
    });

    it("should default to 'down' direction matching Enemy constructor default", () => {
      const sprite = createMockSprite();
      const composer = new EnemySpriteComposer(sprite, EnemyType.Skeleton);

      // The Enemy constructor defaults state="idle", direction="down"
      composer.updateAnimation("idle", "down");

      expect(composer.getCurrentAnimationKey()).toBe("skeleton-idle-down");
    });
  });

  describe("Walking animations synchronize with enemy movement", () => {
    it("should transition from idle to walking when state changes", () => {
      const sprite = createMockSprite();
      const composer = new EnemySpriteComposer(sprite, EnemyType.Skeleton);

      // Initial idle state
      composer.updateAnimation("idle", "down");
      expect(composer.getCurrentAnimationKey()).toBe("skeleton-idle-down");

      // Simulate movement starting — state changes to walking
      composer.updateAnimation("walking", "down");
      expect(composer.getCurrentAnimationKey()).toBe("skeleton-walk-down");
      expect(sprite.play).toHaveBeenCalledWith("skeleton-walk-down");
    });

    it("should transition back to idle when movement stops", () => {
      const sprite = createMockSprite();
      const composer = new EnemySpriteComposer(sprite, EnemyType.Skeleton);

      composer.updateAnimation("walking", "left");
      expect(composer.getCurrentAnimationKey()).toBe("skeleton-walk-left");

      // Movement stops — back to idle
      composer.updateAnimation("idle", "left");
      expect(composer.getCurrentAnimationKey()).toBe("skeleton-idle-left");
    });

    it("should update walking direction when movement direction changes", () => {
      const sprite = createMockSprite();
      const composer = new EnemySpriteComposer(sprite, EnemyType.Skeleton);

      composer.updateAnimation("walking", "down");
      composer.updateAnimation("walking", "right");

      expect(composer.getCurrentAnimationKey()).toBe("skeleton-walk-right");
    });

    it("should support the full idle→walking→direction change→idle cycle", () => {
      const sprite = createMockSprite();
      const composer = new EnemySpriteComposer(sprite, EnemyType.Skeleton);

      // Start idle
      composer.updateAnimation("idle", "down");
      expect(composer.getCurrentAnimationKey()).toBe("skeleton-idle-down");

      // Start walking
      composer.updateAnimation("walking", "down");
      expect(composer.getCurrentAnimationKey()).toBe("skeleton-walk-down");

      // Change direction while walking
      composer.updateAnimation("walking", "up");
      expect(composer.getCurrentAnimationKey()).toBe("skeleton-walk-up");

      // Stop — return to idle
      composer.updateAnimation("idle", "up");
      expect(composer.getCurrentAnimationKey()).toBe("skeleton-idle-up");
    });
  });

  describe("Multiple Skeletons animate simultaneously", () => {
    it("should allow independent animation state per enemy instance", () => {
      const sprite1 = createMockSprite();
      const sprite2 = createMockSprite();
      const sprite3 = createMockSprite();

      const composer1 = new EnemySpriteComposer(sprite1, EnemyType.Skeleton);
      const composer2 = new EnemySpriteComposer(sprite2, EnemyType.Skeleton);
      const composer3 = new EnemySpriteComposer(sprite3, EnemyType.Skeleton);

      // Each enemy has a different animation
      composer1.updateAnimation("idle", "down");
      composer2.updateAnimation("walking", "left");
      composer3.updateAnimation("walking", "up");

      expect(composer1.getCurrentAnimationKey()).toBe("skeleton-idle-down");
      expect(composer2.getCurrentAnimationKey()).toBe("skeleton-walk-left");
      expect(composer3.getCurrentAnimationKey()).toBe("skeleton-walk-up");
    });

    it("should not interfere between instances when one changes state", () => {
      const sprite1 = createMockSprite();
      const sprite2 = createMockSprite();

      const composer1 = new EnemySpriteComposer(sprite1, EnemyType.Skeleton);
      const composer2 = new EnemySpriteComposer(sprite2, EnemyType.Skeleton);

      composer1.updateAnimation("idle", "down");
      composer2.updateAnimation("idle", "down");

      // Only enemy 1 starts walking
      composer1.updateAnimation("walking", "right");

      // Enemy 2 should remain idle
      expect(composer1.getCurrentAnimationKey()).toBe("skeleton-walk-right");
      expect(composer2.getCurrentAnimationKey()).toBe("skeleton-idle-down");
    });

    it("each enemy owns its own controller instance", () => {
      const sprite1 = createMockSprite();
      const sprite2 = createMockSprite();

      const composer1 = new EnemySpriteComposer(sprite1, EnemyType.Skeleton);
      const composer2 = new EnemySpriteComposer(sprite2, EnemyType.Skeleton);

      // They are distinct objects with independent state
      expect(composer1).not.toBe(composer2);
      expect(composer1.getSprite()).not.toBe(composer2.getSprite());
    });
  });

  describe("SpriteComposer coordinates enemy rendering", () => {
    it("EnemySpriteComposer delegates to EnemyAnimationController", () => {
      const sprite = createMockSprite();
      const composer = new EnemySpriteComposer(sprite, EnemyType.Skeleton);

      // The composer should delegate to the controller which calls sprite.play
      composer.updateAnimation("idle", "down");

      // Sprite.play was invoked — proof the chain works
      expect(sprite.play).toHaveBeenCalledWith("skeleton-idle-down");
    });

    it("SpriteComposer provides the sprite reference", () => {
      const sprite = createMockSprite();
      const composer = new EnemySpriteComposer(sprite, EnemyType.Skeleton);

      expect(composer.getSprite()).toBe(sprite);
    });

    it("EnemySpriteComposer is the sole entry point for animation changes", () => {
      const sprite = createMockSprite();
      const composer = new EnemySpriteComposer(sprite, EnemyType.Skeleton);

      // All animation updates go through updateAnimation
      composer.updateAnimation("walking", "left");
      composer.updateAnimation("idle", "right");

      // Verify the controller handled both calls via the composer
      expect(composer.getCurrentAnimationKey()).toBe("skeleton-idle-right");
    });

    it("Enemy.ts does not contain direct Phaser animation calls", () => {
      const enemySource = fs.readFileSync(
        path.resolve(__dirname, "../entities/characters/Enemy.ts"),
        "utf-8"
      );

      // Enemy should NOT directly call sprite.play() or sprite.anims.play()
      // It should only call spriteComposer.updateAnimation()
      expect(enemySource).not.toMatch(/this\.sprite\.play\(/);
      expect(enemySource).not.toMatch(/this\.sprite\.anims\.play\(/);
      expect(enemySource).not.toMatch(/\.anims\.play\(/);

      // It SHOULD call spriteComposer.updateAnimation
      expect(enemySource).toMatch(/spriteComposer\.updateAnimation\(/);
    });
  });

  describe("MainScene contains no animation selection logic", () => {
    it("MainScene does not determine which animation to play", () => {
      const mainSceneSource = fs.readFileSync(
        path.resolve(__dirname, "../scenes/MainScene.ts"),
        "utf-8"
      );

      // MainScene should NOT contain animation selection patterns
      // These patterns would indicate MainScene is choosing animations:
      expect(mainSceneSource).not.toMatch(/\.play\(["']skeleton-(idle|walk)/);
      expect(mainSceneSource).not.toMatch(/updateAnimation\(/);
      expect(mainSceneSource).not.toMatch(/setState\(/);
      expect(mainSceneSource).not.toMatch(/setDirection\(/);
      expect(mainSceneSource).not.toMatch(/setStateAndDirection\(/);
    });

    it("MainScene only calls registerAnimations (registration, not selection)", () => {
      const mainSceneSource = fs.readFileSync(
        path.resolve(__dirname, "../scenes/MainScene.ts"),
        "utf-8"
      );

      // Registration IS allowed in MainScene
      expect(mainSceneSource).toMatch(/registerAnimations/);

      // But selection logic is NOT:
      // No direct animation key construction
      expect(mainSceneSource).not.toMatch(/skeleton-(idle|walk)-(up|down|left|right)/);
    });

    it("MainScene does not import EnemyAnimationController", () => {
      const mainSceneSource = fs.readFileSync(
        path.resolve(__dirname, "../scenes/MainScene.ts"),
        "utf-8"
      );

      // MainScene should not import the controller (that's internal to the enemy)
      expect(mainSceneSource).not.toMatch(/EnemyAnimationController/);
      expect(mainSceneSource).not.toMatch(/EnemySpriteComposer/);
    });
  });

  describe("Consistent with Player rendering architecture", () => {
    it("Enemy follows same Entity → Composer → Controller → Phaser pattern as Player", () => {
      const enemySource = fs.readFileSync(
        path.resolve(__dirname, "../entities/characters/Enemy.ts"),
        "utf-8"
      );
      const playerSource = fs.readFileSync(
        path.resolve(__dirname, "../entities/characters/Player.ts"),
        "utf-8"
      );

      // Both Player and Enemy use a SpriteComposer
      expect(playerSource).toMatch(/spriteComposer/);
      expect(enemySource).toMatch(/spriteComposer/);

      // Both delegate animation to their respective composers
      expect(playerSource).toMatch(/spriteComposer\./);
      expect(enemySource).toMatch(/spriteComposer\.updateAnimation\(/);
    });

    it("Enemy uses EnemySpriteComposer which parallels DefaultSpriteComposer", () => {
      const enemySource = fs.readFileSync(
        path.resolve(__dirname, "../entities/characters/Enemy.ts"),
        "utf-8"
      );
      const playerSource = fs.readFileSync(
        path.resolve(__dirname, "../entities/characters/Player.ts"),
        "utf-8"
      );

      // Enemy uses EnemySpriteComposer
      expect(enemySource).toMatch(/EnemySpriteComposer/);

      // Player uses DefaultSpriteComposer
      expect(playerSource).toMatch(/DefaultSpriteComposer/);
    });

    it("neither Enemy nor Player invoke Phaser animations directly", () => {
      const enemySource = fs.readFileSync(
        path.resolve(__dirname, "../entities/characters/Enemy.ts"),
        "utf-8"
      );
      const playerSource = fs.readFileSync(
        path.resolve(__dirname, "../entities/characters/Player.ts"),
        "utf-8"
      );

      // Neither entity should call .anims.play() directly
      expect(enemySource).not.toMatch(/\.anims\.play\(/);
      // Player uses spriteComposer.playAnimation (not direct Phaser calls)
      expect(playerSource).toMatch(/spriteComposer\.playAnimation/);
    });

    it("Enemy exposes state/direction via setters like Player uses move/stop", () => {
      const enemySource = fs.readFileSync(
        path.resolve(__dirname, "../entities/characters/Enemy.ts"),
        "utf-8"
      );

      // Enemy exposes state changes through setState/setDirection
      expect(enemySource).toMatch(/setState\(/);
      expect(enemySource).toMatch(/setDirection\(/);
      expect(enemySource).toMatch(/setStateAndDirection\(/);
    });

    it("both entities store state and direction internally", () => {
      const enemySource = fs.readFileSync(
        path.resolve(__dirname, "../entities/characters/Enemy.ts"),
        "utf-8"
      );
      const playerSource = fs.readFileSync(
        path.resolve(__dirname, "../entities/characters/Player.ts"),
        "utf-8"
      );

      // Both store state and direction as private fields
      expect(enemySource).toMatch(/private.*state/);
      expect(enemySource).toMatch(/private.*direction/);
      expect(playerSource).toMatch(/private.*state/);
      expect(playerSource).toMatch(/private.*direction/);
    });
  });
});
