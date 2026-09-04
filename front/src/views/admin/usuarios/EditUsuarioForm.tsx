import { updateUsuarioById } from "@/api/usuarioAPI";
import UsuarioForm from "@/components/usuario/UsuarioForm";
import {
  getDefaultModules,
  normalizeModules,
  type UserModules,
} from "@/constants/modules";
import { paths } from "@/routes/paths";
import type { SucursalEntrega, UnidadNegocio } from "@/types/index";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { UsuarioFormData } from "./formTypes";

type Usuario = {
  _id: string;
  email: string;
  name: string;
  lastName: string;
  celular?: string;
  enable: boolean;
  numberSaleNic: number;
  numberSaleLiess: number;
  role: string[];
  modules?: UserModules;
  unidadNegocio?: UnidadNegocio | null;
  sucursalPredeterminada?: SucursalEntrega | null;
};

type EditUsuarioFormProps = {
  data: Usuario;
  usuarioId: Usuario["_id"];
};

export default function EditUsuarioForm({
  data,
  usuarioId,
}: EditUsuarioFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<UsuarioFormData>({
    defaultValues: {
      name: data.name,
      lastName: data.lastName,
      email: data.email,
      celular: data.celular ?? "",
      sucursalPredeterminada: data.sucursalPredeterminada?._id ?? "",
      unidadNegocio: data.unidadNegocio?._id ?? "",
      numberSaleNic: data.numberSaleNic,
      numberSaleLiess: data.numberSaleLiess,
      role: data.role,
      modules: {
        ...getDefaultModules(),
        ...normalizeModules(data.modules),
      },
    },
  });

  const mutation = useMutation({
    mutationFn: updateUsuarioById,
    onSuccess: (response: { message: string }) => {
      queryClient.invalidateQueries({ queryKey: ["usuarios", "listar"] });
      queryClient.invalidateQueries({ queryKey: ["usuario", usuarioId] });
      toast.success(response.message);
      navigate(paths.admin.usuarios);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleFormSubmit = (formData: UsuarioFormData) => {
    mutation.mutate({ formData, usuarioId });
  };

  return (
    <div className="font-preset w-full space-y-3 px-2 py-3">
      <section className="flex flex-col gap-3 rounded-lg border border-border bg-card px-3 py-3 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Administracion
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Editar usuario
          </h1>
        </div>

        <Link
          to={paths.admin.usuarios}
          className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-xs font-semibold uppercase tracking-wide text-primary-foreground transition hover:opacity-90"
        >
          Volver
        </Link>
      </section>

      <section className="grid grid-cols-1 gap-1 border-y border-border bg-card md:grid-cols-4">
        <article className="border-b border-border px-3 py-3 md:border-r md:border-b-0">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Usuario
          </p>
          <p className="mt-1 text-lg font-semibold tracking-tight text-foreground">
            {data.lastName}, {data.name}
          </p>
        </article>

        <article className="border-b border-border px-3 py-3 md:border-r md:border-b-0">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Estado
          </p>
          <p className="mt-1 text-lg font-semibold tracking-tight text-foreground">
            {data.enable ? "Activo" : "Inactivo"}
          </p>
        </article>

        <article className="border-b border-border px-3 py-3 md:border-r md:border-b-0">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Email
          </p>
          <p className="mt-1 break-all text-sm font-medium text-foreground">
            {data.email}
          </p>
        </article>

        <article className="px-3 py-3">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Sucursal predeterminada
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {data.sucursalPredeterminada?.nombre ?? "Sin asignar"}
          </p>
        </article>
      </section>

      <form
        className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm"
        onSubmit={handleSubmit(handleFormSubmit)}
        noValidate
      >
        <div className="border-b border-border px-3 py-3">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Datos del usuario
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Actualiza los datos, la unidad de negocio, la sucursal
            predeterminada y los modulos habilitados.
          </p>
        </div>

        <div className="p-3">
          <UsuarioForm register={register} control={control} errors={errors} />
        </div>

        <div className="flex flex-col gap-3 border-t border-border bg-muted px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            Revisa los datos antes de guardar la edicion.
          </div>

          <input
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex cursor-pointer justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold uppercase text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            value={mutation.isPending ? "Guardando..." : "Guardar cambios"}
          />
        </div>
      </form>
    </div>
  );
}
