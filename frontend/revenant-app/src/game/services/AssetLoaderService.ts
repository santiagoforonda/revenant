import Phaser from "phaser";
import {
  PlayerClass,
  CLASS_SPRITE_REGISTRY,
  SHARED_BODY_KEY,
  FRAME_WIDTH,
  FRAME_HEIGHT,
} from "@/game/config/ClassSpriteRegistry";
import type { EquipmentLayer } from "@/game/config/ClassSpriteRegistry";
import { ENEMY_SPRITE_REGISTRY } from "@/game/config/EnemySpriteRegistry";
import type { EnemyType, EnemySpriteConfig } from "@/game/config/EnemySpriteRegistry";

/** Base path for all class sprite assets */
const ASSETS_BASE = "/assets/characters/classes";

/** Directions used for directional helmet loading */
const HELMET_DIRECTIONS = ["n", "s", "e", "w"] as const;

/**
 * Maps (classId, layer) to the actual filename on disk.
 * Handles the known filename inconsistencies across classes.
 */
const FILENAME_OVERRIDES: Partial<Record<string, Record<string, string>>> = {
  gladiador: {
    weapon: "Walk.png",
  },
  arquero: {
    weapon: "bow.png",
  },
  espadachin: {
    helmet: "hair.png",
  },
};

/**
 * Returns the filename for a given class and layer.
 * Falls back to the standard naming convention when no override exists.
 *
 * Standard convention:
 * - feet → feets.png
 * - weapon → weapon.png
 * - all others → {layer}.png
 */
function getFilename(classId: string, layer: EquipmentLayer): string {
  const override = FILENAME_OVERRIDES[classId]?.[layer];
  if (override) {
    return override;
  }

  // Default filenames per layer
  switch (layer) {
    case "feet":
      return "feets.png";
    case "legs":
      return "legs.png";
    case "torso":
      return "torso.png";
    case "weapon":
      return "weapon.png";
    case "shield":
      return "shield.png";
    case "helmet":
      return "helmet.png";
    default:
      return `${layer}.png`;
  }
}

/**
 * AssetLoaderService manages loading and caching class-specific sprite assets.
 *
 * Responsibilities:
 * - Loads spritesheets for all equipment layers of a given PlayerClass
 * - Loads the shared body asset (once, idempotently)
 * - Handles directional helmet assets (4 individual images)
 * - Skips assets already present in the texture cache
 * - Logs warnings for missing files without interrupting gameplay
 */
export interface AssetLoaderServiceInterface {
  /** Loads all assets for a given class. Skips if already in texture cache. */
  loadClassAssets(scene: Phaser.Scene, playerClass: PlayerClass): Promise<void>;

  /** Checks if all required assets for a class are loaded */
  areAssetsLoaded(scene: Phaser.Scene, playerClass: PlayerClass): boolean;

  /** Resolves the file path for a specific layer and class */
  resolveAssetPath(playerClass: PlayerClass, layer: EquipmentLayer): string;

  /**
   * Queues the enemy spritesheet for loading via the scene's preload pipeline.
   * This method registers the spritesheet with Phaser's loader but does NOT
   * call load.start() — it must be called during the scene's preload() phase.
   *
   * Returns true if the asset was queued, false if already in texture cache.
   */
  preloadEnemySpritesheet(scene: Phaser.Scene, enemyType: EnemyType): boolean;

  /** Checks if the enemy spritesheet is loaded in the texture cache */
  isEnemySpritesheetLoaded(scene: Phaser.Scene, enemyType: EnemyType): boolean;

  /** Returns the sprite config for the given enemy type, or undefined if not registered */
  getEnemySpriteConfig(enemyType: EnemyType): EnemySpriteConfig | undefined;
}

class AssetLoaderServiceImpl implements AssetLoaderServiceInterface {
  /**
   * Loads all spritesheet assets required for the given PlayerClass.
   *
   * - Loads the shared body asset if not already cached
   * - Loads each non-null equipment layer as a spritesheet
   * - Handles directional helmets by loading 4 individual images
   * - Skips any asset already present in the scene's texture cache
   * - Returns a promise that resolves once all loads complete
   */
  async loadClassAssets(scene: Phaser.Scene, playerClass: PlayerClass): Promise<void> {
    const config = CLASS_SPRITE_REGISTRY[playerClass];
    if (!config) {
      console.warn(`[AssetLoader] Unknown player class: "${playerClass}", skipping load`);
      return;
    }

    let hasNewAssets = false;

    // Load shared body asset (idempotent)
    if (!scene.textures.exists(SHARED_BODY_KEY)) {
      const bodyPath = `${ASSETS_BASE}/${PlayerClass.Caballero}/body/body.png`;
      scene.load.spritesheet(SHARED_BODY_KEY, bodyPath, {
        frameWidth: FRAME_WIDTH,
        frameHeight: FRAME_HEIGHT,
      });
      hasNewAssets = true;
    }

    // Load each equipment layer
    const layers = Object.entries(config.layers) as [EquipmentLayer, string | null][];

    for (const [layer, assetKey] of layers) {
      if (assetKey === null) {
        continue;
      }

      if (layer === "helmet") {
        hasNewAssets = this.loadHelmetAsset(scene, config.helmetType, assetKey, playerClass) || hasNewAssets;
      } else {
        if (!scene.textures.exists(assetKey)) {
          const path = this.resolveAssetPath(playerClass, layer);
          scene.load.spritesheet(assetKey, path, {
            frameWidth: FRAME_WIDTH,
            frameHeight: FRAME_HEIGHT,
          });
          hasNewAssets = true;
        }
      }
    }

    // Start the loader only if new assets were queued
    if (hasNewAssets) {
      return new Promise<void>((resolve) => {
        scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
          resolve();
        });

        scene.load.once(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
          console.warn(
            `[AssetLoader] Missing asset for ${playerClass}/${file.key}: ${file.url}`
          );
        });

        scene.load.start();
      });
    }
  }

  /**
   * Checks whether all required textures for the given class
   * are present in the scene's texture cache.
   */
  areAssetsLoaded(scene: Phaser.Scene, playerClass: PlayerClass): boolean {
    const config = CLASS_SPRITE_REGISTRY[playerClass];
    if (!config) {
      return false;
    }

    // Check shared body
    if (!scene.textures.exists(SHARED_BODY_KEY)) {
      return false;
    }

    // Check each non-null layer
    const layers = Object.entries(config.layers) as [EquipmentLayer, string | null][];

    for (const [layer, assetKey] of layers) {
      if (assetKey === null) {
        continue;
      }

      if (layer === "helmet") {
        if (config.helmetType === "directional") {
          for (const dir of HELMET_DIRECTIONS) {
            if (!scene.textures.exists(`${assetKey}-${dir}`)) {
              return false;
            }
          }
        } else {
          if (!scene.textures.exists(assetKey)) {
            return false;
          }
        }
      } else {
        if (!scene.textures.exists(assetKey)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Resolves the filesystem path for a given class and equipment layer.
   *
   * Convention: /src/assets/characters/classes/{classId}/{layer}/{filename}
   *
   * Filename resolution handles known inconsistencies:
   * - Knight feet → feet.png (all others → feets.png)
   * - Gladiador weapon → Walk.png
   * - Arquero weapon → bow.png
   */
  resolveAssetPath(playerClass: PlayerClass, layer: EquipmentLayer): string {
    const classId = playerClass as string;
    const filename = getFilename(classId, layer);
    return `${ASSETS_BASE}/${classId}/${layer}/${filename}`;
  }

  /**
   * Queues the enemy spritesheet for loading via the scene's preload pipeline.
   *
   * This method registers the spritesheet with Phaser's loader using the
   * frame dimensions defined in the EnemySpriteRegistry (32×48 for Skeleton).
   * It must be called during the scene's preload() phase — it does NOT call
   * load.start() manually.
   *
   * Returns true if the asset was queued, false if already in texture cache.
   */
  preloadEnemySpritesheet(scene: Phaser.Scene, enemyType: EnemyType): boolean {
    const config = ENEMY_SPRITE_REGISTRY[enemyType];
    if (!config) {
      console.warn(`[AssetLoader] Unknown enemy type: "${enemyType}", skipping load`);
      return false;
    }

    if (scene.textures.exists(config.textureKey)) {
      return false;
    }

    scene.load.spritesheet(config.textureKey, config.assetPath, {
      frameWidth: config.frameWidth,
      frameHeight: config.frameHeight,
    });

    return true;
  }

  /**
   * Checks if the enemy spritesheet is loaded in the texture cache.
   */
  isEnemySpritesheetLoaded(scene: Phaser.Scene, enemyType: EnemyType): boolean {
    const config = ENEMY_SPRITE_REGISTRY[enemyType];
    if (!config) {
      return false;
    }
    return scene.textures.exists(config.textureKey);
  }

  /**
   * Returns the sprite config for the given enemy type, or undefined if not registered.
   */
  getEnemySpriteConfig(enemyType: EnemyType): EnemySpriteConfig | undefined {
    return ENEMY_SPRITE_REGISTRY[enemyType];
  }

  /**
   * Loads helmet assets based on the helmet type.
   *
   * - "directional": loads 4 individual images (n.png, s.png, e.png, w.png)
   * - "spritesheet": loads a single spritesheet
   *
   * Returns true if any new assets were queued.
   */
  private loadHelmetAsset(
    scene: Phaser.Scene,
    helmetType: "directional" | "spritesheet",
    assetKey: string,
    playerClass: PlayerClass
  ): boolean {
    const classId = playerClass as string;
    let queued = false;

    if (helmetType === "directional") {
      for (const dir of HELMET_DIRECTIONS) {
        const dirKey = `${assetKey}-${dir}`;
        if (!scene.textures.exists(dirKey)) {
          const path = `${ASSETS_BASE}/${classId}/helmet/${dir}.png`;
          scene.load.image(dirKey, path);
          queued = true;
        }
      }
    } else {
      // Spritesheet helmet
      if (!scene.textures.exists(assetKey)) {
        const path = `${ASSETS_BASE}/${classId}/helmet/helmet.png`;
        scene.load.spritesheet(assetKey, path, {
          frameWidth: FRAME_WIDTH,
          frameHeight: FRAME_HEIGHT,
        });
        queued = true;
      }
    }

    return queued;
  }
}

/** Singleton instance of the AssetLoaderService */
export const assetLoaderService = new AssetLoaderServiceImpl();
