import AutocompleteSelect from "@/components/ui/autocomplete-select";
import {
  addLicitacionUnidad,
  assignLicitacionUnidadInterno,
  createLicitacionAdministracion,
  exportLicitacionAdministracionPdf,
  extendLicitacionMaintenance,
  getLicitacionCatalogos,
  getLicitacionUnidades,
  getLicitacionesAdministracion,
  releaseLicitacionUnidadInterno,
  removeLicitacionAdministracion,
  removeLicitacionUnidad,
  updateLicitacionAdministracion,
  updateLicitacionFlow,
  updateLicitacionUnidadProgress,
  updateLicitacionUnidadesProgress,
  type LicitacionAdministracionPayload,
} from "@/api/licitacionesAdministracionAPI";
import {
  ActionButton,
  DeleteActionButton,
  EditActionButton,
} from "@/components/ui/action-button";
import type {
  LicitacionAdministracion,
  LicitacionEstado,
  LicitacionUnidad,
} from "@/types/index";
import { Dialog, Transition } from "@headlessui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarPlus,
  Edit3,
  FileDown,
  PackagePlus,
  Plus,
  Search,
  ScrollText,
  Trash2,
  X,
} from "lucide-react";
import { Fragment, useState, type ReactNode } from "react";
import { toast } from "sonner";

const stateLabels: Record<LicitacionEstado, string> = {
  PENDIENTE_TECNICA: "Pendiente de técnica",
  ESPERANDO_MANTENIMIENTO: "Esperando vencimiento de mantenimiento de oferta",
  PENDIENTE_PREADJUDICADO: "Pendiente de pre-adjudicación",
  PENDIENTE_PAGARE: "Pendiente de pagaré",
  PENDIENTE_OC: "Pendiente de OC",
  ADJUDICADA: "Adjudicada",
  PERDIDA: "Perdida",
};

const stateClass: Record<LicitacionEstado, string> = {
  PENDIENTE_TECNICA: "bg-muted text-muted-foreground",
  ESPERANDO_MANTENIMIENTO: "bg-amber-100 text-amber-900",
  PENDIENTE_PREADJUDICADO: "bg-amber-100 text-amber-900",
  PENDIENTE_PAGARE: "bg-blue-100 text-blue-900",
  PENDIENTE_OC: "bg-blue-100 text-blue-900",
  ADJUDICADA: "bg-emerald-100 text-emerald-900",
  PERDIDA: "bg-red-100 text-red-900",
};

const remainingLabel = (days: number) =>
  days > 0
    ? `${days} día${days === 1 ? "" : "s"}`
    : days === 0
      ? "Vence hoy"
      : "Vencida";

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

function Modal({
  children,
  onClose,
  pending = false,
  panelClassName = "max-w-[96vw]",
}: {
  children: ReactNode;
  onClose: () => void;
  pending?: boolean;
  panelClassName?: string;
}) {
  return (
    <Transition appear show as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={() => !pending && onClose()}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-foreground/40" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-3">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={`w-full ${panelClassName} overflow-hidden rounded-lg border border-border bg-card shadow-xl`}
              >
                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

function DialogHeader({
  title,
  subtitle,
  close,
  pending = false,
}: {
  title: string;
  subtitle?: string;
  close: () => void;
  pending?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border px-3 py-3">
      <div>
        {subtitle ? (
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
        <Dialog.Title className="mt-1 text-xl font-semibold tracking-tight">
          {title}
        </Dialog.Title>
      </div>
      <button
        type="button"
        onClick={close}
        disabled={pending}
        className="rounded-md border border-border p-2 text-muted-foreground hover:bg-muted"
      >
        <X size={18} />
      </button>
    </div>
  );
}

function LicitacionDialog({
  item,
  close,
}: {
  item?: LicitacionAdministracion;
  close: () => void;
}) {
  const client = useQueryClient();
  const [entidad, setEntidad] = useState(item?.entidad ?? "");
  const [cuit, setCuit] = useState(item?.cuit ?? "");
  const [contactoNombre, setContactoNombre] = useState(
    item?.contacto.nombre ?? "",
  );
  const [contactoApellido, setContactoApellido] = useState(
    item?.contacto.apellido ?? "",
  );
  const [contactoTelefono, setContactoTelefono] = useState(
    item?.contacto.telefono ?? "",
  );
  const [fechaApertura, setFechaApertura] = useState(item?.fechaApertura ?? "");
  const [diasMantenimientoOferta, setDiasMantenimientoOferta] = useState(
    item ? String(item.diasMantenimientoOferta) : "",
  );
  const days = Number(diasMantenimientoOferta);
  const invalidDays = !Number.isInteger(days) || days < 1;
  const mutation = useMutation({
    mutationFn: () => {
      const payload: LicitacionAdministracionPayload = {
        entidad,
        cuit,
        contactoNombre,
        contactoApellido,
        contactoTelefono,
        fechaApertura,
        diasMantenimientoOferta: days,
      };
      return item
        ? updateLicitacionAdministracion(item._id, payload)
        : createLicitacionAdministracion(payload);
    },
    onSuccess: (response) => {
      toast.success(response.message);
      client.invalidateQueries({
        queryKey: ["licitaciones", "administracion"],
      });
      close();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  return (
    <Modal onClose={close} pending={mutation.isPending}>
      <DialogHeader
        title={item ? "Editar licitación" : "Cargar licitación"}
        subtitle="Licitaciones · Administración"
        close={close}
        pending={mutation.isPending}
      />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!invalidDays) mutation.mutate();
        }}
      >
        <div className="grid gap-3 p-3 md:grid-cols-2">
          <label className="space-y-1.5 text-sm font-medium md:col-span-2">
            Nombre entidad
            <input
              required
              value={entidad}
              onChange={(event) => setEntidad(event.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            />
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            CUIT
            <input
              required
              value={cuit}
              inputMode="numeric"
              maxLength={13}
              onChange={(event) =>
                setCuit(event.target.value.replace(/[^\d-]/g, ""))
              }
              placeholder="00-00000000-0"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            />
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            Teléfono contacto
            <input
              required
              value={contactoTelefono}
              onChange={(event) => setContactoTelefono(event.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            />
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            Nombre contacto
            <input
              required
              value={contactoNombre}
              onChange={(event) => setContactoNombre(event.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            />
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            Apellido contacto
            <input
              required
              value={contactoApellido}
              onChange={(event) => setContactoApellido(event.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            />
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            Fecha apertura sobre
            <input
              required
              type="date"
              value={fechaApertura}
              onChange={(event) => setFechaApertura(event.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            />
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            Días mantenimiento de oferta
            <input
              required
              type="number"
              min="1"
              step="1"
              value={diasMantenimientoOferta}
              onChange={(event) =>
                setDiasMantenimientoOferta(event.target.value)
              }
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            />
          </label>
          {diasMantenimientoOferta && invalidDays ? (
            <p className="text-sm text-destructive md:col-span-2">
              Ingresá una cantidad entera de días mayor a cero.
            </p>
          ) : null}
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-3 py-3">
          <ActionButton
            type="button"
            variant="outline"
            onClick={close}
            disabled={mutation.isPending}
          >
            Cancelar
          </ActionButton>
          <ActionButton
            type="submit"
            disabled={invalidDays || mutation.isPending}
          >
            {mutation.isPending ? "Guardando..." : "Guardar"}
          </ActionButton>
        </div>
      </form>
    </Modal>
  );
}

function ExtensionDialog({
  item,
  close,
}: {
  item: LicitacionAdministracion;
  close: () => void;
}) {
  const client = useQueryClient();
  const [dias, setDias] = useState("");
  const cantidad = Number(dias);
  const invalid = !Number.isInteger(cantidad) || cantidad < 1;
  const mutation = useMutation({
    mutationFn: () => extendLicitacionMaintenance(item._id, cantidad),
    onSuccess: (response) => {
      toast.success(response.message);
      client.invalidateQueries({
        queryKey: ["licitaciones", "administracion"],
      });
      close();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  return (
    <Modal onClose={close} pending={mutation.isPending}>
      <DialogHeader
        title="Prorrogar mantenimiento"
        subtitle={item.entidad}
        close={close}
        pending={mutation.isPending}
      />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!invalid) mutation.mutate();
        }}
      >
        <div className="space-y-2 p-3">
          <p className="text-sm text-muted-foreground">
            Se sumarán días al mantenimiento actual de{" "}
            {item.diasMantenimientoOferta} días.
          </p>
          <label className="block space-y-1.5 text-sm font-medium">
            Días de prórroga
            <input
              required
              autoFocus
              type="number"
              min="1"
              step="1"
              value={dias}
              onChange={(event) => setDias(event.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            />
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-3 py-3">
          <ActionButton
            type="button"
            variant="outline"
            onClick={close}
            disabled={mutation.isPending}
          >
            Cancelar
          </ActionButton>
          <ActionButton type="submit" disabled={invalid || mutation.isPending}>
            {mutation.isPending ? "Guardando..." : "Agregar días"}
          </ActionButton>
        </div>
      </form>
    </Modal>
  );
}

function UnitsDialog({
  item,
  close,
}: {
  item: LicitacionAdministracion;
  close: () => void;
}) {
  const client = useQueryClient();
  const [versionId, setVersionId] = useState("");
  const [cantidadText, setCantidadText] = useState("");
  const [internos, setInternos] = useState<Record<string, string>>({});
  const catalogsQuery = useQuery({
    queryKey: ["licitaciones", "catalogos"],
    queryFn: getLicitacionCatalogos,
  });
  const unitsQuery = useQuery({
    queryKey: ["licitaciones", "administracion", item._id, "unidades"],
    queryFn: () => getLicitacionUnidades(item._id),
  });
  const cantidad = Number(cantidadText);
  const invalid = !versionId || !Number.isInteger(cantidad) || cantidad < 1;
  const reset = () => {
    setVersionId("");
    setCantidadText("");
  };
  const mutation = useMutation({
    mutationFn: () => addLicitacionUnidad(item._id, { versionId, cantidad }),
    onSuccess: (response) => {
      toast.success(response.message);
      client.setQueryData(
        ["licitaciones", "administracion", item._id, "unidades"],
        { data: response.data },
      );
      reset();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const removeMutation = useMutation({
    mutationFn: ({ unitId, rowIndex }: { unitId: string; rowIndex: number }) =>
      removeLicitacionUnidad(item._id, unitId, rowIndex),
    onSuccess: (response) => {
      toast.success(response.message);
      client.setQueryData(
        ["licitaciones", "administracion", item._id, "unidades"],
        { data: response.data },
      );
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const progressMutation = useMutation({
    mutationFn: ({ unitId, field, value }: { unitId: string; field: "asignada" | "equipadaTransformada" | "arribada" | "patentada" | "pagada" | "entregada"; value: boolean }) => updateLicitacionUnidadProgress(item._id, unitId, field, value),
    onSuccess: (response, variables) => {
      client.setQueryData(
        ["licitaciones", "administracion", item._id, "unidades"],
        { data: response.data },
      );
      void variables;
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const bulkProgressMutation = useMutation({
    mutationFn: async ({
      field,
      value,
      unitIds,
    }: {
      field: "equipadaTransformada" | "arribada" | "patentada" | "pagada" | "entregada";
      value: boolean;
      unitIds: string[];
    }) => {
      try {
        return await updateLicitacionUnidadesProgress(item._id, field, value);
      } catch (error) {
        // Durante un despliegue escalonado el backend anterior interpreta
        // "avance" como un id de unidad. Conservamos la acción masiva usando
        // el endpoint individual que ya existe en esa versión.
        if (!(error instanceof Error) || error.message !== "La unidad no es válida") throw error;
        if (!unitIds.length) throw new Error("No hay unidades para actualizar");
        let response = await updateLicitacionUnidadProgress(item._id, unitIds[0], field, value);
        for (const unitId of unitIds.slice(1)) response = await updateLicitacionUnidadProgress(item._id, unitId, field, value);
        return { ...response, message: `Columna ${value ? "marcada" : "desmarcada"} correctamente` };
      }
    },
    onSuccess: (response) => {
      client.setQueryData(
        ["licitaciones", "administracion", item._id, "unidades"],
        { data: response.data },
      );
      toast.success(response.message);
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const detailsMutation = progressMutation;
  const internoMutation = useMutation({
    mutationFn: ({ unitId, interno }: { unitId: string; interno: number }) => assignLicitacionUnidadInterno(item._id, unitId, interno),
    onSuccess: (response, variables) => {
      client.setQueryData(["licitaciones", "administracion", item._id, "unidades"], { data: response.data });
      setInternos((current) => ({ ...current, [variables.unitId]: "" }));
      toast.success(response.message);
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const releaseInternoMutation = useMutation({
    mutationFn: (unitId: string) => releaseLicitacionUnidadInterno(item._id, unitId),
    onSuccess: (response, unitId) => {
      client.setQueryData(["licitaciones", "administracion", item._id, "unidades"], { data: response.data });
      setInternos((current) => ({ ...current, [unitId]: "" }));
      toast.success(response.message);
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const updateDetails = (...values: unknown[]) => { void values; };
  const units = unitsQuery.data?.data ?? [];
  const unitsByVersion = Array.from(
    units.reduce((summary, unit) => {
      summary.set(
        unit.versionNombre,
        (summary.get(unit.versionNombre) ?? 0) + 1,
      );
      return summary;
    }, new Map<string, number>()),
  );
  return (
    <Modal
      onClose={close}
      pending={mutation.isPending || removeMutation.isPending || progressMutation.isPending || bulkProgressMutation.isPending}
    >
      <DialogHeader
        title="Unidades del pliego"
        subtitle={item.entidad}
        close={close}
        pending={
          mutation.isPending || removeMutation.isPending || progressMutation.isPending || bulkProgressMutation.isPending
        }
      />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!invalid) mutation.mutate();
        }}
      >
        <div className="grid gap-3 border-b border-border p-3 md:grid-cols-[minmax(0,1fr)_120px_auto]">
          <label className="space-y-1 text-sm font-medium">
            Versión
            <AutocompleteSelect
              required
              value={versionId}
              onChange={(event) => setVersionId(event.target.value)}
              disabled={catalogsQuery.isLoading || catalogsQuery.isError}
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value="">Seleccionar</option>
              {catalogsQuery.data?.versiones.map((version) => (
                <option key={version._id} value={version._id}>
                  {version.nombre}
                </option>
              ))}
            </AutocompleteSelect>
          </label>
          <label className="space-y-1 text-sm font-medium">
            Cantidad
            <input
              required
              type="number"
              min="1"
              step="1"
              value={cantidadText}
              onChange={(event) => setCantidadText(event.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            />
          </label>
          <div className="flex items-end gap-1">
            <ActionButton
              type="submit"
              disabled={
                invalid ||
                mutation.isPending ||
                catalogsQuery.isLoading ||
                catalogsQuery.isError
              }
            >
              {mutation.isPending ? "Guardando..." : "Cargar"}
            </ActionButton>
          </div>
          {catalogsQuery.isError ? (
            <p className="text-sm text-destructive md:col-span-4">
              No se pudieron cargar las versiones. Cerrá y reintentá.
            </p>
          ) : null}
        </div>
      </form>
      {units.length ? (
        <p className="border-b border-border px-3 py-2 text-xs text-muted-foreground">
          Total: {units.length} unidad{units.length === 1 ? "" : "es"} ·{" "}
          {unitsByVersion
            .map(([version, total]) => `${version}: ${total}`)
            .join(" · ")}
        </p>
      ) : null}
      <div className="max-h-[46vh] overflow-auto">
        <table className="w-full text-left text-xs [&_th:nth-child(n+10)]:hidden [&_td:nth-child(n+10)]:hidden">
          <thead className="sticky top-0 bg-muted text-[10px] uppercase tracking-[.1em] text-muted-foreground">
            <tr>
              <th className="whitespace-nowrap px-3 py-2">Interno</th>
              <th className="whitespace-nowrap px-3 py-2">Versión</th>
              <th className="whitespace-nowrap px-3 py-2 text-center">Asignada</th>
              {([
                ["equipadaTransformada", "EQ / Transformada"],
                ["arribada", "Arribada"],
                ["patentada", "Patentada"],
                ["pagada", "Pagada"],
                ["entregada", "Entregada"],
              ] as const).map(([field, label]) => {
                const allMarked = units.length > 0 && units.every((unit) => unit[field]);
                return <th key={field} className="whitespace-nowrap px-3 py-2 text-center"><label className="flex cursor-pointer flex-col items-center gap-1"><span>{label}</span><input type="checkbox" checked={allMarked} disabled={!units.length || bulkProgressMutation.isPending || progressMutation.isPending} onChange={(event) => bulkProgressMutation.mutate({ field, value: event.target.checked, unitIds: units.map((unit) => unit._id) })} className="h-3.5 w-3.5 accent-primary" aria-label={`Marcar todas las unidades como ${label}`} title={`Marcar o desmarcar toda la columna ${label}`} /></label></th>;
              })}
              <th className="whitespace-nowrap px-3 py-2 text-center">
                Eliminar
              </th>
              <th className="whitespace-nowrap px-3 py-2">Conversión</th>
              <th className="whitespace-nowrap px-3 py-2">Estado conversión</th>
              <th className="whitespace-nowrap px-3 py-2">Estado</th>
              <th className="whitespace-nowrap px-3 py-2 text-center">EQ / Transformada</th>
              <th className="whitespace-nowrap px-3 py-2 text-center">Arribada</th>
              <th className="whitespace-nowrap px-3 py-2 text-center">Patentada</th>
              <th className="whitespace-nowrap px-3 py-2 text-center">Pagada</th>
              <th className="whitespace-nowrap px-3 py-2 text-center">Entregada</th>
            </tr>
          </thead>
          <tbody>
            {unitsQuery.isLoading ? (
              <tr>
                <td
                  colSpan={11}
                  className="px-3 py-6 text-center text-muted-foreground"
                >
                  Cargando unidades...
                </td>
              </tr>
            ) : unitsQuery.isError ? (
              <tr>
                <td
                  colSpan={11}
                  className="px-3 py-8 text-center text-destructive"
                >
                  {unitsQuery.error instanceof Error
                    ? unitsQuery.error.message
                    : "No se pudieron cargar las unidades."}
                </td>
              </tr>
            ) : units.length ? (
              units.map((unit, rowIndex) => (
                <tr key={unit._id} className="border-t border-border">
                  <td className="px-3 py-1.5">
                    {unit.interno ? (
                      <div className="flex items-center gap-1">
                        <span className="font-medium tabular-nums">{unit.interno}</span>
                        <ActionButton
                          type="button"
                          size="icon-sm"
                          variant="outline"
                          title="Liberar interno"
                          aria-label={`Liberar interno ${unit.interno}`}
                          disabled={internoMutation.isPending || releaseInternoMutation.isPending}
                          onClick={() => {
                            if (window.confirm(`¿Liberar el interno ${unit.interno} de esta unidad?`)) releaseInternoMutation.mutate(unit._id);
                          }}
                        >
                          <X size={14} />
                        </ActionButton>
                      </div>
                    ) : (
                      <div className="flex w-28 gap-1">
                        <input
                          inputMode="numeric"
                          value={
                            internos[unit._id] ??
                            (unit.interno ? String(unit.interno) : "")
                          }
                          onChange={(event) =>
                            setInternos((current) => ({
                              ...current,
                              [unit._id]: event.target.value.replace(/\D/g, ""),
                            }))
                          }
                          className="h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-xs"
                        />
                        <ActionButton
                          type="button"
                          size="icon-sm"
                          variant="outline"
                          title="Buscar interno"
                          aria-label={`Buscar interno para ${unit.versionNombre}`}
                          disabled={
                            internoMutation.isPending ||
                            !(
                              internos[unit._id] ??
                              (unit.interno ? String(unit.interno) : "")
                            )
                          }
                          onClick={() =>
                            internoMutation.mutate({
                              unitId: unit._id,
                              interno: Number(
                                internos[unit._id] ?? unit.interno,
                              ),
                            })
                          }
                        >
                          <Search size={15} />
                        </ActionButton>
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-1.5 font-medium">
                    {unit.versionNombre}
                  </td>
                  <td className="px-3 py-2 text-center">{unit.asignada ? <span className="text-emerald-600">✓</span> : "-"}</td>
                  {(["equipadaTransformada", "arribada", "patentada", "pagada", "entregada"] as const).map((field) => <td key={field} className="px-3 py-2 text-center"><input type="checkbox" checked={unit[field]} onChange={(event) => progressMutation.mutate({ unitId: unit._id, field, value: event.target.checked })} disabled={progressMutation.isPending} className="h-4 w-4 accent-primary" aria-label={`${field} de ${unit.versionNombre}`} /></td>)}
                  <td className="px-3 py-2">
                    <div className="flex justify-center">
                      <DeleteActionButton
                        size="icon-sm"
                        title="Quitar unidad"
                        aria-label={`Quitar ${unit.versionNombre}`}
                        onClick={() => removeMutation.mutate({ unitId: unit._id, rowIndex })}
                        disabled={
                          mutation.isPending ||
                          removeMutation.isPending ||
                          progressMutation.isPending ||
                          bulkProgressMutation.isPending
                        }
                      >
                        <Trash2 />
                      </DeleteActionButton>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-1.5">
                    {unit.colorNombre || "-"}
                  </td>
                  <td className="px-3 py-2">
                    <AutocompleteSelect
                      value={unit.patentamiento ? "si" : "no"}
                      onChange={(event) =>
                        updateDetails(unit, {
                          patentamiento: event.target.value === "si",
                        })
                      }
                      disabled={detailsMutation.isPending}
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="no">No</option>
                      <option value="si">Sí</option>
                    </AutocompleteSelect>
                  </td>
                  <td className="px-3 py-2">
                    <AutocompleteSelect
                      value={unit.flete ? "si" : "no"}
                      onChange={(event) =>
                        updateDetails(unit, {
                          flete: event.target.value === "si",
                        })
                      }
                      disabled={detailsMutation.isPending}
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="no">No</option>
                      <option value="si">Sí</option>
                    </AutocompleteSelect>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      defaultValue={unit.cantidadServicios}
                      aria-label={`Cantidad de servicios de ${unit.versionNombre}`}
                      disabled={detailsMutation.isPending}
                      onBlur={(event) => {
                        const cantidadServicios = Number(event.target.value);
                        if (
                          !Number.isInteger(cantidadServicios) ||
                          cantidadServicios < 0
                        ) {
                          toast.error(
                            "La cantidad de servicios debe ser un entero igual o mayor a cero",
                          );
                          event.target.value = String(unit.cantidadServicios);
                          return;
                        }
                        if (cantidadServicios !== unit.cantidadServicios)
                          updateDetails(unit, { cantidadServicios });
                      }}
                      className="h-8 w-24 rounded-md border border-input bg-background px-2 text-xs disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <AutocompleteSelect
                      value={unit.acc ? "si" : "no"}
                      onChange={(event) =>
                        updateDetails(unit, { acc: event.target.value === "si" })
                      }
                      disabled={detailsMutation.isPending}
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="no">No</option>
                      <option value="si">Sí</option>
                    </AutocompleteSelect>
                  </td>
                  <td className="px-3 py-2">
                    <AutocompleteSelect
                      value={unit.conversionId ?? ""}
                      onChange={(event) => {
                        const conversionId = event.target.value || null;
                        updateDetails(unit, {
                          conversionId,
                          estadoConversion: conversionId ? "PENDIENTE" : null,
                        });
                      }}
                      disabled={detailsMutation.isPending || catalogsQuery.isLoading}
                      className="h-8 min-w-44 rounded-md border border-input bg-background px-2 text-xs disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">Sin conversión</option>
                      {catalogsQuery.data?.conversiones.map((conversion) => (
                        <option key={conversion._id} value={conversion._id}>
                          {conversion.tipoConversion} · {conversion.proveedor}
                        </option>
                      ))}
                    </AutocompleteSelect>
                  </td>
                  <td className="px-3 py-2">
                    <AutocompleteSelect
                      value={unit.estadoConversion ?? ""}
                      onChange={(event) =>
                        updateDetails(unit, {
                          estadoConversion: event.target.value as
                            | "PENDIENTE"
                            | "EN_PROVEEDOR"
                            | "CONVERTIDA",
                        })
                      }
                      disabled={
                        detailsMutation.isPending || !unit.conversionId
                      }
                      className="h-8 min-w-32 rounded-md border border-input bg-background px-2 text-xs disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="" disabled>
                        Sin conversión
                      </option>
                      <option value="PENDIENTE">Pendiente</option>
                      <option value="EN_PROVEEDOR">En Proveedor</option>
                      <option value="CONVERTIDA">Convertida</option>
                    </AutocompleteSelect>
                  </td>
                  <td className="px-3 py-1.5">
                    <span
                      className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-medium ${unit.estado === "ENTREGADA" ? "bg-sky-100 text-sky-800" : unit.estado === "ASIGNADA" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}
                    >
                      {unit.estado === "ENTREGADA" ? "Entregada" : unit.estado === "ASIGNADA" ? "Asignada" : "Pend de Asignar"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={11}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  Todavía no hay unidades cargadas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end border-t border-border px-3 py-3">
        <ActionButton
          variant="outline"
          onClick={close}
          disabled={
            mutation.isPending ||
            removeMutation.isPending ||
            progressMutation.isPending
            || bulkProgressMutation.isPending
          }
        >
          Cerrar
        </ActionButton>
      </div>
    </Modal>
  );
}

function LicitacionViewDialog({
  item,
  close,
}: {
  item: LicitacionAdministracion;
  close: () => void;
}) {
  const unitsQuery = useQuery({
    queryKey: ["licitaciones", "administracion", item._id, "unidades"],
    queryFn: () => getLicitacionUnidades(item._id),
  });
  const units = unitsQuery.data?.data ?? [];
  const assigned = units.filter(
    (unit) => unit.estado === "ASIGNADA" || unit.estado === "ENTREGADA",
  ).length;
  const delivered = units.filter((unit) => unit.estado === "ENTREGADA").length;
  const unitStateLabel = (unit: LicitacionUnidad) =>
    unit.estado === "ENTREGADA"
      ? "Entregada"
      : unit.estado === "ASIGNADA"
        ? "Asignada"
        : "Pendiente";
  const unitStateClass: Record<LicitacionUnidad["estado"], string> = {
    PENDIENTE_ASIGNAR: "bg-amber-100 text-amber-800",
    ASIGNADA: "bg-emerald-100 text-emerald-800",
    ENTREGADA: "bg-sky-100 text-sky-800",
  };
  const conversionLabel = (unit: LicitacionUnidad) =>
    [unit.conversionTipo, unit.conversionProveedor]
      .filter(Boolean)
      .join(" · ") || "-";
  const conversionStateLabel: Record<
    NonNullable<LicitacionUnidad["estadoConversion"]>,
    string
  > = {
    PENDIENTE: "Pendiente",
    EN_PROVEEDOR: "En Proveedor",
    CONVERTIDA: "Convertida",
  };
  const conversionStateClass: Record<
    NonNullable<LicitacionUnidad["estadoConversion"]>,
    string
  > = {
    PENDIENTE: "bg-amber-100 text-amber-800",
    EN_PROVEEDOR: "bg-sky-100 text-sky-800",
    CONVERTIDA: "bg-emerald-100 text-emerald-800",
  };

  return (
    <Modal onClose={close}>
      <DialogHeader
        title="Vista de licitación"
        subtitle={item.entidad}
        close={close}
      />
      <div className="grid gap-2 border-b border-border p-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-md border border-border bg-muted/40 px-3 py-2"><span className="block text-[10px] font-semibold uppercase tracking-[.12em] text-muted-foreground">Apertura</span><span className="font-semibold">{item.fechaApertura}</span></div>
        <div className="rounded-md border border-border bg-muted/40 px-3 py-2"><span className="block text-[10px] font-semibold uppercase tracking-[.12em] text-muted-foreground">Mantenimiento</span><span className="font-semibold">{item.diasMantenimientoOferta} días</span></div>
        <div className="rounded-md border border-border bg-muted/40 px-3 py-2"><span className="block text-[10px] font-semibold uppercase tracking-[.12em] text-muted-foreground">Unidades</span><span className="font-semibold">{units.length} total · {assigned} asignadas</span></div>
        <div className="rounded-md border border-border bg-muted/40 px-3 py-2"><span className="block text-[10px] font-semibold uppercase tracking-[.12em] text-muted-foreground">Entregadas</span><span className="font-semibold">{delivered}</span></div>
      </div>
      <div className="max-h-[52vh] overflow-auto">
        <table className="w-full min-w-[1050px] text-left text-xs">
          <thead className="sticky top-0 bg-muted text-[10px] uppercase tracking-[.1em] text-muted-foreground"><tr><th className="px-3 py-2">#</th><th className="px-3 py-2">Interno</th><th className="px-3 py-2">Versión</th><th className="px-3 py-2">Conversión</th><th className="px-3 py-2">Est. conversión</th><th className="px-3 py-2">Pat.</th><th className="px-3 py-2">Flete</th><th className="px-3 py-2">Serv.</th><th className="px-3 py-2">ACC</th><th className="px-3 py-2">Estado</th></tr></thead>
          <tbody>
            {unitsQuery.isLoading ? <tr><td colSpan={10} className="px-3 py-8 text-center text-muted-foreground">Cargando unidades...</td></tr> : null}
            {unitsQuery.isError ? <tr><td colSpan={10} className="px-3 py-8 text-center text-destructive">No se pudieron cargar las unidades.</td></tr> : null}
            {!unitsQuery.isLoading && !unitsQuery.isError && units.length === 0 ? <tr><td colSpan={10} className="px-3 py-8 text-center text-muted-foreground">Todavía no hay unidades cargadas.</td></tr> : null}
            {units.map((unit, index) => <tr key={unit._id} className="border-t border-border"><td className="px-3 py-2">{index + 1}</td><td className="px-3 py-2 font-medium tabular-nums">{unit.interno ?? "-"}</td><td className="px-3 py-2 font-medium">{unit.versionNombre}</td><td className="px-3 py-2">{conversionLabel(unit)}</td><td className="px-3 py-2">{unit.estadoConversion ? <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-medium ${conversionStateClass[unit.estadoConversion]}`}>{conversionStateLabel[unit.estadoConversion]}</span> : "-"}</td><td className="px-3 py-2">{unit.patentamiento ? "Sí" : "No"}</td><td className="px-3 py-2">{unit.flete ? "Sí" : "No"}</td><td className="px-3 py-2">{unit.cantidadServicios}</td><td className="px-3 py-2">{unit.acc ? "Sí" : "No"}</td><td className="px-3 py-2"><span className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-medium ${unitStateClass[unit.estado]}`}>{unitStateLabel(unit)}</span></td></tr>)}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end border-t border-border px-3 py-3"><ActionButton variant="outline" onClick={close}>Cerrar</ActionButton></div>
    </Modal>
  );
}

export default function LicitacionesAdministracionView() {
  const [createOpen, setCreateOpen] = useState(false);
  const [tab, setTab] = useState<"TODAS" | "PENDIENTES" | "ADJUDICADA" | "PERDIDA">(
    "TODAS",
  );
  const [editItem, setEditItem] = useState<LicitacionAdministracion | null>(
    null,
  );
  const [extensionItem, setExtensionItem] =
    useState<LicitacionAdministracion | null>(null);
  const [unitsItem, setUnitsItem] = useState<LicitacionAdministracion | null>(
    null,
  );
  const [viewItem, setViewItem] = useState<LicitacionAdministracion | null>(
    null,
  );
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["licitaciones", "administracion"],
    queryFn: getLicitacionesAdministracion,
  });
  const flowMutation = useMutation({
    mutationFn: ({
      id,
      field,
      value,
    }: {
      id: string;
      field: "tecnica" | "preAdjudicado" | "pagare" | "oc";
      value: boolean | null;
    }) => updateLicitacionFlow(id, field, value),
    onSuccess: (response) => {
      toast.success(response.message);
      client.invalidateQueries({
        queryKey: ["licitaciones", "administracion"],
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const pdfMutation = useMutation({
    mutationFn: (item: LicitacionAdministracion) =>
      exportLicitacionAdministracionPdf(item._id),
    onSuccess: (blob, item) => {
      downloadBlob(
        blob,
        `licitacion-${item.entidad.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${item.fechaApertura}.pdf`,
      );
      toast.success("PDF generado correctamente");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const removeMutation = useMutation({
    mutationFn: (item: LicitacionAdministracion) => removeLicitacionAdministracion(item._id),
    onSuccess: (response) => {
      toast.success(response.message);
      client.invalidateQueries({ queryKey: ["licitaciones", "administracion"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const rows = query.data?.data ?? [];
  const visibleRows = rows.filter((item) =>
    tab === "TODAS"
      ? true
      : tab === "PENDIENTES"
      ? item.estado !== "ADJUDICADA" && item.estado !== "PERDIDA"
      : item.estado === tab,
  );
  const flowSelect = (
    item: LicitacionAdministracion,
    field: "tecnica" | "preAdjudicado",
    enabled: boolean,
  ) => (
    <AutocompleteSelect
      aria-label={`${field} de ${item.entidad}`}
      value={item[field] === null ? "pendiente" : item[field] ? "si" : "no"}
      disabled={!enabled || flowMutation.isPending}
      onChange={(event) =>
        flowMutation.mutate({
          id: item._id,
          field,
          value:
            event.target.value === "pendiente"
              ? null
              : event.target.value === "si",
        })
      }
      className="h-8 rounded-md border border-input bg-background px-2 text-xs disabled:cursor-not-allowed disabled:opacity-60"
    >
      <option value="pendiente">Pendiente</option>
      <option value="si">Sí</option>
      <option value="no">No</option>
    </AutocompleteSelect>
  );
  const flowCheck = (
    item: LicitacionAdministracion,
    field: "pagare" | "oc",
    enabled: boolean,
  ) => (
    <input
      type="checkbox"
      aria-label={`${field} de ${item.entidad}`}
      checked={item[field]}
      disabled={!enabled || flowMutation.isPending}
      onChange={(event) =>
        flowMutation.mutate({
          id: item._id,
          field,
          value: event.target.checked,
        })
      }
      className="h-4 w-4 accent-primary disabled:cursor-not-allowed"
    />
  );
  return (
    <div className="space-y-3 font-preset">
      <section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-muted-foreground">
            Licitaciones
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">
            Administración
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Seguimiento de técnica, mantenimiento de oferta, pre-adjudicación,
            pagaré y OC.
          </p>
        </div>
        <ActionButton onClick={() => setCreateOpen(true)}>
          <Plus />
          Cargar licitación
        </ActionButton>
      </section>
      <section
        className="flex flex-wrap gap-1 rounded-lg border border-border bg-card p-2"
        role="tablist"
        aria-label="Estado de licitaciones"
      >
        {(["TODAS", "PENDIENTES", "ADJUDICADA", "PERDIDA"] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={tab === option}
            onClick={() => setTab(option)}
            className={`h-9 rounded-md border px-3 text-xs font-medium ${tab === option ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
          >
            {option === "TODAS"
              ? "Todas"
              : option === "PENDIENTES"
              ? "Pendientes"
              : option === "ADJUDICADA"
                ? "Adjudicadas"
                : "Perdidas"}
          </button>
        ))}
      </section>
      {query.isLoading ? (
        <section className="rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">
          Cargando licitaciones...
        </section>
      ) : query.isError ? (
        <section className="rounded-lg border border-border bg-card p-3 text-sm text-destructive">
          {query.error instanceof Error
            ? query.error.message
            : "No se pudieron cargar las licitaciones"}
        </section>
      ) : visibleRows.length ? (
        <section className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full min-w-[1160px] text-center text-sm">
            <thead className="bg-muted text-[11px] uppercase tracking-[.12em] text-muted-foreground">
              <tr>
                {[
                  "Entidad",
                  "Apertura",
                  "Días mantenimiento",
                  "Días restantes",
                  "Técnica",
                  "Pre-adjudicado",
                  "Pagaré",
                  "OC",
                  "Unidades",
                  "Estado",
                  "Acciones",
                  "Gestión",
                ].map((label) => (
                  <th key={label} className="px-3 py-2">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((item) => {
                const technicalApproved = item.tecnica === true;
                const preAdjudicationEnabled =
                  technicalApproved &&
                  item.estado !== "ESPERANDO_MANTENIMIENTO";
                const pagareEnabled = item.preAdjudicado === true;
                return (
                  <tr key={item._id} className="border-t border-border">
                    <td className="px-3 py-2 text-left font-medium">
                      {item.entidad}
                    </td>
                    <td className="px-3 py-2">{item.fechaApertura}</td>
                    <td className="px-3 py-2">
                      {item.diasMantenimientoOferta} días
                    </td>
                    <td
                      className={`px-3 py-2 font-medium ${item.diasRestantesMantenimiento < 0 ? "text-destructive" : item.diasRestantesMantenimiento === 0 ? "text-amber-700" : "text-foreground"}`}
                    >
                      {remainingLabel(item.diasRestantesMantenimiento)}
                    </td>
                    <td className="px-3 py-2">
                      {flowSelect(item, "tecnica", true)}
                    </td>
                    <td className="px-3 py-2">
                      {flowSelect(
                        item,
                        "preAdjudicado",
                        preAdjudicationEnabled,
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {flowCheck(item, "pagare", pagareEnabled)}
                    </td>
                    <td className="px-3 py-2">
                      {flowCheck(item, "oc", item.pagare)}
                    </td>
                    <td className="px-3 py-2 font-medium">
                      {item.totalUnidades}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex max-w-52 rounded-full px-2 py-1 text-xs font-medium ${stateClass[item.estado]}`}
                      >
                        {stateLabels[item.estado]}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-center gap-2">
                        <EditActionButton
                          size="icon-lg"
                          title="Editar licitación"
                          aria-label={`Editar ${item.entidad}`}
                          onClick={() => setEditItem(item)}
                          className="border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
                        >
                          <Edit3 size={18} />
                        </EditActionButton>
                        <ActionButton
                          variant="outline"
                          size="icon-lg"
                          title="Prorrogar mantenimiento"
                          aria-label={`Prorrogar mantenimiento de ${item.entidad}`}
                          onClick={() => setExtensionItem(item)}
                          className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                        >
                          <CalendarPlus size={18} />
                        </ActionButton>
                        <DeleteActionButton
                          size="icon-lg"
                          title="Eliminar licitación"
                          aria-label={`Eliminar ${item.entidad}`}
                          disabled={removeMutation.isPending}
                          onClick={() => {
                            if (window.confirm(`¿Eliminar la licitación ${item.entidad} y todas sus ${item.totalUnidades} unidades? Esta acción no se puede deshacer.`)) removeMutation.mutate(item);
                          }}
                        >
                          <Trash2 size={18} />
                        </DeleteActionButton>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-center gap-2">
                        <ActionButton
                          variant="outline"
                          size="icon-lg"
                          title="Cargar unidades"
                          aria-label={`Cargar unidades de ${item.entidad}`}
                          onClick={() => setUnitsItem(item)}
                          className="border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"
                        >
                          <PackagePlus size={18} />
                        </ActionButton>
                        <ActionButton
                          variant="outline"
                          size="icon-lg"
                          title="Descargar resumen PDF"
                          aria-label={`Descargar resumen PDF de ${item.entidad}`}
                          disabled={pdfMutation.isPending}
                          onClick={() => pdfMutation.mutate(item)}
                          className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        >
                          <FileDown size={18} />
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ) : (
        <section className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          <ScrollText className="mx-auto mb-2" size={24} />
          No hay licitaciones en esta pestaña.
        </section>
      )}
      {createOpen ? (
        <LicitacionDialog close={() => setCreateOpen(false)} />
      ) : null}
      {editItem ? (
        <LicitacionDialog item={editItem} close={() => setEditItem(null)} />
      ) : null}
      {extensionItem ? (
        <ExtensionDialog
          item={extensionItem}
          close={() => setExtensionItem(null)}
        />
      ) : null}
      {unitsItem ? (
        <UnitsDialog item={unitsItem} close={() => setUnitsItem(null)} />
      ) : null}
      {viewItem ? (
        <LicitacionViewDialog item={viewItem} close={() => setViewItem(null)} />
      ) : null}
    </div>
  );
}
