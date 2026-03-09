import { authenticateUser } from "@/api/authAPI";
import { useMutation } from "@tanstack/react-query";
import { LogIn } from "lucide-react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export type UserLoginForm = {
  email: string;
  password: string;
};

export default function LoginUser() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
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
    onError: (error: any) => {
      toast.error(error.message || "Error al iniciar sesión");
    },
  });

  const handleLogin = (formData: UserLoginForm) => mutate(formData);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img
            src="/logoNic.png"
            alt="IntraNIC"
            className="h-12 w-auto object-contain"
          />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex items-center gap-2 text-gray-900">
              <LogIn size={18} strokeWidth={1.5} />
              <h1 className="text-lg font-semibold tracking-tight">
                Iniciar sesión
              </h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Accedé al sistema con tu cuenta.
            </p>
          </div>

          <form className="p-6 space-y-5" onSubmit={handleSubmit(handleLogin)} noValidate>
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                placeholder="usuario@empresa.com"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-gray-500"
                {...register("email", {
                  required: "El email es obligatorio",
                  pattern: {
                    value: /\S+@\S+\.\S+/,
                    message: "Email no válido",
                  },
                })}
              />

              {errors.email && (
                <p className="text-xs font-medium text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500"
              >
                Contraseña
              </label>

              <input
                id="password"
                type="password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-gray-500"
                {...register("password", {
                  required: "La contraseña es obligatoria",
                })}
              />

              {errors.password && (
                <p className="text-xs font-medium text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-900 transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogIn size={16} strokeWidth={1.5} />
              {isPending ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          © {new Date().getFullYear()} - Franco Sanchez
        </p>
      </div>
    </div>
  );
}
