import Phaser from "phaser";
import { Npc } from "../entities/characters/Npc";
import type { NpcDto } from "../interfaces/NpcResponse";

/**
 * NpcFactory is the sole component responsible for creating NPC entities.
 *
 * It receives backend NPC data and Tiled spawn coordinates,
 * and produces fully initialized Npc instances.
 *
 * This factory centralizes NPC creation so that new NPC types
 * can be added without modifying the spawning workflow.
 */

/** Maps NPC id to sprite texture key. Only NPCs with a configured sprite will be spawned. */
const NPC_SPRITE_MAP: Record<number, string> = {
  1: "sea_maid",
  2: "traveling_merchant",
  3: "old_hermit",
  4: "forest_healer",
  5: "guard",
};

/** Maps NPC id to custom scale. NPCs not listed here use the default scale (1). */
const NPC_SCALE_MAP: Record<number, number> = {
  2: 1.5,
};

/** Maps NPC id to custom interaction radius in pixels. NPCs not listed use the default radius. */
const NPC_INTERACTION_RADIUS_MAP: Record<number, number> = {
  1: 280, // sea_maid
};

class NpcFactory {
  /**
   * Creates an NPC entity from backend data and spawn position.
   * Returns null if no sprite is configured for this NPC type or if creation fails.
   *
   * @param scene - The Phaser scene the NPC will belong to.
   * @param x - World X coordinate from the Tiled spawn point.
   * @param y - World Y coordinate from the Tiled spawn point.
   * @param npcData - Backend NPC data (NpcDto).
   * @returns A fully initialized Npc entity, or null if creation fails.
   */
  create(
    scene: Phaser.Scene,
    x: number,
    y: number,
    npcData: NpcDto
  ): Npc | null {
    const spriteKey = NPC_SPRITE_MAP[npcData.id];

    if (!spriteKey) {
      console.warn(
        `[NpcFactory] No sprite configured for NPC id=${npcData.id} ("${npcData.name}"). Skipping creation.`
      );
      return null;
    }

    try {
      const scale = NPC_SCALE_MAP[npcData.id] ?? 1;
      const interactionRadius = NPC_INTERACTION_RADIUS_MAP[npcData.id] ?? null;
      return new Npc(scene, x, y, npcData, spriteKey, scale, interactionRadius);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(
        `[NpcFactory] Failed to create NPC id=${npcData.id} ("${npcData.name}"): ${errorMessage}`
      );
      return null;
    }
  }
}

export const npcFactory = new NpcFactory();
