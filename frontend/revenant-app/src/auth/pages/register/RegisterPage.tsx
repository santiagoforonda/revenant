import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { authenticationService } from "../../services/AuthenticationService";
import { useAuthError } from "../../hooks/useAuthError";
import { AuthErrorAlert } from "../../components/AuthErrorAlert";

const PLAYER_TYPES = ["CABALLERO", "MAGO", "ARQUERO", "GLADIADOR", "ESPADACHIN"] as const;

const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username must be at most 20 characters"),
    email: z.string().min(1, "Email is required").email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
    playerType: z.enum(PLAYER_TYPES, {
      errorMap: () => ({ message: "Please select a player type" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const { authError, handleAuthError, clearError } = useAuthError<RegisterFormData>(setError);

  const onSubmit = async (formData: RegisterFormData) => {
    clearError();
    setIsSubmitting(true);

    try {
      await authenticationService.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        playerType: formData.playerType,
      });

      toast.success("Account created! Welcome, adventurer.");
      navigate("/");
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
          Create your legend
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
              placeholder="Choose a username"
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

          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-200 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={errors.email ? "true" : "false"}
              aria-describedby={errors.email ? "email-error" : undefined}
              className="w-full rounded-lg border border-[#A05344] bg-[#321F28] px-4 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E79E4F]"
              placeholder="Enter your email"
              {...register("email")}
            />
            {errors.email && (
              <p
                id="email-error"
                role="alert"
                className="mt-1 text-xs text-red-300"
              >
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-200 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              aria-invalid={errors.password ? "true" : "false"}
              aria-describedby={errors.password ? "password-error" : undefined}
              className="w-full rounded-lg border border-[#A05344] bg-[#321F28] px-4 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E79E4F]"
              placeholder="Create a password"
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

          <div className="mb-4">
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-200 mb-1"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              aria-invalid={errors.confirmPassword ? "true" : "false"}
              aria-describedby={
                errors.confirmPassword ? "confirmPassword-error" : undefined
              }
              className="w-full rounded-lg border border-[#A05344] bg-[#321F28] px-4 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E79E4F]"
              placeholder="Repeat your password"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p
                id="confirmPassword-error"
                role="alert"
                className="mt-1 text-xs text-red-300"
              >
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <div className="mb-6">
            <label
              htmlFor="playerType"
              className="block text-sm font-medium text-gray-200 mb-1"
            >
              Player Type
            </label>
            <select
              id="playerType"
              aria-invalid={errors.playerType ? "true" : "false"}
              aria-describedby={
                errors.playerType ? "playerType-error" : undefined
              }
              className="w-full rounded-lg border border-[#A05344] bg-[#321F28] px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#E79E4F]"
              defaultValue=""
              {...register("playerType")}
            >
              <option value="" disabled>
                Select your class
              </option>
              {PLAYER_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0) + type.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
            {errors.playerType && (
              <p
                id="playerType-error"
                role="alert"
                className="mt-1 text-xs text-red-300"
              >
                {errors.playerType.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-[#A05344] px-4 py-3 font-semibold text-white transition-colors hover:bg-[#E79E4F] hover:text-[#321F28] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Creating..." : "Begin Your Journey"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-300">
          Already an adventurer?{" "}
          <Link
            to="/"
            className="font-medium text-[#E79E4F] hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
