import { updateUsuarioById } from "@/api/usuarioAPI";
import UsuarioForm from "@/components/usuario/UsuarioForm";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

type Usuario = {
  _id: string;
  email: string;
  name: string;
  lastName: string;
  enable: boolean;
  numberSaleNic: number;
  numberSaleLiess: number;
  role: string[];
  company: string[];
};

export type UsuarioFormData = {
  name: string;
  lastName: string;
  email: string;
  numberSaleNic: number;
  numberSaleLiess: number;
  role: string[];
  company: string[];
};

type EditUsuarioFormProps = {
  data: Usuario;
  usuarioId: Usuario["_id"];
};

export default function EditUsuarioForm({ data, usuarioId }: EditUsuarioFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UsuarioFormData>({
    defaultValues: {
      name: data.name,
      lastName: data.lastName,
      email: data.email,
      numberSaleNic: data.numberSaleNic,
      numberSaleLiess: data.numberSaleLiess,
      company: data.company,
      role: data.role,
    },
  });

  const mutation = useMutation({
    mutationFn: updateUsuarioById,
    onSuccess: (response: { message: string }) => {
      queryClient.invalidateQueries({ queryKey: ["usuarios", "listar"] });
      queryClient.invalidateQueries({ queryKey: ["usuario", usuarioId] });
      toast.success(response.message);
      navigate("/usuarios");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleFormSubmit = (formData: UsuarioFormData) => {
    mutation.mutate({ formData, usuarioId });
  };

  return (
    <div className="w-full px-4 py-6 space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Administración</p>

          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Editar usuario</h1>
        </div>

        <Link
          to="/usuarios"
          className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-gray-900"
        >
          Volver
        </Link>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Usuario</p>
          <p className="mt-2 text-lg font-semibold tracking-tight text-gray-900">
            {data.lastName}, {data.name}
          </p>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Estado</p>
          <p className="mt-2 text-lg font-semibold tracking-tight text-gray-900">{data.enable ? "Activo" : "Inactivo"}</p>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Email</p>
          <p className="mt-2 text-sm font-medium break-all text-gray-900">{data.email}</p>
        </article>
      </section>

      <form className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm" onSubmit={handleSubmit(handleFormSubmit)} noValidate>
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold tracking-tight text-gray-900">Datos del usuario</h2>
          <p className="mt-1 text-sm text-gray-500">Actualizá los datos y guardá los cambios.</p>
        </div>

        <div className="p-6">
          <UsuarioForm register={register} errors={errors} />
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-500">Revisá los datos antes de guardar la edición.</div>

          <input
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex cursor-pointer justify-center rounded-lg bg-black px-6 py-2.5 text-sm font-semibold uppercase text-white shadow-sm transition-colors hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
            value={mutation.isPending ? "Guardando..." : "Guardar cambios"}
          />
        </div>
      </form>
    </div>
  );
}
