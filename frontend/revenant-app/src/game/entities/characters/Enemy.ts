import Phaser from "phaser";
import type { EnemyResponse } from "../../interfaces/EnemyResponse";
import { EnemyType } from "@/game/config/EnemySpriteRegistry";
import { EnemySpriteComposer } from "@/game/services/EnemySpriteComposer";
import type { EnemyAnimationState, EnemyDirection } from "@/game/services/EnemyAnimationRegistrar";

/**
 * Enemy entity — represents an enemy in the game world.
 *
 * Each Enemy instance stores:
 * - Backend statistics (health, damage, armor, rewards, etc.)
 * - Spawn position from the Tiled map.
 * - A Phaser sprite for rendering.
 * - Current animation state and facing direction.
 *
 * Animation Architecture:
 * The Enemy entity exposes state and direction changes but never invokes
 * Phaser animations directly. All animation playback is delegated through
 * the EnemySpriteComposer, which internally uses the EnemyAnimationController.
 *
 * Flow: Enemy → EnemySpriteComposer → EnemyAnimationController → Phaser
 *
 * This mirrors the Player entity's architecture where the Player delegates
 * animation playback to DefaultSpriteComposer.
 */
export class Enemy {
  private readonly scene: Phaser.Scene;
  private readonly sprite: Phaser.Physics.Arcade.Sprite;
  private readonly stats: EnemyResponse;
  private readonly spriteComposer: EnemySpriteComposer;
  private readonly enemyType: EnemyType;
  private state: EnemyAnimationState = "idle";
  private direction: EnemyDirection = "down";

  /**
   * Creates an Enemy entity.
   *
   * @param scene - The Phaser scene this enemy belongs to.
   * @param x - World X coordinate (from Tiled spawn point).
   * @param y - World Y coordinate (from Tiled spawn point).
   * @param stats - Backend enemy statistics.
   * @param spriteKey - The texture key to use for rendering.
   * @param enemyType - The enemy type for animation resolution (defaults to Skeleton).
   */
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    stats: EnemyResponse,
    spriteKey: string,
    enemyType: EnemyType = EnemyType.Skeleton
  ) {
    this.scene = scene;
    this.stats = stats;
    this.enemyType = enemyType;

    this.sprite = this.scene.physics.add.sprite(x, y, spriteKey, 13);
    this.sprite.setDepth(2);
    this.sprite.setImmovable(true);

    // Initialize the SpriteComposer — delegates all animation to EnemyAnimationController
    this.spriteComposer = new EnemySpriteComposer(this.sprite, this.enemyType);

    // Play initial idle-down animation through the composer
    this.spriteComposer.updateAnimation(this.state, this.direction);
  }

  /**
   * Updates the enemy's animation state.
   *
   * When the state changes, the EnemySpriteComposer is notified to update
   * the visual representation. The Enemy never invokes Phaser animations directly.
   *
   * @param newState - The new animation state (idle or walking).
   */
  setState(newState: EnemyAnimationState): void {
    this.state = newState;
    this.spriteComposer.updateAnimation(this.state, this.direction);
  }

  /**
   * Updates the enemy's facing direction.
   *
   * When the direction changes, the EnemySpriteComposer is notified to update
   * the visual representation. The Enemy never invokes Phaser animations directly.
   *
   * @param newDirection - The new facing direction.
   */
  setDirection(newDirection: EnemyDirection): void {
    this.direction = newDirection;
    this.spriteComposer.updateAnimation(this.state, this.direction);
  }

  /**
   * Updates both state and direction simultaneously.
   *
   * This avoids redundant animation updates when both values change at once.
   * Delegates to SpriteComposer a single time.
   *
   * @param newState - The new animation state.
   * @param newDirection - The new facing direction.
   */
  setStateAndDirection(newState: EnemyAnimationState, newDirection: EnemyDirection): void {
    this.state = newState;
    this.direction = newDirection;
    this.spriteComposer.updateAnimation(this.state, this.direction);
  }

  /**
   * Returns the current animation state.
   */
  getState(): EnemyAnimationState {
    return this.state;
  }

  /**
   * Returns the current facing direction.
   */
  getDirection(): EnemyDirection {
    return this.direction;
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

  /**
   * Sets the enemy's world position directly.
   *
   * Used by the PatrolController for frame-independent movement
   * without relying on physics velocity. This ensures predictable
   * patrol movement that is not affected by collision physics.
   *
   * @param x - The new world X coordinate.
   * @param y - The new world Y coordinate.
   */
  setPosition(x: number, y: number): void {
    this.sprite.setPosition(x, y);
  }

  /**
   * Returns the enemy type.
   */
  getEnemyType(): EnemyType {
    return this.enemyType;
  }

  /**
   * Returns the currently playing animation key.
   * Useful for testing and debugging.
   */
  getCurrentAnimationKey(): string {
    return this.spriteComposer.getCurrentAnimationKey();
  }
}
