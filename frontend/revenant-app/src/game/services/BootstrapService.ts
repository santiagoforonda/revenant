import type { LoginResponse } from "../../auth/interfaces/auth-response";
import { eventBus } from "../events";
import type { ApiErrorPayload } from "../events";
import { npcService } from "./NpcService";

/**
 * BootstrapService manages the game initialization lifecycle.
 *
 * After GAME_INITIALIZED is emitted, this service coordinates loading
 * of all required game resources before emitting GAME_READY.
 *
 * Currently implemented as a skeleton. Future resource loading
 * (maps, enemies, NPCs, stores, inventory) will be added here
 * when the corresponding API endpoints are available.
 */
class BootstrapService {
  /**
   * Initializes the game by loading all required resources.
   *
   * Once all resources are loaded successfully, emits GAME_READY.
   * If any resource fails to load, emits API_ERROR.
   *
   * @param userData - The authenticated user's login response data
   */
  async initialize(userData: LoginResponse): Promise<void> {
    try {

      // Fetch NPC data for the user's current map and emit through Event Bus.
      // NPCs are non-critical — failure is logged but does not block bootstrap.
      await this.loadNpcs(userData.mapId);

      eventBus.emit("GAME_READY");
    } catch (error: unknown) {
      const errorPayload: ApiErrorPayload = {
        statusCode: 500,
        message: error instanceof Error ? error.message : "Bootstrap initialization failed",
        endpoint: "bootstrap",
      };

      console.error("[BootstrapService] Bootstrap failed:", errorPayload.message);
      eventBus.emit("API_ERROR", errorPayload);
    }
  }

  /**
   * Loads NPC data for the given map and emits it through the Event Bus.
   * NPCs are non-critical — if the fetch fails, a warning is logged
   * but the bootstrap continues.
   *
   * @param mapId - The map identifier to fetch NPCs for.
   */
  private async loadNpcs(mapId: number): Promise<void> {
    const npcs = await npcService.getNpcsByMap(mapId);

    if (npcs && npcs.length > 0) {
      eventBus.emit("NPC_DATA_LOADED", npcs);
    } 
  }
}

export const bootstrapService = new BootstrapService();
