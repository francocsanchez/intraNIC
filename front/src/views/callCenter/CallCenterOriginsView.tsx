import {
  changeStatusCallCenterSummaryOrigin,
  createCallCenterSummaryOrigin,
  getCallCenterDataOrigins,
  getCallCenterSummaryOrigins,
  updateCallCenterDataOrigin,
  updateCallCenterSummaryOrigin,
} from "@/api/callCenterAPI";
import type { CallCenterDataOrigin, CallCenterSummaryOrigin } from "@/types/index";
import { Dialog, Transition } from "@headlessui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useEffect, useMemo, useState } from "react";
import { ChevronDown, Database, LoaderCircle, Pencil, Plus, Power, Save, Search, X } from "lucide-react";
import { toast } from "sonner";

function SummaryOriginModal({
  open,
  onClose,
  summaryOrigin,
}: {
  open: boolean;
  onClose: () => void;
  summaryOrigin: CallCenterSummaryOrigin | null;
}) {
  const queryClient = useQueryClient();
  const isEditing = Boolean(summaryOrigin);
  const [nombre, setNombre] = useState("");
  const [activo, setActivo] = useState(true);

  useEffect(() => {
    if (!open) return;

    setNombre(summaryOrigin?.nombre ?? "");
    setActivo(summaryOrigin?.activo ?? true);
  }, [open, summaryOrigin]);

  const mutation = useMutation({
    mutationFn: async () => {
      const normalizedName = nombre.trim();

      if (!normalizedName) {
        throw new Error("El nombre es obligatorio");
      }

      if (summaryOrigin?._id) {
        return updateCallCenterSummaryOrigin(summaryOrigin._id, { nombre: normalizedName, activo });
      }

      return createCallCenterSummaryOrigin({ nombre: normalizedName, activo });
    },
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["call-center", "origenes-resumidos"] });
      queryClient.invalidateQueries({ queryKey: ["call-center", "origenes"] });
      onClose();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => (mutation.isPending ? undefined : onClose())}>
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
              <Dialog.Panel className="w-full max-w-xl overflow-hidden rounded-2xl border border-[#e5dccd] bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-[#ece3d4] px-5 py-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7b62]">Call Center</p>
                    <Dialog.Title className="mt-1 text-xl font-semibold tracking-tight text-[#2f2616]">
                      {isEditing ? "Editar origen resumido" : "Nuevo origen resumido"}
                    </Dialog.Title>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    disabled={mutation.isPending}
                    className="rounded-lg border border-[#e5dccd] p-2 text-[#6d6049] transition hover:bg-[#f8f4eb] hover:text-[#2f2616] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-4 p-5">
                  <label className="block space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7b62]">Nombre</span>
                    <input
                      type="text"
                      value={nombre}
                      onChange={(event) => setNombre(event.target.value)}
                      className="w-full rounded-xl border border-[#dfd6c6] bg-[#fcfbf7] px-4 py-2.5 text-sm text-[#2f2616] outline-none transition-colors focus:border-[#c5ae7a]"
                    />
                  </label>

                  <label className="flex items-center justify-between gap-3 rounded-xl border border-[#ece3d4] bg-[#fbf8f2] px-4 py-3 text-sm font-medium text-[#2f2616]">
                    <span>Origen resumido activo</span>
                    <input
                      type="checkbox"
                      checked={activo}
                      onChange={(event) => setActivo(event.target.checked)}
                      className="h-4 w-4 rounded border-[#cdbfa6] text-[#8a6400] focus:ring-[#8a6400]"
                    />
                  </label>
                </div>

                <div className="flex flex-col gap-3 border-t border-[#ece3d4] bg-[#fbf8f2] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-[#6d6049]">Guarda los cambios para actualizar el catalogo.</div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={mutation.isPending}
                      className="inline-flex items-center justify-center rounded-lg border border-[#e5dccd] bg-white px-4 py-2.5 text-sm font-semibold text-[#2f2616] transition-colors hover:bg-[#f8f4eb] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => mutation.mutate()}
                      disabled={mutation.isPending}
                      className="inline-flex items-center justify-center rounded-lg bg-[#8a6400] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#715100] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {mutation.isPending ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear origen resumido"}
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

const SELECT_BASE_CLASS =
  "w-full appearance-none rounded-xl border border-[#dfd6c6] bg-[#fcfbf7] px-3 py-2 text-sm text-[#2f2616] outline-none transition focus:border-[#c5ae7a]";

export default function CallCenterOriginsView() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [visibleSection, setVisibleSection] = useState<"conResumen" | "sinResumen">("sinResumen");
  const [catalogSection, setCatalogSection] = useState<"activos" | "inactivos">("activos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSummaryOrigin, setEditingSummaryOrigin] = useState<CallCenterSummaryOrigin | null>(null);
  const [editingAssignments, setEditingAssignments] = useState<Record<string, string>>({});

  const { data, isLoading, isError } = useQuery({
    queryKey: ["call-center", "origenes"],
    queryFn: getCallCenterDataOrigins,
  });

  const { data: summaryOriginsResponse, isLoading: summaryOriginsLoading, isError: summaryOriginsError } = useQuery({
    queryKey: ["call-center", "origenes-resumidos"],
    queryFn: () => getCallCenterSummaryOrigins(),
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, origenResumidoId }: { id: string; origenResumidoId: string | null }) =>
      updateCallCenterDataOrigin(id, origenResumidoId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["call-center", "origenes"] });
      toast.success(response.message);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const statusMutation = useMutation({
    mutationFn: (id: string) => changeStatusCallCenterSummaryOrigin(id),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["call-center", "origenes-resumidos"] });
      queryClient.invalidateQueries({ queryKey: ["call-center", "origenes"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const origins = data?.data ?? [];
  const summaryOrigins: CallCenterSummaryOrigin[] = summaryOriginsResponse?.data ?? [];
  const normalizedSearch = search.trim().toLowerCase();

  const conResumen = useMemo(() => origins.filter((origin) => Boolean(origin.origenResumido)), [origins]);
  const sinResumen = useMemo(() => origins.filter((origin) => !origin.origenResumido), [origins]);
  const originsVisiblesBase = visibleSection === "conResumen" ? conResumen : sinResumen;

  const filteredOrigins = useMemo(
    () =>
      originsVisiblesBase.filter((origin) => {
        if (!normalizedSearch) {
          return true;
        }

        return (
          origin.origen.toLowerCase().includes(normalizedSearch) ||
          (origin.origenResumido?.nombre ?? "").toLowerCase().includes(normalizedSearch)
        );
      }),
    [originsVisiblesBase, normalizedSearch],
  );

  const activeSummaryOrigins = useMemo(() => summaryOrigins.filter((item: CallCenterSummaryOrigin) => item.activo), [summaryOrigins]);
  const inactiveSummaryOrigins = useMemo(() => summaryOrigins.filter((item: CallCenterSummaryOrigin) => !item.activo), [summaryOrigins]);
  const summaryOriginsVisibles = catalogSection === "activos" ? activeSummaryOrigins : inactiveSummaryOrigins;

  const getCurrentAssignment = (origin: CallCenterDataOrigin) =>
    Object.prototype.hasOwnProperty.call(editingAssignments, origin._id)
      ? editingAssignments[origin._id]
      : origin.origenResumidoId ?? "";

  const hasAssignmentChanges = (origin: CallCenterDataOrigin) =>
    getCurrentAssignment(origin) !== (origin.origenResumidoId ?? "");

  const getSelectOptions = (origin: CallCenterDataOrigin) => {
    const options = [...activeSummaryOrigins];
    const current = origin.origenResumido;

    if (current && !current.activo && !options.some((item) => item._id === current._id)) {
      options.push(current);
    }

    return options.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  };

  const handleSaveAssignment = (origin: CallCenterDataOrigin) => {
    const currentValue = getCurrentAssignment(origin);

    assignMutation.mutate({
      id: origin._id,
      origenResumidoId: currentValue ? currentValue : null,
    });
  };

  const handleCreateSummaryOrigin = () => {
    setEditingSummaryOrigin(null);
    setIsModalOpen(true);
  };

  const handleEditSummaryOrigin = (summaryOrigin: CallCenterSummaryOrigin) => {
    setEditingSummaryOrigin(summaryOrigin);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingSummaryOrigin(null);
    setIsModalOpen(false);
  };

  return (
    <div className="w-full space-y-6 px-1 py-1">
      <section className="rounded-3xl border border-[#e5dccd] bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7b62]">Call Center</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#2f2616]">Origenes de datos</h1>
        <p className="mt-1 max-w-3xl text-sm text-[#6d6049]">
          Asigna cada origen a un catalogo controlado de origenes resumidos para evitar errores de escritura y dejar
          la base lista para el analisis.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-[#e5dccd] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7b62]">Total origenes</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-[#2f2616]">{origins.length}</p>
        </article>

        <article className="rounded-2xl border border-[#e5dccd] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7b62]">Con origen resumido</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-[#2f2616]">{conResumen.length}</p>
        </article>

        <article className="rounded-2xl border border-[#e5dccd] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7b62]">Sin origen resumido</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-[#2f2616]">{sinResumen.length}</p>
        </article>
      </section>

      <section className="rounded-3xl border border-[#e5dccd] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-[#2f2616]">Asignacion de origenes</h2>
            <p className="mt-1 text-sm text-[#6d6049]">
              Usa el selector para vincular cada origen detectado con un origen resumido del catalogo.
            </p>
          </div>

          <label className="flex w-full max-w-md items-center gap-3 rounded-2xl border border-[#e0d7c8] bg-[#fcfbf7] px-4 py-3 text-sm text-[#6d6049]">
            <Search size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por origen o resumen"
              className="w-full bg-transparent outline-none placeholder:text-[#a39781]"
            />
          </label>
        </div>

        {isLoading ? <div className="py-12 text-sm text-[#6d6049]">Cargando origenes de datos...</div> : null}
        {isError ? (
          <div className="py-12 text-sm font-medium text-red-600">No se pudieron cargar los origenes de datos.</div>
        ) : null}

        {!isLoading && !isError ? (
          <>
            <div className="mt-5 inline-flex w-full rounded-lg bg-[#f3eee5] p-1 md:w-auto">
              <button
                type="button"
                onClick={() => setVisibleSection("sinResumen")}
                className={[
                  "flex-1 rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors md:flex-none",
                  visibleSection === "sinResumen"
                    ? "bg-white text-[#2f2616] shadow-sm"
                    : "text-[#6d6049] hover:text-[#2f2616]",
                ].join(" ")}
              >
                Sin origen resumido ({sinResumen.length})
              </button>
              <button
                type="button"
                onClick={() => setVisibleSection("conResumen")}
                className={[
                  "flex-1 rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors md:flex-none",
                  visibleSection === "conResumen"
                    ? "bg-white text-[#2f2616] shadow-sm"
                    : "text-[#6d6049] hover:text-[#2f2616]",
                ].join(" ")}
              >
                Con origen resumido ({conResumen.length})
              </button>
            </div>

            <div className="mt-6 overflow-hidden rounded-3xl border border-[#ece3d4]">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#ece3d4]">
                  <thead className="bg-[#faf6ee]">
                    <tr>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7f735f]">
                        Origen
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7f735f]">
                        Estado
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7f735f]">
                        Origen resumido
                      </th>
                      <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7f735f]">
                        Accion
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#f1ebdf] bg-white">
                    {filteredOrigins.map((origin) => {
                      const savingCurrentRow = assignMutation.isPending && assignMutation.variables?.id === origin._id;
                      const currentAssignment = getCurrentAssignment(origin);
                      const options = getSelectOptions(origin);

                      return (
                        <tr key={origin._id}>
                          <td className="px-5 py-4 text-sm font-medium text-[#2f2616]">{origin.origen}</td>
                          <td className="px-5 py-4">
                            <span
                              className={[
                                "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                                origin.origenResumido
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-amber-100 text-amber-700",
                              ].join(" ")}
                            >
                              {origin.origenResumido ? "Con resumen" : "Pendiente"}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="relative">
                              <select
                                value={currentAssignment}
                                onChange={(event) =>
                                  setEditingAssignments((current) => ({
                                    ...current,
                                    [origin._id]: event.target.value,
                                  }))
                                }
                                className={SELECT_BASE_CLASS}
                              >
                                <option value="">Sin resumir</option>
                                {options.map((option) => (
                                  <option key={option._id} value={option._id}>
                                    {option.nombre}{option.activo ? "" : " (Inactivo)"}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8a7b62]" size={16} />
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleSaveAssignment(origin)}
                              disabled={!hasAssignmentChanges(origin) || savingCurrentRow}
                              className="inline-flex items-center gap-2 rounded-xl border border-[#d8cfbf] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#2f2616] transition hover:border-[#bcae93] hover:bg-[#f8f4eb] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {savingCurrentRow ? <LoaderCircle size={14} className="animate-spin" /> : <Save size={14} />}
                              Guardar
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {!filteredOrigins.length ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-10 text-center text-sm text-[#6d6049]">
                          No hay origenes que coincidan con la vista actual.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : null}
      </section>

      <section className="rounded-3xl border border-[#e5dccd] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-[#2f2616]">Catalogo de origenes resumidos</h2>
            <p className="mt-1 text-sm text-[#6d6049]">
              Administra las opciones del desplegable para unificar criterios y evitar errores de escritura.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCreateSummaryOrigin}
            className="inline-flex items-center gap-2 rounded-xl bg-[#8a6400] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#715100]"
          >
            <Plus size={16} />
            Nuevo origen resumido
          </button>
        </div>

        {summaryOriginsLoading ? <div className="py-12 text-sm text-[#6d6049]">Cargando origenes resumidos...</div> : null}
        {summaryOriginsError ? (
          <div className="py-12 text-sm font-medium text-red-600">No se pudieron cargar los origenes resumidos.</div>
        ) : null}

        {!summaryOriginsLoading && !summaryOriginsError ? (
          <>
            <section className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              <article className="rounded-2xl border border-[#ece3d4] bg-[#fcfbf7] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7b62]">Total catalogo</p>
                <p className="mt-1.5 text-2xl font-semibold tracking-tight text-[#2f2616]">{summaryOrigins.length}</p>
              </article>
              <article className="rounded-2xl border border-[#ece3d4] bg-[#fcfbf7] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7b62]">Activos</p>
                <p className="mt-1.5 text-2xl font-semibold tracking-tight text-[#2f2616]">{activeSummaryOrigins.length}</p>
              </article>
              <article className="rounded-2xl border border-[#ece3d4] bg-[#fcfbf7] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7b62]">Inactivos</p>
                <p className="mt-1.5 text-2xl font-semibold tracking-tight text-[#2f2616]">{inactiveSummaryOrigins.length}</p>
              </article>
            </section>

            <div className="mt-5 inline-flex w-full rounded-lg bg-[#f3eee5] p-1 md:w-auto">
              <button
                type="button"
                onClick={() => setCatalogSection("activos")}
                className={[
                  "flex-1 rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors md:flex-none",
                  catalogSection === "activos"
                    ? "bg-white text-[#2f2616] shadow-sm"
                    : "text-[#6d6049] hover:text-[#2f2616]",
                ].join(" ")}
              >
                Activos ({activeSummaryOrigins.length})
              </button>
              <button
                type="button"
                onClick={() => setCatalogSection("inactivos")}
                className={[
                  "flex-1 rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors md:flex-none",
                  catalogSection === "inactivos"
                    ? "bg-white text-[#2f2616] shadow-sm"
                    : "text-[#6d6049] hover:text-[#2f2616]",
                ].join(" ")}
              >
                Inactivos ({inactiveSummaryOrigins.length})
              </button>
            </div>

            <div className="mt-6 overflow-hidden rounded-3xl border border-[#ece3d4]">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-[#faf6ee] text-[11px] uppercase tracking-[0.16em] text-[#7f735f]">
                    <tr>
                      <th className="px-5 py-3 text-left">Nombre</th>
                      <th className="px-5 py-3 text-center">Estado</th>
                      <th className="px-5 py-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1ebdf] bg-white">
                    {summaryOriginsVisibles.map((summaryOrigin: CallCenterSummaryOrigin) => (
                      <tr key={summaryOrigin._id} className="hover:bg-[#fcfbf7]">
                        <td className="px-5 py-3 font-medium text-[#2f2616]">
                          <div className="flex items-center gap-3">
                            <Database size={16} className="text-[#8a6400]" />
                            {summaryOrigin.nombre}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span
                            className={[
                              "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                              summaryOrigin.activo ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600",
                            ].join(" ")}
                          >
                            {summaryOrigin.activo ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => statusMutation.mutate(summaryOrigin._id)}
                              disabled={statusMutation.isPending}
                              className={[
                                "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                                summaryOrigin.activo
                                  ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                                  : "border border-green-200 bg-green-50 text-green-700 hover:bg-green-100",
                              ].join(" ")}
                            >
                              <Power size={14} />
                              {summaryOrigin.activo ? "Desactivar" : "Activar"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditSummaryOrigin(summaryOrigin)}
                              className="inline-flex items-center gap-2 rounded-xl border border-[#e5dccd] px-3 py-2 text-xs font-semibold text-[#2f2616] hover:bg-[#f8f4eb]"
                            >
                              <Pencil size={14} />
                              Editar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!summaryOriginsVisibles.length ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-10 text-center text-sm text-[#6d6049]">
                          {catalogSection === "activos"
                            ? "No hay origenes resumidos activos."
                            : "No hay origenes resumidos inactivos."}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : null}
      </section>

      <SummaryOriginModal open={isModalOpen} onClose={handleCloseModal} summaryOrigin={editingSummaryOrigin} />
    </div>
  );
}
