import { revenantApi } from "../../api/RevenantApi";
import type { NpcDto } from "../interfaces/NpcResponse";

/**
 * NpcService is responsible for retrieving NPC data from the backend.
 *
 * This service consumes the endpoint:
 * GET /api/world/maps/npc/{mapId}
 *
 * It provides:
 * - NPC catalog retrieval for a given map.
 *
 * This service does NOT implement NPC behavior, interaction, or rendering.
 */
class NpcService {
  /**
   * Retrieves the NPC catalog for a given map from the backend.
   *
   * @param mapId - The map identifier to fetch NPCs for.
   * @returns The NPC collection or null if the request fails.
   */
  async getNpcsByMap(mapId: number): Promise<NpcDto[] | null> {
    try {
      const { data } = await revenantApi.get<NpcDto[]>(
        `/world/maps/npc/${mapId}`
      );
      return data;
    } catch (error) {
      console.error(`[NpcService] Failed to retrieve NPCs for map ${mapId}:`, error);
      return null;
    }
  }
}

export const npcService = new NpcService();
