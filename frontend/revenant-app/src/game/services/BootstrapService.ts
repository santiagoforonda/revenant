import type { LoginResponse } from "../../auth/interfaces/auth-response";
import { eventBus } from "../events";
import type { ApiErrorPayload } from "../events";

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
      console.log("[BootstrapService] Bootstrap started for user:", userData.username);

      // Future: parallel load of required resources
      // await Promise.all([
      //   this.loadPlayer(userData),
      //   this.loadCurrentMap(userData.mapId),
      //   this.loadEnemies(userData.mapId),
      //   this.loadNPCs(userData.mapId),
      //   this.loadStores(userData.mapId),
      //   this.loadInventory(),
      // ]);

      // For now, the LoginResponse already contains initial player data.
      // Resource loading will be implemented when APIs are available.

      console.log("[BootstrapService] Bootstrap completed successfully");
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
}

export const bootstrapService = new BootstrapService();
