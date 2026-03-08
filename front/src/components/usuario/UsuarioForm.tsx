import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { getVendedoresNic } from "@/api/dms/dmsAPI";
import type { UsuarioFormData } from "@/views/admin/usuarios/CrearUsuarioView";


type Vendedor = {
  codigo: number;
  vendedor: string;
};

type UsuarioFormProps = {
  register: UseFormRegister<UsuarioFormData>;
  errors: FieldErrors<UsuarioFormData>;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-red-600">{message}</p>;
}

export default function UsuarioForm({ register, errors }: UsuarioFormProps) {
  const { data: vendedoresResponse, isLoading } = useQuery({
    queryKey: ["vendedores"],
    queryFn: getVendedoresNic,
  });

  const vendedores: Vendedor[] = vendedoresResponse?.data ?? [];

  return (
   <div className="space-y-6">
  <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
    <div className="space-y-2">
      <label
        htmlFor="name"
        className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500"
      >
        Nombre
      </label>
      <input
        id="name"
        type="text"
        placeholder="Ej: Franco"
        className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-gray-500"
        {...register("name", { required: "El nombre es obligatorio" })}
      />
      <FieldError message={errors.name?.message} />
    </div>

    <div className="space-y-2">
      <label
        htmlFor="lastName"
        className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500"
      >
        Apellido
      </label>
      <input
        id="lastName"
        type="text"
        placeholder="Ej: Sánchez"
        className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-gray-500"
        {...register("lastName", { required: "El apellido es obligatorio" })}
      />
      <FieldError message={errors.lastName?.message} />
    </div>

    <div className="space-y-2">
      <label
        htmlFor="email"
        className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500"
      >
        Correo electrónico
      </label>
      <input
        id="email"
        type="email"
        placeholder="usuario@nipponcar.com.ar"
        className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-gray-500"
        {...register("email", {
          required: "El email es obligatorio",
          pattern: { value: /\S+@\S+\.\S+/, message: "Email no válido" },
        })}
      />
      <FieldError message={errors.email?.message} />
    </div>
  </section>

  <section className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
    <div className="border-b border-gray-200 px-5 py-4">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
        Compañías
      </div>
      <div className="mt-1 text-xs text-gray-500">
        Seleccioná una o más unidades de negocio.
      </div>
    </div>

    <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-3">
      <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 hover:bg-gray-100">
        <input
          type="checkbox"
          value="convencional"
          {...register("company", {
            required: "Debe seleccionar al menos una compañía",
          })}
          className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black/20"
        />
        <span className="text-sm font-medium text-gray-800">Convencional</span>
      </label>

      <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 hover:bg-gray-100">
        <input
          type="checkbox"
          value="usados"
          {...register("company", {
            required: "Debe seleccionar al menos una compañía",
          })}
          className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black/20"
        />
        <span className="text-sm font-medium text-gray-800">Usados</span>
      </label>

      <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 hover:bg-gray-100">
        <input
          type="checkbox"
          value="liess"
          {...register("company", {
            required: "Debe seleccionar al menos una compañía",
          })}
          className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black/20"
        />
        <span className="text-sm font-medium text-gray-800">Liess</span>
      </label>
    </div>

    <div className="px-5 pb-5">
      <FieldError message={errors.company?.message as string | undefined} />
    </div>
  </section>

  <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
  <div className="space-y-2">
    <label
      htmlFor="role"
      className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500"
    >
      Roles
    </label>
    <select
      id="role"
      multiple
      className="min-h-[120px] w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-gray-500"
      {...register("role", {
        required: "Debe seleccionar al menos un rol",
      })}
    >
      <option value="vendedor">Vendedor</option>
      <option value="stock">Stock</option>
      <option value="supervisor">Supervisor</option>
      <option value="admin">Admin</option>
    </select>
    <FieldError message={errors.role?.message as string | undefined} />
    <p className="text-xs text-gray-500">
      Usá Ctrl/Cmd + click para seleccionar múltiples opciones.
    </p>
  </div>

  <div className="space-y-6">
    <div className="space-y-2">
      <label
        htmlFor="numberSaleNic"
        className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500"
      >
        Vendedor NIC
      </label>
      <select
        id="numberSaleNic"
        className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-gray-500"
        {...register("numberSaleNic", { valueAsNumber: true })}
      >
        <option value={0}>-- Seleccioná un vendedor --</option>
        {vendedores.map((vendedor) => (
          <option key={vendedor.codigo} value={vendedor.codigo}>
            {vendedor.vendedor}
          </option>
        ))}
      </select>
      {isLoading && (
        <p className="text-xs text-gray-500">Cargando vendedores...</p>
      )}
    </div>

    <div className="space-y-2">
      <label
        htmlFor="numberSaleLiess"
        className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500"
      >
        Vendedor Liess
      </label>
      <input
        id="numberSaleLiess"
        type="number"
        placeholder="Ej: 0"
        className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-gray-500"
        {...register("numberSaleLiess", { valueAsNumber: true })}
      />
    </div>
  </div>
</section>
</div>
  );
}
