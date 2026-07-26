import { describe, it, expect, vi, beforeEach } from "vitest";
import { NpcSpawnLoader } from "@/game/loader/spawnLoader/NpcSpawnLoader";
import { npcFactory } from "@/game/factories/NpcFactory";
import type { NpcDto } from "@/game/interfaces/NpcResponse";

/**
 * Integration tests for the NPC spawning workflow.
 *
 * Validates the complete flow:
 * - SpawnLoader extracts spawn points from a mock tilemap.
 * - NpcFactory creates NPCs at the correct positions with correct data.
 * - Missing/invalid entries are handled gracefully without breaking the flow.
 */

// --- Mock Phaser Scene ---

function createMockScene() {
  const sprites: Array<{ x: number; y: number; textureKey: string }> = [];

  return {
    add: {
      sprite: vi.fn().mockImplementation((x: number, y: number, key: string) => {
        const spriteObj = {
          setDepth: vi.fn().mockReturnThis(),
          play: vi.fn(),
          x,
          y,
        };
        sprites.push({ x, y, textureKey: key });
        return spriteObj;
      }),
    },
    textures: {
      exists: vi.fn().mockReturnValue(true),
    },
    anims: {
      exists: vi.fn().mockReturnValue(false),
    },
    _sprites: sprites,
  } as unknown as Phaser.Scene & { _sprites: Array<{ x: number; y: number; textureKey: string }> };
}

// --- Mock Tilemap ---

function createMockTilemap(objects: object[]) {
  return {
    getObjectLayer: vi.fn().mockReturnValue({
      objects,
    }),
  } as unknown as Phaser.Tilemaps.Tilemap;
}

// --- Test Data ---

const backendNpcs: NpcDto[] = [
  {
    id: 1,
    id_map: 1,
    name: "Sea Maid",
    description: "A mysterious sea maid",
    phrases: ["Hello traveler", "The sea is calm today"],
  },
  {
    id: 2,
    id_map: 1,
    name: "Traveling Merchant",
    description: "Sells rare goods",
    phrases: ["Want to trade?"],
  },
  {
    id: 3,
    id_map: 1,
    name: "Old Hermit",
    description: "Wise old man",
    phrases: ["I have seen much"],
  },
];

describe("NPC Spawn Integration", () => {
  let mockScene: Phaser.Scene & { _sprites: Array<{ x: number; y: number; textureKey: string }> };
  let loader: NpcSpawnLoader;

  beforeEach(() => {
    vi.clearAllMocks();
    mockScene = createMockScene();
    loader = new NpcSpawnLoader();
  });

  it("should spawn NPCs at correct positions from tilemap spawn points and backend data", () => {
    const tilemapObjects = [
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
    ];

    const map = createMockTilemap(tilemapObjects);

    // Step 1: Load spawn points
    const spawnPoints = loader.loadSpawnPoints(map);
    expect(spawnPoints).toHaveLength(3);

    // Step 2: Match backend NPCs with spawn points and create entities
    const spawnedNpcs = [];
    const npcLookup = new Map<number, NpcDto>();
    for (const dto of backendNpcs) {
      npcLookup.set(dto.id, dto);
    }

    for (const sp of spawnPoints) {
      const matchingDto = npcLookup.get(sp.npcId);
      if (matchingDto) {
        const npc = npcFactory.create(mockScene, sp.x, sp.y, matchingDto);
        if (npc) {
          spawnedNpcs.push(npc);
        }
      }
    }

    // Step 3: Verify NPCs were created at the correct positions
    expect(spawnedNpcs).toHaveLength(3);
    expect(mockScene._sprites).toHaveLength(3);

    expect(mockScene._sprites[0]).toEqual({ x: 100, y: 200, textureKey: "sea_maid" });
    expect(mockScene._sprites[1]).toEqual({ x: 300, y: 400, textureKey: "traveling_merchant" });
    expect(mockScene._sprites[2]).toEqual({ x: 500, y: 600, textureKey: "old_hermit" });
  });

  it("should handle missing spawn points gracefully without crashing", () => {
    const tilemapObjects = [
      {
        name: "npcSpawn",
        x: 100,
        y: 200,
        properties: [{ name: "npcId", value: 1 }],
      },
      // NPC 2 has no spawn point
    ];

    const map = createMockTilemap(tilemapObjects);
    const spawnPoints = loader.loadSpawnPoints(map);

    expect(spawnPoints).toHaveLength(1);

    // Only NPC 1 should be spawnable
    const npcLookup = new Map<number, NpcDto>();
    for (const dto of backendNpcs) {
      npcLookup.set(dto.id, dto);
    }

    const spawnedNpcs = [];
    for (const sp of spawnPoints) {
      const matchingDto = npcLookup.get(sp.npcId);
      if (matchingDto) {
        const npc = npcFactory.create(mockScene, sp.x, sp.y, matchingDto);
        if (npc) {
          spawnedNpcs.push(npc);
        }
      }
    }

    expect(spawnedNpcs).toHaveLength(1);
    expect(mockScene._sprites[0]).toEqual({ x: 100, y: 200, textureKey: "sea_maid" });
  });

  it("should skip spawn points referencing NPC ids not present in backend data", () => {
    const tilemapObjects = [
      {
        name: "npcSpawn",
        x: 100,
        y: 200,
        properties: [{ name: "npcId", value: 1 }],
      },
      {
        name: "npcSpawn",
        x: 700,
        y: 800,
        properties: [{ name: "npcId", value: 99 }], // No backend data for id 99
      },
    ];

    const map = createMockTilemap(tilemapObjects);
    const spawnPoints = loader.loadSpawnPoints(map);

    expect(spawnPoints).toHaveLength(2);

    const npcLookup = new Map<number, NpcDto>();
    for (const dto of backendNpcs) {
      npcLookup.set(dto.id, dto);
    }

    const spawnedNpcs = [];
    for (const sp of spawnPoints) {
      const matchingDto = npcLookup.get(sp.npcId);
      if (matchingDto) {
        const npc = npcFactory.create(mockScene, sp.x, sp.y, matchingDto);
        if (npc) {
          spawnedNpcs.push(npc);
        }
      }
    }

    // Only NPC 1 should be spawned (id 99 has no backend data)
    expect(spawnedNpcs).toHaveLength(1);
    expect(mockScene._sprites).toHaveLength(1);
  });

  it("should handle invalid tilemap objects (missing npcId) without breaking the flow", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const tilemapObjects = [
      {
        name: "npcSpawn",
        x: 100,
        y: 200,
        properties: [], // Missing npcId
      },
      {
        name: "npcSpawn",
        x: 300,
        y: 400,
        properties: [{ name: "npcId", value: 2 }],
      },
    ];

    const map = createMockTilemap(tilemapObjects);
    const spawnPoints = loader.loadSpawnPoints(map);

    // Only the valid spawn point should be returned
    expect(spawnPoints).toHaveLength(1);
    expect(spawnPoints[0]).toEqual({ npcId: 2, x: 300, y: 400 });

    // Warning should have been logged for the invalid object
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("missing 'npcId' property")
    );

    consoleSpy.mockRestore();
  });

  it("should handle NPC factory failure for one NPC while spawning others", () => {
    const tilemapObjects = [
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
        properties: [{ name: "npcId", value: 99 }], // id=99 has no sprite configured
      },
      {
        name: "npcSpawn",
        x: 500,
        y: 600,
        properties: [{ name: "npcId", value: 3 }],
      },
    ];

    const map = createMockTilemap(tilemapObjects);
    const spawnPoints = loader.loadSpawnPoints(map);

    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Include an NPC dto for id=99 to pass the matching check,
    // but factory will return null because id=99 has no sprite configured
    const extendedBackendNpcs: NpcDto[] = [
      ...backendNpcs,
      { id: 99, id_map: 1, name: "Ghost NPC", description: "", phrases: [] },
    ];

    const npcLookup = new Map<number, NpcDto>();
    for (const dto of extendedBackendNpcs) {
      npcLookup.set(dto.id, dto);
    }

    const spawnedNpcs = [];
    for (const sp of spawnPoints) {
      const matchingDto = npcLookup.get(sp.npcId);
      if (matchingDto) {
        const npc = npcFactory.create(mockScene, sp.x, sp.y, matchingDto);
        if (npc) {
          spawnedNpcs.push(npc);
        }
      }
    }

    // NPC id=1 and id=3 should spawn, id=99 returns null from factory
    expect(spawnedNpcs).toHaveLength(2);
    expect(mockScene._sprites[0]).toEqual({ x: 100, y: 200, textureKey: "sea_maid" });
    expect(mockScene._sprites[1]).toEqual({ x: 500, y: 600, textureKey: "old_hermit" });

    consoleSpy.mockRestore();
  });
});
