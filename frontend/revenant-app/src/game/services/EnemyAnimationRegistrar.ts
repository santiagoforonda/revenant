import Phaser from "phaser";
import { EnemyType, ENEMY_SPRITE_REGISTRY } from "@/game/config/EnemySpriteRegistry";
import type { EnemySpriteConfig } from "@/game/config/EnemySpriteRegistry";
import { assetLoaderService } from "@/game/services/AssetLoaderService";

/**
 * Supported enemy animation states.
 */
export type EnemyAnimationState = "idle" | "walking" | "attacking";

/**
 * Supported facing directions for enemies.
 */
export type EnemyDirection = "up" | "down" | "left" | "right";

/** All four directions for iteration */
const DIRECTIONS: EnemyDirection[] = ["up", "down", "left", "right"];

/** Walking animation frame rate */
const WALK_FRAME_RATE = 8;

/** Idle animation frame rate */
const IDLE_FRAME_RATE = 1;

/** Death animation frame rate */
const DEATH_FRAME_RATE = 8;

/**
 * Frame ranges for the Skeleton spritesheet.
 *
 * The Skeleton spritesheet (832×1344 at 64×64 frames) has 13 columns per row.
 * Walking animations follow the standard LPC layout at rows 8-11:
 *   Row 8 (walk up):    9 frames starting at frame index 104
 *   Row 9 (walk left):  9 frames starting at frame index 117
 *   Row 10 (walk down): 9 frames starting at frame index 130
 *   Row 11 (walk right): 9 frames starting at frame index 143
 *
 * Idle frames use the first frame of each walk direction row.
 */
const SKELETON_COLS_PER_ROW = 13;

const SKELETON_DIRECTION_FRAMES: Record<EnemyDirection, { start: number; end: number; idle: number }> = {
  up:    { start: 8 * SKELETON_COLS_PER_ROW, end: 8 * SKELETON_COLS_PER_ROW + 8, idle: 8 * SKELETON_COLS_PER_ROW },
  left:  { start: 9 * SKELETON_COLS_PER_ROW, end: 9 * SKELETON_COLS_PER_ROW + 8, idle: 9 * SKELETON_COLS_PER_ROW },
  down:  { start: 10 * SKELETON_COLS_PER_ROW, end: 10 * SKELETON_COLS_PER_ROW + 8, idle: 10 * SKELETON_COLS_PER_ROW },
  right: { start: 11 * SKELETON_COLS_PER_ROW, end: 11 * SKELETON_COLS_PER_ROW + 8, idle: 11 * SKELETON_COLS_PER_ROW },
};


const SKELETON_ATTACK_FRAMES: Record<
    EnemyDirection,
    { start: number; end: number }
> = {
    up: {
        start: 12 * SKELETON_COLS_PER_ROW,
        end:   12 * SKELETON_COLS_PER_ROW + 5,
    },
    left: {
        start: 13 * SKELETON_COLS_PER_ROW,
        end:   13 * SKELETON_COLS_PER_ROW + 5,
    },
    down: {
        start: 14 * SKELETON_COLS_PER_ROW,
        end:   14 * SKELETON_COLS_PER_ROW + 5,
    },
    right: {
        start: 15 * SKELETON_COLS_PER_ROW,
        end:   15 * SKELETON_COLS_PER_ROW + 5,
    },
};

const MINOTAUR_ATTACK_FRAMES = SKELETON_ATTACK_FRAMES;
const WOLF_ATTACK_FRAMES = SKELETON_ATTACK_FRAMES;
/**
 * Death animation frames for the Skeleton.
 * Row 20 of the skeleton spritesheet (13 columns per row).
 * Frame indices: 260 to 265 (6 frames).
 */
const SKELETON_DEATH_FRAMES = {
  start: 20 * SKELETON_COLS_PER_ROW,
  end: 20 * SKELETON_COLS_PER_ROW + 5,
};

/**
 * Frame ranges for the Minotaur spritesheet.
 *
 * The Minotaur uses the same LPC layout as the Skeleton (64×64, 13 columns per row).
 * Walking animations at rows 8-11 with the same directional mapping.
 */
const MINOTAUR_COLS_PER_ROW = 13;

const MINOTAUR_DIRECTION_FRAMES: Record<EnemyDirection, { start: number; end: number; idle: number }> = {
  up:    { start: 8 * MINOTAUR_COLS_PER_ROW, end: 8 * MINOTAUR_COLS_PER_ROW + 8, idle: 8 * MINOTAUR_COLS_PER_ROW },
  left:  { start: 9 * MINOTAUR_COLS_PER_ROW, end: 9 * MINOTAUR_COLS_PER_ROW + 8, idle: 9 * MINOTAUR_COLS_PER_ROW },
  down:  { start: 10 * MINOTAUR_COLS_PER_ROW, end: 10 * MINOTAUR_COLS_PER_ROW + 8, idle: 10 * MINOTAUR_COLS_PER_ROW },
  right: { start: 11 * MINOTAUR_COLS_PER_ROW, end: 11 * MINOTAUR_COLS_PER_ROW + 8, idle: 11 * MINOTAUR_COLS_PER_ROW },
};

/**
 * Death animation frames for the Minotaur.
 * Row 20 of the minotaur spritesheet (13 columns per row).
 * Frame indices: 260 to 265 (6 frames).
 */
const MINOTAUR_DEATH_FRAMES = {
  start: 20 * MINOTAUR_COLS_PER_ROW,
  end: 20 * MINOTAUR_COLS_PER_ROW + 5,
};

/**
 * Frame ranges for the Hedgehog spritesheet.
 *
 * The Hedgehog spritesheet (640×320 at 64×64 frames) has 10 columns per row.
 * Walking animations at rows 0-3:
 *   Row 0 (walk up):    9 frames
 *   Row 1 (walk left):  9 frames
 *   Row 2 (walk down):  9 frames
 *   Row 3 (walk right): 9 frames
 */
const HEDGEHOG_COLS_PER_ROW = 10;

const HEDGEHOG_DIRECTION_FRAMES: Record<EnemyDirection, { start: number; end: number; idle: number }> = {
  up:    { start: 0 * HEDGEHOG_COLS_PER_ROW, end: 0 * HEDGEHOG_COLS_PER_ROW + 8, idle: 0 * HEDGEHOG_COLS_PER_ROW },
  left:  { start: 1 * HEDGEHOG_COLS_PER_ROW, end: 1 * HEDGEHOG_COLS_PER_ROW + 8, idle: 1 * HEDGEHOG_COLS_PER_ROW },
  down:  { start: 2 * HEDGEHOG_COLS_PER_ROW, end: 2 * HEDGEHOG_COLS_PER_ROW + 8, idle: 2 * HEDGEHOG_COLS_PER_ROW },
  right: { start: 3 * HEDGEHOG_COLS_PER_ROW, end: 3 * HEDGEHOG_COLS_PER_ROW + 8, idle: 3 * HEDGEHOG_COLS_PER_ROW },
};

/**
 * Death animation frames for the Hedgehog.
 * Row 4 of the hedgehog spritesheet (10 columns per row).
 * Frame indices: 40 to 45 (6 frames).
 */
const HEDGEHOG_DEATH_FRAMES = {
  start: 4 * HEDGEHOG_COLS_PER_ROW,
  end: 4 * HEDGEHOG_COLS_PER_ROW + 5,
};

/**
 * Frame ranges for the Wolf spritesheet.
 *
 * The Wolf uses the same LPC layout as the Skeleton/Minotaur (64×64, 13 columns per row).
 * Walking animations at rows 8-11 with the same directional mapping.
 */
const WOLF_COLS_PER_ROW = 13;

const WOLF_DIRECTION_FRAMES: Record<EnemyDirection, { start: number; end: number; idle: number }> = {
  up:    { start: 8 * WOLF_COLS_PER_ROW, end: 8 * WOLF_COLS_PER_ROW + 8, idle: 8 * WOLF_COLS_PER_ROW },
  left:  { start: 9 * WOLF_COLS_PER_ROW, end: 9 * WOLF_COLS_PER_ROW + 8, idle: 9 * WOLF_COLS_PER_ROW },
  down:  { start: 10 * WOLF_COLS_PER_ROW, end: 10 * WOLF_COLS_PER_ROW + 8, idle: 10 * WOLF_COLS_PER_ROW },
  right: { start: 11 * WOLF_COLS_PER_ROW, end: 11 * WOLF_COLS_PER_ROW + 8, idle: 11 * WOLF_COLS_PER_ROW },
};

/**
 * Death animation frames for the Wolf.
 * Row 20 of the wolf spritesheet (13 columns per row).
 * Frame indices: 260 to 265 (6 frames).
 */
const WOLF_DEATH_FRAMES = {
  start: 20 * WOLF_COLS_PER_ROW,
  end: 20 * WOLF_COLS_PER_ROW + 5,
};

/**
 * EnemyAnimationRegistrar is responsible for registering enemy animations
 * with Phaser's Animation Manager.
 *
 * Responsibilities:
 * - Register idle animations for all four directions.
 * - Register walking animations for all four directions.
 * - Prevent duplicate animation registration.
 * - Verify spritesheet availability before attempting registration.
 * - Reuse existing animation definitions whenever possible.
 *
 * Animation registration must occur only once during the application lifecycle.
 * All enemy instances of the same type reuse the same animation definitions.
 *
 * This service follows the same pattern as SpriteComposer.registerAnimations()
 * but is tailored for enemy entities which use a single spritesheet per type.
 */
export interface EnemyAnimationRegistrarInterface {
  /**
   * Registers all animations for the given enemy type.
   *
   * Checks if the spritesheet is loaded before attempting registration.
   * Prevents duplicate animation registration by checking anims.exists().
   * Returns true if registration was successful, false if skipped or failed.
   */
  registerAnimations(scene: Phaser.Scene, enemyType: EnemyType): boolean;

  /**
   * Checks if all animations for the given enemy type are already registered.
   */
  areAnimationsRegistered(scene: Phaser.Scene, enemyType: EnemyType): boolean;

  /**
   * Resolves the animation key for a given enemy type, state, and direction.
   */
  resolveAnimationKey(enemyType: EnemyType, state: EnemyAnimationState, direction: EnemyDirection): string;
}

class EnemyAnimationRegistrarImpl implements EnemyAnimationRegistrarInterface {
  /**
   * Registers all idle and walking animations for the specified enemy type.
   *
   * This method is idempotent — calling it multiple times has no effect
   * after the first successful registration.
   *
   * @param scene - The Phaser scene providing access to the Animation Manager.
   * @param enemyType - The enemy type to register animations for.
   * @returns true if animations were registered (or already existed), false on failure.
   */
  registerAnimations(scene: Phaser.Scene, enemyType: EnemyType): boolean {
    const config = ENEMY_SPRITE_REGISTRY[enemyType];
    if (!config) {
      console.warn(`[EnemyAnimationRegistrar] Unknown enemy type: "${enemyType}"`);
      return false;
    }

    // Verify the spritesheet is loaded before attempting registration
    if (!assetLoaderService.isEnemySpritesheetLoaded(scene, enemyType)) {
      console.warn(
        `[EnemyAnimationRegistrar] Spritesheet not loaded for "${enemyType}", skipping registration`
      );
      return false;
    }

    // Register animations based on enemy type
    const frameData = this.getFrameDataForEnemy(enemyType);
    if (!frameData) {
      console.warn(`[EnemyAnimationRegistrar] No frame data for "${enemyType}"`);
      return false;
    }

    this.registerDirectionalAnimations(scene.anims, config, frameData);

    // Register death animation if available for this enemy type
    this.registerDeathAnimation(scene.anims, config);

    this.registerAttackAnimation(scene.anims,config);

    return true;
  }

  /**
   * Checks if all animations for the given enemy type are already registered.
   */
  areAnimationsRegistered(scene: Phaser.Scene, enemyType: EnemyType): boolean {
    const anims = scene.anims;

    for (const direction of DIRECTIONS) {
      const walkKey = this.resolveAnimationKey(enemyType, "walking", direction);
      const idleKey = this.resolveAnimationKey(enemyType, "idle", direction);

      if (!anims.exists(walkKey) || !anims.exists(idleKey)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Resolves the animation key for a given enemy type, state, and direction.
   *
   * Key format: `{enemyType}-{state}-{direction}`
   * Examples: skeleton-idle-down, skeleton-walk-up
   */
  resolveAnimationKey(
    enemyType: EnemyType,
    state: EnemyAnimationState,
    direction: EnemyDirection
  ): string {
    switch (state) {
    case "walking":
        return `${enemyType}-walk-${direction}`;

    case "attacking":
        return `${enemyType}-attack-${direction}`;

    default:
        return `${enemyType}-idle-${direction}`;
    }
  }

  /**
   * Returns the frame data map for the given enemy type.
   */
  private getFrameDataForEnemy(
    enemyType: EnemyType
  ): Record<EnemyDirection, { start: number; end: number; idle: number }> | null {
    switch (enemyType) {
      case EnemyType.Skeleton:
        return SKELETON_DIRECTION_FRAMES;
      case EnemyType.Minotaur:
        return MINOTAUR_DIRECTION_FRAMES;
      case EnemyType.Hedgehog:
        return HEDGEHOG_DIRECTION_FRAMES;
      case EnemyType.Wolf:
        return WOLF_DIRECTION_FRAMES;
      default:
        return null;
    }
  }

  /**
   * Registers walk and idle animations for all four directions.
   * Skips registration for any animation key that already exists (idempotent).
   */
  private registerDirectionalAnimations(
    anims: Phaser.Animations.AnimationManager,
    config: EnemySpriteConfig,
    frameData: Record<EnemyDirection, { start: number; end: number; idle: number }>
  ): void {
    const textureKey = config.textureKey;

    for (const direction of DIRECTIONS) {
      const frames = frameData[direction];

      // Walking animation — loops continuously
      const walkKey = this.resolveAnimationKey(config.enemyType, "walking", direction);
      if (!anims.exists(walkKey)) {
        anims.create({
          key: walkKey,
          frames: anims.generateFrameNumbers(textureKey, {
            start: frames.start,
            end: frames.end,
          }),
          frameRate: WALK_FRAME_RATE,
          repeat: -1,
        });
      }

      // Idle animation — loops continuously per Requirement 2.2
      const idleKey = this.resolveAnimationKey(config.enemyType, "idle", direction);
      if (!anims.exists(idleKey)) {
        anims.create({
          key: idleKey,
          frames: [{ key: textureKey, frame: frames.idle }],
          frameRate: IDLE_FRAME_RATE,
          repeat: -1,
        });
      }
    }
  }

  /**
   * Registers the death animation for an enemy type if death frame data exists.
   * The death animation key follows the pattern: `{enemyType}-death`
   * Plays once (no repeat) since death is a one-shot sequence.
   */
  private registerDeathAnimation(
    anims: Phaser.Animations.AnimationManager,
    config: EnemySpriteConfig
  ): void {
    const deathFrames = this.getDeathFramesForEnemy(config.enemyType);
    if (!deathFrames) {
      return; // No death animation data for this enemy type
    }

    const deathKey = `${config.enemyType}-death`;
    if (anims.exists(deathKey)) {
      return; // Already registered
    }

    anims.create({
      key: deathKey,
      frames: anims.generateFrameNumbers(config.textureKey, {
        start: deathFrames.start,
        end: deathFrames.end,
      }),
      frameRate: DEATH_FRAME_RATE,
      repeat: 0,
    });
  }

  private registerAttackAnimation(
    anims: Phaser.Animations.AnimationManager,
    config: EnemySpriteConfig
): void {

    const textureKey = config.textureKey;

    const frameData = this.getAttackFrameDataForEnemy(config.enemyType);

    if (!frameData) {
        return;
    }

    for (const direction of DIRECTIONS) {

        const frames = frameData[direction];

        const attackKey = `${config.enemyType}-attack-${direction}`;

        if (anims.exists(attackKey)) {
            continue;
        }

        anims.create({
            key: attackKey,
            frames: anims.generateFrameNumbers(textureKey, {
                start: frames.start,
                end: frames.end,
            }),
            frameRate: 8,
            repeat: 0,
        });
    }
}

  /**
   * Returns the death animation frame range for the given enemy type,
   * or null if no death animation is defined.
   */
  private getDeathFramesForEnemy(
    enemyType: EnemyType
  ): { start: number; end: number } | null {
    switch (enemyType) {
      case EnemyType.Skeleton:
        return SKELETON_DEATH_FRAMES;
      case EnemyType.Minotaur:
        return MINOTAUR_DEATH_FRAMES;
      case EnemyType.Hedgehog:
        return HEDGEHOG_DEATH_FRAMES;
      case EnemyType.Wolf:
        return WOLF_DEATH_FRAMES;
      default:
        return null;
    }
  }

  private getAttackFrameDataForEnemy(enemyType: EnemyType): Record<EnemyDirection, { start: number; end: number }> | null {

    switch (enemyType) {

        case EnemyType.Skeleton:
            return SKELETON_ATTACK_FRAMES;

        case EnemyType.Minotaur:
            return MINOTAUR_ATTACK_FRAMES;

        case EnemyType.Wolf:
            return WOLF_ATTACK_FRAMES;

        default:
            return null;
    }
  }


}

/** Singleton instance of the EnemyAnimationRegistrar */
export const enemyAnimationRegistrar = new EnemyAnimationRegistrarImpl();
