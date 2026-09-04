import { createUsuario } from "@/api/usuarioAPI";
import UsuarioForm from "@/components/usuario/UsuarioForm";
import { getDefaultModules } from "@/constants/modules";
import { paths } from "@/routes/paths";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { UsuarioFormData } from "./formTypes";

export default function CreateUsuarioView() {
  const navigate = useNavigate();

  const initialValues: UsuarioFormData = {
    name: "",
    lastName: "",
    email: "",
    password: "",
    celular: "",
    sucursalPredeterminada: "",
    unidadNegocio: "",
    numberSaleNic: 0,
    numberSaleLiess: 0,
    role: [],
    modules: getDefaultModules(),
  };

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<UsuarioFormData>({
    defaultValues: initialValues,
  });

  const mutation = useMutation({
    mutationFn: createUsuario,
    onError: (error: Error) => {
      toast.error(error.message);
    },
    onSuccess: (response: { message: string }) => {
      toast.success(response.message);
      navigate(paths.admin.usuarios);
    },
  });

  return (
    <div className="font-preset w-full space-y-3 px-2 py-3">
      <section className="flex flex-col gap-3 rounded-lg border border-border bg-card px-3 py-3 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Administracion
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Crear usuario
          </h1>
        </div>

        <Link
          to={paths.admin.usuarios}
          className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-xs font-semibold uppercase tracking-wide text-primary-foreground transition hover:opacity-90"
        >
          Volver
        </Link>
      </section>

      <form
        className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm"
        noValidate
        onSubmit={handleSubmit((formData) => mutation.mutate(formData))}
      >
        <div className="border-b border-border px-3 py-3">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Datos del usuario
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Completa la informacion principal, la unidad de negocio, la sucursal
            predeterminada y los modulos habilitados.
          </p>
        </div>

        <div className="p-3">
          <UsuarioForm
            register={register}
            control={control}
            errors={errors}
            showPasswordField
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-border bg-muted px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            Los campos obligatorios deben completarse antes de guardar.
          </div>

          <input
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex cursor-pointer justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold uppercase text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            value={mutation.isPending ? "Creando..." : "Crear usuario"}
          />
        </div>
      </form>
    </div>
  );
}
