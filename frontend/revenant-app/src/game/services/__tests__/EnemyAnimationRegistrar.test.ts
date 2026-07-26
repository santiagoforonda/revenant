import { describe, it, expect, vi, beforeEach } from "vitest";
import { EnemyType } from "@/game/config/EnemySpriteRegistry";

/**
 * Unit tests for EnemyAnimationRegistrar.
 *
 * Validates:
 * - All 8 animation keys are registered (4 idle + 4 walk)
 * - Keys follow naming convention: skeleton-{state}-{direction}
 * - Duplicate registration is prevented
 * - areAnimationsRegistered() returns correct status
 * - Missing spritesheet prevents registration without crashing
 */

// Mock the AssetLoaderService module
vi.mock("@/game/services/AssetLoaderService", () => ({
  assetLoaderService: {
    isEnemySpritesheetLoaded: vi.fn().mockReturnValue(true),
  },
}));

// Import after mocking
import { enemyAnimationRegistrar } from "@/game/services/EnemyAnimationRegistrar";
import { assetLoaderService } from "@/game/services/AssetLoaderService";

/** Creates a mock Phaser Scene with a functional Animation Manager */
function createMockScene() {
  const registeredAnims = new Map<string, object>();

  const anims = {
    exists: vi.fn((key: string) => registeredAnims.has(key)),
    create: vi.fn((config: { key: string }) => {
      registeredAnims.set(config.key, config);
      return config;
    }),
    generateFrameNumbers: vi.fn(
      (textureKey: string, config: { start: number; end: number }) => {
        const frames = [];
        for (let i = config.start; i <= config.end; i++) {
          frames.push({ key: textureKey, frame: i });
        }
        return frames;
      }
    ),
  };

  return {
    anims,
    _registeredAnims: registeredAnims,
  } as unknown as Phaser.Scene & { _registeredAnims: Map<string, object> };
}

describe("EnemyAnimationRegistrar", () => {
  let mockScene: ReturnType<typeof createMockScene>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockScene = createMockScene();
  });

  describe("Animation registration correctness", () => {
    it("should register all 8 animation keys (4 idle + 4 walk)", () => {
      enemyAnimationRegistrar.registerAnimations(mockScene, EnemyType.Skeleton);

      const expectedKeys = [
        "skeleton-idle-up",
        "skeleton-idle-down",
        "skeleton-idle-left",
        "skeleton-idle-right",
        "skeleton-walk-up",
        "skeleton-walk-down",
        "skeleton-walk-left",
        "skeleton-walk-right",
      ];

      for (const key of expectedKeys) {
        expect(
          mockScene._registeredAnims.has(key),
          `Expected animation key "${key}" to be registered`
        ).toBe(true);
      }

      expect(mockScene._registeredAnims.size).toBe(8);
    });

    it("should follow the naming convention: skeleton-{state}-{direction}", () => {
      enemyAnimationRegistrar.registerAnimations(mockScene, EnemyType.Skeleton);

      const keys = Array.from(mockScene._registeredAnims.keys());
      const pattern = /^skeleton-(idle|walk)-(up|down|left|right)$/;

      for (const key of keys) {
        expect(key).toMatch(pattern);
      }
    });

    it("should return true on successful registration", () => {
      const result = enemyAnimationRegistrar.registerAnimations(
        mockScene,
        EnemyType.Skeleton
      );
      expect(result).toBe(true);
    });

    it("should create idle animations with repeat -1 for continuous looping", () => {
      enemyAnimationRegistrar.registerAnimations(mockScene, EnemyType.Skeleton);

      const createCalls = (mockScene.anims.create as ReturnType<typeof vi.fn>).mock.calls;
      const idleCalls = createCalls.filter((call: [{ key: string; repeat: number }]) =>
        call[0].key.includes("idle")
      );

      for (const call of idleCalls) {
        expect(call[0].repeat).toBe(-1);
      }
    });

    it("should create walk animations with repeat -1 for continuous looping", () => {
      enemyAnimationRegistrar.registerAnimations(mockScene, EnemyType.Skeleton);

      const createCalls = (mockScene.anims.create as ReturnType<typeof vi.fn>).mock.calls;
      const walkCalls = createCalls.filter((call: [{ key: string; repeat: number }]) =>
        call[0].key.includes("walk")
      );

      for (const call of walkCalls) {
        expect(call[0].repeat).toBe(-1);
      }
    });
  });

  describe("Duplicate registration prevention", () => {
    it("should not create duplicate animations when called twice", () => {
      enemyAnimationRegistrar.registerAnimations(mockScene, EnemyType.Skeleton);
      enemyAnimationRegistrar.registerAnimations(mockScene, EnemyType.Skeleton);

      // After first registration, anims.exists() returns true for all keys
      // so the second call should not call create() again
      expect(mockScene._registeredAnims.size).toBe(8);
    });

    it("should return true on the second registration call (already registered)", () => {
      enemyAnimationRegistrar.registerAnimations(mockScene, EnemyType.Skeleton);
      const result = enemyAnimationRegistrar.registerAnimations(
        mockScene,
        EnemyType.Skeleton
      );
      expect(result).toBe(true);
    });

    it("areAnimationsRegistered() should return true after first registration", () => {
      enemyAnimationRegistrar.registerAnimations(mockScene, EnemyType.Skeleton);

      const result = enemyAnimationRegistrar.areAnimationsRegistered(
        mockScene,
        EnemyType.Skeleton
      );
      expect(result).toBe(true);
    });

    it("areAnimationsRegistered() should return false before registration", () => {
      const freshScene = createMockScene();
      const result = enemyAnimationRegistrar.areAnimationsRegistered(
        freshScene,
        EnemyType.Skeleton
      );
      expect(result).toBe(false);
    });
  });

  describe("Missing spritesheet handling", () => {
    it("should return false when spritesheet is not loaded", () => {
      vi.mocked(assetLoaderService.isEnemySpritesheetLoaded).mockReturnValue(false);

      const freshScene = createMockScene();
      const result = enemyAnimationRegistrar.registerAnimations(
        freshScene,
        EnemyType.Skeleton
      );
      expect(result).toBe(false);
    });

    it("should not register any animations when spritesheet is missing", () => {
      vi.mocked(assetLoaderService.isEnemySpritesheetLoaded).mockReturnValue(false);

      const freshScene = createMockScene();
      enemyAnimationRegistrar.registerAnimations(freshScene, EnemyType.Skeleton);
      expect(freshScene._registeredAnims.size).toBe(0);
    });

    it("should not crash when spritesheet is unavailable", () => {
      vi.mocked(assetLoaderService.isEnemySpritesheetLoaded).mockReturnValue(false);

      const freshScene = createMockScene();
      expect(() => {
        enemyAnimationRegistrar.registerAnimations(freshScene, EnemyType.Skeleton);
      }).not.toThrow();
    });
  });

  describe("resolveAnimationKey", () => {
    it("should resolve idle-down key correctly", () => {
      const key = enemyAnimationRegistrar.resolveAnimationKey(
        EnemyType.Skeleton,
        "idle",
        "down"
      );
      expect(key).toBe("skeleton-idle-down");
    });

    it("should resolve walking-up key correctly", () => {
      const key = enemyAnimationRegistrar.resolveAnimationKey(
        EnemyType.Skeleton,
        "walking",
        "up"
      );
      expect(key).toBe("skeleton-walk-up");
    });

    it("should resolve all valid combinations", () => {
      const states = ["idle", "walking"] as const;
      const directions = ["up", "down", "left", "right"] as const;

      for (const state of states) {
        for (const direction of directions) {
          const key = enemyAnimationRegistrar.resolveAnimationKey(
            EnemyType.Skeleton,
            state,
            direction
          );
          const stateKey = state === "walking" ? "walk" : "idle";
          expect(key).toBe(`skeleton-${stateKey}-${direction}`);
        }
      }
    });
  });
});
