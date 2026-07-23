import type { AuthErrorResponse } from "../services/AuthenticationService";

type AuthErrorAlertProps = {
  error: AuthErrorResponse | null;
};

/**
 * Shared component for rendering authentication errors consistently.
 *
 * Displays a top-level error message and optional field-level errors
 * returned by the backend. Never exposes technical details to the user.
 */
export const AuthErrorAlert = ({ error }: AuthErrorAlertProps) => {
  if (!error) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="mb-4 rounded-lg bg-red-900/40 border border-red-500/50 p-3 text-sm text-red-200"
    >
      <p>{error.message}</p>
      {error.fieldErrors.length > 0 && (
        <ul className="mt-2 list-disc list-inside space-y-1">
          {error.fieldErrors.map((fieldError) => (
            <li key={fieldError.field}>{fieldError.message}</li>
          ))}
        </ul>
      )}
    </div>
  );
};
