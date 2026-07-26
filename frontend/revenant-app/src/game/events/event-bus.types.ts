import type { LoginResponse } from "../../auth/interfaces/auth-response";
import type { PlayerClass } from "../config/ClassSpriteRegistry";

export type ApiErrorPayload = {
  statusCode: number;
  message: string;
  endpoint: string;
};

export type ClassChangeFailedPayload = {
  reason: "missing_assets" | "invalid_class";
  requestedClass: string;
};

export type ClassChangeSuccessPayload = {
  previousClass: PlayerClass;
  newClass: PlayerClass;
};

export type PlayerStatsPayload = {
  healthPoints?: number;
  experience?: number;
  gold?: number;
  level?: number;
};

export type EventBusMap = {
  GAME_INITIALIZED: LoginResponse;
  GAME_READY: void;
  SESSION_EXPIRED: void;
  API_ERROR: ApiErrorPayload;
  CLASS_CHANGE_FAILED: ClassChangeFailedPayload;
  CLASS_CHANGE_SUCCESS: ClassChangeSuccessPayload;
  PLAYER_STATS_UPDATED: PlayerStatsPayload;
  LOGOUT_REQUESTED: void;
};

export type EventName = keyof EventBusMap;
