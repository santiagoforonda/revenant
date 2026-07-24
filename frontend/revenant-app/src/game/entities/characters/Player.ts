import Phaser from "phaser";

/**
 * Player entity — encapsulates all rendering logic for the player character.
 *
 * The Player owns independent render layers for each visual piece:
 * - Body (base layer, always rendered first)
 * - Helmet (rendered above body)
 *
 * Each layer uses a Phaser.GameObjects.Sprite created from a spritesheet
 * (32x48 pixels per frame). Currently displays frame 0 only.
 *
 * Future equipment layers will follow the same pattern:
 * - Armor (pechera)
 * - Gloves (guantes)
 * - Pants (pantalones)
 * - Weapon (mano principal)
 * - Shield (mano secundaria)
 *
 * Each layer is an independent Phaser.GameObjects.Sprite that shares
 * the same world position. Layers are NOT merged into a single texture
 * and do NOT use containers, allowing granular control over each piece
 * for future equipment swapping and animations.
 *
 * Rendering order (bottom to top):
 * 1. Body
 * 2. Helmet
 * (future: armor, gloves, pants, weapon, shield)
 */
export class Player {
  private readonly scene: Phaser.Scene;
  private readonly body: Phaser.GameObjects.Sprite;
  private readonly helmet: Phaser.GameObjects.Sprite;

  /**
   * Creates the Player entity with all its visual layers.
   *
   * @param scene - The Phaser scene this player belongs to.
   * @param x - Initial world X coordinate.
   * @param y - Initial world Y coordinate.
   */
  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;

    // Body layer — base character rendering (depth 0), frame 0
    this.body = this.scene.add.sprite(x, y, "knight-body", 0);
    this.body.setDepth(0);

    // Helmet layer — rendered above body (depth 1), frame 0
    this.helmet = this.scene.add.sprite(x, y, "knight-helmet", 0);
    this.helmet.setDepth(1);
  }

  /**
   * Returns the body layer Sprite.
   */
  getBody(): Phaser.GameObjects.Sprite {
    return this.body;
  }

  /**
   * Returns the helmet layer Sprite.
   */
  getHelmet(): Phaser.GameObjects.Sprite {
    return this.helmet;
  }

  /**
   * Returns the underlying body sprite for external coordination (e.g. camera follow).
   */
  getSprite(): Phaser.GameObjects.Sprite {
    return this.body;
  }

  /**
   * Returns the current world X position.
   */
  getX(): number {
    return this.body.x;
  }

  /**
   * Returns the current world Y position.
   */
  getY(): number {
    return this.body.y;
  }

  /**
   * Sets the player's world position.
   * Moves all equipment layers together.
   *
   * @param x - New world X coordinate.
   * @param y - New world Y coordinate.
   */
  setPosition(x: number, y: number): void {
    this.body.setPosition(x, y);
    this.helmet.setPosition(x, y);
  }
}
