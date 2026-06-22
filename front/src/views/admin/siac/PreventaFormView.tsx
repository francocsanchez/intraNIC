import Loading from "@/components/Loading";
import { getVendedoresActivosNic } from "@/api/dms/dmsAPI";
import { createPreventa, getColores, getPreventaById, getVersiones, updatePreventa } from "@/api/dms/preventasAPI";
import { toMonthInputValue } from "@/helpers/preventas";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, Transition } from "@headlessui/react";
import { Save, X } from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { toast } from "sonner";

type PreventaFormState = {
  vendedor: string;
  numero_op: string;
  cliente: string;
  version: string;
  colores: string[];
  monto_reserva: string;
  observaciones: string;
  mes_asigna: string;
};

const initialForm: PreventaFormState = {
  vendedor: "",
  numero_op: "",
  cliente: "",
  version: "",
  colores: [],
  monto_reserva: "",
  observaciones: "",
  mes_asigna: "",
};

type PreventaFormContentProps = {
  colores: Awaited<ReturnType<typeof getColores>>["data"];
  initialValues: PreventaFormState;
  isEditing: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preventaId?: string;
  vendedores: Awaited<ReturnType<typeof getVendedoresActivosNic>>["data"];
  versiones: Awaited<ReturnType<typeof getVersiones>>["data"];
};

function PreventaFormContent({
  colores,
  initialValues,
  isEditing,
  onClose,
  onSuccess,
  preventaId,
  vendedores,
  versiones,
}: PreventaFormContentProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<PreventaFormState>(initialValues);

  useEffect(() => {
    setForm(initialValues);
  }, [initialValues]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.vendedor) throw new Error("Debes seleccionar un vendedor");
      if (!form.cliente.trim()) throw new Error("El cliente es obligatorio");
      if (!form.version) throw new Error("Debes seleccionar una version");
      if (!form.mes_asigna) throw new Error("Debes seleccionar el mes de asignacion");

      const payload = {
        vendedor: Number(form.vendedor),
        numero_op: form.numero_op ? Number(form.numero_op) : null,
        cliente: form.cliente.trim(),
        version: form.version,
        colores: form.colores,
        monto_reserva: form.monto_reserva ? Number(form.monto_reserva) : null,
        observaciones: form.observaciones.trim(),
        mes_asigna: form.mes_asigna,
      };

      if (isEditing && preventaId) {
        return updatePreventa(preventaId, payload);
      }

      return createPreventa(payload);
    },
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["preventas"] });
      queryClient.invalidateQueries({ queryKey: ["preventas-resumen"] });
      onSuccess();
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  return (
    <>
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Preventas</p>
          <Dialog.Title className="mt-1 text-xl font-semibold tracking-tight text-gray-900">
            {isEditing ? "Editar preventa" : "Nueva preventa"}
          </Dialog.Title>
          <p className="mt-2 text-sm text-gray-600">
            Registra la necesidad comercial y el mes esperado de asignacion para la unidad.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={saveMutation.isPending}
          className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X size={18} />
        </button>
      </div>

      <div className="max-h-[calc(100vh-12rem)] overflow-y-auto p-6">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700 xl:col-span-4">
            Vendedor
            <select
              value={form.vendedor}
              onChange={(event) => setForm((current) => ({ ...current, vendedor: event.target.value }))}
              className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#15aa9a]"
            >
              <option value="">Seleccionar vendedor</option>
              {vendedores.map((vendedor) => (
                <option key={vendedor.codigo} value={vendedor.codigo}>
                  {vendedor.vendedor}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700 xl:col-span-4">
            Numero OP
            <input
              type="number"
              value={form.numero_op}
              onChange={(event) => setForm((current) => ({ ...current, numero_op: event.target.value }))}
              className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#15aa9a]"
              placeholder="Opcional"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700 xl:col-span-4">
            Monto reserva
            <input
              type="number"
              min={0}
              value={form.monto_reserva}
              onChange={(event) => setForm((current) => ({ ...current, monto_reserva: event.target.value }))}
              className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#15aa9a]"
              placeholder="Opcional"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700 xl:col-span-6">
            Cliente
            <input
              type="text"
              value={form.cliente}
              onChange={(event) => setForm((current) => ({ ...current, cliente: event.target.value }))}
              className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#15aa9a]"
              placeholder="Nombre del cliente"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700 xl:col-span-3">
            Version
            <select
              value={form.version}
              onChange={(event) => setForm((current) => ({ ...current, version: event.target.value }))}
              className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#15aa9a]"
            >
              <option value="">Seleccionar version</option>
              {versiones.map((version) => (
                <option key={version._id} value={version._id}>
                  {version.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700 xl:col-span-3">
            Mes de asignacion
            <input
              type="month"
              value={form.mes_asigna}
              onChange={(event) => setForm((current) => ({ ...current, mes_asigna: event.target.value }))}
              className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#15aa9a]"
            />
          </label>

          <div className="rounded-3xl border border-gray-200 bg-[#f8fbfd] p-4 xl:col-span-12">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Colores</h2>
                <p className="mt-1 text-xs text-gray-500">Podes seleccionar varios colores posibles para una misma unidad.</p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#146b61] shadow-sm">
                {form.colores.length} seleccionados
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {colores.map((color) => {
                const checked = form.colores.includes(color._id);

                return (
                  <label
                    key={color._id}
                    className={[
                      "flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition",
                      checked ? "border-[#15aa9a] bg-[#eef9f7] text-[#146b61]" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
                    ].join(" ")}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setForm((current) => ({
                          ...current,
                          colores: checked
                            ? current.colores.filter((item) => item !== color._id)
                            : [...current.colores, color._id],
                        }))
                      }
                      className="h-4 w-4 rounded border-gray-300 text-[#15aa9a] focus:ring-[#15aa9a]"
                    />
                    {color.nombre}
                  </label>
                );
              })}
            </div>
          </div>

          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700 xl:col-span-12">
            Observaciones
            <textarea
              value={form.observaciones}
              onChange={(event) => setForm((current) => ({ ...current, observaciones: event.target.value }))}
              rows={5}
              className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#15aa9a]"
              placeholder="Contexto comercial, prioridad, preferencia de color, etc."
            />
          </label>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-gray-500">Guarda los cambios para actualizar el listado operativo.</div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saveMutation.isPending}
            className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#15aa9a] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#128d80] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={16} />
            {saveMutation.isPending ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear preventa"}
          </button>
        </div>
      </div>
    </>
  );
}

export function PreventaModal({
  open,
  onClose,
  preventaId,
}: {
  open: boolean;
  onClose: () => void;
  preventaId?: string;
}) {
  const isEditing = Boolean(preventaId);

  const vendedoresQuery = useQuery({
    queryKey: ["vendedores", "nic", "activos"],
    queryFn: getVendedoresActivosNic,
    enabled: open,
  });

  const versionesQuery = useQuery({
    queryKey: ["versiones", "activas"],
    queryFn: () => getVersiones(true),
    enabled: open,
  });

  const coloresQuery = useQuery({
    queryKey: ["colores", "activos"],
    queryFn: () => getColores(true),
    enabled: open,
  });

  const preventaQuery = useQuery({
    queryKey: ["preventa", preventaId],
    queryFn: () => getPreventaById(preventaId!),
    enabled: open && isEditing,
  });

  const loading = vendedoresQuery.isLoading || versionesQuery.isLoading || coloresQuery.isLoading || preventaQuery.isLoading;
  const firstError = vendedoresQuery.error || versionesQuery.error || coloresQuery.error || preventaQuery.error;

  const vendedores = vendedoresQuery.data?.data ?? [];
  const versiones = versionesQuery.data?.data ?? [];
  const colores = coloresQuery.data?.data ?? [];
  const preventa = preventaQuery.data?.data;

  const initialValues = preventa
    ? {
        vendedor: String(preventa.vendedor),
        numero_op: preventa.numero_op?.toString() ?? "",
        cliente: preventa.cliente,
        version: preventa.version._id,
        colores: preventa.colores.map((color) => color._id),
        monto_reserva: preventa.monto_reserva?.toString() ?? "",
        observaciones: preventa.observaciones ?? "",
        mes_asigna: toMonthInputValue(preventa.mes_asigna),
      }
    : initialForm;

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-5xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
                {loading ? (
                  <div className="p-10">
                    <Loading />
                  </div>
                ) : firstError instanceof Error ? (
                  <div className="p-6">
                    <h1 className="text-lg font-semibold text-gray-900">No se pudo cargar el formulario de preventa</h1>
                    <p className="mt-2 text-sm text-red-600">{firstError.message}</p>
                  </div>
                ) : isEditing && !preventa ? (
                  <div className="p-6">
                    <h1 className="text-lg font-semibold text-gray-900">Preventa no encontrada</h1>
                    <p className="mt-2 text-sm text-red-600">No fue posible cargar la preventa solicitada.</p>
                  </div>
                ) : (
                  <PreventaFormContent
                    colores={colores}
                    initialValues={initialValues}
                    isEditing={isEditing}
                    onClose={onClose}
                    onSuccess={onClose}
                    preventaId={preventaId}
                    vendedores={vendedores}
                    versiones={versiones}
                  />
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default function PreventaFormView() {
  return null;
}
