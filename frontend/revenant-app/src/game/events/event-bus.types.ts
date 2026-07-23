import type { LoginResponse } from "../../auth/interfaces/auth-response";

export type ApiErrorPayload = {
  statusCode: number;
  message: string;
  endpoint: string;
};

export type EventBusMap = {
  GAME_INITIALIZED: LoginResponse;
  GAME_READY: void;
  SESSION_EXPIRED: void;
  API_ERROR: ApiErrorPayload;
};

export type EventName = keyof EventBusMap;
