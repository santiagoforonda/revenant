import type { NpcSpawnPoint } from "./NpcSpawnPoint";

/**
 * Loads NPC spawn points from the Tiled object layer.
 *
 * Responsibilities:
 * - Read the object layer from the Tiled map.
 * - Locate NPC spawn definitions.
 * - Return the collection of spawn points as NpcSpawnPoint[].
 *
 * This loader does not implement gameplay logic.
 */
export class NpcSpawnLoader {
  private static readonly OBJECT_LAYER_NAME = "objectos";
  private static readonly NPC_SPAWN_OBJECT_NAME = "npc";
  private static readonly NPC_ID_PROPERTY = "id";

  /**
   * Reads NPC spawn points from the Tiled object layer.
   *
   * @param map - The Phaser Tilemap containing the object layer.
   * @returns An array of valid NpcSpawnPoint entries.
   */
  loadSpawnPoints(map: Phaser.Tilemaps.Tilemap): NpcSpawnPoint[] {
    const objectLayer = map.getObjectLayer(NpcSpawnLoader.OBJECT_LAYER_NAME);

    if (!objectLayer) {
      console.warn(
        `[NpcSpawnLoader] Object layer '${NpcSpawnLoader.OBJECT_LAYER_NAME}' not found in tilemap.`
      );
      return [];
    }

    const spawnPoints: NpcSpawnPoint[] = [];

    for (const obj of objectLayer.objects) {
      if (obj.name !== NpcSpawnLoader.NPC_SPAWN_OBJECT_NAME) {
        continue;
      }

      const npcId = this.extractNpcId(obj);

      if (npcId === undefined) {
        console.warn(
          `[NpcSpawnLoader] Spawn object at (${obj.x}, ${obj.y}) missing '${NpcSpawnLoader.NPC_ID_PROPERTY}' property. Skipping.`
        );
        continue;
      }

      const x = obj.x;
      const y = obj.y;

      if (x === undefined || y === undefined) {
        console.warn(
          `[NpcSpawnLoader] Spawn object with npcId=${npcId} missing coordinates. Skipping.`
        );
        continue;
      }

      spawnPoints.push({ npcId, x, y });
    }

    return spawnPoints;
  }

  /**
   * Extracts the npcId custom property from a Tiled object.
   * Handles both array format [{name, value}] and flat object format {key: value}.
   */
  private extractNpcId(obj: Phaser.Types.Tilemaps.TiledObject): number | undefined {
    if (Array.isArray(obj.properties)) {
      const prop = obj.properties.find(
        (p: { name: string; value: unknown }) => p.name === NpcSpawnLoader.NPC_ID_PROPERTY
      );
      return prop?.value as number | undefined;
    }

    if (obj.properties && typeof obj.properties === "object") {
      return (obj.properties as Record<string, unknown>)[NpcSpawnLoader.NPC_ID_PROPERTY] as
        | number
        | undefined;
    }

    return undefined;
  }
}

/** Singleton instance for use across the application. */
export const npcSpawnLoader = new NpcSpawnLoader();
