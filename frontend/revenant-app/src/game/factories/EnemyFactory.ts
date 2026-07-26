import Phaser from "phaser";
import { Enemy } from "../entities/characters/Enemy";
import type { EnemyResponse } from "../interfaces/EnemyResponse";
import { EnemyType } from "@/game/config/EnemySpriteRegistry";

/**
 * EnemyFactory is the sole component responsible for creating Enemy entities.
 *
 * It receives backend enemy data and Tiled spawn information,
 * and produces fully initialized Enemy instances.
 *
 * This factory centralizes enemy creation so that new enemy types
 * can be added without modifying the spawning workflow.
 */

/** Maps enemyId to sprite keys. Only enemies with a configured sprite will be spawned. */
const ENEMY_SPRITE_MAP: Record<number, string> = {
  15: "skeleton",
  16: "lobos",
  17: "hedgehog",
  18: "minotauro",
};

/** Maps enemyId to EnemyType for animation support. Only enemies with animation support are listed. */
const ENEMY_TYPE_MAP: Record<number, EnemyType> = {
  15: EnemyType.Skeleton,
  16: EnemyType.Wolf,
  17: EnemyType.Hedgehog,
  18: EnemyType.Minotaur,
};

/** Default sprite — not used, enemies without mapping are skipped */
const DEFAULT_ENEMY_SPRITE: string | null = null;

class EnemyFactory {
  /**
   * Creates an Enemy entity from backend data and spawn position.
   * Returns null if no sprite is configured for this enemy type.
   *
   * @param scene - The Phaser scene the enemy will belong to.
   * @param x - World X coordinate from the Tiled spawn object.
   * @param y - World Y coordinate from the Tiled spawn object.
   * @param stats - Backend enemy statistics.
   * @returns A fully initialized Enemy entity, or null if no sprite is available.
   */
  create(
    scene: Phaser.Scene,
    x: number,
    y: number,
    stats: EnemyResponse
  ): Enemy | null {
    const spriteKey = ENEMY_SPRITE_MAP[stats.id] ?? DEFAULT_ENEMY_SPRITE;
    if (!spriteKey) {
      return null;
    }
    const enemyType = ENEMY_TYPE_MAP[stats.id] ?? EnemyType.Skeleton;
    return new Enemy(scene, x, y, stats, spriteKey, enemyType);
  }
}

export const enemyFactory = new EnemyFactory();
