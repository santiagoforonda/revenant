import Phaser from "phaser";
import { PlayerClass, CLASS_SPRITE_REGISTRY } from "@/game/config/ClassSpriteRegistry";
import type { ClassSpriteConfig } from "@/game/config/ClassSpriteRegistry";
import { DefaultSpriteComposer } from "@/game/services/SpriteComposer";
import type { ComposedSprites, PlayerState, PlayerDirection } from "@/game/services/SpriteComposer";
import { assetLoaderService } from "@/game/services/AssetLoaderService";
import { eventBus } from "@/game/events";

/** Constant movement speed in pixels per second (used by MainScene input handler) */
export const PLAYER_SPEED = 120;

export class Player {
  private readonly scene: Phaser.Scene;
  private readonly spriteComposer: DefaultSpriteComposer;
  private currentClass: PlayerClass;
  private config: ClassSpriteConfig;
  private sprites: ComposedSprites;
  private state: PlayerState = "idle";
  private direction: PlayerDirection = "down";
  private currentAnimKey: string = "";

  /**
   * Creates the Player entity with all visual layers assembled by SpriteComposer.
   *
   * @param scene - The Phaser scene this player belongs to.
   * @param x - Initial world X coordinate.
   * @param y - Initial world Y coordinate.
   * @param config - The class sprite configuration resolved from the registry.
   */
  constructor(scene: Phaser.Scene, x: number, y: number, config: ClassSpriteConfig) {
    this.scene = scene;
    this.config = config;
    this.currentClass = config.classId;
    this.spriteComposer = new DefaultSpriteComposer();

    // Compose all sprite layers via SpriteComposer
    this.sprites = this.spriteComposer.compose(scene, x, y, config);

    // Play initial idle-down animation
    this.spriteComposer.playAnimation(this.sprites, this.config, this.state, this.direction);
    this.currentAnimKey = `${this.config.classId}-body-idle-${this.direction}`;
  }

  /**
   * Applies movement velocity to the player.
   * Updates state to walking and determines facing direction.
   *
   * @param velocityX - Horizontal velocity in pixels/sec.
   * @param velocityY - Vertical velocity in pixels/sec.
   */
  move(velocityX: number, velocityY: number): void {
    this.sprites.body.setVelocity(velocityX, velocityY);
    this.state = "walking";

    // Determine facing direction based on velocity
    if (Math.abs(velocityX) >= Math.abs(velocityY)) {
      this.direction = velocityX > 0 ? "right" : "left";
    } else {
      this.direction = velocityY > 0 ? "down" : "up";
    }
  }

  /**
   * Stops all player movement immediately.
   * Sets velocity to zero and transitions to idle state.
   */
  stop(): void {
    this.sprites.body.setVelocity(0, 0);
    this.state = "idle";
  }

  /**
   * Called every frame. Synchronizes equipment layer positions and updates animations.
   */
  update(): void {
    this.spriteComposer.syncPositions(this.sprites, this.direction, this.config);
    this.updateAnimation();
  }

  /**
   * Selects and plays the correct animation based on current state and direction.
   * Prevents restarting an animation that is already playing.
   */
  private updateAnimation(): void {
    const prefix = this.state === "walking" ? "walk" : "idle";
    const animKey = `${this.config.classId}-body-${prefix}-${this.direction}`;

    if (animKey !== this.currentAnimKey) {
      this.spriteComposer.playAnimation(this.sprites, this.config, this.state, this.direction);
      this.currentAnimKey = animKey;
    }
  }

  /**
   * Returns the physics-enabled body sprite.
   */
  getBody(): Phaser.Physics.Arcade.Sprite {
    return this.sprites.body;
  }

  /**
   * Returns the helmet layer sprite, or null if the class has no helmet.
   */
  getHelmet(): Phaser.GameObjects.Sprite | null {
    return this.sprites.helmet;
  }

  /**
   * Returns the underlying body sprite for external coordination (e.g. camera follow).
   */
  getSprite(): Phaser.Physics.Arcade.Sprite {
    return this.sprites.body;
  }

  /**
   * Returns the current world X position.
   */
  getX(): number {
    return this.sprites.body.x;
  }

  /**
   * Returns the current world Y position.
   */
  getY(): number {
    return this.sprites.body.y;
  }

  /**
   * Returns the current player state.
   */
  getState(): PlayerState {
    return this.state;
  }

  /**
   * Returns the current facing direction.
   */
  getDirection(): PlayerDirection {
    return this.direction;
  }

  /**
   * Returns the currently active player class.
   */
  getPlayerClass(): PlayerClass {
    return this.currentClass;
  }

  /**
   * Changes the player's visual class at runtime.
   *
   * - If newClass is the same as currentClass, returns immediately (no-op).
   * - If newClass is not a valid PlayerClass, emits CLASS_CHANGE_FAILED with reason "invalid_class".
   * - If assets for newClass are not loaded, emits CLASS_CHANGE_FAILED with reason "missing_assets".
   * - On success: destroys current sprites, composes new layers, registers animations,
   *   plays idle animation in current direction, emits CLASS_CHANGE_SUCCESS.
   * - Preserves world position (x, y) and facing direction throughout.
   */
  changeClass(newClass: PlayerClass): void {
    // 1. Same class = no-op
    if (newClass === this.currentClass) return;

    // 2. Validate class exists in registry
    const validClasses = Object.values(PlayerClass) as string[];
    if (!validClasses.includes(newClass)) {
      eventBus.emit("CLASS_CHANGE_FAILED", { reason: "invalid_class", requestedClass: newClass });
      return;
    }

    // 3. Check assets loaded
    if (!assetLoaderService.areAssetsLoaded(this.scene, newClass)) {
      eventBus.emit("CLASS_CHANGE_FAILED", { reason: "missing_assets", requestedClass: newClass });
      return;
    }

    // 4. Success path
    const previousClass = this.currentClass;
    const newConfig = CLASS_SPRITE_REGISTRY[newClass];

    // Preserve position and direction
    const x = this.sprites.body.x;
    const y = this.sprites.body.y;

    // Destroy old equipment layers (non-body sprites)
    this.spriteComposer.destroyEquipmentLayers(this.sprites);

    // Destroy old body sprite manually (compose() creates a new one)
    this.sprites.body.destroy();

    // Compose new sprites (body + equipment) at preserved position
    this.sprites = this.spriteComposer.compose(this.scene, x, y, newConfig);

    // Register animations for new class (idempotent — skips if already registered)
    this.spriteComposer.registerAnimations(this.scene, newConfig);

    // Update internal state
    this.config = newConfig;
    this.currentClass = newClass;

    // Play idle animation in current direction
    this.state = "idle";
    this.spriteComposer.playAnimation(this.sprites, this.config, this.state, this.direction);
    this.currentAnimKey = `${this.config.classId}-body-idle-${this.direction}`;

    // Emit success event
    eventBus.emit("CLASS_CHANGE_SUCCESS", { previousClass, newClass });
  }

  /**
   * Sets the player's world position.
   * Moves the body and then synchronizes all equipment layers.
   *
   * @param x - New world X coordinate.
   * @param y - New world Y coordinate.
   */
  setPosition(x: number, y: number): void {
    this.sprites.body.setPosition(x, y);
    this.spriteComposer.syncPositions(this.sprites, this.direction, this.config);
  }
}
