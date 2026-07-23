import { create } from "zustand";
import type { LoginResponse } from "../interfaces/auth-response";
import { authenticationService } from "../services/AuthenticationService";
import type { AuthErrorResponse } from "../services/AuthenticationService";
import { eventBus } from "../../game/events/event-bus";

const TOKEN_KEY = "token";

type AuthState = {
  user: LoginResponse | null;
  token: string | null;
  isAuthenticated: boolean;

  login: (username: string, password: string) => Promise<LoginResponse>;
  logout: () => void;
  restoreSession: () => boolean;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: async (username: string, password: string): Promise<LoginResponse> => {
    const data = await authenticationService.login({ username, password });

    localStorage.setItem(TOKEN_KEY, data.token);
    set({ user: data, token: data.token, isAuthenticated: true });

    return data;
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    set({ user: null, token: null, isAuthenticated: false });
  },

  restoreSession: (): boolean => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (token) {
      set({ token, isAuthenticated: true });
      return true;
    }

    return false;
  },

  clearSession: () => {
    localStorage.removeItem(TOKEN_KEY);
    eventBus.emit("SESSION_EXPIRED");
    set({ user: null, token: null, isAuthenticated: false });
  },
}));

export type { AuthErrorResponse };
