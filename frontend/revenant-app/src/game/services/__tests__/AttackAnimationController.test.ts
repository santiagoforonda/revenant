import { describe, it, expect, vi, beforeEach } from "vitest";
import { AttackAnimationController } from "@/game/services/AttackAnimationController";
import type { PlayerDirection } from "@/game/services/SpriteComposer";
import type { ClassSpriteConfig } from "@/game/config/ClassSpriteRegistry";
import { PlayerClass } from "@/game/config/ClassSpriteRegistry";

/**
 * Unit tests for AttackAnimationController.
 *
 * Validates: Requirement 2 (Play Attack Animation)
 *
 * Validates:
 * - Correct attack animation key resolution based on direction
 * - Overlap prevention (rejects if already playing)
 * - Graceful handling of missing animation keys
 * - Promise resolves when animation completes
 * - State restored (isPlaying = false) after animation finishes
 */

/** Set of animation keys that "exist" in the mock scene */
let registeredKeys: Set<string>;

/** Stores the event listener registered via sprite.once() */
let animationCompleteCallback: (() => void) | null = null;

/** Creates a mock Phaser physics arcade sprite with event support */
function createMockBodySprite() {
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
  } as unknown as Phaser.Physics.Arcade.Sprite;

  return sprite;
}

/** Creates a mock ClassSpriteConfig for the knight class */
function createMockConfig(): ClassSpriteConfig {
  return {
    classId: PlayerClass.Caballero,
    layers: {
      feet: "knight-feet",
      legs: "knight-legs",
      torso: "knight-torso",
      weapon: "knight-weapon",
      shield: "knight-shield",
      helmet: "knight-helmet",
    },
    helmetType: "directional",
  };
}

describe("AttackAnimationController", () => {
  let mockSprite: Phaser.Physics.Arcade.Sprite;
  let config: ClassSpriteConfig;
  let controller: AttackAnimationController;

  beforeEach(() => {
    vi.clearAllMocks();

    // Register attack animation keys for all directions
    registeredKeys = new Set([
      "knight-body-attack-up",
      "knight-body-attack-down",
      "knight-body-attack-left",
      "knight-body-attack-right",
    ]);

    mockSprite = createMockBodySprite();
    config = createMockConfig();
    controller = new AttackAnimationController(mockSprite, config);
  });

  describe("playAttack - correct animation selection", () => {
    it("should play the attack animation for the down direction", async () => {
      const promise = controller.playAttack("down");

      expect(mockSprite.play).toHaveBeenCalledWith("knight-body-attack-down");

      // Simulate animation complete
      animationCompleteCallback!();
      await promise;
    });

    it("should play the attack animation for the up direction", async () => {
      const promise = controller.playAttack("up");

      expect(mockSprite.play).toHaveBeenCalledWith("knight-body-attack-up");

      animationCompleteCallback!();
      await promise;
    });

    it("should play the attack animation for the left direction", async () => {
      const promise = controller.playAttack("left");

      expect(mockSprite.play).toHaveBeenCalledWith("knight-body-attack-left");

      animationCompleteCallback!();
      await promise;
    });

    it("should play the attack animation for the right direction", async () => {
      const promise = controller.playAttack("right");

      expect(mockSprite.play).toHaveBeenCalledWith("knight-body-attack-right");

      animationCompleteCallback!();
      await promise;
    });
  });

  describe("playAttack - overlap prevention", () => {
    it("should reject if an attack animation is already playing", async () => {
      // Start first attack
      controller.playAttack("down");

      // Attempt second attack while first is still playing
      await expect(controller.playAttack("up")).rejects.toThrow(
        "Attack animation already in progress"
      );
    });

    it("should allow a new attack after the previous one finishes", async () => {
      const firstPromise = controller.playAttack("down");
      animationCompleteCallback!();
      await firstPromise;

      // Start second attack — should succeed
      const secondPromise = controller.playAttack("up");
      expect(mockSprite.play).toHaveBeenCalledWith("knight-body-attack-up");
      animationCompleteCallback!();
      await secondPromise;
    });

    it("should not play the animation when rejecting an overlapping request", async () => {
      controller.playAttack("down");

      // Clear play call count
      (mockSprite.play as ReturnType<typeof vi.fn>).mockClear();

      // Attempt overlapping attack
      await expect(controller.playAttack("left")).rejects.toThrow();

      expect(mockSprite.play).not.toHaveBeenCalled();
    });
  });

  describe("playAttack - animation completion", () => {
    it("should resolve the Promise when animation finishes", async () => {
      const promise = controller.playAttack("down");

      // Animation hasn't finished yet
      expect(controller.isPlaying()).toBe(true);

      // Simulate animation complete event
      animationCompleteCallback!();

      await promise;
      expect(controller.isPlaying()).toBe(false);
    });

    it("should register the animationcomplete listener with once()", () => {
      controller.playAttack("down");

      expect(mockSprite.once).toHaveBeenCalledWith(
        "animationcomplete",
        expect.any(Function)
      );
    });
  });

  describe("playAttack - missing animation key", () => {
    it("should resolve immediately when animation key does not exist", async () => {
      registeredKeys.clear();

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await controller.playAttack("down");

      expect(mockSprite.play).not.toHaveBeenCalled();
      expect(controller.isPlaying()).toBe(false);

      consoleSpy.mockRestore();
    });

    it("should log an error when animation key does not exist", async () => {
      registeredKeys.clear();

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await controller.playAttack("down");

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("knight-body-attack-down")
      );

      consoleSpy.mockRestore();
    });
  });

  describe("isPlaying", () => {
    it("should return false initially", () => {
      expect(controller.isPlaying()).toBe(false);
    });

    it("should return true while attack animation is in progress", () => {
      controller.playAttack("down");
      expect(controller.isPlaying()).toBe(true);
    });

    it("should return false after the animation finishes", async () => {
      const promise = controller.playAttack("down");
      animationCompleteCallback!();
      await promise;

      expect(controller.isPlaying()).toBe(false);
    });

    it("should return false when animation key does not exist (immediate resolve)", async () => {
      registeredKeys.clear();
      vi.spyOn(console, "error").mockImplementation(() => {});

      await controller.playAttack("down");

      expect(controller.isPlaying()).toBe(false);
    });
  });

  describe("Different class configurations", () => {
    it("should use the classId from config to resolve animation keys", async () => {
      const arqueroConfig: ClassSpriteConfig = {
        classId: PlayerClass.Arquero,
        layers: {
          feet: "arquero-feet",
          legs: "arquero-legs",
          torso: "arquero-torso",
          weapon: "arquero-weapon",
          shield: null,
          helmet: "arquero-helmet",
        },
        helmetType: "spritesheet",
      };

      registeredKeys.add("arquero-body-attack-down");

      const arqueroSprite = createMockBodySprite();
      const arqueroController = new AttackAnimationController(arqueroSprite, arqueroConfig);

      const promise = arqueroController.playAttack("down");
      expect(arqueroSprite.play).toHaveBeenCalledWith("arquero-body-attack-down");

      animationCompleteCallback!();
      await promise;
    });
  });
});
