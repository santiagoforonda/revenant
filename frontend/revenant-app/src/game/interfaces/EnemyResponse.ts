/**
 * DTO representing an enemy returned by the backend.
 * Endpoint: GET /api/world/maps/enemies/{mapId}
 */
export interface EnemyResponse {
  id: number;
  id_map: number;
  healthPoints: number;
  damagePoints: number;
  armorPoints: number;
  goldReward: number;
  xpReward: number;
  speedAttackPoints: number;
  name: string;
  description: string;
}
