import { updateMyPassword } from "@/api/usuarioAPI";
import { useAuth } from "@/hooks/useAuthe";
import { useMutation } from "@tanstack/react-query";
import { Building2, CircleUserRound, Hash, KeyRound, Mail, Smartphone } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type UpdatePasswordForm = {
  newPassword: string;
  confirmPassword: string;
};

export default function MiPerfilView() {
  const navigate = useNavigate();
  const { user, isLoading, isError } = useAuth();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<UpdatePasswordForm>();

  const newPassword = useWatch({ control, name: "newPassword" });
  const mutation = useMutation({
    mutationFn: updateMyPassword,
    onSuccess: (data) => {
      toast.success(data.message);
      localStorage.removeItem("AUTH_TOKEN");
      navigate("/login", { replace: true });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al actualizar la contrasena");
    },
  });

  if (isLoading) {
    return (
      <div className="font-preset w-full px-2 py-3">
        <section className="rounded-lg border border-border bg-card p-3 shadow-sm">
          <p className="text-sm text-muted-foreground">Cargando perfil...</p>
        </section>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="font-preset w-full px-2 py-3">
        <section className="rounded-lg border border-destructive/30 bg-card p-3 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Error al cargar el perfil</h1>
          <p className="mt-2 text-sm text-destructive">No fue posible obtener la informacion del usuario.</p>
        </section>
      </div>
    );
  }

  const fullName = `${user.name ?? ""} ${user.lastName ?? ""}`.trim();

  return (
    <div className="font-preset w-full space-y-3 px-2 py-3">
      <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
        <div className="px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Mi perfil</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground">Informacion del usuario</h1>
          <p className="mt-1 text-sm text-muted-foreground">Resumen general de tu cuenta dentro del sistema.</p>
        </div>
        <div className="grid border-t border-border md:grid-cols-2">
          <div className="px-3 py-3 md:border-r md:border-border">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Usuario</p>
            <p className="mt-1 text-lg font-semibold tracking-tight text-foreground">{fullName || "Sin nombre"}</p>
          </div>
          <div className="px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Email</p>
            <p className="mt-1 break-all text-sm font-medium text-foreground">{user.email || "No informado"}</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-[1.2fr_1fr]">
        <section className="border-y border-border py-3">
          <div className="pb-3">
            <h2 className="text-base font-semibold tracking-tight text-foreground">Datos principales</h2>
            <p className="mt-1 text-sm text-muted-foreground">Informacion basica de tu cuenta.</p>
          </div>

          <div className="grid grid-cols-1 gap-x-6 gap-y-5 border-t border-border pt-3 md:grid-cols-2">
            <div className="px-3 py-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CircleUserRound size={16} strokeWidth={1.5} />
                <p className="text-xs font-semibold uppercase tracking-[0.18em]">Nombre completo</p>
              </div>
              <p className="mt-2 text-sm font-medium text-foreground">{fullName || "No informado"}</p>
            </div>

            <div className="px-3 py-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail size={16} strokeWidth={1.5} />
                <p className="text-xs font-semibold uppercase tracking-[0.18em]">Email</p>
              </div>
              <p className="mt-2 break-all text-sm font-medium text-foreground">{user.email || "No informado"}</p>
            </div>

            <div className="px-3 py-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Smartphone size={16} strokeWidth={1.5} />
                <p className="text-xs font-semibold uppercase tracking-[0.18em]">Celular</p>
              </div>
              <p className="mt-2 text-sm font-medium text-foreground">{user.celular || "No informado"}</p>
            </div>

            <div className="px-3 py-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Hash size={16} strokeWidth={1.5} />
                <p className="text-xs font-semibold uppercase tracking-[0.18em]">Numero vendedor NIC</p>
              </div>
              <p className="mt-2 text-sm font-medium text-foreground">{user.numberSaleNic ?? 0}</p>
            </div>

            <div className="px-3 py-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Hash size={16} strokeWidth={1.5} />
                <p className="text-xs font-semibold uppercase tracking-[0.18em]">Numero vendedor Liess</p>
              </div>
              <p className="mt-2 text-sm font-medium text-foreground">{user.numberSaleLiess ?? 0}</p>
            </div>

            <div className="px-3 py-3 md:col-span-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 size={16} strokeWidth={1.5} />
                <p className="text-xs font-semibold uppercase tracking-[0.18em]">Sucursal de entrega</p>
              </div>
              <p className="mt-2 text-sm font-medium text-foreground">
                {user.sucursalPredeterminada?.nombre || "Sin asignar"}
              </p>
            </div>
          </div>
        </section>

        <section className="border-y border-border py-3">
            <div className="pb-3">
              <div className="flex items-center gap-2">
                <KeyRound size={16} strokeWidth={1.5} className="text-foreground" />
                <h2 className="text-base font-semibold tracking-tight text-foreground">Cambiar contrasena</h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Ingresa la nueva contrasena dos veces para confirmarla.</p>
            </div>

            <form
              className="space-y-3 border-t border-border pt-3"
              onSubmit={handleSubmit((formData) =>
                mutation.mutate({ newPassword: formData.newPassword }),
              )}
            >
              <div className="space-y-2">
                <label htmlFor="newPassword" className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Nueva contrasena
                </label>
                <input
                  id="newPassword"
                  type="password"
                  placeholder="********"
                  {...register("newPassword", {
                    required: "La contrasena es obligatoria",
                    minLength: {
                      value: 8,
                      message: "La contrasena debe tener al menos 8 caracteres",
                    },
                  })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:ring-2 focus:ring-ring"
                />
                {errors.newPassword ? <p className="text-xs text-red-500">{errors.newPassword.message}</p> : null}
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Confirmar nueva contrasena
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="********"
                  {...register("confirmPassword", {
                    required: "Debes confirmar la contrasena",
                    validate: (value) => value === newPassword || "Las contrasenas no coinciden",
                  })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:ring-2 focus:ring-ring"
                />
                {errors.confirmPassword ? <p className="text-xs text-red-500">{errors.confirmPassword.message}</p> : null}
              </div>

              <button
                type="submit"
                disabled={mutation.isPending}
                className="inline-flex w-full items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {mutation.isPending ? "Actualizando..." : "Actualizar contrasena"}
              </button>
            </form>
        </section>
      </section>
    </div>
  );
}
