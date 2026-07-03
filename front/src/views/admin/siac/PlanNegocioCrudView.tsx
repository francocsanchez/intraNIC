import Loading from "@/components/Loading";
import {
  createPlanNegocio,
  deletePlanNegocio,
  getPlanNegocioModelos,
  getPlanesNegocio,
  updatePlanNegocio,
} from "@/api/dms/planNegocioAPI";
import type { PlanNegocioItem } from "@/types/index";
import { Dialog, Transition } from "@headlessui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, Pencil, Plus, Power, Trash2, X } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type PlanNegocioModalProps = {
  open: boolean;
  onClose: () => void;
  item: PlanNegocioItem | null;
  selectedYear: number;
};

function PlanNegocioModal({ open, onClose, item, selectedYear }: PlanNegocioModalProps) {
  const queryClient = useQueryClient();
  const isEditing = Boolean(item);
  const [modelo, setModelo] = useState("");
  const [anio, setAnio] = useState(selectedYear);
  const [objetivo, setObjetivo] = useState("0");
  const [activo, setActivo] = useState(true);

  const { data: modelosResponse } = useQuery({
    queryKey: ["plan-negocio-modelos"],
    queryFn: getPlanNegocioModelos,
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;

    setModelo(item?.modelo ?? "");
    setAnio(item?.anio ?? selectedYear);
    setObjetivo(String(item?.objetivo ?? 0));
    setActivo(item?.activo ?? true);
  }, [item, open, selectedYear]);

  const mutation = useMutation({
    mutationFn: async () => {
      const normalizedModelo = modelo.trim();
      const parsedObjetivo = Number(objetivo);

      if (!normalizedModelo) {
        throw new Error("El modelo es obligatorio");
      }

      if (!Number.isInteger(anio) || anio < 2000) {
        throw new Error("El año es obligatorio");
      }

      if (!Number.isInteger(parsedObjetivo) || parsedObjetivo < 0) {
        throw new Error("El objetivo debe ser un entero mayor o igual a 0");
      }

      const payload = {
        modelo: normalizedModelo,
        anio,
        objetivo: parsedObjetivo,
        activo,
      };

      if (item?._id) {
        return updatePlanNegocio(item._id, payload);
      }

      return createPlanNegocio(payload);
    },
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["plan-negocio-crud"] });
      queryClient.invalidateQueries({ queryKey: ["plan-negocio-resumen"] });
      onClose();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const modelos = modelosResponse?.data ?? [];

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => (mutation.isPending ? undefined : onClose())}>
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Sistema</p>
                    <Dialog.Title className="mt-1 text-xl font-semibold tracking-tight text-gray-900">
                      {isEditing ? "Editar objetivo PN" : "Nuevo objetivo PN"}
                    </Dialog.Title>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    disabled={mutation.isPending}
                    className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="grid gap-4 p-5 md:grid-cols-2">
                  <label className="block space-y-2 md:col-span-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Modelo</span>
                    <select
                      value={modelo}
                      onChange={(event) => setModelo(event.target.value)}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-[#15aa9a]"
                    >
                      <option value="">Selecciona un modelo</option>
                      {modelos.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Año</span>
                    <input
                      type="number"
                      value={anio}
                      onChange={(event) => setAnio(Number(event.target.value))}
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-[#15aa9a]"
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Objetivo anual</span>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={objetivo}
                      onChange={(event) => setObjetivo(event.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-[#15aa9a]"
                    />
                  </label>

                  <label className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-800 md:col-span-2">
                    <span>Registro activo</span>
                    <input
                      type="checkbox"
                      checked={activo}
                      onChange={(event) => setActivo(event.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-[#15aa9a] focus:ring-[#15aa9a]"
                    />
                  </label>
                </div>

                <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-gray-500">Se guardará un único objetivo por modelo y año.</div>

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
                      {mutation.isPending ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear objetivo"}
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

export default function PlanNegocioCrudView() {
  const currentYear = new Date().getFullYear();
  const queryClient = useQueryClient();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PlanNegocioItem | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["plan-negocio-crud", selectedYear],
    queryFn: () => getPlanesNegocio(selectedYear),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePlanNegocio(id),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["plan-negocio-crud"] });
      queryClient.invalidateQueries({ queryKey: ["plan-negocio-resumen"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const statusMutation = useMutation({
    mutationFn: (item: PlanNegocioItem) =>
      updatePlanNegocio(item._id, {
        modelo: item.modelo,
        anio: item.anio,
        objetivo: item.objetivo,
        activo: !item.activo,
      }),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["plan-negocio-crud"] });
      queryClient.invalidateQueries({ queryKey: ["plan-negocio-resumen"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const years = useMemo(() => Array.from({ length: 6 }, (_, index) => currentYear + 1 - index), [currentYear]);
  const items = data?.data ?? [];

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="w-full px-4 py-6">
        <section className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
          <h1 className="text-lg font-semibold text-gray-900">Error al cargar PN</h1>
          <p className="mt-2 text-sm text-red-600">{error.message}</p>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 px-4 py-5">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Sistema</p>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">PN</h1>
            <p className="mt-1 text-sm text-gray-500">Carga anual de objetivos por modelo para el tablero de Plan de negocio.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              value={selectedYear}
              onChange={(event) => setSelectedYear(Number(event.target.value))}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-[#15aa9a]"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                setEditingItem(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-[#15aa9a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#128d80]"
            >
              <Plus size={16} />
              Nuevo objetivo
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Registros</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-gray-900">{items.length}</p>
        </article>
        <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Activos</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-gray-900">{items.filter((item) => item.activo).length}</p>
        </article>
        <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Objetivo total</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-gray-900">{items.reduce((acc, item) => acc + item.objetivo, 0)}</p>
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-3">
          <h2 className="text-base font-semibold tracking-tight text-gray-900">Objetivos {selectedYear}</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-[0.18em] text-gray-500">
              <tr>
                <th className="px-4 py-2.5 text-left">Modelo</th>
                <th className="px-4 py-2.5 text-center">Año</th>
                <th className="px-4 py-2.5 text-center">Objetivo</th>
                <th className="px-4 py-2.5 text-center">Estado</th>
                <th className="px-4 py-2.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      <BarChart3 size={16} className="text-[#15aa9a]" />
                      {item.modelo}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">{item.anio}</td>
                  <td className="px-4 py-3 text-center font-semibold text-gray-900">{item.objetivo}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={["inline-flex rounded-full px-3 py-1 text-xs font-semibold", item.activo ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"].join(" ")}>
                      {item.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => statusMutation.mutate(item)}
                        disabled={statusMutation.isPending}
                        className={["inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60", item.activo ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100" : "border border-green-200 bg-green-50 text-green-700 hover:bg-green-100"].join(" ")}
                      >
                        <Power size={14} />
                        {item.activo ? "Desactivar" : "Activar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingItem(item);
                          setIsModalOpen(true);
                        }}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        <Pencil size={14} />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(item._id)}
                        disabled={deleteMutation.isPending}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 size={14} />
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!items.length ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">
                    Todavía no hay objetivos cargados para {selectedYear}.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <PlanNegocioModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        item={editingItem}
        selectedYear={selectedYear}
      />
    </div>
  );
}
