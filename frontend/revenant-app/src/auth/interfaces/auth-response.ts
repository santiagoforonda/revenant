
export type PlayerType = "CABALLERO" | "MAGO" | "ARQUERO" | "GLADIADOR" | "ESPADACHIN";

export type ItemType = "ARMA" | "ESCUDO" | "ARMADURA" | "CONSUMIBLE";

export type ArmorType = "GUANTES" | "CASCO" | "PECHERA" | "PANTALONES";

export type WeaponType = "ESPADA" | "MARTILLO" | "BASTON" | "ARCO";

export type EquippedSlot =
  | "MANO_PRINCIPAL"
  | "MANO_SECUNDARIA"
  | "CASCO"
  | "PECHERA"
  | "GUANTES"
  | "PANTALONES";

export interface RegisterResponse {
  userId: number;
  username: string;
  email: string;
}

export interface LoginResponse {
  token: string;
  tokenType: string;
  username: string;
  mapId: number;
  posX: number;
  posY: number;
  healthPoints: number;
  strongPoints: number;
  speedAttackPoints: number;
  gold: number;
  level: number;
  experience: number;
  typePlayer: PlayerType;
  inventory: Inventory[];
}

export interface Inventory {
  itemId: number;
  name: string;
  description: string;
  itemType: ItemType;
  price: number;
  sellPrice: number;
  isSpecial: boolean;
  quantity: number;
  equipped: boolean;
  equippedSlot: EquippedSlot | null;
}