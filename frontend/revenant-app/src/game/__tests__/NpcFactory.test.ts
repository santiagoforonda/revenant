import { describe, it, expect, vi, beforeEach } from "vitest";
import { npcFactory } from "@/game/factories/NpcFactory";
import type { NpcDto } from "@/game/interfaces/NpcResponse";

/**
 * Unit tests for NpcFactory.
 *
 * Validates:
 * - NPC creation for valid NPC ids (1-5).
 * - Returns null for unconfigured NPC ids.
 * - Passes correct coordinates and data to the Npc constructor.
 * - Handles constructor failures gracefully.
 * - Logs appropriate warnings.
 */

// --- Mock Phaser Scene ---

function createMockScene() {
  return {
    add: {
      sprite: vi.fn().mockReturnValue({
        setDepth: vi.fn().mockReturnThis(),
        play: vi.fn(),
        x: 0,
        y: 0,
      }),
    },
    textures: {
      exists: vi.fn().mockReturnValue(true),
    },
    anims: {
      exists: vi.fn().mockReturnValue(false),
    },
  } as unknown as Phaser.Scene;
}

// --- Test Data ---

const testNpcDto: NpcDto = {
  id: 1,
  id_map: 1,
  name: "Sea Maid",
  description: "A mysterious sea maid",
  phrases: ["Hello traveler", "The sea is calm today"],
};

describe("NpcFactory", () => {
  let mockScene: ReturnType<typeof createMockScene>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockScene = createMockScene();
  });

  it("should create an Npc entity when NPC id has a configured sprite (ids 1-5)", () => {
    const npc = npcFactory.create(mockScene, 100, 200, testNpcDto);

    expect(npc).not.toBeNull();
    expect(npc!.getId()).toBe(1);
    expect(npc!.getName()).toBe("Sea Maid");
  });

  it("should return null when NPC id has no configured sprite", () => {
    const unknownNpc: NpcDto = {
      id: 99,
      id_map: 1,
      name: "Unknown NPC",
      description: "No sprite configured",
      phrases: [],
    };

    const npc = npcFactory.create(mockScene, 100, 200, unknownNpc);

    expect(npc).toBeNull();
  });

  it("should pass correct x, y coordinates to the Npc constructor", () => {
    npcFactory.create(mockScene, 150, 250, testNpcDto);

    expect((mockScene as unknown as { add: { sprite: ReturnType<typeof vi.fn> } }).add.sprite)
      .toHaveBeenCalledWith(150, 250, "sea_maid");
  });

  it("should pass correct npcData to the Npc entity", () => {
    const npc = npcFactory.create(mockScene, 100, 200, testNpcDto);

    expect(npc).not.toBeNull();
    expect(npc!.getId()).toBe(testNpcDto.id);
    expect(npc!.getName()).toBe(testNpcDto.name);
    expect(npc!.getDescription()).toBe(testNpcDto.description);
    expect(npc!.getPhrases()).toEqual(testNpcDto.phrases);
  });

  it("should return null when Npc constructor throws", () => {
    // Make sprite throw to simulate a constructor failure
    (mockScene as unknown as { add: { sprite: ReturnType<typeof vi.fn> } }).add.sprite
      .mockImplementation(() => {
        throw new Error("Sprite creation failed");
      });

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const npc = npcFactory.create(mockScene, 100, 200, testNpcDto);

    expect(npc).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("should log warning when no sprite configured", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const unknownNpc: NpcDto = {
      id: 42,
      id_map: 1,
      name: "Unregistered NPC",
      description: "Not in sprite map",
      phrases: [],
    };

    npcFactory.create(mockScene, 100, 200, unknownNpc);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("No sprite configured for NPC id=42")
    );

    consoleSpy.mockRestore();
  });
});
