import { useState, useCallback } from "react";
import type { AuthErrorResponse, ValidationFieldError } from "../services/AuthenticationService";
import type { UseFormSetError, FieldValues, Path } from "react-hook-form";

type UseAuthErrorReturn = {
  authError: AuthErrorResponse | null;
  handleAuthError: (error: unknown) => void;
  clearError: () => void;
};

/**
 * Maps backend field error names to form field names.
 * Extends this map if the backend uses different naming than the frontend form.
 */
const FIELD_NAME_MAP: Record<string, string> = {
  email: "email",
  username: "username",
  password: "password",
  playerType: "playerType",
  confirmPassword: "confirmPassword",
};

function mapFieldName(backendField: string): string {
  return FIELD_NAME_MAP[backendField] ?? backendField;
}

/**
 * Hook for managing authentication error state consistently across pages.
 *
 * Handles mapping of AuthErrorResponse to:
 * - A displayable alert error (for AuthErrorAlert component)
 * - Field-level errors applied directly to form fields via react-hook-form's setError
 *
 * Ensures no technical details leak to the user for server errors.
 */
export function useAuthError<TForm extends FieldValues>(
  setError?: UseFormSetError<TForm>
): UseAuthErrorReturn {
  const [authError, setAuthError] = useState<AuthErrorResponse | null>(null);

  const applyFieldErrors = useCallback(
    (fieldErrors: ValidationFieldError[]) => {
      if (!setError || fieldErrors.length === 0) return;

      for (const fieldError of fieldErrors) {
        const mappedField = mapFieldName(fieldError.field) as Path<TForm>;
        setError(mappedField, {
          type: "server",
          message: fieldError.message,
        });
      }
    },
    [setError]
  );

  const handleAuthError = useCallback(
    (error: unknown) => {
      const authErr = error as AuthErrorResponse;

      // Ensure server errors never expose internal details
      if (authErr.type === "server") {
        const sanitized: AuthErrorResponse = {
          type: "server",
          message: "An unexpected error occurred. Please try again later.",
          fieldErrors: [],
        };
        setAuthError(sanitized);
        return;
      }

      setAuthError(authErr);

      // Apply field-level errors to form if available
      if (authErr.fieldErrors && authErr.fieldErrors.length > 0) {
        applyFieldErrors(authErr.fieldErrors);
      }
    },
    [applyFieldErrors]
  );

  const clearError = useCallback(() => {
    setAuthError(null);
  }, []);

  return { authError, handleAuthError, clearError };
}
