import Phaser from "phaser";
import {
  PlayerClass,
  CLASS_SPRITE_REGISTRY,
} from "@/game/config/ClassSpriteRegistry";
import { assetLoaderService } from "@/game/services/AssetLoaderService";
import { DefaultSpriteComposer } from "@/game/services/SpriteComposer";
import { Player } from "@/game/entities/characters/Player";
import type { LoginResponse } from "@/auth";

/**
 * Options accepted by the PlayerFactory when creating a Player entity.
 */
export interface PlayerFactoryOptions {
  scene: Phaser.Scene;
  x: number;
  y: number;
  playerClass?: PlayerClass;
}

/**
 * PlayerFactory creates fully configured Player entities for any supported class.
 *
 * Responsibilities:
 * - Validates the requested PlayerClass (falls back to Caballero if invalid)
 * - Resolves the ClassSpriteConfig from the registry
 * - Verifies that assets are loaded via AssetLoaderService
 * - Registers animations for the resolved class via SpriteComposer
 * - Returns a fully configured Player entity
 */
class PlayerFactoryImpl {
  private readonly spriteComposer = new DefaultSpriteComposer();

  /**
   * Creates a Player entity configured for the specified class.
   *
   * Falls back to Caballero if:
   * - No playerClass is provided
   * - The provided playerClass is not a valid PlayerClass enum value
   *
   * @param options - Factory options including scene, position, and optional class.
   * @returns A fully configured Player entity.
   */
  create(options: PlayerFactoryOptions,stats:LoginResponse): Player {
    const { scene, x, y } = options;
    const resolvedClass = this.resolvePlayerClass(options.playerClass);
    const config = CLASS_SPRITE_REGISTRY[resolvedClass];

    // Verify assets are loaded — log warning if not
    if (!assetLoaderService.areAssetsLoaded(scene, resolvedClass)) {
      console.warn(
        `[PlayerFactory] Assets not fully loaded for class "${resolvedClass}". ` +
          `Player may render with missing layers.`
      );
    }

    // Register animations for this class (idempotent)
    this.spriteComposer.registerAnimations(scene, config);

    return new Player(scene, x, y, config,stats);
  }

  /**
   * Resolves and validates the player class, falling back to Caballero
   * if the value is undefined or not present in the registry.
   */
  private resolvePlayerClass(playerClass?: PlayerClass): PlayerClass {
    if (playerClass === undefined) {
      return PlayerClass.Caballero;
    }

    const validClasses = Object.values(PlayerClass) as string[];
    if (!validClasses.includes(playerClass as string)) {
      console.warn(
        `[PlayerFactory] Invalid class "${String(playerClass)}", falling back to Caballero`
      );
      return PlayerClass.Caballero;
    }

    return playerClass;
  }
}

/** Singleton instance of the PlayerFactory */
export const playerFactory = new PlayerFactoryImpl();
