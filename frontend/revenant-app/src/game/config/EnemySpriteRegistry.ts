/**
 * EnemySpriteRegistry defines the sprite configuration for all enemy types.
 *
 * This registry follows the same data-driven pattern as ClassSpriteRegistry
 * but is tailored for enemy entities which use a single spritesheet per type
 * rather than multiple equipment layers.
 *
 * Only the Skeleton enemy is currently supported. The architecture remains
 * extensible for future enemy types (Wolves, Hedgehogs, Minotaurs).
 */

/** Supported enemy types */
export enum EnemyType {
  Skeleton = "skeleton",
  Minotaur = "minotauro",
  Hedgehog = "hedgehog",
  Wolf = "lobos",
}

/** Frame dimensions for the Skeleton spritesheet */
export const SKELETON_FRAME_WIDTH = 64;
export const SKELETON_FRAME_HEIGHT = 64;

/** Frame dimensions for the Minotaur spritesheet */
export const MINOTAUR_FRAME_WIDTH = 64;
export const MINOTAUR_FRAME_HEIGHT = 64;

/** Frame dimensions for the Hedgehog spritesheet */
export const HEDGEHOG_FRAME_WIDTH = 64;
export const HEDGEHOG_FRAME_HEIGHT = 64;

/** Frame dimensions for the Wolf spritesheet */
export const WOLF_FRAME_WIDTH = 64;
export const WOLF_FRAME_HEIGHT = 64;

/** Configuration for a single enemy type's sprite */
export interface EnemySpriteConfig {
  /** Enemy type identifier used in asset key prefixes */
  enemyType: EnemyType;
  /** The texture key used by Phaser to identify this spritesheet */
  textureKey: string;
  /** Path to the spritesheet asset */
  assetPath: string;
  /** Frame width in pixels */
  frameWidth: number;
  /** Frame height in pixels */
  frameHeight: number;
}

/** The full registry mapping each EnemyType to its EnemySpriteConfig */
export const ENEMY_SPRITE_REGISTRY: Record<EnemyType, EnemySpriteConfig> = {
  [EnemyType.Skeleton]: {
    enemyType: EnemyType.Skeleton,
    textureKey: "skeleton",
    assetPath: "/assets/characters/classes/skeleton/skeleton.png",
    frameWidth: SKELETON_FRAME_WIDTH,
    frameHeight: SKELETON_FRAME_HEIGHT,
  },
  [EnemyType.Minotaur]: {
    enemyType: EnemyType.Minotaur,
    textureKey: "minotauro",
    assetPath: "/assets/characters/classes/minotauro/minotaur.png",
    frameWidth: MINOTAUR_FRAME_WIDTH,
    frameHeight: MINOTAUR_FRAME_HEIGHT,
  },
  [EnemyType.Hedgehog]: {
    enemyType: EnemyType.Hedgehog,
    textureKey: "hedgehog",
    assetPath: "/assets/characters/classes/hedgehog/hedgehog.png",
    frameWidth: HEDGEHOG_FRAME_WIDTH,
    frameHeight: HEDGEHOG_FRAME_HEIGHT,
  },
  [EnemyType.Wolf]: {
    enemyType: EnemyType.Wolf,
    textureKey: "lobos",
    assetPath: "/assets/characters/classes/lobos/wolfs.png",
    frameWidth: WOLF_FRAME_WIDTH,
    frameHeight: WOLF_FRAME_HEIGHT,
  },
};
