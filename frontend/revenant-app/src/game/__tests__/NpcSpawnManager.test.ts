import { describe, it, expect, vi, beforeEach } from "vitest";
import { npcSpawnManager } from "@/game/managers/NpcSpawnManager";
import { npcFactory } from "@/game/factories/NpcFactory";
import { npcSpawnLoader } from "@/game/loader/spawnLoader/NpcSpawnLoader";
import type { NpcDto } from "@/game/interfaces/NpcResponse";
import type { NpcSpawnPoint } from "@/game/loader/spawnLoader/NpcSpawnPoint";

/**
 * Unit tests for NpcSpawnManager.
 *
 * Validates:
 * - NPCs are spawned when backend data matches spawn points.
 * - Unmatched spawn points or backend NPCs are skipped gracefully.
 * - Factory returning null is handled.
 * - Invalid NpcDto entries are filtered out.
 * - Spawning continues after individual failures.
 * - getSpawnedNpcs() exposes spawned NPCs.
 * - clear() resets the collection.
 */

// --- Mocks ---

vi.mock("@/game/factories/NpcFactory", () => ({
  npcFactory: {
    create: vi.fn(),
  },
}));

vi.mock("@/game/loader/spawnLoader/NpcSpawnLoader", () => ({
  npcSpawnLoader: {
    loadSpawnPoints: vi.fn(),
  },
}));

// --- Mock Scene & Tilemap ---

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

function createMockTilemap() {
  return {
    getObjectLayer: vi.fn().mockReturnValue({ objects: [] }),
  } as unknown as Phaser.Tilemaps.Tilemap;
}

// --- Test Data ---

const npcDto1: NpcDto = {
  id: 1,
  id_map: 1,
  name: "Sea Maid",
  description: "A mysterious sea maid",
  phrases: ["Hello traveler"],
};

const npcDto2: NpcDto = {
  id: 2,
  id_map: 1,
  name: "Traveling Merchant",
  description: "Sells rare goods",
  phrases: ["Want to trade?"],
};

const spawnPoint1: NpcSpawnPoint = { npcId: 1, x: 100, y: 200 };
const spawnPoint2: NpcSpawnPoint = { npcId: 2, x: 300, y: 400 };

// --- Mock NPC entity ---

function createMockNpc(id: number, name: string) {
  return {
    getId: () => id,
    getName: () => name,
    getSprite: vi.fn(),
    getX: vi.fn(),
    getY: vi.fn(),
  };
}

describe("NpcSpawnManager", () => {
  let mockScene: Phaser.Scene;
  let mockMap: Phaser.Tilemaps.Tilemap;

  beforeEach(() => {
    vi.clearAllMocks();
    mockScene = createMockScene();
    mockMap = createMockTilemap();
    npcSpawnManager.clear();
  });

  it("should spawn NPCs matching backend data with spawn points", () => {
    vi.mocked(npcSpawnLoader.loadSpawnPoints).mockReturnValue([spawnPoint1, spawnPoint2]);

    const mockNpc1 = createMockNpc(1, "Sea Maid");
    const mockNpc2 = createMockNpc(2, "Traveling Merchant");

    vi.mocked(npcFactory.create)
      .mockReturnValueOnce(mockNpc1 as never)
      .mockReturnValueOnce(mockNpc2 as never);

    npcSpawnManager.spawnNpcs(mockScene, mockMap, [npcDto1, npcDto2]);

    expect(npcFactory.create).toHaveBeenCalledTimes(2);
    expect(npcFactory.create).toHaveBeenCalledWith(mockScene, 100, 200, npcDto1);
    expect(npcFactory.create).toHaveBeenCalledWith(mockScene, 300, 400, npcDto2);
    expect(npcSpawnManager.getSpawnedNpcs()).toHaveLength(2);
  });

  it("should skip spawn points with no matching backend NPC", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    vi.mocked(npcSpawnLoader.loadSpawnPoints).mockReturnValue([
      { npcId: 99, x: 500, y: 600 },
    ]);

    npcSpawnManager.spawnNpcs(mockScene, mockMap, [npcDto1]);

    expect(npcFactory.create).not.toHaveBeenCalled();
    expect(npcSpawnManager.getSpawnedNpcs()).toHaveLength(0);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("no matching backend NPC exists")
    );

    consoleSpy.mockRestore();
  });

  it("should skip backend NPCs with no matching spawn point", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    vi.mocked(npcSpawnLoader.loadSpawnPoints).mockReturnValue([]);

    npcSpawnManager.spawnNpcs(mockScene, mockMap, [npcDto1]);

    expect(npcFactory.create).not.toHaveBeenCalled();
    expect(npcSpawnManager.getSpawnedNpcs()).toHaveLength(0);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("has no matching spawn point")
    );

    consoleSpy.mockRestore();
  });

  it("should handle NPC factory returning null", () => {
    vi.mocked(npcSpawnLoader.loadSpawnPoints).mockReturnValue([spawnPoint1]);
    vi.mocked(npcFactory.create).mockReturnValue(null);

    npcSpawnManager.spawnNpcs(mockScene, mockMap, [npcDto1]);

    expect(npcFactory.create).toHaveBeenCalledTimes(1);
    expect(npcSpawnManager.getSpawnedNpcs()).toHaveLength(0);
  });

  it("should filter out invalid NpcDto entries (missing id or name)", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    vi.mocked(npcSpawnLoader.loadSpawnPoints).mockReturnValue([spawnPoint1]);

    const invalidNpc = {
      id: undefined,
      id_map: 1,
      name: "Invalid",
      description: "",
      phrases: [],
    } as unknown as NpcDto;

    const noNameNpc: NpcDto = {
      id: 3,
      id_map: 1,
      name: "",
      description: "",
      phrases: [],
    };

    npcSpawnManager.spawnNpcs(mockScene, mockMap, [invalidNpc, noNameNpc]);

    expect(npcFactory.create).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("missing 'id' field")
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("missing 'name' field")
    );

    consoleSpy.mockRestore();
  });

  it("should continue spawning after individual failure", () => {
    vi.mocked(npcSpawnLoader.loadSpawnPoints).mockReturnValue([spawnPoint1, spawnPoint2]);

    const mockNpc2 = createMockNpc(2, "Traveling Merchant");

    vi.mocked(npcFactory.create)
      .mockImplementationOnce(() => {
        throw new Error("Creation failed");
      })
      .mockReturnValueOnce(mockNpc2 as never);

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    npcSpawnManager.spawnNpcs(mockScene, mockMap, [npcDto1, npcDto2]);

    expect(npcFactory.create).toHaveBeenCalledTimes(2);
    expect(npcSpawnManager.getSpawnedNpcs()).toHaveLength(1);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Unexpected error spawning NPC")
    );

    consoleSpy.mockRestore();
  });

  it("should expose spawned NPCs via getSpawnedNpcs()", () => {
    vi.mocked(npcSpawnLoader.loadSpawnPoints).mockReturnValue([spawnPoint1]);

    const mockNpc1 = createMockNpc(1, "Sea Maid");
    vi.mocked(npcFactory.create).mockReturnValue(mockNpc1 as never);

    npcSpawnManager.spawnNpcs(mockScene, mockMap, [npcDto1]);

    const spawned = npcSpawnManager.getSpawnedNpcs();
    expect(spawned).toHaveLength(1);
    expect(spawned[0].getId()).toBe(1);
  });

  it("should clear spawned NPCs collection", () => {
    vi.mocked(npcSpawnLoader.loadSpawnPoints).mockReturnValue([spawnPoint1]);

    const mockNpc1 = createMockNpc(1, "Sea Maid");
    vi.mocked(npcFactory.create).mockReturnValue(mockNpc1 as never);

    npcSpawnManager.spawnNpcs(mockScene, mockMap, [npcDto1]);
    expect(npcSpawnManager.getSpawnedNpcs()).toHaveLength(1);

    npcSpawnManager.clear();
    expect(npcSpawnManager.getSpawnedNpcs()).toHaveLength(0);
  });
});
