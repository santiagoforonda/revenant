/**
 * DTO representing an NPC returned by the backend.
 * Endpoint: GET /api/world/maps/npc/{mapId}
 */
export interface NpcDto {
  id: number;
  id_map: number;
  name: string;
  description: string;
  phrases: string[];
}
