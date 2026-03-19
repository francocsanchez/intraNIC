import { createUsuario } from "@/api/usuarioAPI";
import UsuarioForm from "@/components/usuario/UsuarioForm";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

export type UsuarioFormData = {
  name: string;
  lastName: string;
  email: string;
  numberSaleNic: number;
  numberSaleLiess: number;
  role: string[];
  company: string[];
};

export default function CreateUsuarioView() {
  const navigate = useNavigate();

  const initialValues: UsuarioFormData = {
    name: "",
    lastName: "",
    email: "",
    numberSaleNic: 0,
    numberSaleLiess: 0,
    role: [],
    company: [],
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UsuarioFormData>({
    defaultValues: initialValues,
  });

  const mutation = useMutation({
    mutationFn: createUsuario,
    onError: (error: Error) => {
      toast.error(error.message)},
    onSuccess: (response: { message: string }) => {
      toast.success(response.message);
      navigate("/usuarios");
    },
  });

  return (
    <div className="w-full px-4 py-6 space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Administración</p>

          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Crear usuario</h1>
        </div>

        <Link
          to="/usuarios"
          className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-gray-900"
        >
          Volver
        </Link>
      </section>

      <form
        className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
        noValidate
        onSubmit={handleSubmit((formData) => mutation.mutate(formData))}
      >
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold tracking-tight text-gray-900">Datos del usuario</h2>
          <p className="mt-1 text-sm text-gray-500">Completá la información principal, roles, compañías y vendedor asociado.</p>
        </div>

        <div className="p-6">
          <UsuarioForm register={register} errors={errors} />
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-500">Los campos obligatorios deben completarse antes de guardar.</div>

          <input
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex cursor-pointer justify-center rounded-lg bg-black px-6 py-2.5 text-sm font-semibold uppercase text-white shadow-sm transition-colors hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
            value={mutation.isPending ? "Creando..." : "Crear usuario"}
          />
        </div>
      </form>
    </div>
  );
}
