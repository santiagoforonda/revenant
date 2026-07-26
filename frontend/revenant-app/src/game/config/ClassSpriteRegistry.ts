/** The five supported player classes */
export enum PlayerClass {
  Caballero = "knight",
  Mago = "mago",
  Espadachin = "espadachin",
  Gladiador = "gladiador",
  Arquero = "arquero",
}

/** Maps backend PlayerType strings to PlayerClass enum values */
export const PLAYER_TYPE_TO_CLASS: Record<string, PlayerClass> = {
  CABALLERO: PlayerClass.Caballero,
  MAGO: PlayerClass.Mago,
  ARQUERO: PlayerClass.Arquero,
  GLADIADOR: PlayerClass.Gladiador,
  ESPADACHIN: PlayerClass.Espadachin,
};

/** Sprite layers that vary by class */
export type EquipmentLayer = "feet" | "legs" | "torso" | "weapon" | "shield" | "helmet";

/** Configuration for a single class's sprite layers */
export interface ClassSpriteConfig {
  /** Class identifier used in asset key prefixes */
  classId: PlayerClass;
  /** Asset keys for each equipment layer, null if layer is absent */
  layers: Record<EquipmentLayer, string | null>;
  /** Helmet type: "directional" uses 4 separate images, "spritesheet" uses a single sheet */
  helmetType: "directional" | "spritesheet";
}

/** The shared body asset key used by ALL classes */
export const SHARED_BODY_KEY = "knight-body";

/** Frame dimensions for all spritesheets */
export const FRAME_WIDTH = 64;
export const FRAME_HEIGHT = 64;

/** The full registry mapping each PlayerClass to its ClassSpriteConfig */
export const CLASS_SPRITE_REGISTRY: Record<PlayerClass, ClassSpriteConfig> = {
  [PlayerClass.Caballero]: {
    classId: PlayerClass.Caballero,
    layers: {
      feet: "knight-feet",
      legs: "knight-legs",
      torso: "knight-torso",
      weapon: "knight-weapon",
      shield: null,
      helmet: "knight-helmet",
    },
    helmetType: "spritesheet",
  },
  [PlayerClass.Mago]: {
    classId: PlayerClass.Mago,
    layers: {
      feet: "mago-feet",
      legs: "mago-legs",
      torso: "mago-torso",
      weapon: "mago-weapon",
      shield: null,
      helmet: "mago-helmet",
    },
    helmetType: "spritesheet",
  },
  [PlayerClass.Espadachin]: {
    classId: PlayerClass.Espadachin,
    layers: {
      feet: "espadachin-feet",
      legs: "espadachin-legs",
      torso: "espadachin-torso",
      weapon: "espadachin-weapon",
      shield: null,
      helmet: "espadachin-helmet",
    },
    helmetType: "spritesheet",
  },
  [PlayerClass.Gladiador]: {
    classId: PlayerClass.Gladiador,
    layers: {
      feet: "gladiador-feet",
      legs: "gladiador-legs",
      torso: "gladiador-torso",
      weapon: "gladiador-weapon",
      shield: null,
      helmet: "gladiador-helmet",
    },
    helmetType: "spritesheet",
  },
  [PlayerClass.Arquero]: {
    classId: PlayerClass.Arquero,
    layers: {
      feet: "arquero-feet",
      legs: "arquero-legs",
      torso: "arquero-torso",
      weapon: "arquero-weapon",
      shield: null,
      helmet: "arquero-helmet",
    },
    helmetType: "spritesheet",
  },
};
