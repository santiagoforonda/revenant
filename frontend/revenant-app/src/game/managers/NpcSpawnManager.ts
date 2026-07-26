import type { Npc } from "../entities/characters/Npc";
import type { NpcDto } from "../interfaces/NpcResponse";
import { npcFactory } from "../factories/NpcFactory";
import { npcSpawnLoader } from "../loader/spawnLoader/NpcSpawnLoader";

/**
 * NpcSpawnManager coordinates the complete NPC spawning process.
 *
 * Responsibilities:
 * - Receive NPC data (NpcDto[]) and coordinate the spawning workflow.
 * - Use the SpawnLoader to get spawn points from the tilemap.
 * - Match backend NPCs with their spawn points by npcId.
 * - Delegate entity creation to NpcFactory.
 * - Register spawned NPCs in the active scene.
 * - Expose the spawned NPC collection.
 *
 * This manager does NOT:
 * - Perform HTTP requests.
 * - Subscribe to the Event Bus (handled externally).
 * - Implement gameplay logic.
 */
class NpcSpawnManager {
  private spawnedNpcs: Npc[] = [];

  /**
   * Spawns NPCs into the given scene by matching backend NPC data
   * with spawn points defined in the Tiled map.
   *
   * The spawning process is resilient: if one NPC fails to spawn for any reason,
   * the error is logged and remaining NPCs continue spawning.
   *
   * @param scene - The active Phaser scene where NPCs will be added.
   * @param map - The Phaser Tilemap containing spawn point definitions.
   * @param npcData - Array of NPC DTOs received from the backend.
   */
  spawnNpcs(
    scene: Phaser.Scene,
    map: Phaser.Tilemaps.Tilemap,
    npcData: NpcDto[]
  ): void {
    const spawnPoints = npcSpawnLoader.loadSpawnPoints(map);

    // Filter valid NPC data — skip entries with missing required fields
    const validNpcData = this.filterValidNpcData(npcData);

    const npcLookup = new Map<number, NpcDto>();
    for (const dto of validNpcData) {
      npcLookup.set(dto.id, dto);
    }

    // Warn about backend NPCs that have no matching spawn point
    for (const dto of validNpcData) {
      const hasSpawnPoint = spawnPoints.some((sp) => sp.npcId === dto.id);
      if (!hasSpawnPoint) {
        console.warn(
          `[NpcSpawnManager] Backend NPC id=${dto.id} ("${dto.name}") has no matching spawn point. Skipping.`
        );
      }
    }

    // Process each spawn point with resilient error handling
    let skipped = 0;
    const totalSpawnPoints = spawnPoints.length;

    for (const spawnPoint of spawnPoints) {
      try {
        const matchingNpc = npcLookup.get(spawnPoint.npcId);

        if (!matchingNpc) {
          console.warn(
            `[NpcSpawnManager] Spawn point at (${spawnPoint.x}, ${spawnPoint.y}) references npcId=${spawnPoint.npcId} but no matching backend NPC exists. Skipping.`
          );
          skipped++;
          continue;
        }

        const npc = npcFactory.create(
          scene,
          spawnPoint.x,
          spawnPoint.y,
          matchingNpc
        );

        if (!npc) {
          // Factory returned null (unsupported NPC type or creation failure).
          // NpcFactory already logs its own warning.
          skipped++;
          continue;
        }

        this.spawnedNpcs.push(npc);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(
          `[NpcSpawnManager] Unexpected error spawning NPC at (${spawnPoint.x}, ${spawnPoint.y}) npcId=${spawnPoint.npcId}: ${errorMessage}`
        );
        skipped++;
      }
    }

    // Log spawn summary
    const spawned = this.spawnedNpcs.length;
    console.log(
      `[NpcSpawnManager] Spawned ${spawned}/${totalSpawnPoints} NPCs (${skipped} skipped)`
    );
  }

  /**
   * Validates NpcDto entries and filters out those with missing required fields.
   * Logs a warning for each invalid entry.
   *
   * @param npcData - Raw array of NPC DTOs from the backend.
   * @returns Filtered array containing only valid NpcDto entries.
   */
  private filterValidNpcData(npcData: NpcDto[]): NpcDto[] {
    const valid: NpcDto[] = [];

    for (const dto of npcData) {
      if (dto.id === undefined || dto.id === null) {
        console.warn(
          `[NpcSpawnManager] NPC data entry missing 'id' field. Skipping invalid entry.`
        );
        continue;
      }

      if (!dto.name) {
        console.warn(
          `[NpcSpawnManager] NPC id=${dto.id} missing 'name' field. Skipping invalid entry.`
        );
        continue;
      }

      valid.push(dto);
    }

    return valid;
  }

  /**
   * Returns all NPCs that have been successfully spawned.
   */
  getSpawnedNpcs(): Npc[] {
    return this.spawnedNpcs;
  }

  /**
   * Clears the spawned NPC collection.
   * Call this when transitioning between maps or resetting the scene.
   */
  clear(): void {
    this.spawnedNpcs = [];
  }
}

/** Singleton instance for use across the application. */
export const npcSpawnManager = new NpcSpawnManager();
