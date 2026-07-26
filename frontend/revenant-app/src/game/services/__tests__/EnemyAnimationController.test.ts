import { describe, it, expect, vi, beforeEach } from "vitest";
import { EnemyType } from "@/game/config/EnemySpriteRegistry";
import { EnemyAnimationController } from "@/game/services/EnemyAnimationController";
import type { EnemyAnimationState, EnemyDirection } from "@/game/services/EnemyAnimationRegistrar";

/**
 * Unit tests for EnemyAnimationController.
 *
 * Validates:
 * - Invalid animation states are handled safely (no crash, current preserved)
 * - Invalid directions do not break animation playback
 * - Missing animation keys do not crash the scene
 * - Correct animation key resolution and playback
 * - Duplicate playback prevention
 */

// Mock the EnemyAnimationRegistrar module
vi.mock("@/game/services/EnemyAnimationRegistrar", () => ({
  enemyAnimationRegistrar: {
    resolveAnimationKey: vi.fn(
      (enemyType: string, state: string, direction: string) => {
        const stateKey = state === "walking" ? "walk" : "idle";
        return `${enemyType}-${stateKey}-${direction}`;
      }
    ),
  },
}));

/** Set of animation keys that "exist" in the mock scene */
let registeredKeys: Set<string>;

/** Creates a mock Phaser sprite with a mock scene */
function createMockSprite() {
  const sprite = {
    play: vi.fn(),
    scene: {
      anims: {
        exists: vi.fn((key: string) => registeredKeys.has(key)),
      },
    },
  } as unknown as Phaser.GameObjects.Sprite;

  return sprite;
}

describe("EnemyAnimationController", () => {
  let mockSprite: Phaser.GameObjects.Sprite;
  let controller: EnemyAnimationController;

  beforeEach(() => {
    vi.clearAllMocks();
    // All 8 standard animations are registered
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
    mockSprite = createMockSprite();
    controller = new EnemyAnimationController(mockSprite, EnemyType.Skeleton);
  });

  describe("Valid state and direction", () => {
    it("should play the correct animation for idle-down", () => {
      controller.update("idle", "down");
      expect(mockSprite.play).toHaveBeenCalledWith("skeleton-idle-down");
      expect(controller.getCurrentAnimationKey()).toBe("skeleton-idle-down");
    });

    it("should play the correct animation for walking-up", () => {
      controller.update("walking", "up");
      expect(mockSprite.play).toHaveBeenCalledWith("skeleton-walk-up");
      expect(controller.getCurrentAnimationKey()).toBe("skeleton-walk-up");
    });

    it("should update when state changes from idle to walking", () => {
      controller.update("idle", "down");
      controller.update("walking", "down");
      expect(mockSprite.play).toHaveBeenCalledTimes(2);
      expect(controller.getCurrentAnimationKey()).toBe("skeleton-walk-down");
    });

    it("should update when direction changes", () => {
      controller.update("idle", "down");
      controller.update("idle", "left");
      expect(mockSprite.play).toHaveBeenCalledTimes(2);
      expect(controller.getCurrentAnimationKey()).toBe("skeleton-idle-left");
    });
  });

  describe("Duplicate playback prevention", () => {
    it("should not restart the same animation", () => {
      controller.update("idle", "down");
      controller.update("idle", "down");
      expect(mockSprite.play).toHaveBeenCalledTimes(1);
    });

    it("should preserve the current key when same animation is requested", () => {
      controller.update("walking", "right");
      controller.update("walking", "right");
      expect(controller.getCurrentAnimationKey()).toBe("skeleton-walk-right");
      expect(mockSprite.play).toHaveBeenCalledTimes(1);
    });
  });

  describe("Invalid animation states", () => {
    it("should not crash when receiving an invalid state", () => {
      expect(() => {
        controller.update("attack" as EnemyAnimationState, "down");
      }).not.toThrow();
    });

    it("should preserve the current animation when an invalid state is received", () => {
      controller.update("idle", "down");
      controller.update("attack" as EnemyAnimationState, "down");
      expect(controller.getCurrentAnimationKey()).toBe("skeleton-idle-down");
    });

    it("should not call play when state is invalid", () => {
      controller.update("attack" as EnemyAnimationState, "down");
      expect(mockSprite.play).not.toHaveBeenCalled();
    });

    it("should handle undefined state gracefully", () => {
      controller.update("idle", "down");
      controller.update(undefined as unknown as EnemyAnimationState, "down");
      expect(controller.getCurrentAnimationKey()).toBe("skeleton-idle-down");
    });

    it("should handle null state gracefully", () => {
      controller.update("idle", "left");
      controller.update(null as unknown as EnemyAnimationState, "left");
      expect(controller.getCurrentAnimationKey()).toBe("skeleton-idle-left");
    });

    it("should handle empty string state gracefully", () => {
      controller.update("idle", "right");
      controller.update("" as EnemyAnimationState, "right");
      expect(controller.getCurrentAnimationKey()).toBe("skeleton-idle-right");
    });
  });

  describe("Invalid directions", () => {
    it("should not crash when receiving an invalid direction", () => {
      expect(() => {
        controller.update("idle", "diagonal" as EnemyDirection);
      }).not.toThrow();
    });

    it("should preserve the current animation when an invalid direction is received", () => {
      controller.update("walking", "up");
      controller.update("walking", "diagonal" as EnemyDirection);
      expect(controller.getCurrentAnimationKey()).toBe("skeleton-walk-up");
    });

    it("should not call play when direction is invalid", () => {
      controller.update("idle", "diagonal" as EnemyDirection);
      expect(mockSprite.play).not.toHaveBeenCalled();
    });

    it("should handle undefined direction gracefully", () => {
      controller.update("idle", "down");
      controller.update("idle", undefined as unknown as EnemyDirection);
      expect(controller.getCurrentAnimationKey()).toBe("skeleton-idle-down");
    });

    it("should handle null direction gracefully", () => {
      controller.update("walking", "left");
      controller.update("walking", null as unknown as EnemyDirection);
      expect(controller.getCurrentAnimationKey()).toBe("skeleton-walk-left");
    });
  });

  describe("Missing animation keys", () => {
    it("should not crash when the animation key does not exist", () => {
      // Remove all registered keys to simulate missing animations
      registeredKeys.clear();

      expect(() => {
        controller.update("idle", "down");
      }).not.toThrow();
    });

    it("should not play animation when the key does not exist", () => {
      registeredKeys.clear();
      controller.update("idle", "down");
      expect(mockSprite.play).not.toHaveBeenCalled();
    });

    it("should preserve empty current key when animation does not exist", () => {
      registeredKeys.clear();
      controller.update("idle", "down");
      expect(controller.getCurrentAnimationKey()).toBe("");
    });

    it("should preserve current animation key when new key does not exist", () => {
      // Play a valid animation first
      controller.update("idle", "down");
      expect(controller.getCurrentAnimationKey()).toBe("skeleton-idle-down");

      // Remove the next animation key
      registeredKeys.delete("skeleton-walk-down");
      controller.update("walking", "down");

      // The current key should still be the previously valid one
      expect(controller.getCurrentAnimationKey()).toBe("skeleton-idle-down");
    });

    it("should not crash the scene when partial animations are registered", () => {
      // Only some keys exist
      registeredKeys.clear();
      registeredKeys.add("skeleton-idle-down");

      expect(() => {
        controller.update("idle", "down"); // exists
        controller.update("walking", "down"); // doesn't exist
        controller.update("idle", "up"); // doesn't exist
        controller.update("walking", "left"); // doesn't exist
      }).not.toThrow();

      // Only the first valid animation should have been played
      expect(mockSprite.play).toHaveBeenCalledTimes(1);
      expect(controller.getCurrentAnimationKey()).toBe("skeleton-idle-down");
    });
  });

  describe("Initial state", () => {
    it("should start with an empty animation key", () => {
      const freshController = new EnemyAnimationController(
        mockSprite,
        EnemyType.Skeleton
      );
      expect(freshController.getCurrentAnimationKey()).toBe("");
    });
  });
});
