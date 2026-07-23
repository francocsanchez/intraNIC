import Loading from "@/components/Loading";
import { createPlanFinanciero, deletePlanFinanciero, exportPlanesFinancieros, getPlanesFinancieros, importPlanesFinancieros, updatePlanFinanciero, type PlanFinancieroPayload } from "@/api/dms/cotizadorAPI";
import type { PlanFinanciero } from "@/types/index";
import { formatMoney, formatPercent } from "@/views/admin/siac/cotizadorUtils";
import { Dialog, Transition } from "@headlessui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Calculator, Download, Pencil, Plus, Power, Trash2, Upload, X } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { paths } from "@/routes/paths";

type PlanTermForm = PlanFinancieroPayload["plazos"][number];

const EMPTY_PLANES: Awaited<ReturnType<typeof getPlanesFinancieros>>["data"] = [];

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

const createEmptyTerm = (): PlanTermForm => ({
  plazo: 12,
  tna: 0,
  quebrantoTipo: "porcentaje",
  quebrantoValor: 0,
  maxFinanciacionTipo: "monto",
  maxFinanciacionValor: 0,
  activo: true,
});

function PlanFinancieroModal({
  open,
  onClose,
  plan,
}: {
  open: boolean;
  onClose: () => void;
  plan: PlanFinanciero | null;
}) {
  const queryClient = useQueryClient();
  const [entidad, setEntidad] = useState("");
  const [nombre, setNombre] = useState("");
  const [activo, setActivo] = useState(true);
  const [plazos, setPlazos] = useState<PlanTermForm[]>([createEmptyTerm()]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setEntidad(plan?.entidad ?? "");
    setNombre(plan?.nombre ?? "");
    setActivo(plan?.activo ?? true);
    setPlazos(
      plan?.plazos.map((item) => ({
        plazo: item.plazo,
        tna: item.tna,
        quebrantoTipo: item.quebrantoTipo,
        quebrantoValor: item.quebrantoValor,
        maxFinanciacionTipo: item.maxFinanciacionTipo,
        maxFinanciacionValor: item.maxFinanciacionValor,
        activo: item.activo,
      })) ?? [createEmptyTerm()],
    );
  }, [open, plan]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: PlanFinancieroPayload = {
        entidad: entidad.trim(),
        nombre: nombre.trim(),
        activo,
        plazos,
      };

      if (!payload.entidad) {
        throw new Error("La entidad financiera es obligatoria");
      }

      if (!payload.nombre) {
        throw new Error("El nombre del plan es obligatorio");
      }

      if (plan?._id) {
        return updatePlanFinanciero(plan._id, payload);
      }

      return createPlanFinanciero(payload);
    },
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["planes-financieros"] });
      queryClient.invalidateQueries({ queryKey: ["cotizador-catalogo"] });
      onClose();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => (mutation.isPending ? undefined : onClose())}>
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-3">
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-6xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Cotizador</p>
                    <Dialog.Title className="mt-1 text-lg font-semibold tracking-tight text-gray-900">
                      {plan ? "Editar plan financiero" : "Nuevo plan financiero"}
                    </Dialog.Title>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    disabled={mutation.isPending}
                    className="rounded-lg border border-gray-200 p-1.5 text-gray-500 transition hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-4 p-4">
                  <div className="grid gap-3 md:grid-cols-3">
                    <label className="block space-y-1.5">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Entidad financiera</span>
                      <input
                        type="text"
                        value={entidad}
                        onChange={(event) => setEntidad(event.target.value)}
                        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-[#15aa9a]"
                      />
                    </label>

                    <label className="block space-y-1.5 md:col-span-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Nombre del plan</span>
                      <input
                        type="text"
                        value={nombre}
                        onChange={(event) => setNombre(event.target.value)}
                        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-[#15aa9a]"
                      />
                    </label>
                  </div>

                  <div className="rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2.5">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">Plazos del plan</h3>
                        <p className="text-[11px] text-gray-500">Cada fila define su propia TNA, quebranto y maximo financiable.</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setPlazos((current) => [...current, createEmptyTerm()])}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-2.5 py-1.5 text-[10px] font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        <Plus size={12} />
                        Agregar plazo
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs">
                        <thead className="bg-gray-50 text-[10px] uppercase tracking-[0.18em] text-gray-500">
                          <tr>
                            <th className="px-3 py-3 text-center">Plazo</th>
                            <th className="px-3 py-3 text-center">TNA</th>
                            <th className="px-3 py-3 text-center">Tipo quebranto</th>
                            <th className="px-3 py-3 text-center">Quebranto</th>
                            <th className="px-3 py-3 text-center">Tipo max.</th>
                            <th className="px-3 py-3 text-center">Maximo</th>
                            <th className="px-3 py-3 text-center">Activo</th>
                            <th className="px-3 py-3 text-center">Accion</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {plazos.map((term, index) => (
                            <tr key={`${index}-${term.plazo}`}>
                              <td className="px-3 py-3">
                                <input
                                  type="number"
                                  min={1}
                                  value={term.plazo}
                                  onChange={(event) =>
                                    setPlazos((current) =>
                                      current.map((item, itemIndex) =>
                                        itemIndex === index ? { ...item, plazo: Number(event.target.value) } : item,
                                      ),
                                    )
                                  }
                                  className="w-24 rounded-xl border border-gray-300 px-3 py-2 text-center text-sm outline-none focus:border-[#15aa9a]"
                                />
                              </td>
                              <td className="px-3 py-3">
                                <input
                                  type="number"
                                  min={0}
                                  step={0.01}
                                  value={term.tna}
                                  onChange={(event) =>
                                    setPlazos((current) =>
                                      current.map((item, itemIndex) =>
                                        itemIndex === index ? { ...item, tna: Number(event.target.value) } : item,
                                      ),
                                    )
                                  }
                                  className="w-28 rounded-xl border border-gray-300 px-3 py-2 text-center text-sm outline-none focus:border-[#15aa9a]"
                                />
                              </td>
                              <td className="px-3 py-3">
                                <select
                                  value={term.quebrantoTipo}
                                  onChange={(event) =>
                                    setPlazos((current) =>
                                      current.map((item, itemIndex) =>
                                        itemIndex === index
                                          ? { ...item, quebrantoTipo: event.target.value as PlanTermForm["quebrantoTipo"] }
                                          : item,
                                      ),
                                    )
                                  }
                                  className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#15aa9a]"
                                >
                                  <option value="porcentaje">%</option>
                                  <option value="monto">$</option>
                                </select>
                              </td>
                              <td className="px-3 py-3">
                                <input
                                  type="number"
                                  min={0}
                                  step={0.01}
                                  value={term.quebrantoValor}
                                  onChange={(event) =>
                                    setPlazos((current) =>
                                      current.map((item, itemIndex) =>
                                        itemIndex === index ? { ...item, quebrantoValor: Number(event.target.value) } : item,
                                      ),
                                    )
                                  }
                                  className="w-32 rounded-xl border border-gray-300 px-3 py-2 text-center text-sm outline-none focus:border-[#15aa9a]"
                                />
                              </td>
                              <td className="px-3 py-3">
                                <select
                                  value={term.maxFinanciacionTipo}
                                  onChange={(event) =>
                                    setPlazos((current) =>
                                      current.map((item, itemIndex) =>
                                        itemIndex === index
                                          ? { ...item, maxFinanciacionTipo: event.target.value as PlanTermForm["maxFinanciacionTipo"] }
                                          : item,
                                      ),
                                    )
                                  }
                                  className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#15aa9a]"
                                >
                                  <option value="porcentaje">%</option>
                                  <option value="monto">$</option>
                                </select>
                              </td>
                              <td className="px-3 py-3">
                                <input
                                  type="number"
                                  min={0}
                                  step={0.01}
                                  value={term.maxFinanciacionValor}
                                  onChange={(event) =>
                                    setPlazos((current) =>
                                      current.map((item, itemIndex) =>
                                        itemIndex === index
                                          ? { ...item, maxFinanciacionValor: Number(event.target.value) }
                                          : item,
                                      ),
                                    )
                                  }
                                  className="w-32 rounded-xl border border-gray-300 px-3 py-2 text-center text-sm outline-none focus:border-[#15aa9a]"
                                />
                              </td>
                              <td className="px-3 py-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={term.activo}
                                  onChange={(event) =>
                                    setPlazos((current) =>
                                      current.map((item, itemIndex) =>
                                        itemIndex === index ? { ...item, activo: event.target.checked } : item,
                                      ),
                                    )
                                  }
                                  className="h-4 w-4 rounded border-gray-300 text-[#15aa9a] focus:ring-[#15aa9a]"
                                />
                              </td>
                              <td className="px-3 py-3 text-center">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPlazos((current) => (current.length === 1 ? current : current.filter((_, itemIndex) => itemIndex !== index)))
                                  }
                                  className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                                >
                                  <Trash2 size={14} />
                                  Quitar
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <label className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-800">
                    <span>Plan activo</span>
                    <input
                      type="checkbox"
                      checked={activo}
                      onChange={(event) => setActivo(event.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-[#15aa9a] focus:ring-[#15aa9a]"
                    />
                  </label>
                </div>

                <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-gray-500">El simulador mostrara solo los plazos activos de cada plan activo.</div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={mutation.isPending}
                      className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => mutation.mutate()}
                      disabled={mutation.isPending}
                      className="inline-flex items-center justify-center rounded-lg bg-[#15aa9a] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#128d80] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {mutation.isPending ? "Guardando..." : plan ? "Guardar cambios" : "Crear plan"}
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default function PlanesFinancierosView() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanFinanciero | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["planes-financieros"],
    queryFn: () => getPlanesFinancieros(),
  });

  const deleteMutation = useMutation({
    mutationFn: deletePlanFinanciero,
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["planes-financieros"] });
      queryClient.invalidateQueries({ queryKey: ["cotizador-catalogo"] });
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  const statusMutation = useMutation({
    mutationFn: (plan: PlanFinanciero) =>
      updatePlanFinanciero(plan._id, {
        entidad: plan.entidad,
        nombre: plan.nombre,
        activo: !plan.activo,
        plazos: plan.plazos.map((item) => ({
          plazo: item.plazo,
          tna: item.tna,
          quebrantoTipo: item.quebrantoTipo,
          quebrantoValor: item.quebrantoValor,
          maxFinanciacionTipo: item.maxFinanciacionTipo,
          maxFinanciacionValor: item.maxFinanciacionValor,
          activo: item.activo,
        })),
      }),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["planes-financieros"] });
      queryClient.invalidateQueries({ queryKey: ["cotizador-catalogo"] });
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  const exportMutation = useMutation({
    mutationFn: exportPlanesFinancieros,
    onSuccess: (blob) => {
      downloadBlob(blob, "cotizador-planes.xlsx");
      toast.success("Excel exportado correctamente");
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  const importMutation = useMutation({
    mutationFn: importPlanesFinancieros,
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["planes-financieros"] });
      queryClient.invalidateQueries({ queryKey: ["cotizador-catalogo"] });
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  const planes = data?.data ?? EMPTY_PLANES;
  const groupedByEntidad = useMemo(
    () =>
      planes.reduce<Record<string, PlanFinanciero[]>>((acc, plan) => {
        acc[plan.entidad] = [...(acc[plan.entidad] ?? []), plan];
        return acc;
      }, {}),
    [planes],
  );

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="w-full px-4 py-6">
        <section className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
          <h1 className="text-lg font-semibold text-gray-900">Error al cargar planes financieros</h1>
          <p className="mt-2 text-sm text-red-600">{error.message}</p>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-4 py-6">
      <section className="rounded-3xl border border-[#cbe7e2] bg-[#e4f3fa] p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#17897d]">Cotizador</p>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Planes financieros</h1>
            <p className="mt-2 max-w-3xl text-sm text-gray-600">
              Gestiona entidad, plan y las caracteristicas por plazo que alimentan el simulador.
            </p>
          </div>

          <div className="flex gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  importMutation.mutate(file);
                }
                event.target.value = "";
              }}
            />
            <Link
              to={paths.admin.cotizadorPrecios}
              className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
            >
              Ver precios mensuales
            </Link>
            <button
              type="button"
              onClick={() => exportMutation.mutate()}
              className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
            >
              <Download size={16} />
              Descargar Excel
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
            >
              <Upload size={16} />
              Importar Excel
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingPlan(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#15aa9a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#128d80]"
            >
              <Plus size={16} />
              Nuevo plan
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-600">
          El Excel exporta una fila por plazo. Al importar, si el plan ya existe por entidad + nombre se actualiza completo; si no existe, se crea.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Planes</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-gray-900">{planes.length}</p>
        </article>
        <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Entidades</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-gray-900">{Object.keys(groupedByEntidad).length}</p>
        </article>
        <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Plazos activos</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-gray-900">
            {planes.reduce((acc, plan) => acc + plan.plazos.filter((item) => item.activo).length, 0)}
          </p>
        </article>
      </section>

      <div className="space-y-6">
        {Object.entries(groupedByEntidad).map(([entidad, items]) => (
          <section key={entidad} className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-base font-semibold tracking-tight text-gray-900">{entidad}</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-[0.18em] text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Plan</th>
                    <th className="px-4 py-3 text-left">Plazos</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                    <th className="px-4 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((plan) => (
                    <tr key={plan._id} className="align-top hover:bg-gray-50">
                      <td className="px-4 py-4 font-medium text-gray-900">
                        <div className="flex items-center gap-3">
                          <Calculator size={16} className="text-[#15aa9a]" />
                          <div>
                            <div>{plan.nombre}</div>
                            <div className="text-xs text-gray-500">{plan.plazos.length} plazos configurados</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          {plan.plazos.map((term) => (
                            <div key={term._id} className="rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700">
                              <strong>{term.plazo}m</strong> · TNA {formatPercent(term.tna)} · Q{" "}
                              {term.quebrantoTipo === "porcentaje" ? formatPercent(term.quebrantoValor) : formatMoney(term.quebrantoValor)} · Max{" "}
                              {term.maxFinanciacionTipo === "porcentaje"
                                ? formatPercent(term.maxFinanciacionValor)
                                : formatMoney(term.maxFinanciacionValor)}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={["inline-flex rounded-full px-3 py-1 text-xs font-semibold", plan.activo ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"].join(" ")}>
                          {plan.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPlan(plan);
                              setIsModalOpen(true);
                            }}
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            <Pencil size={14} />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => statusMutation.mutate(plan)}
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            <Power size={14} />
                            {plan.activo ? "Desactivar" : "Activar"}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteMutation.mutate(plan._id)}
                            className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                          >
                            <Trash2 size={14} />
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}

        {!planes.length ? (
          <section className="rounded-3xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500 shadow-sm">
            Todavia no hay planes financieros cargados.
          </section>
        ) : null}
      </div>

      <PlanFinancieroModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPlan(null);
        }}
        plan={editingPlan}
      />
    </div>
  );
}
