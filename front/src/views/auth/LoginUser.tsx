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
    onSuccess: (response: any) => {
      toast.success(response.message || "Te enviamos una nueva contrasena por email");
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8 gap-10">
          <img src="/logoNic.png" alt="IntraNIC" className="h-12 w-auto object-contain" />
          <img src="/logoLIESS.png" alt="IntraNIC" className="h-12 w-auto object-contain" />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex items-center gap-2 text-gray-900">
              <LogIn size={18} strokeWidth={1.5} />
              <h1 className="text-lg font-semibold tracking-tight">Iniciar sesion</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">Accede al sistema con tu cuenta.</p>
          </div>

          <form className="p-6 space-y-5" onSubmit={handleSubmit(handleLogin)} noValidate>
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
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
                    message: "Email no valido",
                  },
                })}
              />

              {errors.email ? <p className="text-xs font-medium text-red-600">{errors.email.message}</p> : null}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                Contrasena
              </label>

              <input
                id="password"
                type="password"
                placeholder="********"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-gray-500"
                {...register("password", {
                  required: "La contrasena es obligatoria",
                })}
              />

              {errors.password ? <p className="text-xs font-medium text-red-600">{errors.password.message}</p> : null}
            </div>

            <button
              type="submit"
              disabled={isPending || isRecoveringPassword}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-900 transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogIn size={16} strokeWidth={1.5} />
              {isPending ? "Ingresando..." : "Ingresar"}
            </button>

            <button
              type="button"
              disabled={isPending || isRecoveringPassword}
              onClick={handleRecoverPassword}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50 transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              <KeyRound size={16} strokeWidth={1.5} />
              {isRecoveringPassword ? "Enviando nueva contrasena..." : "Recuperar contrasena"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">© {new Date().getFullYear()} - Franco Sanchez</p>
      </div>
    </div>
  );
}
