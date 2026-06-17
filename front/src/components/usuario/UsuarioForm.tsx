import { Controller, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { getVendedoresNic } from "@/api/dms/dmsAPI";
import { moduleLabels, moduleSections, type ModuleKey } from "@/constants/modules";
import type { UsuarioFormData } from "@/views/admin/usuarios/CrearUsuarioView";

type Vendedor = {
  codigo: number;
  vendedor: string;
};

type UsuarioFormProps = {
  register: UseFormRegister<UsuarioFormData>;
  control: Control<UsuarioFormData>;
  errors: FieldErrors<UsuarioFormData>;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-red-600">{message}</p>;
}

export default function UsuarioForm({ register, control, errors }: UsuarioFormProps) {
  const { data: vendedoresResponse, isLoading } = useQuery({
    queryKey: ["vendedores"],
    queryFn: getVendedoresNic,
  });

  const vendedores: Vendedor[] = vendedoresResponse?.data ?? [];

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-2">
          <label htmlFor="name" className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
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
          <label htmlFor="lastName" className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            Apellido
          </label>
          <input
            id="lastName"
            type="text"
            placeholder="Ej: Sanchez"
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-gray-500"
            {...register("lastName", { required: "El apellido es obligatorio" })}
          />
          <FieldError message={errors.lastName?.message} />
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            Correo electronico
          </label>
          <input
            id="email"
            type="email"
            placeholder="usuario@nipponcar.com.ar"
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-gray-500"
            {...register("email", {
              required: "El email es obligatorio",
              pattern: { value: /\S+@\S+\.\S+/, message: "Email no valido" },
            })}
          />
          <FieldError message={errors.email?.message} />
        </div>

        <div className="space-y-2">
          <label htmlFor="celular" className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            Celular
          </label>
          <input
            id="celular"
            type="text"
            inputMode="numeric"
            placeholder="Ej: 1123456789"
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-gray-500"
            {...register("celular", {
              setValueAs: (value) => (typeof value === "string" ? value.replace(/\D/g, "") : ""),
              validate: (value) => {
                if (!value) return true;
                if (!/^\d+$/.test(value)) return "El celular solo puede contener numeros";
                if (value.startsWith("0")) return "No ingreses el 0 inicial";
                if (value.startsWith("549")) return "No ingreses el prefijo +549";
                if (value.startsWith("54")) return "No ingreses el codigo de pais 54";
                if (value.startsWith("15")) return "No ingreses el 15";
                if (value.length < 8 || value.length > 13) return "Ingresa entre 8 y 13 digitos";
                return true;
              },
            })}
          />
          <p className="text-xs text-gray-500">Campo opcional. Cargalo sin `0`, sin `15` y sin `+549`.</p>
          <FieldError message={errors.celular?.message} />
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-5 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Modulos</div>
          <div className="mt-1 text-xs text-gray-500">Marca los modulos que queres habilitar para este usuario.</div>
        </div>

        <div className="space-y-5 p-5">
          {moduleSections.map((section) => (
            <div key={section.title} className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">{section.title}</div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {section.modules.map((moduleKey) => (
                  <Controller
                    key={moduleKey}
                    control={control}
                    name={`modules.${moduleKey}` as const}
                    render={({ field }) => (
                      <label className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 hover:bg-gray-100">
                        <span className="text-sm font-medium text-gray-800">{moduleLabels[moduleKey as ModuleKey]}</span>

                        <input
                          type="checkbox"
                          checked={Number(field.value ?? 0) === 1}
                          onChange={(event) => field.onChange(event.target.checked ? 1 : 0)}
                          className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black/20"
                        />
                      </label>
                    )}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="role" className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
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
            <option value="gerente">Gerente</option>
            <option value="supervisor">Supervisor</option>
            <option value="superAdmin">Super Admin</option>
            <option value="stock">Stock</option>
            <option value="reventa">Reventa</option>
            <option value="administracion">Administracion</option>
            <option value="admin">Admin</option>
          </select>
          <FieldError message={errors.role?.message as string | undefined} />
          <p className="text-xs text-gray-500">Usa Ctrl/Cmd + click para seleccionar multiples opciones.</p>
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
              <option value={0}>-- Selecciona un vendedor --</option>
              {vendedores.map((vendedor) => (
                <option key={vendedor.codigo} value={vendedor.codigo}>
                  {vendedor.vendedor}
                </option>
              ))}
            </select>
            {isLoading ? <p className="text-xs text-gray-500">Cargando vendedores...</p> : null}
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
