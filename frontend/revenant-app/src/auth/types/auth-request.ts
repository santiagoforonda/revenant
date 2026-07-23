import type { PlayerType } from "../interfaces/auth-response";

export type LoginRequest = {
  username: string;
  password: string;
};

export type RegisterRequest = {
  username: string;
  email: string;
  password: string;
  playerType: PlayerType;
};
