import Phaser from "phaser";
import { SHARED_BODY_KEY } from "@/game/config/ClassSpriteRegistry";
import type { ClassSpriteConfig, EquipmentLayer } from "@/game/config/ClassSpriteRegistry";

/** Possible player states */
export type PlayerState = "idle" | "walking";

/** Possible facing directions */
export type PlayerDirection = "up" | "down" | "left" | "right";

/** Animation frame rate for walking */
const WALK_FRAME_RATE = 8;

/** Idle animation frame rate */
const IDLE_FRAME_RATE = 1;

/** Attack animation frame rate */
const ATTACK_FRAME_RATE = 10;

/** Number of columns per row in the body_attack spritesheet (default: 6-col classes) */
const ATTACK_COLS_PER_ROW = 6;

/** Number of columns per row for mago's attack spritesheets (8 cols) */
const MAGO_ATTACK_COLS_PER_ROW = 8;

/** All four directions for iteration */
const DIRECTIONS: PlayerDirection[] = ["up", "down", "left", "right"];

/**
 * Frame ranges for body attack spritesheet.
 * Row 0 = North/Up, Row 1 = Left, Row 2 = South/Down, Row 3 = Right
 * 6 frames per direction. Used by gladiador, knight, espadachin.
 */
const ATTACK_DIRECTION_FRAMES: Record<PlayerDirection, { start: number; end: number }> = {
  up:    { start: 0 * ATTACK_COLS_PER_ROW, end: 0 * ATTACK_COLS_PER_ROW + 5 },
  left:  { start: 1 * ATTACK_COLS_PER_ROW, end: 1 * ATTACK_COLS_PER_ROW + 5 },
  down:  { start: 2 * ATTACK_COLS_PER_ROW, end: 2 * ATTACK_COLS_PER_ROW + 5 },
  right: { start: 3 * ATTACK_COLS_PER_ROW, end: 3 * ATTACK_COLS_PER_ROW + 5 },
};

/**
 * Frame ranges for mago's attack spritesheets (8 cols × 4 rows).
 * Row 0 = North/Up, Row 1 = Left, Row 2 = South/Down, Row 3 = Right
 * 8 frames per direction.
 */
const MAGO_ATTACK_DIRECTION_FRAMES: Record<PlayerDirection, { start: number; end: number }> = {
  up:    { start: 0 * MAGO_ATTACK_COLS_PER_ROW, end: 0 * MAGO_ATTACK_COLS_PER_ROW + 7 },
  left:  { start: 1 * MAGO_ATTACK_COLS_PER_ROW, end: 1 * MAGO_ATTACK_COLS_PER_ROW + 7 },
  down:  { start: 2 * MAGO_ATTACK_COLS_PER_ROW, end: 2 * MAGO_ATTACK_COLS_PER_ROW + 7 },
  right: { start: 3 * MAGO_ATTACK_COLS_PER_ROW, end: 3 * MAGO_ATTACK_COLS_PER_ROW + 7 },
};

/** Frame ranges for body, legs, torso (9 cols × 4 rows = 576x256, 64x64 frames) */
const BODY_DIRECTION_FRAMES: Record<PlayerDirection, { start: number; end: number; idle: number }> = {
  up:    { start: 0, end: 8, idle: 0 },
  left:  { start: 9, end: 17, idle: 9 },
  down:  { start: 18, end: 26, idle: 18 },
  right: { start: 27, end: 35, idle: 27 },
};

/** Frame ranges for feet layer (8 cols × 4 rows = 512x256, 64x64 frames) */
const FEET_DIRECTION_FRAMES: Record<PlayerDirection, { start: number; end: number; idle: number }> = {
  up:    { start: 0, end: 7, idle: 0 },
  left:  { start: 8, end: 15, idle: 8 },
  down:  { start: 16, end: 23, idle: 16 },
  right: { start: 24, end: 31, idle: 24 },
};

/** Frame ranges for weapon layer (6 cols × 4 rows = 384x256, 64x64 frames) */
const WEAPON_DIRECTION_FRAMES: Record<PlayerDirection, { start: number; end: number; idle: number }> = {
  up:    { start: 0, end: 5, idle: 0 },
  left:  { start: 6, end: 11, idle: 6 },
  down:  { start: 12, end: 17, idle: 12 },
  right: { start: 18, end: 23, idle: 18 },
};

/** Frame ranges for shield layer (8 cols × 4 rows = 512x256, 64x64 frames) */
const SHIELD_DIRECTION_FRAMES: Record<PlayerDirection, { start: number; end: number; idle: number }> = {
  up:    { start: 0, end: 7, idle: 0 },
  left:  { start: 8, end: 15, idle: 8 },
  down:  { start: 16, end: 23, idle: 16 },
  right: { start: 24, end: 31, idle: 24 },
};

/** Frame ranges for large spritesheets (13 cols × 4+ rows = 832x, 64x64 frames) */
const LARGE_DIRECTION_FRAMES: Record<PlayerDirection, { start: number; end: number; idle: number }> = {
  up:    { start: 0, end: 12, idle: 0 },
  left:  { start: 13, end: 25, idle: 13 },
  down:  { start: 26, end: 38, idle: 26 },
  right: { start: 39, end: 51, idle: 39 },
};

/** Frame ranges for espadachin torso and helmet — rows 8-11 of 13-col spritesheet, 9 frames each */
const ESPADACHIN_ROWS_8_11: Record<PlayerDirection, { start: number; end: number; idle: number }> = {
  up:    { start: 104, end: 112, idle: 104 },  // row 8: 8*13=104
  left:  { start: 117, end: 125, idle: 117 },  // row 9: 9*13=117
  down:  { start: 130, end: 138, idle: 130 },  // row 10: 10*13=130
  right: { start: 143, end: 151, idle: 143 },  // row 11: 11*13=143
};

/** The assembled sprite layers for a player entity */
export interface ComposedSprites {
  body: Phaser.Physics.Arcade.Sprite;
  feet: Phaser.GameObjects.Sprite | null;
  legs: Phaser.GameObjects.Sprite | null;
  torso: Phaser.GameObjects.Sprite | null;
  weapon: Phaser.GameObjects.Sprite | null;
  shield: Phaser.GameObjects.Sprite | null;
  helmet: Phaser.GameObjects.Sprite | null;
}

/** Depth constants for each layer */
const LAYER_DEPTHS = {
  body: 0,
  feet: 1,
  legs: 2,
  torso: 3,
  weapon: 4,
  shield: 4,
  helmet: 5,
} as const;

/** Direction-to-helmet suffix mapping for directional helmets */
const DIRECTION_HELMET_SUFFIX: Record<PlayerDirection, string> = {
  up: "n",
  down: "s",
  left: "w",
  right: "e",
};

/** Contract for assembling, synchronizing, and destroying layered sprites */
export interface SpriteComposer {
  /** Creates all sprite layers for the given class at position (x, y) */
  compose(scene: Phaser.Scene, x: number, y: number, config: ClassSpriteConfig): ComposedSprites;

  /** Destroys all equipment layers (not body) */
  destroyEquipmentLayers(sprites: ComposedSprites): void;

  /** Registers animations for a specific class (implemented in Task 2.3) */
  registerAnimations(scene: Phaser.Scene, config: ClassSpriteConfig): void;

  /** Updates all layer positions relative to body */
  syncPositions(sprites: ComposedSprites, direction: PlayerDirection, config: ClassSpriteConfig): void;

  /** Plays the correct animation on all layers */
  playAnimation(
    sprites: ComposedSprites,
    config: ClassSpriteConfig,
    state: PlayerState,
    direction: PlayerDirection
  ): void;
}

/** Default implementation of the SpriteComposer interface */
export class DefaultSpriteComposer implements SpriteComposer {
  /**
   * Creates all sprite layers for the given class config at the specified position.
   * Null layers in the config result in null entries in ComposedSprites — no sprite is created.
   */
  compose(scene: Phaser.Scene, x: number, y: number, config: ClassSpriteConfig): ComposedSprites {
    // Body layer — physics-enabled, shared across all classes
    const body = scene.physics.add.sprite(x, y, SHARED_BODY_KEY, 18);
    body.setDepth(LAYER_DEPTHS.body);

    // Equipment layers — create only if the config has a non-null key
    const feet = this.createEquipmentSprite(scene, x, y, config.layers.feet, LAYER_DEPTHS.feet);
    const legs = this.createEquipmentSprite(scene, x, y, config.layers.legs, LAYER_DEPTHS.legs);
    const torso = this.createEquipmentSprite(scene, x, y, config.layers.torso, LAYER_DEPTHS.torso);
    const weapon = this.createEquipmentSprite(scene, x, y, config.layers.weapon, LAYER_DEPTHS.weapon);
    const shield = this.createEquipmentSprite(scene, x, y, config.layers.shield, LAYER_DEPTHS.shield);

    // Helmet — special handling based on helmetType
    const helmet = this.createHelmetSprite(scene, x, y, config);

    return { body, feet, legs, torso, weapon, shield, helmet };
  }

  /**
   * Destroys all equipment layers (everything except body).
   * Null layers are skipped gracefully.
   */
  destroyEquipmentLayers(sprites: ComposedSprites): void {
    if (sprites.feet) {
      sprites.feet.destroy();
      sprites.feet = null;
    }
    if (sprites.legs) {
      sprites.legs.destroy();
      sprites.legs = null;
    }
    if (sprites.torso) {
      sprites.torso.destroy();
      sprites.torso = null;
    }
    if (sprites.weapon) {
      sprites.weapon.destroy();
      sprites.weapon = null;
    }
    if (sprites.shield) {
      sprites.shield.destroy();
      sprites.shield = null;
    }
    if (sprites.helmet) {
      sprites.helmet.destroy();
      sprites.helmet = null;
    }
  }

  /**
   * Registers walk and idle animations for all non-null layers of the given class.
   * Also registers the shared body animations using the SHARED_BODY_KEY.
   *
   * Animation key pattern: `{classId}-{layer}-{state}-{direction}`
   * Walk: frameRate=8, repeat=-1 (infinite loop)
   * Idle: frameRate=1, repeat=0 (single frame, no loop)
   *
   * Idempotent — skips registration if the animation key already exists.
   * Directional helmets do NOT get animation registration (texture swap only).
   * Spritesheet helmets use the same frame layout as body/feet/legs/torso.
   */
  registerAnimations(scene: Phaser.Scene, config: ClassSpriteConfig): void {
    const anims = scene.anims;
    const classId = config.classId;

    // Register shared body animations
    this.registerLayerAnimations(anims, classId, "body", SHARED_BODY_KEY, BODY_DIRECTION_FRAMES);

    // Register animations for each non-null equipment layer
    const layerNames: EquipmentLayer[] = ["feet", "legs", "torso", "weapon", "shield", "helmet"];

    for (const layer of layerNames) {
      const assetKey = config.layers[layer];
      if (assetKey === null) {
        continue;
      }

      // Directional helmets use texture swap only — no animation registration needed
      if (layer === "helmet" && config.helmetType === "directional") {
        continue;
      }

      const frameData = this.getFrameDataForLayer(layer, classId);
      this.registerLayerAnimations(anims, classId, layer, assetKey, frameData);
    }

    // Select the correct attack frame layout based on class
    // Mago uses 8 cols × 4 rows, all other classes use 6 cols × 4 rows
    const attackFrameData = classId === "mago" ? MAGO_ATTACK_DIRECTION_FRAMES : ATTACK_DIRECTION_FRAMES;

    // Register body attack animations using the attack spritesheet
    const bodyAttackTextureKey = `${classId}-body-attack`;
    if (scene.textures.exists(bodyAttackTextureKey)) {
      for (const direction of DIRECTIONS) {
        const attackKey = `${classId}-body-attack-${direction}`;
        if (!anims.exists(attackKey)) {
          const frames = attackFrameData[direction];
          anims.create({
            key: attackKey,
            frames: anims.generateFrameNumbers(bodyAttackTextureKey, {
              start: frames.start,
              end: frames.end,
            }),
            frameRate: ATTACK_FRAME_RATE,
            repeat: 0,
          });
        }
      }
    }

    // Register weapon attack animations if the weapon attack spritesheet is loaded
    // (e.g., gladiador Slash.png uses same row layout as body attack)
    const weaponAttackKey = `${classId}-weapon-attack`;
    if (scene.textures.exists(weaponAttackKey)) {
      for (const direction of DIRECTIONS) {
        const animKey = `${classId}-weapon-attack-${direction}`;
        if (!anims.exists(animKey)) {
          const frames = attackFrameData[direction];
          anims.create({
            key: animKey,
            frames: anims.generateFrameNumbers(weaponAttackKey, {
              start: frames.start,
              end: frames.end,
            }),
            frameRate: ATTACK_FRAME_RATE,
            repeat: 0,
          });
        }
      }
    }

    // Register attack animations for feet, legs, torso, helmet layers if spritesheets are loaded
    const attackLayers = ["feet", "legs", "torso", "helmet"] as const;
    for (const layer of attackLayers) {
      const layerAttackTextureKey = `${classId}-${layer}-attack`;
      if (scene.textures.exists(layerAttackTextureKey)) {
        for (const direction of DIRECTIONS) {
          const animKey = `${classId}-${layer}-attack-${direction}`;
          if (!anims.exists(animKey)) {
            const frames = attackFrameData[direction];
            anims.create({
              key: animKey,
              frames: anims.generateFrameNumbers(layerAttackTextureKey, {
                start: frames.start,
                end: frames.end,
              }),
              frameRate: ATTACK_FRAME_RATE,
              repeat: 0,
            });
          }
        }
      }
    }

    // Espadachin: legs and torso attack frames are in rows 12-15 of the same spritesheet (13 cols)
    // Row 12 = up, Row 13 = left, Row 14 = down, Row 15 = right (9 frames each)
    if (classId === "espadachin") {
      const espadachinAttackRows: Record<PlayerDirection, { start: number; end: number }> = {
        up:    { start: 12 * 13, end: 12 * 13 + 8 },
        left:  { start: 13 * 13, end: 13 * 13 + 8 },
        down:  { start: 14 * 13, end: 14 * 13 + 8 },
        right: { start: 15 * 13, end: 15 * 13 + 8 },
      };

      // Register legs attack using existing espadachin-legs texture
      if (scene.textures.exists(`${classId}-legs`)) {
        for (const direction of DIRECTIONS) {
          const animKey = `${classId}-legs-attack-${direction}`;
          if (!anims.exists(animKey)) {
            const frames = espadachinAttackRows[direction];
            anims.create({
              key: animKey,
              frames: anims.generateFrameNumbers(`${classId}-legs`, {
                start: frames.start,
                end: frames.end,
              }),
              frameRate: ATTACK_FRAME_RATE,
              repeat: 0,
            });
          }
        }
      }

      // Register torso attack using existing espadachin-torso texture
      if (scene.textures.exists(`${classId}-torso`)) {
        for (const direction of DIRECTIONS) {
          const animKey = `${classId}-torso-attack-${direction}`;
          if (!anims.exists(animKey)) {
            const frames = espadachinAttackRows[direction];
            anims.create({
              key: animKey,
              frames: anims.generateFrameNumbers(`${classId}-torso`, {
                start: frames.start,
                end: frames.end,
              }),
              frameRate: ATTACK_FRAME_RATE,
              repeat: 0,
            });
          }
        }
      }

      // Register helmet attack using existing espadachin-helmet texture (hair.png, rows 12-15)
      if (scene.textures.exists(`${classId}-helmet`)) {
        for (const direction of DIRECTIONS) {
          const animKey = `${classId}-helmet-attack-${direction}`;
          if (!anims.exists(animKey)) {
            const frames = espadachinAttackRows[direction];
            anims.create({
              key: animKey,
              frames: anims.generateFrameNumbers(`${classId}-helmet`, {
                start: frames.start,
                end: frames.end,
              }),
              frameRate: ATTACK_FRAME_RATE,
              repeat: 0,
            });
          }
        }
      }
    }
  }

  /**
   * Registers walk and idle animations for a single layer across all 4 directions.
   */
  private registerLayerAnimations(
    anims: Phaser.Animations.AnimationManager,
    classId: string,
    layer: string,
    assetKey: string,
    frameData: Record<PlayerDirection, { start: number; end: number; idle: number }>
  ): void {
    for (const direction of DIRECTIONS) {
      const frames = frameData[direction];

      // Walk animation
      const walkKey = `${classId}-${layer}-walk-${direction}`;
      if (!anims.exists(walkKey)) {
        anims.create({
          key: walkKey,
          frames: anims.generateFrameNumbers(assetKey, {
            start: frames.start,
            end: frames.end,
          }),
          frameRate: WALK_FRAME_RATE,
          repeat: -1,
        });
      }

      // Idle animation (single frame)
      const idleKey = `${classId}-${layer}-idle-${direction}`;
      if (!anims.exists(idleKey)) {
        anims.create({
          key: idleKey,
          frames: [{ key: assetKey, frame: frames.idle }],
          frameRate: IDLE_FRAME_RATE,
          repeat: 0,
        });
      }
    }
  }

  /**
   * Returns the appropriate frame data map for a given layer type.
   * Returns the appropriate frame data map for a given layer type.
   * - weapon → WEAPON_DIRECTION_FRAMES (6 cols × 4 rows) by default
   * - shield → SHIELD_DIRECTION_FRAMES (8 cols × 4 rows)
   * - feet → FEET_DIRECTION_FRAMES (8 cols) for most classes, BODY_DIRECTION_FRAMES (9 cols) for knight
   * - body → BODY_DIRECTION_FRAMES (9 cols × 4 rows)
   * - legs, torso, helmet → depends on class (9 cols or 13 cols)
   *
   * Classes with 13-col spritesheets:
   * - espadachin: legs, torso, helmet
   * - mago: weapon
   * - arquero: weapon
   * - gladiador: weapon (9 cols)
   */
  private getFrameDataForLayer(
    layer: EquipmentLayer,
    classId?: string
  ): Record<PlayerDirection, { start: number; end: number; idle: number }> {
    switch (layer) {
      case "weapon":
        // Mago and arquero weapons are 13 cols, gladiador is 9 cols, knight/espadachin are 6 cols
        if (classId === "mago" || classId === "arquero") {
          return LARGE_DIRECTION_FRAMES;
        }
        if (classId === "gladiador") {
          return BODY_DIRECTION_FRAMES;
        }
        return WEAPON_DIRECTION_FRAMES;
      case "shield":
        return SHIELD_DIRECTION_FRAMES;
      case "feet":
        return BODY_DIRECTION_FRAMES;
      case "legs":
      case "torso":
      case "helmet":
        // Espadachin legs, torso and helmet all use rows 8-11
        if (classId === "espadachin") {
          return ESPADACHIN_ROWS_8_11;
        }
        return BODY_DIRECTION_FRAMES;
      default:
        return BODY_DIRECTION_FRAMES;
    }
  }

  /**
   * Updates all equipment layer positions relative to the body sprite.
   * Applies directional offsets for helmet, weapon, and shield.
   * Adjusts weapon/shield depth based on facing direction.
   */
  syncPositions(sprites: ComposedSprites, direction: PlayerDirection, config: ClassSpriteConfig): void {
    const { body } = sprites;
    const x = body.x;
    const y = body.y;

    // Feet, legs, torso always match body position exactly
    if (sprites.feet) {
      sprites.feet.setPosition(x, y);
    }
    if (sprites.legs) {
      sprites.legs.setPosition(x, y);
    }
    if (sprites.torso) {
      sprites.torso.setPosition(x, y);
    }

    // Weapon and shield positions vary by direction
    if (sprites.weapon) {
      // Skip visibility override if weapon is in attack animation
      const isAttacking = sprites.weapon.getData("isAttacking") === true;

      if (!isAttacking && direction === "up") {
        sprites.weapon.setVisible(false);
      } else {
        sprites.weapon.setVisible(true);
        if (direction === "down") {
          // During attack animation facing south, offset weapon to the right.
          // Mago's weapon attack frames are larger (192x192), so it needs a bigger offset.
          const offsetX = isAttacking ? -2 : -21;
          sprites.weapon.setPosition(x + offsetX, y);
        } else {
          sprites.weapon.setPosition(x, y);
        }
      }
    }

    if (sprites.shield) {
      if (direction === "down") {
        sprites.shield.setPosition(x + 8, y);
      } else if (direction === "up") {
        sprites.shield.setPosition(x, y);
      } else {
        sprites.shield.setPosition(x, y);
      }
    }

    // Helmet positioned on the body, with directional offset
    if (sprites.helmet) {
      if (config.helmetType === "directional") {
        // Directional helmets (128x128) need offset to center on head
        sprites.helmet.setPosition(x - 5, y - 16);
      } else {
        // Spritesheet helmets (64x64) align with body
        sprites.helmet.setPosition(x, y);
      }
    }

    // Depth adjustments for weapon/shield based on direction
    this.adjustWeaponShieldDepth(sprites, direction);
  }

  /**
   * Plays the correct animation on all non-null layers using the
   * `{classId}-{layer}-{state}-{direction}` key pattern.
   * For directional helmets, swaps texture instead of playing an animation.
   */
  playAnimation(
    sprites: ComposedSprites,
    config: ClassSpriteConfig,
    state: PlayerState,
    direction: PlayerDirection
  ): void {
    const classId = config.classId;
    const stateKey = state === "walking" ? "walk" : "idle";

    // Body always plays animation
    const bodyKey = `${classId}-body-${stateKey}-${direction}`;
    sprites.body.play(bodyKey);

    // Equipment layers
    if (sprites.feet) {
      if (sprites.feet.getData("isAttacking") !== true) {
        sprites.feet.play(`${classId}-feet-${stateKey}-${direction}`);
      }
    }
    if (sprites.legs) {
      if (sprites.legs.getData("isAttacking") !== true) {
        sprites.legs.play(`${classId}-legs-${stateKey}-${direction}`);
      }
    }
    if (sprites.torso) {
      if (sprites.torso.getData("isAttacking") !== true) {
        sprites.torso.play(`${classId}-torso-${stateKey}-${direction}`);
      }
    }
    if (sprites.weapon) {
      // Skip frame override if weapon is currently in attack animation
      const isAttacking = sprites.weapon.getData("isAttacking") === true;
      if (!isAttacking) {
        // Static weapon — only change frame based on direction, no animation
        const weaponFrameData = this.getFrameDataForLayer("weapon", classId);
        sprites.weapon.setFrame(weaponFrameData[direction].idle);
      }
    }
    if (sprites.shield) {
      sprites.shield.play(`${classId}-shield-${stateKey}-${direction}`);
    }

    // Helmet — depends on helmetType
    if (sprites.helmet) {
      if (sprites.helmet.getData("isAttacking") !== true) {
        if (config.helmetType === "directional") {
          // Directional helmet: swap texture per direction
          const suffix = DIRECTION_HELMET_SUFFIX[direction];
          sprites.helmet.setTexture(`${classId}-helmet-${suffix}`);
        } else {
          // Spritesheet helmet: play animation like other layers
          sprites.helmet.play(`${classId}-helmet-${stateKey}-${direction}`);
        }
      }
    }
  }

  /**
   * Creates an equipment sprite if the asset key is non-null.
   * Returns null if the layer should be skipped.
   */
  private createEquipmentSprite(
    scene: Phaser.Scene,
    x: number,
    y: number,
    assetKey: string | null,
    depth: number
  ): Phaser.GameObjects.Sprite | null {
    if (assetKey === null) {
      return null;
    }

    const sprite = scene.add.sprite(x, y, assetKey);
    sprite.setDepth(depth);
    return sprite;
  }

  /**
   * Creates the helmet sprite based on the config's helmetType.
   * - directional: uses `{classId}-helmet-s` as the initial (facing down) texture
   * - spritesheet: uses the helmet asset key directly
   * Returns null if the helmet layer is null in the config.
   */
  private createHelmetSprite(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: ClassSpriteConfig
  ): Phaser.GameObjects.Sprite | null {
    const helmetKey = config.layers.helmet;
    if (helmetKey === null) {
      return null;
    }

    let textureKey: string;
    let initialFrame: number | undefined;
    if (config.helmetType === "directional") {
      // Start facing down → south texture
      textureKey = `${config.classId}-helmet-s`;
    } else {
      textureKey = helmetKey;
      // Initial frame handled by playAnimation after compose
    }

    // Directional helmets (128x128) need offset, spritesheet helmets (64x64) align with body
    const offsetX = config.helmetType === "directional" ? -5 : 0;
    const offsetY = config.helmetType === "directional" ? -16 : 0;
    const helmet = scene.add.sprite(x + offsetX, y + offsetY, textureKey, initialFrame);
    helmet.setDepth(LAYER_DEPTHS.helmet);
    return helmet;
  }

  /**
   * Adjusts weapon and shield depth based on facing direction.
   * Down: weapon behind torso (3), shield in front of helmet (5)
   * Up: weapon in front (5), shield behind torso (3)
   * Left/Right: both at default depth (4)
   */
  private adjustWeaponShieldDepth(sprites: ComposedSprites, direction: PlayerDirection): void {
    if (direction === "down") {
      if (sprites.weapon) sprites.weapon.setDepth(3);
      if (sprites.shield) sprites.shield.setDepth(5);
    } else if (direction === "up") {
      if (sprites.weapon) sprites.weapon.setDepth(5);
      if (sprites.shield) sprites.shield.setDepth(3);
    } else {
      if (sprites.weapon) sprites.weapon.setDepth(4);
      if (sprites.shield) sprites.shield.setDepth(4);
    }
  }
}
