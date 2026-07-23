import { AxiosError } from "axios";
import { revenantApi } from "../../api/RevenantApi";
import type { LoginResponse, RegisterResponse } from "../interfaces/auth-response";
import type { LoginRequest, RegisterRequest } from "../types/auth-request";

export type ValidationFieldError = {
  field: string;
  message: string;
};

export type AuthErrorResponse = {
  type: "validation" | "authentication" | "conflict" | "server";
  message: string;
  fieldErrors: ValidationFieldError[];
};

type BackendErrorBody = {
  message?: string;
  errors?: ValidationFieldError[];
};

function buildAuthError(error: AxiosError<BackendErrorBody>): AuthErrorResponse {
  const status = error.response?.status;
  const body = error.response?.data;

  if (status === 400) {
    return {
      type: "validation",
      message: body?.message ?? "Validation failed",
      fieldErrors: body?.errors ?? [],
    };
  }

  if (status === 401) {
    return {
      type: "authentication",
      message: body?.message ?? "Invalid credentials",
      fieldErrors: [],
    };
  }

  if (status === 409) {
    return {
      type: "conflict",
      message: body?.message ?? "Resource already exists",
      fieldErrors: [],
    };
  }

  return {
    type: "server",
    message: "An unexpected error occurred. Please try again later.",
    fieldErrors: [],
  };
}

class AuthenticationService {
  async login(request: LoginRequest): Promise<LoginResponse> {
    try {
      const { data } = await revenantApi.post<LoginResponse>("/auth/login", {
        username: request.username,
        password: request.password,
      });

      return data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw buildAuthError(error as AxiosError<BackendErrorBody>);
      }
      throw {
        type: "server",
        message: "An unexpected error occurred. Please try again later.",
        fieldErrors: [],
      } satisfies AuthErrorResponse;
    }
  }

  async register(request: RegisterRequest): Promise<RegisterResponse> {
    try {
      const { data } = await revenantApi.post<RegisterResponse>("/auth/register", {
        username: request.username,
        email: request.email,
        password: request.password,
        playerType: request.playerType,
      });

      return data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw buildAuthError(error as AxiosError<BackendErrorBody>);
      }
      throw {
        type: "server",
        message: "An unexpected error occurred. Please try again later.",
        fieldErrors: [],
      } satisfies AuthErrorResponse;
    }
  }
}

export const authenticationService = new AuthenticationService();
