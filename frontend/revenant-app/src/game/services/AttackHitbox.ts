import type { PlayerDirection } from "@/game/services/SpriteComposer";
import type { Enemy } from "@/game/entities/characters/Enemy";

/**
 * Default attack range in pixels (one tile + half a tile).
 */
const DEFAULT_RANGE = 48;

/**
 * Default attack width in pixels (perpendicular to direction).
 */
const DEFAULT_WIDTH = 48;

/**
 * Configuration for the attack hitbox dimensions.
 */
export interface AttackHitboxConfig {
  /** How far the hitbox extends in the attack direction (pixels). */
  range?: number;
  /** Size perpendicular to the attack direction (pixels). */
  width?: number;
}

/**
 * Represents the bounds of the attack area as a rectangle.
 */
interface HitboxBounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * AttackHitbox — represents the area affected by the player's melee attack.
 *
 * Responsibilities:
 * - Build the attack area based on player position and direction.
 * - Detect every enemy whose position falls inside the hitbox bounds.
 * - Return the collection of affected enemies.
 *
 * The hitbox is a rectangle that extends from the player's position
 * in the specified direction. Its size is determined by the configured
 * range (distance along the attack direction) and width (perpendicular).
 *
 * Detection uses simple point-in-rectangle checks (pure math, no physics engine).
 *
 * Validates: Requirement 3 (Detect Attack Targets)
 */
export class AttackHitbox {
  private readonly position: { x: number; y: number };
  private readonly direction: PlayerDirection;
  private readonly range: number;
  private readonly width: number;
  private readonly bounds: HitboxBounds;

  /**
   * Creates an AttackHitbox.
   *
   * @param x - Player's world X position.
   * @param y - Player's world Y position.
   * @param direction - The direction the player is attacking toward.
   * @param config - Optional configuration for range and width. Uses defaults if omitted.
   */
  constructor(x: number, y: number, direction: PlayerDirection, config?: AttackHitboxConfig) {
    this.position = { x, y };
    this.direction = direction;
    this.range = config?.range ?? DEFAULT_RANGE;
    this.width = config?.width ?? DEFAULT_WIDTH;
    this.bounds = this.calculateBounds();
  }

  /**
   * Detects all enemies whose position falls within the hitbox bounds.
   *
   * Uses point-in-rectangle collision: an enemy is "inside" if its (x, y)
   * position is within the hitbox rectangle (inclusive on min, exclusive on max).
   *
   * @param enemies - The collection of enemies to evaluate.
   * @returns Array of enemies detected inside the hitbox.
   */
  detectEnemies(enemies: Enemy[]): Enemy[] {
    return enemies.filter((enemy) => this.isInsideBounds(enemy.getX(), enemy.getY()));
  }

  /**
   * Returns the hitbox bounds for external inspection or debugging.
   */
  getBounds(): { x: number; y: number; w: number; h: number } {
    return { ...this.bounds };
  }

  /**
   * Returns the configured range.
   */
  getRange(): number {
    return this.range;
  }

  /**
   * Returns the configured width.
   */
  getWidth(): number {
    return this.width;
  }

  /**
   * Returns the attack direction.
   */
  getDirection(): PlayerDirection {
    return this.direction;
  }

  /**
   * Returns the origin position (player position at time of creation).
   */
  getPosition(): { x: number; y: number } {
    return { ...this.position };
  }

  /**
   * Calculates the hitbox rectangle bounds based on direction.
   *
   * - "right": extends to the right of the player.
   * - "left": extends to the left of the player.
   * - "down": extends below the player.
   * - "up": extends above the player.
   */
  private calculateBounds(): HitboxBounds {
    const { x, y } = this.position;
    const halfWidth = this.width / 2;

    switch (this.direction) {
      case "right":
        return { x, y: y - halfWidth, w: this.range, h: this.width };
      case "left":
        return { x: x - this.range, y: y - halfWidth, w: this.range, h: this.width };
      case "down":
        return { x: x - halfWidth, y, w: this.width, h: this.range };
      case "up":
        return { x: x - halfWidth, y: y - this.range, w: this.width, h: this.range };
    }
  }

  /**
   * Checks if a point (ex, ey) falls within the hitbox bounds.
   *
   * Uses inclusive lower bound and exclusive upper bound:
   *   bounds.x <= ex < bounds.x + bounds.w
   *   bounds.y <= ey < bounds.y + bounds.h
   */
  private isInsideBounds(ex: number, ey: number): boolean {
    return (
      ex >= this.bounds.x &&
      ex < this.bounds.x + this.bounds.w &&
      ey >= this.bounds.y &&
      ey < this.bounds.y + this.bounds.h
    );
  }
}
