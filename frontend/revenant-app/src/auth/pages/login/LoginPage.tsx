import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { GiCrossedSwords } from "react-icons/gi";
import { useAuthStore } from "../../store/auth-store";
import { useAuthError } from "../../hooks/useAuthError";
import { AuthErrorAlert } from "../../components/AuthErrorAlert";
import { ParticleBackground } from "@/auth/components/ParticleBackground";
import { AuthCard } from "@/auth/components/AuthCard";
import { AuthInput } from "@/auth/components/AuthInput";
import { AuthLabel } from "@/auth/components/AuthLabel";
import { InteractiveButton } from "@/auth/components/InteractiveButton";

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
    <div
      className="relative min-h-screen flex items-center justify-center bg-[#000000] px-4"
      style={{ background: 'radial-gradient(ellipse at center, rgba(31,21,12,0.15) 0%, transparent 70%), #000000' }}
    >
      <ParticleBackground />

      <div className="relative z-10 w-full max-w-md">
        <AuthCard maxWidth="md">
          <div className="p-8">
            <h1 className="text-center font-title text-4xl font-bold text-[#E1DCC9] mb-2 animate-[torchlight_3.5s_ease-in-out_infinite]">
              Revenant
            </h1>
            <GiCrossedSwords className="mx-auto text-[#E1DCC9]/40" size={20} />
            <p className="text-center font-hand text-sm text-[#E1DCC9]/70 mb-8 mt-2">
              Entra al sueño
            </p>

            <AuthErrorAlert error={authError} />

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="mb-4">
                <AuthLabel htmlFor="username" className="block text-sm">
                  Nombre de usuario
                </AuthLabel>
                <AuthInput
                  id="username"
                  type="text"
                  autoComplete="username"
                  aria-invalid={errors.username ? "true" : "false"}
                  aria-describedby={errors.username ? "username-error" : undefined}
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
                <AuthLabel htmlFor="password" className="block text-sm">
                  Contraseña
                </AuthLabel>
                <AuthInput
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={errors.password ? "true" : "false"}
                  aria-describedby={errors.password ? "password-error" : undefined}
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

              <InteractiveButton
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[44px] px-4 py-3 font-semibold"
              >
                {isSubmitting ? "Entrando..." : "Entra al mundo"}
              </InteractiveButton>
            </form>

            <p className="mt-6 text-center text-sm text-[#E1DCC9]/70">
              ¿Nuevo aventurero?{" "}
              <Link
                to="/register"
                className="inline-block min-h-[44px] leading-[44px] font-medium text-[#E1DCC9] hover:underline"
              >
                Crea una cuenta
              </Link>
            </p>
          </div>
        </AuthCard>
      </div>
    </div>
  );
};
