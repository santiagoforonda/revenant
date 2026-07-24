import { revenantApi } from "../../api/RevenantApi";
import type { EnemyResponse } from "../interfaces/EnemyResponse";

/**
 * EnemyService is responsible for retrieving enemy data from the backend.
 *
 * This service consumes the endpoint:
 * GET /api/world/maps/enemies/{mapId}
 *
 * It provides:
 * - Enemy catalog retrieval for a given map.
 * - An efficient lookup table indexed by enemyId.
 *
 * This service does NOT implement enemy behavior, AI, combat, or rendering.
 */
class EnemyService {
  /**
   * Retrieves the enemy catalog for a given map from the backend.
   *
   * @param mapId - The map identifier to fetch enemies for.
   * @returns The enemy collection or null if the request fails.
   */
  async getEnemiesByMap(mapId: number): Promise<EnemyResponse[] | null> {
    try {
      const { data } = await revenantApi.get<EnemyResponse[]>(
        `/world/maps/enemies/${mapId}`
      );
      return data;
    } catch (error) {
      console.error(`[EnemyService] Failed to retrieve enemies for map ${mapId}:`, error);
      return null;
    }
  }

  /**
   * Builds a lookup table indexed by enemy id for efficient access
   * during spawn processing.
   *
   * @param enemies - The enemy collection from the backend.
   * @returns A Map indexed by enemy id.
   */
  buildLookupTable(enemies: EnemyResponse[]): Map<number, EnemyResponse> {
    const lookup = new Map<number, EnemyResponse>();
    for (const enemy of enemies) {
      lookup.set(enemy.id, enemy);
    }
    return lookup;
  }
}

export const enemyService = new EnemyService();
