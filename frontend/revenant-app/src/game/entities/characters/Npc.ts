import Phaser from "phaser";
import type { NpcDto } from "../../interfaces/NpcResponse";

/**
 * NPC entity — represents a non-player character in the game world.
 *
 * Each Npc instance stores:
 * - Backend metadata (id, name, description, phrases).
 * - A Phaser sprite for rendering (non-physics, since NPCs are static).
 * - Spawn position from the Tiled map.
 *
 * NPCs are static entities. They do not move, have no physics body,
 * and remain idle until an interaction system is implemented.
 */
export class Npc {
  private readonly scene: Phaser.Scene;
  private readonly sprite: Phaser.GameObjects.Sprite;
  private readonly data: NpcDto;
  private currentPhraseIndex: number = 0;
  private readonly interactionRadius: number | null;

  /**
   * Creates an NPC entity.
   *
   * @param scene - The Phaser scene this NPC belongs to.
   * @param x - World X coordinate (from Tiled spawn point).
   * @param y - World Y coordinate (from Tiled spawn point).
   * @param npcData - Backend NPC data.
   * @param spriteKey - The texture key to use for rendering.
   * @param scale - Sprite scale factor.
   * @param interactionRadius - Custom interaction radius in pixels (overrides the default).
   */
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    npcData: NpcDto,
    spriteKey: string,
    scale: number = 1,
    interactionRadius: number | null = null
  ) {
    this.scene = scene;
    this.data = npcData;
    this.interactionRadius = interactionRadius;

    // Warn if the texture is not loaded — Phaser will use a placeholder
    if (!this.scene.textures.exists(spriteKey)) {
      console.warn(
        `[Npc] Texture '${spriteKey}' not found for NPC id=${npcData.id} ("${npcData.name}"). Phaser will use a placeholder texture.`
      );
    }

    this.sprite = this.scene.add.sprite(x, y, spriteKey);
    this.sprite.setDepth(2);
    this.sprite.setScale(scale);

    this.playIdleAnimation(spriteKey);
  }

  /**
   * Plays the idle animation for this NPC if it exists.
   * Falls back to the first frame of the sprite if no animation is available.
   *
   * @param spriteKey - The texture key used to derive the animation key.
   */
  private playIdleAnimation(spriteKey: string): void {
    const idleAnimKey = `${spriteKey}_idle`;

    if (this.scene.anims.exists(idleAnimKey)) {
      this.sprite.play(idleAnimKey);
    }
  }

  /**
   * Returns the NPC's unique identifier.
   */
  getId(): number {
    return this.data.id;
  }

  /**
   * Returns the NPC's display name.
   */
  getName(): string {
    return this.data.name;
  }

  /**
   * Returns the NPC's description.
   */
  getDescription(): string {
    return this.data.description;
  }

  /**
   * Returns the NPC's dialogue phrases.
   */
  getPhrases(): string[] {
    return this.data.phrases;
  }

  /**
   * Returns the NPC's Phaser sprite.
   */
  getSprite(): Phaser.GameObjects.Sprite {
    return this.sprite;
  }

  /**
   * Returns the NPC's world X position.
   */
  getX(): number {
    return this.sprite.x;
  }

  /**
   * Returns the NPC's world Y position.
   */
  getY(): number {
    return this.sprite.y;
  }

  /**
   * Returns the NPC's custom interaction radius, or null if using the default.
   */
  getInteractionRadius(): number | null {
    return this.interactionRadius;
  }

  /**
   * Returns the current phrase and advances the dialogue index.
   * Cycles back to 0 after the last phrase.
   * Returns null if no phrases exist.
   *
   * If the dialogue index is invalid (negative, out of bounds, or NaN),
   * it is reset to 0 and a warning is logged. This ensures the NPC
   * remains in a valid state after corruption.
   */
  getNextPhrase(): string | null {
    const phrases = this.data.phrases;

    if (phrases.length === 0) {
      return null;
    }

    // Validate dialogue index — reset if corrupted
    if (
      this.currentPhraseIndex < 0 ||
      this.currentPhraseIndex >= phrases.length ||
      !Number.isFinite(this.currentPhraseIndex)
    ) {
      console.warn(
        `[Npc] Invalid dialogue index ${this.currentPhraseIndex} for NPC id=${this.data.id} ("${this.data.name}"). Resetting to 0.`
      );
      this.currentPhraseIndex = 0;
    }

    const phrase = phrases[this.currentPhraseIndex];
    this.currentPhraseIndex = (this.currentPhraseIndex + 1) % phrases.length;

    return phrase;
  }

  /**
   * Triggers an interaction with this NPC.
   * Returns the next dialogue phrase or null if no dialogue exists.
   */
  interact(): string | null {
    return this.getNextPhrase();
  }

  /**
   * Returns the current dialogue phrase index (for testing purposes).
   */
  getCurrentPhraseIndex(): number {
    return this.currentPhraseIndex;
  }
}
