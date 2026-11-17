import AutocompleteSelect from "@/components/ui/autocomplete-select";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getSucursalesSiac, getVendedoresNic } from "@/api/dms/dmsAPI";
import { getSucursalesEntrega } from "@/api/entregasAPI";
import { getUnidadesNegocio } from "@/api/unidadNegocioAPI";
import {
  moduleLabels,
  moduleSections,
  type ModuleKey,
} from "@/constants/modules";
import type { UsuarioFormData } from "@/views/admin/usuarios/formTypes";
import type { SucursalEntrega, SucursalSiac, UnidadNegocio } from "@/types/index";

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
  { value: "repuestos", label: "Repuestos" },
  { value: "administracion", label: "Administracion" },
] as const;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-destructive">{message}</p>;
}

function RolesAutocomplete({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleRoles = roleOptions.filter((role) => role.label.toLocaleLowerCase().includes(normalizedQuery));
  const selectedRoles = roleOptions.filter((role) => value.includes(role.value));

  return (
    <div className="space-y-2">
      <Combobox value={selectedRoles} onChange={(roles: typeof roleOptions[number][]) => onChange(roles.map((role) => role.value))} multiple immediate>
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground" />
          <ComboboxInput aria-label="Buscar roles" displayValue={() => query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar o seleccionar roles..." className="h-9 w-full rounded-md border border-input bg-background px-9 pr-9 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring" />
          <ComboboxButton className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"><ChevronDown size={16} /></ComboboxButton>
          <ComboboxOptions transition className="absolute left-0 right-0 z-20 mt-1 max-h-56 overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg transition duration-150 ease-out empty:invisible data-[closed]:scale-95 data-[closed]:opacity-0">
            {visibleRoles.map((role) => <ComboboxOption key={role.value} value={role}>{({ focus, selected }) => <div className={`flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm ${focus ? "bg-muted" : ""}`}><span className={`flex h-4 w-4 items-center justify-center rounded-sm border ${selected ? "border-border bg-primary text-primary-foreground" : "border-input bg-background"}`}>{selected ? <Check size={12} /> : null}</span>{role.label}</div>}</ComboboxOption>)}
          </ComboboxOptions>
        </div>
      </Combobox>
      <div className="min-h-9 rounded-md border border-dashed border-border bg-muted px-2 py-2">
        {selectedRoles.length ? <div className="flex flex-wrap gap-1">{selectedRoles.map((role) => <span key={role.value} className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-xs font-medium text-foreground">{role.label}<button type="button" onClick={() => onChange(value.filter((current) => current !== role.value))} className="text-muted-foreground hover:text-foreground" aria-label={`Quitar ${role.label}`}><X size={13} /></button></span>)}</div> : <p className="text-sm text-muted-foreground">Todavía no seleccionaste roles.</p>}
      </div>
    </div>
  );
}

function VendedorNicAutocomplete({ value, onChange, vendedores }: { value: number; onChange: (value: number) => void; vendedores: Vendedor[] }) {
  const [query, setQuery] = useState("");
  const selected = useMemo(() => vendedores.find((vendedor) => vendedor.codigo === value) ?? null, [vendedores, value]);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visible = normalizedQuery.length >= 3 ? vendedores.filter((vendedor) => vendedor.vendedor.toLocaleLowerCase().includes(normalizedQuery) || String(vendedor.codigo).includes(normalizedQuery)) : [];

  return (
    <Combobox value={selected} onChange={(vendedor: Vendedor | null) => { onChange(vendedor?.codigo ?? 0); setQuery(""); }} onClose={() => setQuery("")}>
      <div className="relative">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground" />
        <ComboboxInput aria-label="Buscar vendedor NIC" displayValue={() => query || selected?.vendedor || ""} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar vendedor o código..." className="h-9 w-full rounded-md border border-input bg-background px-9 pr-9 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring" />
        <ComboboxButton className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"><ChevronDown size={16} /></ComboboxButton>
        <ComboboxOptions transition className="absolute left-0 right-0 z-20 mt-1 max-h-56 overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg transition duration-150 ease-out empty:invisible data-[closed]:scale-95 data-[closed]:opacity-0">
          <ComboboxOption value={null} className="cursor-pointer rounded-sm px-2 py-1.5 text-sm text-muted-foreground data-focus:bg-muted">Sin asignar</ComboboxOption>
          {normalizedQuery.length < 3 ? <p className="px-2 py-2 text-xs text-muted-foreground">Ingresá al menos 3 caracteres para buscar.</p> : visible.length ? visible.map((vendedor) => <ComboboxOption key={vendedor.codigo} value={vendedor} className="cursor-pointer rounded-sm px-2 py-1.5 text-sm data-focus:bg-muted"><span className="font-medium">{vendedor.vendedor}</span><span className="ml-2 text-xs text-muted-foreground">{vendedor.codigo}</span></ComboboxOption>) : <p className="px-2 py-2 text-xs text-muted-foreground">No se encontraron vendedores.</p>}
        </ComboboxOptions>
      </div>
    </Combobox>
  );
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
  const {
    data: sucursalesSiacResponse,
    isLoading: isLoadingSucursalesSiac,
    isError: isSucursalesSiacError,
    error: sucursalesSiacError,
    refetch: refetchSucursalesSiac,
  } = useQuery({
    queryKey: ["dms", "sucursales", "usuarios-form"],
    queryFn: getSucursalesSiac,
  });

  const vendedores: Vendedor[] = vendedoresResponse?.data ?? [];
  const sucursales: SucursalEntrega[] = sucursalesResponse?.data ?? [];
  const unidadesNegocio: UnidadNegocio[] = unidadesResponse?.data ?? [];
  const sucursalesSiac: SucursalSiac[] = sucursalesSiacResponse?.data ?? [];

  return (
    <div className="space-y-3">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-1">
          <label
            htmlFor="name"
            className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
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

        <div className="space-y-1">
          <label htmlFor="sucursalSiacCodigo" className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Sucursal SIAC
          </label>
          <Controller control={control} name="sucursalSiacCodigo" render={({ field }) => <AutocompleteSelect id="sucursalSiacCodigo" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring" value={field.value ?? ""} name={field.name} onBlur={field.onBlur} onChange={field.onChange}>
            <option value="">-- Sin asignar --</option>
            {sucursalesSiac.map((sucursal) => <option key={sucursal.codigo} value={sucursal.codigo}>{sucursal.nombre}</option>)}
          </AutocompleteSelect>} />
          {isLoadingSucursalesSiac ? <p className="text-xs text-muted-foreground">Cargando sucursales SIAC...</p> : null}
          {isSucursalesSiacError ? (
            <div className="flex items-center gap-2 text-xs text-destructive">
              <span>{sucursalesSiacError instanceof Error ? sucursalesSiacError.message : "No se pudieron cargar las sucursales SIAC."}</span>
              <button type="button" className="underline" onClick={() => void refetchSucursalesSiac()}>Reintentar</button>
            </div>
          ) : null}
          <FieldError message={errors.sucursalSiacCodigo?.message} />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="lastName"
            className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
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

        <div className="space-y-1">
          <label
            htmlFor="email"
            className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
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

        <div className="space-y-1">
          <label
            htmlFor="unidadNegocio"
            className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
          >
            Unidad de negocio
          </label>
          <Controller control={control} name="unidadNegocio" render={({ field }) => <AutocompleteSelect id="unidadNegocio" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring" value={field.value ?? ""} name={field.name} onBlur={field.onBlur} onChange={field.onChange}>
            <option value="">-- Sin asignar --</option>
            {unidadesNegocio.map((unidad) => <option key={unidad._id} value={unidad._id}>{unidad.nombre}{unidad.activo ? "" : " (Inactiva)"}</option>)}
          </AutocompleteSelect>} />
          {isLoadingUnidades ? (
            <p className="text-xs text-muted-foreground">
              Cargando unidades de negocio...
            </p>
          ) : null}
          <FieldError message={errors.unidadNegocio?.message} />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="sucursalPredeterminada"
            className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
          >
            Sucursal predeterminada
          </label>
          <Controller control={control} name="sucursalPredeterminada" render={({ field }) => <AutocompleteSelect id="sucursalPredeterminada" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring" value={field.value ?? ""} name={field.name} onBlur={field.onBlur} onChange={field.onChange}>
            <option value="">-- Sin asignar --</option>
            {sucursales.map((sucursal) => <option key={sucursal._id} value={sucursal._id}>{sucursal.nombre}{sucursal.activa ? "" : " (Inactiva)"}</option>)}
          </AutocompleteSelect>} />
          {isLoadingSucursales ? (
            <p className="text-xs text-muted-foreground">
              Cargando sucursales de entrega...
            </p>
          ) : null}
          <FieldError message={errors.sucursalPredeterminada?.message} />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="celular"
            className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
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
          <FieldError message={errors.celular?.message} />
        </div>

        {showPasswordField ? (
          <div className="space-y-1">
            <label
              htmlFor="password"
              className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
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
            <FieldError message={errors.password?.message} />
          </div>
        ) : null}
      </section>

      <section className="border-t border-border pt-2">
        <div className="pb-1.5">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Modulos
          </div>
        </div>

        <div className="space-y-2">
          {moduleSections.map((section) => (
            <div
              key={section.title}
              className="border-t border-border pt-2 first:border-t-0 first:pt-0"
            >
              <div className="mb-1 text-primary font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {section.title}
              </div>

              <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 xl:grid-cols-5">
                {section.modules.map((moduleKey) => (
                  <Controller
                    key={moduleKey}
                    control={control}
                    name={`modules.${moduleKey}` as `modules.${ModuleKey}`}
                    render={({ field }) => (
                      <label className={`flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-xs font-medium transition-colors hover:bg-muted ${Number(field.value ?? 0) === 1 ? "text-primary" : "text-foreground"}`}>
                        <input
                          type="checkbox"
                          checked={Number(field.value ?? 0) === 1}
                          onChange={(event) =>
                            field.onChange(event.target.checked ? 1 : 0)
                          }
                          className="h-4 w-4 shrink-0 rounded border-input accent-primary focus:ring-ring"
                        />
                        <span className="leading-4">
                          {moduleLabels[moduleKey as ModuleKey]}
                        </span>
                      </label>
                    )}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="space-y-1">
          <label
            htmlFor="role"
            className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
          >
            Roles
          </label>
          <Controller
            control={control}
            name="role"
            rules={{ required: "Debe seleccionar al menos un rol" }}
            render={({ field }) => (
              <RolesAutocomplete value={field.value ?? []} onChange={field.onChange} />
            )}
          />
          <FieldError message={errors.role?.message as string | undefined} />
        </div>

        <div className="space-y-3 lg:col-span-2 lg:grid lg:grid-cols-2">
          <div className="space-y-1">
            <label
              htmlFor="numberSaleNic"
              className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
            >
              Vendedor NIC
            </label>
            <Controller
              control={control}
              name="numberSaleNic"
              render={({ field }) => (
                <VendedorNicAutocomplete
                  value={Number(field.value ?? 0)}
                  onChange={field.onChange}
                  vendedores={vendedores}
                />
              )}
            />
            {isLoading ? (
              <p className="text-xs text-muted-foreground">Cargando vendedores...</p>
            ) : null}
          </div>

          <div className="space-y-1">
            <label
              htmlFor="numberSaleLiess"
              className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
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
