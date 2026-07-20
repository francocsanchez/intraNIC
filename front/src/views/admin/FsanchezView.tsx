import { exportFsanchezOperaciones, getFsanchezOperaciones, updateFsanchezOperacionEstado } from "@/api/dms/fsanchezAPI";
import Loading from "@/components/Loading";
import { textToColor } from "@/helpers/colores";
import type { FsanchezOperacionItem } from "@/types/index";
import { Dialog, Transition } from "@headlessui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useMemo, useState } from "react";
import { Download, MessageSquare, RotateCcw, X, XCircle } from "lucide-react";
import { toast } from "sonner";

type VisibleSection = "conSaldo" | "canceladas";
type AlertLevel = "normal" | "media" | "alta";
type SortField = "version" | "cliente" | "vendedor" | "diasAsignado";
type SortDirection = "asc" | "desc";

function ComentarioModal({
  open,
  operacion,
  comentario,
  onComentarioChange,
  onClose,
  onSave,
  isSaving,
}: {
  open: boolean;
  operacion: FsanchezOperacionItem | null;
  comentario: string;
  onComentarioChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
  isSaving: boolean;
}) {
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
          <div className="fixed inset-0 bg-black/30" />
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
              <Dialog.Panel className="w-full max-w-xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
                <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Comentario</p>
                    <Dialog.Title className="mt-1 text-lg font-semibold tracking-tight text-gray-900">
                      Operacion {operacion?.opera ?? "-"}
                    </Dialog.Title>
                    <p className="mt-1 text-sm text-gray-500">
                      {operacion?.cliente ?? "-"} | {operacion?.modelo ?? "-"} | {operacion?.version ?? "-"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-4 px-5 py-4">
                  <textarea
                    value={comentario}
                    onChange={(event) => onComentarioChange(event.target.value)}
                    rows={6}
                    placeholder="Agrega un comentario para esta operacion"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-400"
                  />

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                      Cerrar
                    </button>
                    <button
                      type="button"
                      onClick={onSave}
                      disabled={isSaving}
                      className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSaving ? "Guardando..." : "Guardar comentario"}
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

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export default function FsanchezView() {
  const queryClient = useQueryClient();
  const [visibleSection, setVisibleSection] = useState<VisibleSection>("conSaldo");
  const [visibleLocation, setVisibleLocation] = useState<string>("todas");
  const [sortField, setSortField] = useState<SortField>("diasAsignado");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [updatingOpera, setUpdatingOpera] = useState<string | null>(null);
  const [comentarioModalOperacion, setComentarioModalOperacion] = useState<FsanchezOperacionItem | null>(null);
  const [comentarioDraft, setComentarioDraft] = useState("");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["fsanchez", "operaciones"],
    queryFn: getFsanchezOperaciones,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      opera,
      payload,
    }: {
      opera: string;
      payload: { cancelada?: boolean; alerta?: AlertLevel; comentario?: string };
    }) => updateFsanchezOperacionEstado(opera, payload),
    onMutate: ({ opera }) => {
      setUpdatingOpera(opera);
    },
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["fsanchez", "operaciones"] });
    },
    onError: (mutationError: Error) => {
      toast.error(mutationError.message);
    },
    onSettled: () => {
      setUpdatingOpera(null);
    },
  });
  const exportMutation = useMutation({
    mutationFn: () =>
      exportFsanchezOperaciones({
        section: visibleSection,
        location: visibleLocation,
      }),
    onSuccess: (blob) => {
      const today = new Date().toISOString().slice(0, 10);
      downloadBlob(blob, `fsanchez-${today}.xlsx`);
      toast.success("Excel exportado correctamente");
    },
    onError: (mutationError: Error) => {
      toast.error(mutationError.message);
    },
  });

  const operaciones = data?.data ?? [];
  const meta = data?.meta;
  const ubicaciones = useMemo(
    () => ["todas", ...Array.from(new Set(operaciones.map((item) => item.ubicacion))).sort((a, b) => a.localeCompare(b, "es"))],
    [operaciones],
  );

  const operacionesVisibles = useMemo(() => {
    const filtered = operaciones.filter((item) => {
      const matchesSection = visibleSection === "conSaldo" ? !item.cancelada : item.cancelada;
      const matchesLocation = visibleLocation === "todas" ? true : item.ubicacion === visibleLocation;

      return matchesSection && matchesLocation;
    });

    return [...filtered].sort((left, right) => {
      const directionFactor = sortDirection === "asc" ? 1 : -1;

      if (sortField === "diasAsignado") {
        const diff = left.diasAsignado - right.diasAsignado;
        if (diff !== 0) {
          return diff * directionFactor;
        }
      } else {
        const leftValue = left[sortField].localeCompare(right[sortField], "es", { sensitivity: "base" });
        if (leftValue !== 0) {
          return leftValue * directionFactor;
        }
      }

      return left.opera.localeCompare(right.opera, "es") * directionFactor;
    });
  }, [operaciones, sortDirection, sortField, visibleLocation, visibleSection]);

  const locationCounts = useMemo(() => {
    return ubicaciones.reduce<Record<string, number>>((acc, location) => {
      acc[location] = operaciones.filter((item) => {
        const matchesSection = visibleSection === "conSaldo" ? !item.cancelada : item.cancelada;
        const matchesLocation = location === "todas" ? true : item.ubicacion === location;
        return matchesSection && matchesLocation;
      }).length;
      return acc;
    }, {});
  }, [operaciones, ubicaciones, visibleSection]);

  const emptyMessage =
    visibleSection === "conSaldo"
      ? "No hay operaciones con saldo para mostrar."
      : "No hay operaciones canceladas para mostrar.";

  const handleToggle = (item: FsanchezOperacionItem) => {
    updateMutation.mutate({ opera: item.opera, payload: { cancelada: !item.cancelada } });
  };

  const handleAlertChange = (item: FsanchezOperacionItem, alerta: AlertLevel) => {
    updateMutation.mutate({ opera: item.opera, payload: { alerta } });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(field);
    setSortDirection(field === "diasAsignado" ? "desc" : "asc");
  };

  const getSortLabel = (field: SortField) => {
    if (sortField !== field) {
      return "";
    }

    return sortDirection === "asc" ? " ▲" : " ▼";
  };

  const openComentarioModal = (item: FsanchezOperacionItem) => {
    setComentarioModalOperacion(item);
    setComentarioDraft(item.comentario ?? "");
  };

  const saveComentario = () => {
    if (!comentarioModalOperacion) {
      return;
    }

    updateMutation.mutate(
      {
        opera: comentarioModalOperacion.opera,
        payload: { comentario: comentarioDraft },
      },
      {
        onSuccess: (response) => {
          toast.success(response.message);
          queryClient.invalidateQueries({ queryKey: ["fsanchez", "operaciones"] });
          setComentarioModalOperacion(null);
          setComentarioDraft("");
        },
      },
    );
  };

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="w-full px-4 py-6">
        <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900">Error al cargar FSANCHEZ</h1>
          <p className="mt-2 text-sm text-red-600">{error.message}</p>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-4 py-6">
      <section className="rounded-3xl border border-[#d9e4ff] bg-gradient-to-r from-[#eff4ff] via-white to-[#eefbf5] p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4c5fc3]">Super Admin</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">FSANCHEZ</h1>
            <p className="mt-2 max-w-3xl text-sm text-gray-600">
              Control manual de operaciones pendientes para separar las que siguen con saldo de las ya canceladas.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <article className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Total</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">{meta?.total ?? 0}</p>
            </article>
            <article className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Con saldo</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-emerald-900">{meta?.conSaldo ?? 0}</p>
            </article>
            <article className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Canceladas</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-amber-900">{meta?.canceladas ?? 0}</p>
            </article>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-gray-900">Operaciones</h2>
            <p className="mt-1 text-sm text-gray-500">
              {visibleSection === "conSaldo"
                ? "Vista principal con operaciones activas."
                : "Vista separada con operaciones marcadas manualmente como canceladas."}
            </p>
          </div>

          <div className="flex flex-col gap-3 md:items-end">
            <div className="flex w-full gap-2 md:w-auto">
              <div className="inline-flex flex-1 rounded-lg bg-gray-100 p-1 md:flex-none">
                <button
                  type="button"
                  onClick={() => setVisibleSection("conSaldo")}
                  className={[
                    "flex-1 rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors md:flex-none",
                    visibleSection === "conSaldo" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900",
                  ].join(" ")}
                >
                  Con saldo ({meta?.conSaldo ?? 0})
                </button>
                <button
                  type="button"
                  onClick={() => setVisibleSection("canceladas")}
                  className={[
                    "flex-1 rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors md:flex-none",
                    visibleSection === "canceladas" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900",
                  ].join(" ")}
                >
                  Canceladas ({meta?.canceladas ?? 0})
                </button>
              </div>

              <button
                type="button"
                onClick={() => exportMutation.mutate()}
                disabled={exportMutation.isPending}
                className="inline-flex h-[42px] items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-xs font-semibold uppercase tracking-wide text-gray-700 transition hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download size={14} />
                {exportMutation.isPending ? "Exportando..." : "Exportar Excel"}
              </button>
            </div>

            <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
              {ubicaciones.map((ubicacion) => (
                <button
                  key={ubicacion}
                  type="button"
                  onClick={() => setVisibleLocation(ubicacion)}
                  className={[
                    "shrink-0 rounded-md border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors",
                    visibleLocation === ubicacion
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 bg-white text-gray-600 hover:text-gray-900",
                  ].join(" ")}
                >
                  {ubicacion === "todas" ? "Todas" : ubicacion} ({locationCounts[ubicacion] ?? 0})
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-[0.16em] text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Opera</th>
                <th className="px-4 py-3 text-left">Modelo</th>
                <th className="px-4 py-3 text-left">
                  <button type="button" onClick={() => handleSort("version")} className="transition hover:text-gray-900">
                    Version{getSortLabel("version")}
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button type="button" onClick={() => handleSort("cliente")} className="transition hover:text-gray-900">
                    Cliente{getSortLabel("cliente")}
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button type="button" onClick={() => handleSort("vendedor")} className="transition hover:text-gray-900">
                    Vendedor{getSortLabel("vendedor")}
                  </button>
                </th>
                <th className="px-4 py-3 text-left">Ubicacion</th>
                <th className="px-4 py-3 text-left">Alerta</th>
                <th className="px-4 py-3 text-left">Comentario</th>
                <th className="px-4 py-3 text-left">
                  <button
                    type="button"
                    onClick={() => handleSort("diasAsignado")}
                    className="transition hover:text-gray-900"
                  >
                    Dias asignado{getSortLabel("diasAsignado")}
                  </button>
                </th>
                <th className="px-4 py-3 text-left">Color</th>
                <th className="px-4 py-3 text-right">Accion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {operacionesVisibles.map((item) => {
                const isUpdating = updatingOpera === item.opera;
                const nextIsCancelada = !item.cancelada;

                return (
                  <tr key={`${item.opera}-${item.interno}-${item.nrofab}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{item.opera}</td>
                    <td className="px-4 py-3 text-[12px] text-gray-700">{item.modelo}</td>
                    <td className="px-4 py-3 text-gray-700">{item.version}</td>
                    <td className="px-4 py-3 text-gray-700">{item.cliente}</td>
                    <td className="px-4 py-3 text-gray-700">{item.vendedor}</td>
                    <td className="px-4 py-3 text-gray-700">{item.ubicacion}</td>
                    <td className="px-4 py-3">
                      <select
                        value={item.alerta}
                        onChange={(event) => handleAlertChange(item, event.target.value as AlertLevel)}
                        disabled={isUpdating}
                        className={[
                          "rounded-md border px-2 py-1 text-xs font-semibold uppercase outline-none",
                          item.alerta === "alta"
                            ? "border-red-200 bg-red-50 text-red-700"
                            : item.alerta === "media"
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : "border-gray-200 bg-white text-gray-700",
                        ].join(" ")}
                      >
                        <option value="normal">Normal</option>
                        <option value="media">Media</option>
                        <option value="alta">Alta</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => openComentarioModal(item)}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] font-semibold leading-none text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        <MessageSquare size={12} strokeWidth={1.75} />
                        {item.comentario ? "Ver" : "Agregar"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{item.diasAsignado}</td>
                    <td className="px-4 py-3 text-gray-700">
                      <span className={`inline-block rounded-md border border-slate-200 px-2 py-1 text-xs font-medium ${textToColor(item.color)}`}>
                        {item.color}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggle(item)}
                        disabled={isUpdating}
                        title={nextIsCancelada ? "Cancelar operacion" : "Volver a con saldo"}
                        aria-label={nextIsCancelada ? "Cancelar operacion" : "Volver a con saldo"}
                        className={[
                          "inline-flex items-center justify-center rounded-lg p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                          nextIsCancelada
                            ? "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                            : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
                        ].join(" ")}
                      >
                        {isUpdating ? (
                          <span className="text-[11px] font-semibold">...</span>
                        ) : nextIsCancelada ? (
                          <XCircle size={16} strokeWidth={1.9} />
                        ) : (
                          <RotateCcw size={16} strokeWidth={1.9} />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {operacionesVisibles.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-10 text-center text-sm text-gray-500">
                    {emptyMessage}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <ComentarioModal
        open={Boolean(comentarioModalOperacion)}
        operacion={comentarioModalOperacion}
        comentario={comentarioDraft}
        onComentarioChange={setComentarioDraft}
        onClose={() => {
          setComentarioModalOperacion(null);
          setComentarioDraft("");
        }}
        onSave={saveComentario}
        isSaving={updateMutation.isPending && Boolean(comentarioModalOperacion)}
      />
    </div>
  );
}
