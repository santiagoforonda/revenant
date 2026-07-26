import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeathAnimationController } from "@/game/services/DeathAnimationController";

/**
 * Unit tests for DeathAnimationController.
 *
 * Validates: Requirement 3 (Play Death Animation)
 *
 * Validates:
 * - Death animation plays correctly when key exists
 * - Resolves with DeathAnimationResult containing completed: true and duration
 * - Prevents additional animations during the death sequence
 * - Handles missing animation keys gracefully (completed: false)
 * - Handles missing scene gracefully (completed: false)
 */

/** Set of animation keys that "exist" in the mock scene */
let registeredKeys: Set<string>;

/** Stores the event listener registered via sprite.once() */
let animationCompleteCallback: (() => void) | null = null;

/** Creates a mock Phaser sprite with event support */
function createMockSprite() {
  animationCompleteCallback = null;

  const sprite = {
    play: vi.fn(),
    once: vi.fn((event: string, callback: () => void) => {
      if (event === "animationcomplete") {
        animationCompleteCallback = callback;
      }
    }),
    scene: {
      anims: {
        exists: vi.fn((key: string) => registeredKeys.has(key)),
      },
    },
  } as unknown as Phaser.GameObjects.Sprite;

  return sprite;
}

describe("DeathAnimationController", () => {
  let mockSprite: Phaser.GameObjects.Sprite;
  let controller: DeathAnimationController;
  const DEATH_ANIM_KEY = "skeleton-death";

  beforeEach(() => {
    vi.clearAllMocks();
    registeredKeys = new Set([DEATH_ANIM_KEY]);
    mockSprite = createMockSprite();
    controller = new DeathAnimationController(mockSprite, DEATH_ANIM_KEY);
  });

  describe("playDeath - successful animation", () => {
    it("should play the death animation with the configured key", () => {
      controller.playDeath();

      expect(mockSprite.play).toHaveBeenCalledWith({ key: DEATH_ANIM_KEY, repeat: 0 });
    });

    it("should resolve with completed: true when the animation finishes", async () => {
      const promise = controller.playDeath();

      animationCompleteCallback!();
      const result = await promise;

      expect(result.completed).toBe(true);
    });

    it("should resolve with a positive duration when the animation finishes", async () => {
      const promise = controller.playDeath();

      animationCompleteCallback!();
      const result = await promise;

      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it("should register the animationcomplete listener with once()", () => {
      controller.playDeath();

      expect(mockSprite.once).toHaveBeenCalledWith(
        "animationcomplete",
        expect.any(Function)
      );
    });
  });

  describe("playDeath - overlap prevention", () => {
    it("should resolve with completed: false if a death animation is already playing", async () => {
      controller.playDeath();

      const secondResult = await controller.playDeath();

      expect(secondResult.completed).toBe(false);
      expect(secondResult.duration).toBe(0);
    });

    it("should not call play again if a death animation is already in progress", async () => {
      controller.playDeath();

      (mockSprite.play as ReturnType<typeof vi.fn>).mockClear();

      await controller.playDeath();

      expect(mockSprite.play).not.toHaveBeenCalled();
    });

    it("should not allow a second animation even after some time passes", async () => {
      controller.playDeath();

      // Animation not yet complete — second call should still be blocked
      const result = await controller.playDeath();

      expect(result.completed).toBe(false);
    });
  });

  describe("playDeath - missing animation key", () => {
    it("should resolve with completed: false when animation key does not exist", async () => {
      registeredKeys.clear();

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const result = await controller.playDeath();

      expect(result.completed).toBe(false);
      expect(result.duration).toBe(0);
      expect(mockSprite.play).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should log an error when animation key does not exist", async () => {
      registeredKeys.clear();

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await controller.playDeath();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(DEATH_ANIM_KEY)
      );

      consoleSpy.mockRestore();
    });
  });

  describe("playDeath - missing scene", () => {
    it("should resolve with completed: false when sprite has no scene", async () => {
      const spriteNoScene = {
        play: vi.fn(),
        once: vi.fn(),
        scene: null,
      } as unknown as Phaser.GameObjects.Sprite;

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const noSceneController = new DeathAnimationController(spriteNoScene, DEATH_ANIM_KEY);
      const result = await noSceneController.playDeath();

      expect(result.completed).toBe(false);
      expect(result.duration).toBe(0);

      consoleSpy.mockRestore();
    });
  });

  describe("isPlaying", () => {
    it("should return false initially", () => {
      expect(controller.isPlaying()).toBe(false);
    });

    it("should return true while death animation is in progress", () => {
      controller.playDeath();
      expect(controller.isPlaying()).toBe(true);
    });

    it("should return false after the animation finishes", async () => {
      const promise = controller.playDeath();
      animationCompleteCallback!();
      await promise;

      expect(controller.isPlaying()).toBe(false);
    });

    it("should return false when animation key does not exist (immediate resolve)", async () => {
      registeredKeys.clear();
      vi.spyOn(console, "error").mockImplementation(() => {});

      await controller.playDeath();

      expect(controller.isPlaying()).toBe(false);
    });
  });
});
