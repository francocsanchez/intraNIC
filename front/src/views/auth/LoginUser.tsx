import { authenticateUser, forgotPassword } from "@/api/authAPI";
import { useMutation } from "@tanstack/react-query";
import { KeyRound, LogIn } from "lucide-react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export type UserLoginForm = {
  email: string;
  password: string;
};

function getResponseMessage(response: unknown, fallback: string) {
  if (
    typeof response === "object" &&
    response !== null &&
    "message" in response &&
    typeof response.message === "string"
  ) {
    return response.message;
  }

  return fallback;
}

export default function LoginUser() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<UserLoginForm>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: authenticateUser,
    onSuccess: () => {
      toast.success("Bienvenido");
      navigate("/");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al iniciar sesion");
    },
  });

  const { mutate: recoverPassword, isPending: isRecoveringPassword } = useMutation({
    mutationFn: forgotPassword,
    onSuccess: (response: unknown) => {
      toast.success(getResponseMessage(response, "Te enviamos una nueva contrasena por email"));
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al recuperar la contrasena");
    },
  });

  const handleLogin = (formData: UserLoginForm) => mutate(formData);

  const handleRecoverPassword = () => {
    const email = getValues("email").trim();

    if (!email) {
      toast.error("Ingresa tu email para recuperar la contrasena");
      return;
    }

    recoverPassword(email);
  };

  return (
    <div className="font-preset flex min-h-svh flex-col bg-background text-foreground">
      <main className="flex flex-1 items-center justify-center px-3 py-6">
        <div className="w-full max-w-sm">
          <div className="mb-5 flex justify-center gap-8">
            <img src="/logoNic.png" alt="Nippon Car" className="h-9 w-auto object-contain" />
            <img src="/logoLIESS.png" alt="LIESS" className="h-9 w-auto object-contain" />
          </div>

        <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
          <div className="border-b border-border px-3 py-3">
            <div className="flex items-center gap-2 text-foreground">
              <LogIn size={18} strokeWidth={1.5} />
              <h1 className="text-lg font-semibold tracking-tight">Iniciar sesion</h1>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Accede al sistema con tu cuenta.</p>
          </div>

          <form className="space-y-3 p-3" onSubmit={handleSubmit(handleLogin)} noValidate>
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Email
              </label>

              <input
                id="email"
                type="email"
                placeholder="usuario@empresa.com"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:ring-2 focus:ring-ring"
                {...register("email", {
                  required: "El email es obligatorio",
                  pattern: {
                    value: /\S+@\S+\.\S+/,
                    message: "Email no valido",
                  },
                })}
              />

              {errors.email ? <p className="text-xs font-medium text-destructive">{errors.email.message}</p> : null}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Contrasena
              </label>

              <input
                id="password"
                type="password"
                placeholder="********"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:ring-2 focus:ring-ring"
                {...register("password", {
                  required: "La contrasena es obligatoria",
                })}
              />

              {errors.password ? <p className="text-xs font-medium text-destructive">{errors.password.message}</p> : null}
            </div>

            <button
              type="submit"
              disabled={isPending || isRecoveringPassword}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogIn size={16} strokeWidth={1.5} />
              {isPending ? "Ingresando..." : "Ingresar"}
            </button>

            <button
              type="button"
              disabled={isPending || isRecoveringPassword}
              onClick={handleRecoverPassword}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
            >
              <KeyRound size={16} strokeWidth={1.5} />
              {isRecoveringPassword ? "Enviando nueva contrasena..." : "Recuperar contrasena"}
            </button>
          </form>
          </section>
        </div>
      </main>

      <footer className="flex flex-col gap-1 border-t border-border px-3 py-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>IntraNIC - Uso interno Nippon Car</span>
        <span>Desarrollado por Franco Sanchez</span>
      </footer>
    </div>
  );
}
