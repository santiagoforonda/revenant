import Phaser from "phaser";
import type { EnemyResponse } from "../../interfaces/EnemyResponse";

/**
 * Enemy entity — represents an enemy in the game world.
 *
 * Each Enemy instance stores:
 * - Backend statistics (health, damage, armor, rewards, etc.)
 * - Spawn position from the Tiled map.
 * - A Phaser sprite for rendering.
 *
 * This entity currently provides only spawning and static rendering.
 * Future features will add: movement, AI, combat, animations, health bars.
 */
export class Enemy {
  private readonly scene: Phaser.Scene;
  private readonly sprite: Phaser.Physics.Arcade.Sprite;
  private readonly stats: EnemyResponse;

  /**
   * Creates an Enemy entity.
   *
   * @param scene - The Phaser scene this enemy belongs to.
   * @param x - World X coordinate (from Tiled spawn point).
   * @param y - World Y coordinate (from Tiled spawn point).
   * @param stats - Backend enemy statistics.
   * @param spriteKey - The texture key to use for rendering.
   */
  constructor(scene: Phaser.Scene, x: number, y: number, stats: EnemyResponse, spriteKey: string) {
    this.scene = scene;
    this.stats = stats;

    this.sprite = this.scene.physics.add.sprite(x, y, spriteKey, 13);
    this.sprite.setDepth(2);
    this.sprite.setImmovable(true);
  }

  /**
   * Returns the enemy's Phaser sprite.
   */
  getSprite(): Phaser.Physics.Arcade.Sprite {
    return this.sprite;
  }

  /**
   * Returns the enemy's backend statistics.
   */
  getStats(): EnemyResponse {
    return this.stats;
  }

  /**
   * Returns the enemy's name from backend data.
   */
  getName(): string {
    return this.stats.name;
  }

  /**
   * Returns the enemy's current world X position.
   */
  getX(): number {
    return this.sprite.x;
  }

  /**
   * Returns the enemy's current world Y position.
   */
  getY(): number {
    return this.sprite.y;
  }
}
