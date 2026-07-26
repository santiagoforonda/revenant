import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { AttackRequestService } from "@/game/services/AttackRequestService";
import { eventBus } from "@/game/events";
import type { AttackRequest } from "@/game/interfaces/AttackRequest";
import type { Player } from "@/game/entities/characters/Player";
import type { Enemy } from "@/game/entities/characters/Enemy";

/**
 * Unit tests for AttackRequestService.
 *
 * Validates: Requirement 4 (Generate Attack Request)
 *
 * Validates:
 * - The service emits an ATTACK_REQUEST event on the Event Bus.
 * - The emitted event payload matches the provided AttackRequest.
 * - The service forwards requests with targets.
 * - The service forwards requests with an empty targets array.
 */

/** Creates a minimal mock Player */
function createMockPlayer(): Player {
  return {
    getX: () => 100,
    getY: () => 100,
    getDirection: () => "right",
  } as unknown as Player;
}

/** Creates a minimal mock Enemy */
function createMockEnemy(x: number, y: number): Enemy {
  return {
    getX: () => x,
    getY: () => y,
  } as unknown as Enemy;
}

describe("AttackRequestService", () => {
  let service: AttackRequestService;

  beforeEach(() => {
    service = new AttackRequestService();
  });

  afterEach(() => {
    eventBus.removeAllListeners();
  });

  it("should emit an ATTACK_REQUEST event when forward is called", () => {
    const handler = vi.fn();
    eventBus.on("ATTACK_REQUEST", handler);

    const request: AttackRequest = {
      attacker: createMockPlayer(),
      targets: [],
      direction: "right",
      timestamp: 1000,
    };

    service.forward(request);

    expect(handler).toHaveBeenCalledOnce();
  });

  it("should emit the AttackRequest as the event payload", () => {
    const handler = vi.fn();
    eventBus.on("ATTACK_REQUEST", handler);

    const player = createMockPlayer();
    const enemy = createMockEnemy(120, 100);

    const request: AttackRequest = {
      attacker: player,
      targets: [enemy],
      direction: "right",
      timestamp: 2000,
    };

    service.forward(request);

    expect(handler).toHaveBeenCalledWith(request);
  });

  it("should forward a request with multiple targets", () => {
    const handler = vi.fn();
    eventBus.on("ATTACK_REQUEST", handler);

    const player = createMockPlayer();
    const enemy1 = createMockEnemy(110, 95);
    const enemy2 = createMockEnemy(130, 105);

    const request: AttackRequest = {
      attacker: player,
      targets: [enemy1, enemy2],
      direction: "down",
      timestamp: 3000,
    };

    service.forward(request);

    expect(handler).toHaveBeenCalledWith(request);
    expect(handler.mock.calls[0][0].targets).toHaveLength(2);
  });

  it("should forward a request with no targets (empty array)", () => {
    const handler = vi.fn();
    eventBus.on("ATTACK_REQUEST", handler);

    const request: AttackRequest = {
      attacker: createMockPlayer(),
      targets: [],
      direction: "up",
      timestamp: 4000,
    };

    service.forward(request);

    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0].targets).toHaveLength(0);
  });

  it("should include the correct direction in the forwarded request", () => {
    const handler = vi.fn();
    eventBus.on("ATTACK_REQUEST", handler);

    const request: AttackRequest = {
      attacker: createMockPlayer(),
      targets: [],
      direction: "left",
      timestamp: 5000,
    };

    service.forward(request);

    expect(handler.mock.calls[0][0].direction).toBe("left");
  });

  it("should include the correct timestamp in the forwarded request", () => {
    const handler = vi.fn();
    eventBus.on("ATTACK_REQUEST", handler);

    const request: AttackRequest = {
      attacker: createMockPlayer(),
      targets: [],
      direction: "right",
      timestamp: 12345,
    };

    service.forward(request);

    expect(handler.mock.calls[0][0].timestamp).toBe(12345);
  });
});
