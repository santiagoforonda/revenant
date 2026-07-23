import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/auth-store";
import { useAuthError } from "../../hooks/useAuthError";
import { AuthErrorAlert } from "../../components/AuthErrorAlert";

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const { authError, handleAuthError, clearError } = useAuthError<LoginFormData>(setError);

  const onSubmit = async (formData: LoginFormData) => {
    clearError();
    setIsSubmitting(true);

    try {
      await login(formData.username, formData.password);

      toast.success("Welcome back, adventurer!");
      navigate("/game");
    } catch (error: unknown) {
      handleAuthError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#321F28] px-4">
      <div className="w-full max-w-md rounded-2xl bg-[#734046] p-8 shadow-xl">
        <h1 className="text-center font-title text-4xl font-bold text-[#E79E4F] mb-2">
          Revenant
        </h1>
        <p className="text-center text-sm text-gray-300 mb-8">
          Enter the realm
        </p>

        <AuthErrorAlert error={authError} />

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="mb-4">
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-200 mb-1"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              aria-invalid={errors.username ? "true" : "false"}
              aria-describedby={errors.username ? "username-error" : undefined}
              className="w-full rounded-lg border border-[#A05344] bg-[#321F28] px-4 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E79E4F]"
              placeholder="Enter your username"
              {...register("username")}
            />
            {errors.username && (
              <p
                id="username-error"
                role="alert"
                className="mt-1 text-xs text-red-300"
              >
                {errors.username.message}
              </p>
            )}
          </div>

          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-200 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={errors.password ? "true" : "false"}
              aria-describedby={errors.password ? "password-error" : undefined}
              className="w-full rounded-lg border border-[#A05344] bg-[#321F28] px-4 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E79E4F]"
              placeholder="Enter your password"
              {...register("password")}
            />
            {errors.password && (
              <p
                id="password-error"
                role="alert"
                className="mt-1 text-xs text-red-300"
              >
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-[#A05344] px-4 py-3 font-semibold text-white transition-colors hover:bg-[#E79E4F] hover:text-[#321F28] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Entering..." : "Enter the Realm"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-300">
          New adventurer?{" "}
          <Link
            to="/register"
            className="font-medium text-[#E79E4F] hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};
