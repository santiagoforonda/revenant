import { describe, it, expect, vi, beforeEach } from "vitest";
import { PlayerAttackSystem } from "./PlayerAttackSystem";
import type { AttackAnimationControllerInterface } from "@/game/services/AttackAnimationController";
import type { Player } from "@/game/entities/characters/Player";
import type { Enemy } from "@/game/entities/characters/Enemy";
import type { PlayerDirection } from "@/game/services/SpriteComposer";

/**
 * Creates a minimal mock of a Phaser Scene with input and time support.
 */
function createMockScene() {
  const listeners: Record<string, ((...args: unknown[]) => void)[]> = {};

  return {
    input: {
      on(event: string, handler: (...args: unknown[]) => void) {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(handler);
      },
      off(event: string, handler: (...args: unknown[]) => void) {
        if (listeners[event]) {
          listeners[event] = listeners[event].filter((h) => h !== handler);
        }
      },
    },
    time: {
      now: 1000,
    },
    simulatePointerDown(button: number = 0) {
      const pointer = { button };
      for (const handler of listeners["pointerdown"] ?? []) {
        handler(pointer);
      }
    },
  } as unknown as Phaser.Scene & {
    simulatePointerDown: (button?: number) => void;
    time: { now: number };
  };
}

/**
 * Creates a minimal mock Player with configurable direction.
 */
function createMockPlayer(direction: PlayerDirection = "right"): Player {
  return {
    getDirection: () => direction,
    getX: () => 100,
    getY: () => 100,
  } as unknown as Player;
}

/**
 * Creates a mock AttackAnimationController that resolves immediately.
 */
function createSuccessfulAnimationController(): AttackAnimationControllerInterface {
  return {
    playAttack: vi.fn(() => Promise.resolve()),
    isPlaying: vi.fn(() => false),
  };
}

/**
 * Creates a mock AttackAnimationController that rejects with an error.
 */
function createFailingAnimationController(
  errorMessage: string = "Animation spritesheet not loaded"
): AttackAnimationControllerInterface {
  return {
    playAttack: vi.fn(() => Promise.reject(new Error(errorMessage))),
    isPlaying: vi.fn(() => false),
  };
}

describe("PlayerAttackSystem - Error Handling", () => {
  let scene: ReturnType<typeof createMockScene>;
  let player: Player;
  let enemies: Enemy[];

  beforeEach(() => {
    scene = createMockScene();
    player = createMockPlayer("right");
    enemies = [];
  });

  describe("Cooldown Active - Silently Ignored", () => {
    it("should silently ignore attacks while cooldown is active", () => {
      const system = new PlayerAttackSystem(
        scene as unknown as Phaser.Scene,
        player,
        enemies
      );
      const attackState = system.getAttackState();

      // First attack at time 1000
      scene.simulatePointerDown(0);
      expect(attackState.getLastAttackTime()).toBe(1000);

      // Second attack at time 1100 (within 500ms cooldown)
      scene.time.now = 1100;
      scene.simulatePointerDown(0);

      // Should remain at first attack time — silently ignored
      expect(attackState.getLastAttackTime()).toBe(1000);

      system.destroy();
    });

    it("should not generate a request when cooldown is active", () => {
      const system = new PlayerAttackSystem(
        scene as unknown as Phaser.Scene,
        player,
        enemies
      );

      const requestSpy = vi.spyOn(
        system as unknown as { onAttackRequestGenerated: (r: unknown) => void },
        "onAttackRequestGenerated"
      );

      // First attack
      scene.simulatePointerDown(0);
      expect(requestSpy).toHaveBeenCalledTimes(1);

      // Second attack within cooldown
      scene.time.now = 1100;
      scene.simulatePointerDown(0);
      expect(requestSpy).toHaveBeenCalledTimes(1); // No new request

      system.destroy();
    });
  });

  describe("Already Attacking - Silently Ignored", () => {
    it("should ignore attacks while already attacking (with animation controller)", () => {
      // Use a controller that never resolves (simulates ongoing animation)
      const neverResolvingController: AttackAnimationControllerInterface = {
        playAttack: vi.fn(() => new Promise<void>(() => {})),
        isPlaying: vi.fn(() => true),
      };

      const system = new PlayerAttackSystem(
        scene as unknown as Phaser.Scene,
        player,
        enemies,
        undefined,
        neverResolvingController
      );

      const attackState = system.getAttackState();

      // First attack — starts but never ends (animation ongoing)
      scene.simulatePointerDown(0);
      expect(attackState.getIsAttacking()).toBe(true);
      expect(attackState.getLastAttackTime()).toBe(1000);

      // Advance past cooldown, but still attacking
      scene.time.now = 2000;
      scene.simulatePointerDown(0);

      // Should still be at first attack time — second attack silently ignored
      expect(attackState.getLastAttackTime()).toBe(1000);

      system.destroy();
    });
  });

  describe("No Detected Enemies", () => {
    it("should generate an AttackRequest with empty targets when no enemies exist", () => {
      const system = new PlayerAttackSystem(
        scene as unknown as Phaser.Scene,
        player,
        [] // No enemies
      );

      const requestSpy = vi.spyOn(
        system as unknown as { onAttackRequestGenerated: (r: unknown) => void },
        "onAttackRequestGenerated"
      );

      scene.simulatePointerDown(0);

      expect(requestSpy).toHaveBeenCalledTimes(1);
      const request = requestSpy.mock.calls[0][0] as { targets: Enemy[] };
      expect(request.targets).toEqual([]);

      system.destroy();
    });

    it("should complete the attack normally with empty targets", () => {
      const system = new PlayerAttackSystem(
        scene as unknown as Phaser.Scene,
        player,
        [] // No enemies
      );

      const attackState = system.getAttackState();

      scene.simulatePointerDown(0);

      // Attack should complete and state should be cleared
      expect(attackState.getIsAttacking()).toBe(false);
      expect(attackState.getLastAttackTime()).toBe(1000);

      system.destroy();
    });
  });

  describe("Animation Failure - Graceful Recovery", () => {
    it("should log an error when animation fails", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const controller = createFailingAnimationController("Spritesheet missing");

      const system = new PlayerAttackSystem(
        scene as unknown as Phaser.Scene,
        player,
        enemies,
        undefined,
        controller
      );

      scene.simulatePointerDown(0);

      // Allow the promise rejection to propagate
      await vi.waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("[PlayerAttackSystem] Animation failure:")
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Spritesheet missing")
      );

      consoleErrorSpy.mockRestore();
      system.destroy();
    });

    it("should clear attacking state when animation fails", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});

      const controller = createFailingAnimationController();

      const system = new PlayerAttackSystem(
        scene as unknown as Phaser.Scene,
        player,
        enemies,
        undefined,
        controller
      );

      const attackState = system.getAttackState();

      scene.simulatePointerDown(0);

      // While animation is pending, state is attacking
      expect(attackState.getIsAttacking()).toBe(true);

      // After promise rejection settles, state should be cleared
      await vi.waitFor(() => {
        expect(attackState.getIsAttacking()).toBe(false);
      });

      vi.restoreAllMocks();
      system.destroy();
    });

    it("should allow a new attack after animation failure clears state", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});

      const controller = createFailingAnimationController();

      const system = new PlayerAttackSystem(
        scene as unknown as Phaser.Scene,
        player,
        enemies,
        undefined,
        controller
      );

      const attackState = system.getAttackState();

      // First attack — animation fails
      scene.simulatePointerDown(0);

      await vi.waitFor(() => {
        expect(attackState.getIsAttacking()).toBe(false);
      });

      // Advance time past cooldown
      scene.time.now = 1600;

      // Second attack should succeed
      scene.simulatePointerDown(0);
      expect(attackState.getLastAttackTime()).toBe(1600);

      vi.restoreAllMocks();
      system.destroy();
    });

    it("should still generate an AttackRequest even if animation fails", () => {
      vi.spyOn(console, "error").mockImplementation(() => {});

      const controller = createFailingAnimationController();

      const system = new PlayerAttackSystem(
        scene as unknown as Phaser.Scene,
        player,
        enemies,
        undefined,
        controller
      );

      const requestSpy = vi.spyOn(
        system as unknown as { onAttackRequestGenerated: (r: unknown) => void },
        "onAttackRequestGenerated"
      );

      scene.simulatePointerDown(0);

      // Request should still be generated (hitbox + request happen synchronously)
      expect(requestSpy).toHaveBeenCalledTimes(1);

      vi.restoreAllMocks();
      system.destroy();
    });
  });

  describe("Animation Success - State Cleared on Completion", () => {
    it("should clear attacking state when animation completes successfully", async () => {
      const controller = createSuccessfulAnimationController();

      const system = new PlayerAttackSystem(
        scene as unknown as Phaser.Scene,
        player,
        enemies,
        undefined,
        controller
      );

      const attackState = system.getAttackState();

      scene.simulatePointerDown(0);

      // After the resolved promise, endAttack should be called
      await vi.waitFor(() => {
        expect(attackState.getIsAttacking()).toBe(false);
      });

      system.destroy();
    });

    it("should call playAttack on the animation controller with correct direction", () => {
      const controller = createSuccessfulAnimationController();

      const system = new PlayerAttackSystem(
        scene as unknown as Phaser.Scene,
        player,
        enemies,
        undefined,
        controller
      );

      scene.simulatePointerDown(0);

      expect(controller.playAttack).toHaveBeenCalledWith("right");

      system.destroy();
    });
  });

  describe("Recoverable Error Logging", () => {
    it("should warn when startAttack fails unexpectedly", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const system = new PlayerAttackSystem(
        scene as unknown as Phaser.Scene,
        player,
        enemies
      );

      const attackState = system.getAttackState();

      // Force the state to already attacking so canAttack returns true but startAttack returns false
      // This is an edge case: manually set internal state to trigger the warn path
      // canAttack checks both isAttacking and cooldown, so we can't easily trigger this
      // The console.warn is only triggered if canAttack passes but startAttack fails
      // This is a defensive check — the current implementation won't normally hit this
      // since canAttack already validates both conditions.

      // We can verify the warn path exists by spying on startAttack to return false
      vi.spyOn(attackState, "canAttack").mockReturnValue(true);
      vi.spyOn(attackState, "startAttack").mockReturnValue(false);

      scene.simulatePointerDown(0);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("[PlayerAttackSystem] Attack could not start")
      );

      consoleWarnSpy.mockRestore();
      system.destroy();
    });

    it("should not crash gameplay when animation throws a non-Error value", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      // Controller rejects with a non-Error value
      const controller: AttackAnimationControllerInterface = {
        playAttack: vi.fn(() => Promise.reject("string error")),
        isPlaying: vi.fn(() => false),
      };

      const system = new PlayerAttackSystem(
        scene as unknown as Phaser.Scene,
        player,
        enemies,
        undefined,
        controller
      );

      const attackState = system.getAttackState();

      scene.simulatePointerDown(0);

      await vi.waitFor(() => {
        expect(attackState.getIsAttacking()).toBe(false);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("string error")
      );

      consoleErrorSpy.mockRestore();
      system.destroy();
    });
  });
});
