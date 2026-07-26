import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the event bus before importing EnemyDeathSystem
vi.mock("@/game/events", () => ({
  eventBus: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  },
}));

// Mock the DeathAnimationController
vi.mock("@/game/services/DeathAnimationController", () => ({
  DeathAnimationController: class MockDeathAnimationController {
    playDeath() {
      return Promise.resolve({ completed: true, duration: 500 });
    }
  },
}));

import { eventBus } from "@/game/events";
import { EnemyDeathSystem } from "./EnemyDeathSystem";
import type { Enemy } from "@/game/entities/characters/Enemy";
import type { EnemyDefeatedEvent } from "@/game/interfaces/CombatEvents";
import type { EnemyRemovedEvent } from "@/game/interfaces/EnemyRemovedEvent";
import type { Player } from "@/game/entities/characters/Player";

/**
 * Comprehensive unit and integration tests for EnemyDeathSystem.
 *
 * Validates: Requirements 1-8 (Enemy Death lifecycle)
 */

/** Creates a mock Player for EnemyDefeatedEvent payloads. */
function createMockPlayer(): Player {
  return {
    getX: () => 100,
    getY: () => 100,
    getDirection: () => "right",
  } as unknown as Player;
}

/** Creates a mock Enemy with controllable behavior. */
function createMockEnemy(name: string, options?: { isDead?: boolean }): Enemy {
  const isDead = options?.isDead ?? false;
  let dead = isDead;

  const mockSprite = {
    active: true,
    play: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    once: vi.fn(),
    anims: { stop: vi.fn() },
    body: { setVelocity: vi.fn(), enable: true },
    destroy: vi.fn(),
  };

  return {
    getName: () => name,
    getSprite: () => mockSprite,
    getEnemyType: () => "skeleton",
    disable: vi.fn(() => { dead = true; }),
    destroy: vi.fn(() => { dead = true; }),
    isDead: () => dead,
  } as unknown as Enemy;
}

/** Helper: gets the ENEMY_DEFEATED callback registered via eventBus.on */
function getDefeatedCallback(): (event: EnemyDefeatedEvent) => void {
  const onCall = vi.mocked(eventBus.on).mock.calls.find(
    ([event]) => event === "ENEMY_DEFEATED"
  );
  if (!onCall) {
    throw new Error("ENEMY_DEFEATED handler not registered. Did you call system.start()?");
  }
  return onCall[1] as (event: EnemyDefeatedEvent) => void;
}

/** Helper: creates a defeat event */
function createDefeatEvent(enemy: Enemy): EnemyDefeatedEvent {
  return { enemy, attacker: createMockPlayer() };
}

/** Helper: waits for async death sequence to finish */
async function waitForDeathSequence(): Promise<void> {
  await vi.waitFor(() => {
    expect(vi.mocked(eventBus.emit)).toHaveBeenCalled();
  });
}

describe("EnemyDeathSystem", () => {
  let system: EnemyDeathSystem;

  beforeEach(() => {
    vi.clearAllMocks();
    system = new EnemyDeathSystem();
  });

  afterEach(() => {
    system.destroy();
  });

  // ─────────────────────────────────────────────────────────────────────
  // 1. EnemyDeathSystem Unit Tests
  // ─────────────────────────────────────────────────────────────────────
  describe("Event Bus Subscription", () => {
    it("should subscribe to ENEMY_DEFEATED on start()", () => {
      system.start();

      expect(eventBus.on).toHaveBeenCalledWith(
        "ENEMY_DEFEATED",
        expect.any(Function)
      );
    });

    it("should unsubscribe from ENEMY_DEFEATED on stop()", () => {
      system.start();
      system.stop();

      expect(eventBus.off).toHaveBeenCalledWith(
        "ENEMY_DEFEATED",
        expect.any(Function)
      );
    });

    it("should use the same handler reference for subscribe and unsubscribe", () => {
      system.start();
      system.stop();

      const onHandler = vi.mocked(eventBus.on).mock.calls[0][1];
      const offHandler = vi.mocked(eventBus.off).mock.calls[0][1];

      expect(onHandler).toBe(offHandler);
    });
  });

  describe("Processing Defeat Events", () => {
    it("should process a defeat event and start the death sequence", async () => {
      const enemy = createMockEnemy("Skeleton-A");
      system.start();

      const callback = getDefeatedCallback();
      callback(createDefeatEvent(enemy));

      expect(system.isDying(enemy)).toBe(true);

      await waitForDeathSequence();
    });

    it("should call enemy.disable() during the death sequence", async () => {
      const enemy = createMockEnemy("Skeleton-B");
      system.start();

      const callback = getDefeatedCallback();
      callback(createDefeatEvent(enemy));

      await waitForDeathSequence();

      expect(enemy.disable).toHaveBeenCalledTimes(1);
    });

    it("should call enemy.destroy() during the death sequence", async () => {
      const enemy = createMockEnemy("Skeleton-C");
      system.start();

      const callback = getDefeatedCallback();
      callback(createDefeatEvent(enemy));

      await waitForDeathSequence();

      expect(enemy.destroy).toHaveBeenCalledTimes(1);
    });
  });

  describe("Duplicate Defeat Event Prevention", () => {
    it("should ignore duplicate defeat events and log a warning", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const enemy = createMockEnemy("Skeleton-D");
      system.start();

      const callback = getDefeatedCallback();
      callback(createDefeatEvent(enemy));

      // The enemy is now dying, send a duplicate
      callback(createDefeatEvent(enemy));

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Duplicate defeat event ignored")
      );

      await waitForDeathSequence();
      warnSpy.mockRestore();
    });

    it("should ignore defeat events for already-removed enemies", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const enemy = createMockEnemy("Skeleton-E");
      system.start();

      const callback = getDefeatedCallback();
      callback(createDefeatEvent(enemy));

      await waitForDeathSequence();

      // Enemy is now removed; send another defeat event
      vi.mocked(eventBus.emit).mockClear();
      callback(createDefeatEvent(enemy));

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("already removed")
      );

      // No new ENEMY_REMOVED event should be emitted
      const emitCalls = vi.mocked(eventBus.emit).mock.calls.filter(
        ([event]) => event === "ENEMY_REMOVED"
      );
      expect(emitCalls).toHaveLength(0);

      warnSpy.mockRestore();
    });
  });

  describe("isDying()", () => {
    it("should return false for an unknown enemy", () => {
      const enemy = createMockEnemy("Unknown");
      expect(system.isDying(enemy)).toBe(false);
    });

    it("should return true while an enemy is in the death sequence", () => {
      const enemy = createMockEnemy("Skeleton-F");
      system.start();

      const callback = getDefeatedCallback();
      callback(createDefeatEvent(enemy));

      expect(system.isDying(enemy)).toBe(true);
    });

    it("should return false after the death sequence completes", async () => {
      const enemy = createMockEnemy("Skeleton-G");
      system.start();

      const callback = getDefeatedCallback();
      callback(createDefeatEvent(enemy));

      await waitForDeathSequence();

      expect(system.isDying(enemy)).toBe(false);
    });
  });

  describe("getDeathState()", () => {
    it("should return undefined for an unknown enemy", () => {
      const enemy = createMockEnemy("Unknown");
      expect(system.getDeathState(enemy)).toBeUndefined();
    });

    it("should return initial death state when death sequence starts", () => {
      const enemy = createMockEnemy("Skeleton-H");
      system.start();

      const callback = getDefeatedCallback();
      callback(createDefeatEvent(enemy));

      const state = system.getDeathState(enemy);
      expect(state).toBeDefined();
      expect(state!.isDead).toBe(true);
    });

    it("should return undefined after the death sequence completes (enemy removed from tracking)", async () => {
      const enemy = createMockEnemy("Skeleton-I");
      system.start();

      const callback = getDefeatedCallback();
      callback(createDefeatEvent(enemy));

      await waitForDeathSequence();

      expect(system.getDeathState(enemy)).toBeUndefined();
    });
  });

  describe("reset()", () => {
    it("should clear all dying enemies", () => {
      const enemy = createMockEnemy("Skeleton-J");
      system.start();

      const callback = getDefeatedCallback();
      callback(createDefeatEvent(enemy));

      system.reset();

      expect(system.isDying(enemy)).toBe(false);
      expect(system.getDeathState(enemy)).toBeUndefined();
    });

    it("should clear removed enemies allowing re-processing", async () => {
      const enemy = createMockEnemy("Skeleton-K");
      system.start();

      const callback = getDefeatedCallback();
      callback(createDefeatEvent(enemy));

      await waitForDeathSequence();

      system.reset();
      vi.mocked(eventBus.emit).mockClear();

      // After reset, the same enemy can trigger a new death sequence
      callback(createDefeatEvent(enemy));

      await vi.waitFor(() => {
        expect(vi.mocked(eventBus.emit)).toHaveBeenCalledWith(
          "ENEMY_REMOVED",
          expect.objectContaining({ enemy })
        );
      });
    });
  });

  describe("destroy()", () => {
    it("should unsubscribe from events on destroy", () => {
      system.start();
      system.destroy();

      expect(eventBus.off).toHaveBeenCalledWith(
        "ENEMY_DEFEATED",
        expect.any(Function)
      );
    });

    it("should clear all internal state on destroy", () => {
      const enemy = createMockEnemy("Skeleton-L");
      system.start();

      const callback = getDefeatedCallback();
      callback(createDefeatEvent(enemy));

      system.destroy();

      expect(system.isDying(enemy)).toBe(false);
      expect(system.getDeathState(enemy)).toBeUndefined();
    });
  });

  // ─────────────────────────────────────────────────────────────────────
  // 2. Enemy Removal Unit Tests
  // ─────────────────────────────────────────────────────────────────────
  describe("Enemy Removal", () => {
    it("should call enemy.disable() to stop movement and disable body", async () => {
      const enemy = createMockEnemy("Skeleton-M");
      system.start();

      const callback = getDefeatedCallback();
      callback(createDefeatEvent(enemy));

      await waitForDeathSequence();

      expect(enemy.disable).toHaveBeenCalled();
    });

    it("should call enemy.destroy() to remove sprite from scene", async () => {
      const enemy = createMockEnemy("Skeleton-N");
      system.start();

      const callback = getDefeatedCallback();
      callback(createDefeatEvent(enemy));

      await waitForDeathSequence();

      expect(enemy.destroy).toHaveBeenCalled();
    });

    it("should skip disable for already-dead enemies", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const enemy = createMockEnemy("Skeleton-O", { isDead: true });
      system.start();

      const callback = getDefeatedCallback();
      callback(createDefeatEvent(enemy));

      await waitForDeathSequence();

      // disable should not be called since enemy is already dead
      expect(enemy.disable).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("already dead")
      );

      warnSpy.mockRestore();
    });
  });

  // ─────────────────────────────────────────────────────────────────────
  // 3. Resource Cleanup Unit Tests
  // ─────────────────────────────────────────────────────────────────────
  describe("Resource Cleanup", () => {
    it("should call enemy.destroy() which handles sprite and physics cleanup", async () => {
      const enemy = createMockEnemy("Skeleton-P");
      system.start();

      const callback = getDefeatedCallback();
      callback(createDefeatEvent(enemy));

      await waitForDeathSequence();

      expect(enemy.destroy).toHaveBeenCalledTimes(1);
    });

    it("should skip removal if sprite is already inactive", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const enemy = createMockEnemy("Skeleton-Q");

      // Make the sprite appear inactive
      const sprite = (enemy as ReturnType<typeof createMockEnemy>).getSprite();
      (sprite as { active: boolean }).active = false;

      system.start();

      const callback = getDefeatedCallback();
      callback(createDefeatEvent(enemy));

      await waitForDeathSequence();

      // destroy should not be called since sprite is already inactive
      expect(enemy.destroy).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("already destroyed or inactive")
      );

      warnSpy.mockRestore();
    });
  });

  // ─────────────────────────────────────────────────────────────────────
  // 4. EnemyRemovedEvent Publication Tests
  // ─────────────────────────────────────────────────────────────────────
  describe("EnemyRemovedEvent Publication", () => {
    it("should publish ENEMY_REMOVED event after removal", async () => {
      const enemy = createMockEnemy("Skeleton-R");
      system.start();

      const callback = getDefeatedCallback();
      callback(createDefeatEvent(enemy));

      await waitForDeathSequence();

      expect(eventBus.emit).toHaveBeenCalledWith(
        "ENEMY_REMOVED",
        expect.objectContaining({ enemy })
      );
    });

    it("should include enemy and timestamp in the event", async () => {
      const enemy = createMockEnemy("Skeleton-S");
      system.start();

      const callback = getDefeatedCallback();
      callback(createDefeatEvent(enemy));

      await waitForDeathSequence();

      expect(eventBus.emit).toHaveBeenCalledWith(
        "ENEMY_REMOVED",
        expect.objectContaining({
          enemy,
          timestamp: expect.any(Number),
        })
      );
    });

    it("should publish exactly one ENEMY_REMOVED event per enemy", async () => {
      const enemy = createMockEnemy("Skeleton-T");
      system.start();

      const callback = getDefeatedCallback();
      callback(createDefeatEvent(enemy));

      await waitForDeathSequence();

      const emitCalls = vi.mocked(eventBus.emit).mock.calls.filter(
        ([event]) => event === "ENEMY_REMOVED"
      );
      expect(emitCalls).toHaveLength(1);
    });

    it("should prevent duplicate ENEMY_REMOVED events", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const enemy = createMockEnemy("Skeleton-U");
      system.start();

      const callback = getDefeatedCallback();
      callback(createDefeatEvent(enemy));

      await waitForDeathSequence();

      // Attempt to trigger a second defeat event (enemy already removed)
      vi.mocked(eventBus.emit).mockClear();
      callback(createDefeatEvent(enemy));

      // Wait briefly for any async processing
      await new Promise((resolve) => setTimeout(resolve, 50));

      const emitCalls = vi.mocked(eventBus.emit).mock.calls.filter(
        ([event]) => event === "ENEMY_REMOVED"
      );
      expect(emitCalls).toHaveLength(0);

      warnSpy.mockRestore();
    });
  });

  // ─────────────────────────────────────────────────────────────────────
  // 5. Integration Tests - Complete Enemy Death Workflow
  // ─────────────────────────────────────────────────────────────────────
  describe("Complete Death Workflow (Integration)", () => {
    it("should execute the full flow: defeat → disable → animate → remove → event", async () => {
      const enemy = createMockEnemy("Skeleton-V");
      system.start();

      const callback = getDefeatedCallback();
      callback(createDefeatEvent(enemy));

      await waitForDeathSequence();

      // 1. Enemy was disabled
      expect(enemy.disable).toHaveBeenCalled();
      // 2. Enemy was destroyed (removal)
      expect(enemy.destroy).toHaveBeenCalled();
      // 3. ENEMY_REMOVED event was published
      expect(eventBus.emit).toHaveBeenCalledWith(
        "ENEMY_REMOVED",
        expect.objectContaining({ enemy })
      );
    });

    it("should process multiple enemies independently", async () => {
      const enemy1 = createMockEnemy("Skeleton-W1");
      const enemy2 = createMockEnemy("Skeleton-W2");
      system.start();

      const callback = getDefeatedCallback();
      callback(createDefeatEvent(enemy1));
      callback(createDefeatEvent(enemy2));

      await vi.waitFor(() => {
        const emitCalls = vi.mocked(eventBus.emit).mock.calls.filter(
          ([event]) => event === "ENEMY_REMOVED"
        );
        expect(emitCalls).toHaveLength(2);
      });

      // Both enemies should have been fully processed
      expect(enemy1.disable).toHaveBeenCalled();
      expect(enemy1.destroy).toHaveBeenCalled();
      expect(enemy2.disable).toHaveBeenCalled();
      expect(enemy2.destroy).toHaveBeenCalled();
    });

    it("should handle the complete workflow end-to-end without errors", async () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const enemy = createMockEnemy("Skeleton-X");
      system.start();

      const callback = getDefeatedCallback();
      callback(createDefeatEvent(enemy));

      await waitForDeathSequence();

      // No errors should have been logged in the happy path
      const deathErrors = errorSpy.mock.calls.filter(
        ([msg]) => typeof msg === "string" && msg.includes("[EnemyDeathSystem]")
      );
      expect(deathErrors).toHaveLength(0);

      errorSpy.mockRestore();
    });
  });

  // ─────────────────────────────────────────────────────────────────────
  // 6. No Backend Communication
  // ─────────────────────────────────────────────────────────────────────
  describe("No Backend Communication", () => {
    it("should not call fetch during the death sequence", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(
        () => Promise.resolve(new Response())
      );

      const enemy = createMockEnemy("Skeleton-Y");
      system.start();

      const callback = getDefeatedCallback();
      callback(createDefeatEvent(enemy));

      await waitForDeathSequence();

      expect(fetchSpy).not.toHaveBeenCalled();
      fetchSpy.mockRestore();
    });

    it("should not call XMLHttpRequest during the death sequence", async () => {
      const xhrOpenSpy = vi.fn();
      const xhrSendSpy = vi.fn();
      const originalXHR = globalThis.XMLHttpRequest;

      const MockXHR = vi.fn(() => ({
        open: xhrOpenSpy,
        send: xhrSendSpy,
        setRequestHeader: vi.fn(),
        readyState: 4,
        status: 200,
        response: "",
      }));

      globalThis.XMLHttpRequest = MockXHR as unknown as typeof XMLHttpRequest;

      const enemy = createMockEnemy("Skeleton-Z");
      system.start();

      const callback = getDefeatedCallback();
      callback(createDefeatEvent(enemy));

      await waitForDeathSequence();

      expect(xhrOpenSpy).not.toHaveBeenCalled();
      expect(xhrSendSpy).not.toHaveBeenCalled();

      globalThis.XMLHttpRequest = originalXHR;
    });
  });
});
