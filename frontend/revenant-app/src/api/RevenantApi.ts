import axios, { type AxiosError } from "axios";
import { eventBus } from "../game/events";

const TOKEN_KEY = "token";

const revenantApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

revenantApi.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

revenantApi.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const url = error.config?.url ?? "";
      if (!url.includes("/auth/login") && !url.includes("/auth/register")) {
        localStorage.removeItem(TOKEN_KEY);
        eventBus.emit("SESSION_EXPIRED");
      }
    }
    return Promise.reject(error);
  }
);

export { revenantApi };