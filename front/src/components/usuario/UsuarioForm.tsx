import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { getVendedoresNic } from "@/api/dms/dmsAPI";
import { getSucursalesEntrega } from "@/api/entregasAPI";
import { getUnidadesNegocio } from "@/api/unidadNegocioAPI";
import {
  moduleLabels,
  moduleSections,
  type ModuleKey,
} from "@/constants/modules";
import type { UsuarioFormData } from "@/views/admin/usuarios/formTypes";
import type { SucursalEntrega, UnidadNegocio } from "@/types/index";

type Vendedor = {
  codigo: number;
  vendedor: string;
};

type UsuarioFormProps = {
  register: UseFormRegister<UsuarioFormData>;
  control: Control<UsuarioFormData>;
  errors: FieldErrors<UsuarioFormData>;
  showPasswordField?: boolean;
};

const roleOptions = [
  { value: "vendedor", label: "Vendedor" },
  { value: "ssi", label: "SSI" },
  { value: "coordinador", label: "Coordinador" },
  { value: "accesorios", label: "Accesorios" },
  { value: "entrega", label: "Entrega" },
  { value: "gerente", label: "Gerente" },
  { value: "supervisor", label: "Supervisor" },
  { value: "superAdmin", label: "Super Admin" },
  { value: "stock", label: "Stock" },
  { value: "administracion", label: "Administracion" },
] as const;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-destructive">{message}</p>;
}

export default function UsuarioForm({
  register,
  control,
  errors,
  showPasswordField = false,
}: UsuarioFormProps) {
  const { data: vendedoresResponse, isLoading } = useQuery({
    queryKey: ["vendedores"],
    queryFn: getVendedoresNic,
  });
  const { data: sucursalesResponse, isLoading: isLoadingSucursales } = useQuery(
    {
      queryKey: ["entregas", "sucursales"],
      queryFn: getSucursalesEntrega,
    },
  );
  const { data: unidadesResponse, isLoading: isLoadingUnidades } = useQuery({
    queryKey: ["unidades-negocio", "usuarios-form"],
    queryFn: () => getUnidadesNegocio(true),
  });

  const vendedores: Vendedor[] = vendedoresResponse?.data ?? [];
  const sucursales: SucursalEntrega[] = sucursalesResponse?.data ?? [];
  const unidadesNegocio: UnidadNegocio[] = unidadesResponse?.data ?? [];

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
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
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring"
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
            placeholder="Ej: Sanchez"
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring"
            {...register("lastName", {
              required: "El apellido es obligatorio",
            })}
          />
          <FieldError message={errors.lastName?.message} />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500"
          >
            Correo electronico
          </label>
          <input
            id="email"
            type="email"
            placeholder="usuario@nipponcar.com.ar"
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring"
            {...register("email", {
              required: "El email es obligatorio",
              pattern: { value: /\S+@\S+\.\S+/, message: "Email no valido" },
            })}
          />
          <FieldError message={errors.email?.message} />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="unidadNegocio"
            className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500"
          >
            Unidad de negocio
          </label>
          <select
            id="unidadNegocio"
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring"
            {...register("unidadNegocio")}
          >
            <option value="">-- Sin asignar --</option>
            {unidadesNegocio.map((unidad) => (
              <option key={unidad._id} value={unidad._id}>
                {unidad.nombre}
                {unidad.activo ? "" : " (Inactiva)"}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500">
            Segmenta la agenda comercial y agrupa usuarios sin reemplazar el
            campo tecnico `company`.
          </p>
          {isLoadingUnidades ? (
            <p className="text-xs text-gray-500">
              Cargando unidades de negocio...
            </p>
          ) : null}
          <FieldError message={errors.unidadNegocio?.message} />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="sucursalPredeterminada"
            className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500"
          >
            Sucursal predeterminada
          </label>
          <select
            id="sucursalPredeterminada"
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring"
            {...register("sucursalPredeterminada")}
          >
            <option value="">-- Sin asignar --</option>
            {sucursales.map((sucursal) => (
              <option key={sucursal._id} value={sucursal._id}>
                {sucursal.nombre}
                {sucursal.activa ? "" : " (Inactiva)"}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500">
            Se usa como sucursal inicial en entregas y pendientes, pero no
            limita el acceso a otras sucursales.
          </p>
          {isLoadingSucursales ? (
            <p className="text-xs text-gray-500">
              Cargando sucursales de entrega...
            </p>
          ) : null}
          <FieldError message={errors.sucursalPredeterminada?.message} />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="celular"
            className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500"
          >
            Celular
          </label>
          <input
            id="celular"
            type="text"
            inputMode="numeric"
            placeholder="Ej: 1123456789"
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring"
            {...register("celular", {
              setValueAs: (value) =>
                typeof value === "string" ? value.replace(/\D/g, "") : "",
              validate: (value) => {
                if (!value) return true;
                if (!/^\d+$/.test(value))
                  return "El celular solo puede contener numeros";
                if (value.startsWith("0")) return "No ingreses el 0 inicial";
                if (value.startsWith("549"))
                  return "No ingreses el prefijo +549";
                if (value.startsWith("54"))
                  return "No ingreses el codigo de pais 54";
                if (value.startsWith("15")) return "No ingreses el 15";
                if (value.length < 8 || value.length > 13)
                  return "Ingresa entre 8 y 13 digitos";
                return true;
              },
            })}
          />
          <p className="text-xs text-gray-500">
            Campo opcional. Cargalo sin `0`, sin `15` y sin `+549`.
          </p>
          <FieldError message={errors.celular?.message} />
        </div>

        {showPasswordField ? (
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500"
            >
              Contrasena inicial
            </label>
            <input
              id="password"
              type="password"
              placeholder="Minimo 8 caracteres"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring"
              {...register("password", {
                required: "La contrasena es obligatoria",
                minLength: {
                  value: 8,
                  message: "La contrasena debe tener al menos 8 caracteres",
                },
              })}
            />
            <p className="text-xs text-gray-500">
              Esta sera la contrasena con la que el usuario ingresara por
              primera vez.
            </p>
            <FieldError message={errors.password?.message} />
          </div>
        ) : null}
      </section>

      <section className="border-t border-border pt-3">
        <div className="pb-2">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Modulos
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Marca los modulos que queres habilitar para este usuario.
          </div>
        </div>

        <div className="space-y-3">
          {moduleSections.map((section) => (
            <div
              key={section.title}
              className="border-t border-border pt-3 first:border-t-0 first:pt-1"
            >
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {section.title}
              </div>

              <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 xl:grid-cols-4">
                {section.modules.map((moduleKey) => (
                  <Controller
                    key={moduleKey}
                    control={control}
                    name={`modules.${moduleKey}` as `modules.${ModuleKey}`}
                    render={({ field }) => (
                      <label className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2 transition-colors hover:bg-muted">
                        <span className="text-xs font-medium leading-4 text-foreground">
                          {moduleLabels[moduleKey as ModuleKey]}
                        </span>

                        <input
                          type="checkbox"
                          checked={Number(field.value ?? 0) === 1}
                          onChange={(event) =>
                            field.onChange(event.target.checked ? 1 : 0)
                          }
                          className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
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

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
            className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring"
            {...register("role", {
              required: "Debe seleccionar al menos un rol",
            })}
          >
            {roleOptions.map((roleOption) => (
              <option key={roleOption.value} value={roleOption.value}>
                {roleOption.label}
              </option>
            ))}
          </select>
          <FieldError message={errors.role?.message as string | undefined} />
          <p className="text-xs text-gray-500">
            Usa Ctrl/Cmd + click para seleccionar multiples opciones.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="numberSaleNic"
              className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500"
            >
              Vendedor NIC
            </label>
            <select
              id="numberSaleNic"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring"
              {...register("numberSaleNic", { valueAsNumber: true })}
            >
              <option value={0}>-- Selecciona un vendedor --</option>
              {vendedores.map((vendedor) => (
                <option key={vendedor.codigo} value={vendedor.codigo}>
                  {vendedor.vendedor}
                </option>
              ))}
            </select>
            {isLoading ? (
              <p className="text-xs text-gray-500">Cargando vendedores...</p>
            ) : null}
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
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring"
              {...register("numberSaleLiess", { valueAsNumber: true })}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
