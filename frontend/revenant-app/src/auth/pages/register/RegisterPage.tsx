import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { GiCrossedSwords } from "react-icons/gi";
import { authenticationService } from "@/auth/services/AuthenticationService";
import { useAuthError } from "@/auth/hooks/useAuthError";
import { AuthErrorAlert } from "@/auth/components/AuthErrorAlert";
import { CharacterClassCarousel } from "@/auth/components/CharacterClassCarousel";
import { ParticleBackground } from "@/auth/components/ParticleBackground";
import { AuthCard } from "@/auth/components/AuthCard";
import { AuthInput } from "@/auth/components/AuthInput";
import { AuthLabel } from "@/auth/components/AuthLabel";
import { InteractiveButton } from "@/auth/components/InteractiveButton";
import { AnimatedRoute, useAnimatedRoute } from "@/auth/components/AnimatedRoute";

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
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[#000000] px-4"
      style={{ background: 'radial-gradient(ellipse at center, rgba(31,21,12,0.15) 0%, transparent 70%), #000000' }}
    >
      <ParticleBackground />

      <div className="relative z-10 w-full max-w-[960px] mx-auto">
        <AnimatedRoute>
          <RegisterFormContent />
        </AnimatedRoute>
      </div>
    </div>
  );
};

function RegisterFormContent() {
  const { navigateWithExit } = useAnimatedRoute();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { playerType: "CABALLERO" },
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
      await navigateWithExit("/");
    } catch (error: unknown) {
      handleAuthError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard maxWidth="xl" className="max-w-[960px] w-full">
      <div className="p-8">
        <h1 className="text-center font-title text-4xl font-bold text-[#E1DCC9] mb-2 animate-[torchlight_3.5s_ease-in-out_infinite]">
          Revenant
        </h1>
        <GiCrossedSwords className="mx-auto text-[#E1DCC9]/40" size={20} />
        <p className="text-center font-hand text-sm text-[#E1DCC9]/70 mb-8 mt-2">
          Elije tu destino
        </p>

        <AuthErrorAlert error={authError} />

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left column — form inputs (~45%) */}
            <div className="w-full md:w-[45%]">
              <div className="mb-4">
                <AuthLabel htmlFor="username">
                  Nombre de usuario
                </AuthLabel>
                <AuthInput
                  id="username"
                  type="text"
                  autoComplete="username"
                  aria-invalid={errors.username ? "true" : "false"}
                  aria-describedby={errors.username ? "username-error" : undefined}
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
                <AuthLabel htmlFor="email">
                  Email
                </AuthLabel>
                <AuthInput
                  id="email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={errors.email ? "true" : "false"}
                  aria-describedby={errors.email ? "email-error" : undefined}
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
                <AuthLabel htmlFor="password">
                  Contraseña
                </AuthLabel>
                <AuthInput
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={errors.password ? "true" : "false"}
                  aria-describedby={errors.password ? "password-error" : undefined}
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
                <AuthLabel htmlFor="confirmPassword">
                  Confirmar contraseña
                </AuthLabel>
                <AuthInput
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={errors.confirmPassword ? "true" : "false"}
                  aria-describedby={
                    errors.confirmPassword ? "confirmPassword-error" : undefined
                  }
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
            </div>

            {/* Right column — character class carousel (~55%) */}
            <div className="w-full md:w-[55%] flex items-center justify-center">
              <Controller
                name="playerType"
                control={control}
                render={({ field }) => (
                  <CharacterClassCarousel
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.playerType?.message}
                  />
                )}
              />
            </div>
          </div>

          <InteractiveButton
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[44px] mt-6 font-semibold"
          >
            {isSubmitting ? "Creando..." : "Empieza tu viaje"}
          </InteractiveButton>
        </form>

        <p className="mt-6 text-center text-sm text-[#E1DCC9]/70">
          ¿Ya tienes una cuenta?{" "}
          <button
            type="button"
            onClick={() => navigateWithExit("/")}
            className="inline-block min-h-[44px] leading-[44px] font-medium text-[#E1DCC9] hover:underline"
          >
            Iniciar sesión
          </button>
        </p>
      </div>
    </AuthCard>
  );
}
