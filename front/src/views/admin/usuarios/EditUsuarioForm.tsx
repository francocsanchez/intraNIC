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
  sucursalSiacCodigo?: number | null;
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
      sucursalSiacCodigo: data.sucursalSiacCodigo ? String(data.sucursalSiacCodigo) : "",
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
    <div className="font-preset w-full space-y-2 px-2 py-2">
      <section className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 shadow-sm">
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="text-base font-semibold tracking-tight text-foreground">Editar usuario</h1>
          <span className="truncate rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {data.lastName}, {data.name}
          </span>
        </div>

        <Link
          to={paths.admin.usuarios}
          className="text-xs font-semibold text-primary hover:underline hover:underline-offset-4"
        >
          Volver
        </Link>
      </section>

      <form
        className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm"
        onSubmit={handleSubmit(handleFormSubmit)}
        noValidate
      >
        <div className="border-b border-border px-3 py-2">
          <h2 className="text-sm font-semibold text-foreground">Datos, permisos y asignaciones</h2>
        </div>

        <div className="p-3">
          <UsuarioForm register={register} control={control} errors={errors} />
        </div>

        <div className="flex justify-end border-t border-border bg-muted px-3 py-2">

          <input
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex cursor-pointer justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            value={mutation.isPending ? "Guardando..." : "Guardar cambios"}
          />
        </div>
      </form>
    </div>
  );
}
