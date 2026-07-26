import { describe, it, expect, vi, beforeEach } from "vitest";
import { NpcSpawnLoader } from "@/game/loader/spawnLoader/NpcSpawnLoader";

/**
 * Unit tests for NpcSpawnLoader.
 *
 * Validates:
 * - Handling of missing object layers.
 * - Extraction of npcId from array-format and flat-object-format properties.
 * - Skipping objects with missing npcId or coordinates.
 * - Returning multiple valid spawn points.
 */

// --- Mock Tilemap ---

function createMockTilemap(objectLayerResult: object | null) {
  return {
    getObjectLayer: vi.fn().mockReturnValue(objectLayerResult),
  } as unknown as Phaser.Tilemaps.Tilemap;
}

describe("NpcSpawnLoader", () => {
  let loader: NpcSpawnLoader;

  beforeEach(() => {
    vi.clearAllMocks();
    loader = new NpcSpawnLoader();
  });

  it("should return empty array when object layer does not exist", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const map = createMockTilemap(null);

    const result = loader.loadSpawnPoints(map);

    expect(result).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Object layer")
    );

    consoleSpy.mockRestore();
  });

  it("should return empty array when no npcSpawn objects exist", () => {
    const map = createMockTilemap({
      objects: [
        { name: "playerSpawn", x: 10, y: 20, properties: [] },
        { name: "chest", x: 30, y: 40, properties: [] },
      ],
    });

    const result = loader.loadSpawnPoints(map);

    expect(result).toEqual([]);
  });

  it("should extract npcId from array-format properties", () => {
    const map = createMockTilemap({
      objects: [
        {
          name: "npcSpawn",
          x: 100,
          y: 200,
          properties: [{ name: "npcId", value: 1 }],
        },
      ],
    });

    const result = loader.loadSpawnPoints(map);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ npcId: 1, x: 100, y: 200 });
  });

  it("should extract npcId from flat-object-format properties", () => {
    const map = createMockTilemap({
      objects: [
        {
          name: "npcSpawn",
          x: 150,
          y: 250,
          properties: { npcId: 3 },
        },
      ],
    });

    const result = loader.loadSpawnPoints(map);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ npcId: 3, x: 150, y: 250 });
  });

  it("should skip objects missing npcId and log warning", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const map = createMockTilemap({
      objects: [
        {
          name: "npcSpawn",
          x: 100,
          y: 200,
          properties: [{ name: "otherProp", value: "foo" }],
        },
      ],
    });

    const result = loader.loadSpawnPoints(map);

    expect(result).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("missing 'npcId' property")
    );

    consoleSpy.mockRestore();
  });

  it("should skip objects with undefined coordinates and log warning", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const map = createMockTilemap({
      objects: [
        {
          name: "npcSpawn",
          x: undefined,
          y: undefined,
          properties: [{ name: "npcId", value: 2 }],
        },
      ],
    });

    const result = loader.loadSpawnPoints(map);

    expect(result).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("missing coordinates")
    );

    consoleSpy.mockRestore();
  });

  it("should return multiple valid spawn points", () => {
    const map = createMockTilemap({
      objects: [
        {
          name: "npcSpawn",
          x: 100,
          y: 200,
          properties: [{ name: "npcId", value: 1 }],
        },
        {
          name: "npcSpawn",
          x: 300,
          y: 400,
          properties: [{ name: "npcId", value: 2 }],
        },
        {
          name: "npcSpawn",
          x: 500,
          y: 600,
          properties: { npcId: 3 },
        },
      ],
    });

    const result = loader.loadSpawnPoints(map);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ npcId: 1, x: 100, y: 200 });
    expect(result[1]).toEqual({ npcId: 2, x: 300, y: 400 });
    expect(result[2]).toEqual({ npcId: 3, x: 500, y: 600 });
  });
});
