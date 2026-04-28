import Loading from "@/components/Loading";
import {
  createPedidoUnidad,
  getPedidoUnidadInfoInterno,
  getPedidosUnidades,
  updatePedidoUnidad,
} from "@/api/dms/pedidoUnidadAPI";
import { hasAnyRole } from "@/helpers/access";
import { useAuth } from "@/hooks/useAuthe";
import type { PedidoUnidad, PedidoUnidadItem } from "@/types/index";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, ChevronDown, ChevronUp, ClipboardList, List, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const MAX_UNIDADES = 8;
const PAGE_SIZE = 10;
const EMPTY_PEDIDOS: PedidoUnidad[] = [];

type ViewMode = "carga" | "registros";

type PedidoUnidadDateGroupItem = {
  pedido: PedidoUnidad;
  item: PedidoUnidadItem;
};

type PedidoUnidadDateGroup = {
  fecha: string;
  pedidos: PedidoUnidad[];
  detalleItems: PedidoUnidadDateGroupItem[];
  totalUnidades: number;
  totalConPDI: number;
  usuarios: string[];
  latestCreatedAt: string;
};

function formatDate(dateString: string) {
  const [year, month, day] = dateString.split("-");
  if (!year || !month || !day) return dateString;
  return `${day}/${month}/${year}`;
}

function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function getLatestCreatedAt(pedidos: PedidoUnidad[]) {
  return pedidos.reduce((latest, pedido) => {
    if (!latest) return pedido.createdAt;

    const latestTime = new Date(latest).getTime();
    const pedidoTime = new Date(pedido.createdAt).getTime();

    if (Number.isNaN(latestTime) || Number.isNaN(pedidoTime)) {
      return latest;
    }

    return pedidoTime > latestTime ? pedido.createdAt : latest;
  }, "");
}

export default function PedidoUnidadesView() {
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const [fecha, setFecha] = useState<string>("");
  const [internoInput, setInternoInput] = useState<string>("");
  const [items, setItems] = useState<PedidoUnidadItem[]>([]);
  const [editingPedidoId, setEditingPedidoId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("carga");
  const [page, setPage] = useState<number>(1);
  const [expandedFecha, setExpandedFecha] = useState<string | null>(null);

  const { data: pedidosResponse, isLoading, isError, error } = useQuery({
    queryKey: ["pedido-unidades", page],
    queryFn: () => getPedidosUnidades(page, PAGE_SIZE),
    refetchOnWindowFocus: true,
  });

  const pedidos = pedidosResponse?.data ?? EMPTY_PEDIDOS;
  const pagination = pedidosResponse?.pagination;

  const pedidosAgrupadosPorFecha = useMemo<PedidoUnidadDateGroup[]>(() => {
    const groups = new Map<string, PedidoUnidad[]>();

    pedidos.forEach((pedido) => {
      const pedidosDelDia = groups.get(pedido.fecha) ?? [];
      pedidosDelDia.push(pedido);
      groups.set(pedido.fecha, pedidosDelDia);
    });

    return Array.from(groups.entries()).map(([fechaGrupo, pedidosDelDia]) => {
      const detalleItems = pedidosDelDia.flatMap((pedido) =>
        pedido.items.map((item) => ({
          pedido,
          item,
        })),
      );

      return {
        fecha: fechaGrupo,
        pedidos: pedidosDelDia,
        detalleItems,
        totalUnidades: detalleItems.length,
        totalConPDI: detalleItems.filter(({ item }) => item.PDI).length,
        usuarios: Array.from(new Set(pedidosDelDia.map((pedido) => pedido.usuarioNombre))),
        latestCreatedAt: getLatestCreatedAt(pedidosDelDia),
      };
    });
  }, [pedidos]);

  const addInternoMutation = useMutation({
    mutationFn: getPedidoUnidadInfoInterno,
    onSuccess: (data) => {
      setItems((current) => [...current, { ...data, PDI: false }]);
      setInternoInput("");
    },
    onError: (mutationError: Error) => {
      toast.error(mutationError.message || "No se pudo obtener la informacion del interno");
    },
  });

  const savePedidoMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        fecha,
        items: items.map((item) => ({
          interno: item.interno,
          PDI: item.PDI,
        })),
      };

      if (editingPedidoId) {
        return updatePedidoUnidad(editingPedidoId, payload);
      }

      return createPedidoUnidad(payload);
    },
    onSuccess: (response) => {
      toast.success(response.message);
      setFecha("");
      setInternoInput("");
      setItems([]);
      setEditingPedidoId(null);
      setExpandedFecha(null);
      setViewMode("registros");
      queryClient.invalidateQueries({ queryKey: ["pedido-unidades"] });
    },
    onError: (mutationError: Error) => {
      toast.error(mutationError.message || "No se pudo guardar el pedido");
    },
  });

  if (authLoading || isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="w-full px-4 py-6">
        <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900">
            Error al cargar pedidos de unidades
          </h1>
          <p className="mt-2 text-sm text-red-600">{error.message}</p>
        </section>
      </div>
    );
  }

  const canAccess = hasAnyRole(user, ["admin", "stock"]);
  if (!canAccess) {
    return null;
  }

  const isEditing = Boolean(editingPedidoId);
  const canAddMore = items.length < MAX_UNIDADES;

  const handleAddInterno = () => {
    const interno = Number(internoInput.trim());

    if (!fecha) {
      toast.error("Debes seleccionar la fecha del pedido");
      return;
    }

    if (!Number.isInteger(interno) || interno <= 0) {
      toast.error("Ingresa un numero de interno valido");
      return;
    }

    if (!canAddMore) {
      toast.error("Solo puedes consolidar hasta 8 unidades por pedido");
      return;
    }

    if (items.some((item) => item.interno === interno)) {
      toast.error("Ese interno ya fue agregado al pedido");
      return;
    }

    addInternoMutation.mutate(interno);
  };

  const handleRemoveItem = (interno: number) => {
    setItems((current) => current.filter((item) => item.interno !== interno));
  };

  const handleTogglePDI = (interno: number) => {
    setItems((current) =>
      current.map((item) => (item.interno === interno ? { ...item, PDI: !item.PDI } : item)),
    );
  };

  const handleEditPedido = (pedido: PedidoUnidad) => {
    setEditingPedidoId(pedido._id);
    setFecha(pedido.fecha);
    setItems(pedido.items);
    setInternoInput("");
    setViewMode("carga");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingPedidoId(null);
    setFecha("");
    setInternoInput("");
    setItems([]);
  };

  const handleSavePedido = () => {
    if (!fecha) {
      toast.error("Debes seleccionar la fecha del pedido");
      return;
    }

    if (!items.length) {
      toast.error("Debes agregar al menos una unidad");
      return;
    }

    savePedidoMutation.mutate();
  };

  const totalRecords = pagination?.total ?? 0;
  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div className="w-full space-y-6 px-4 py-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              Solicitar unidades
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-gray-500">
              Registra pedidos consolidados de hasta 8 unidades y consulta el historial en un listado paginado.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/asignaciones"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
            >
              <CalendarDays size={16} strokeWidth={1.75} />
              Volver a asignaciones
            </Link>

            <button
              type="button"
              onClick={() => setViewMode("registros")}
              className="inline-flex items-center gap-2 rounded-xl bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
            >
              <List size={16} strokeWidth={1.75} />
              Ver registros de pedidos
            </button>
          </div>
        </div>
      </section>

      <section className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setViewMode("carga")}
          className={[
            "rounded-xl px-4 py-2 text-sm font-semibold transition-colors",
            viewMode === "carga" ? "bg-[#15aa9a] text-white" : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50",
          ].join(" ")}
        >
          Nueva carga
        </button>

        <button
          type="button"
          onClick={() => setViewMode("registros")}
          className={[
            "rounded-xl px-4 py-2 text-sm font-semibold transition-colors",
            viewMode === "registros" ? "bg-[#15aa9a] text-white" : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50",
          ].join(" ")}
        >
          Registros
        </button>
      </section>

      {viewMode === "carga" ? (
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-gray-900">
                  {isEditing ? "Editar pedido" : "Nuevo pedido"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Carga internos uno por uno y consolida cuando el pedido este completo.
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                {items.length}/{MAX_UNIDADES} unidades
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-[220px_minmax(0,1fr)_auto]">
              <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                Fecha del pedido
                <input
                  type="date"
                  value={fecha}
                  onChange={(event) => setFecha(event.target.value)}
                  className="rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-[#15aa9a]"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                Interno
                <input
                  type="number"
                  min={1}
                  value={internoInput}
                  onChange={(event) => setInternoInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleAddInterno();
                    }
                  }}
                  placeholder="Ej: 66439"
                  className="rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-[#15aa9a]"
                />
              </label>

              <button
                type="button"
                onClick={handleAddInterno}
                disabled={addInternoMutation.isPending || !canAddMore}
                className="inline-flex items-center justify-center gap-2 self-end rounded-xl bg-[#15aa9a] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#129181] disabled:cursor-not-allowed disabled:bg-[#8fd2ca]"
              >
                <Plus size={16} strokeWidth={2} />
                Agregar
              </button>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-[840px] w-full text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-[0.18em] text-gray-500">
                    <tr>
                      <th className="px-4 py-3 text-left">Interno</th>
                      <th className="px-4 py-3 text-left">Version</th>
                      <th className="px-4 py-3 text-left">Order</th>
                      <th className="px-4 py-3 text-left">Cliente</th>
                      <th className="px-4 py-3 text-left">Vendedor</th>
                      <th className="px-4 py-3 text-left">Chasis</th>
                      <th className="px-4 py-3 text-center">PDI</th>
                      <th className="px-4 py-3 text-center">Accion</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 bg-white">
                    {items.map((item) => (
                      <tr key={item.interno} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-semibold text-gray-900">{item.interno}</td>
                        <td className="px-4 py-3 text-gray-700">{item.version}</td>
                        <td className="px-4 py-3 text-gray-700">{item.order}</td>
                        <td className="px-4 py-3 text-gray-700">{item.cliente}</td>
                        <td className="px-4 py-3 text-gray-700">{item.vendedor}</td>
                        <td className="px-4 py-3 text-gray-700">{item.chasis}</td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={item.PDI}
                            onChange={() => handleTogglePDI(item.interno)}
                            className="h-4 w-4 rounded border-gray-300 text-[#15aa9a] focus:ring-[#15aa9a]"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.interno)}
                            className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
                          >
                            <Trash2 size={14} strokeWidth={1.8} />
                            Quitar
                          </button>
                        </td>
                      </tr>
                    ))}

                    {!items.length && (
                      <tr>
                        <td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-500">
                          Todavia no agregaste internos al pedido.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-gray-500">
                El registro guardara la fecha seleccionada y el usuario autenticado que consolida el pedido.
              </div>

              <div className="flex flex-wrap gap-3">
                {isEditing ? (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Cancelar edicion
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={handleSavePedido}
                  disabled={savePedidoMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-gray-950 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {isEditing ? <Save size={16} strokeWidth={2} /> : <ClipboardList size={16} strokeWidth={2} />}
                  {isEditing ? "Guardar cambios" : "Consolidar carga"}
                </button>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold tracking-tight text-gray-900">
              Resumen de carga
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Vista rapida del pedido en preparacion.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Fecha</p>
                <p className="mt-2 text-xl font-semibold text-gray-900">{fecha ? formatDate(fecha) : "-"}</p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Unidades</p>
                <p className="mt-2 text-xl font-semibold text-gray-900">{items.length}</p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Con PDI</p>
                <p className="mt-2 text-xl font-semibold text-gray-900">{items.filter((item) => item.PDI).length}</p>
              </div>
            </div>
          </article>
        </section>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-gray-900">
                Registros de pedidos
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Historial paginado con vista resumida por fecha y detalle expandible.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
              {totalRecords} registros
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[920px] w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-[0.18em] text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-center">Registros</th>
                  <th className="px-4 py-3 text-left">Usuario</th>
                  <th className="px-4 py-3 text-center">Unidades</th>
                  <th className="px-4 py-3 text-center">Con PDI</th>
                  <th className="px-4 py-3 text-left">Ultimo registro</th>
                  <th className="px-4 py-3 text-center">Detalle</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {pedidosAgrupadosPorFecha.map((grupo) => {
                  const expanded = expandedFecha === grupo.fecha;
                  const registrosLabel = grupo.pedidos.length === 1 ? "registro" : "registros";

                  return (
                    <Fragment key={grupo.fecha}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-semibold text-gray-900">{formatDate(grupo.fecha)}</td>
                        <td className="px-4 py-3 text-center text-gray-700">
                          {grupo.pedidos.length} {registrosLabel}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{grupo.usuarios.join(", ")}</td>
                        <td className="px-4 py-3 text-center text-gray-700">{grupo.totalUnidades}</td>
                        <td className="px-4 py-3 text-center text-gray-700">{grupo.totalConPDI}</td>
                        <td className="px-4 py-3 text-gray-700">{formatDateTime(grupo.latestCreatedAt)}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => setExpandedFecha(expanded ? null : grupo.fecha)}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                          >
                            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            {expanded ? "Ocultar" : "Expandir"}
                          </button>
                        </td>
                      </tr>

                      {expanded ? (
                        <tr className="bg-gray-50">
                          <td colSpan={7} className="px-4 py-4">
                            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                              <div className="overflow-x-auto">
                                <table className="min-w-[1120px] w-full text-sm">
                                  <thead className="bg-gray-50 text-xs uppercase tracking-[0.18em] text-gray-500">
                                    <tr>
                                      <th className="px-4 py-3 text-left">Interno</th>
                                      <th className="px-4 py-3 text-left">Version</th>
                                      <th className="px-4 py-3 text-left">Order</th>
                                      <th className="px-4 py-3 text-left">Cliente</th>
                                      <th className="px-4 py-3 text-left">Vendedor</th>
                                      <th className="px-4 py-3 text-left">Chasis</th>
                                      <th className="px-4 py-3 text-center">PDI</th>
                                      <th className="px-4 py-3 text-left">Usuario</th>
                                      <th className="px-4 py-3 text-left">Creado</th>
                                      <th className="px-4 py-3 text-center">Accion</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {grupo.detalleItems.map(({ pedido, item }) => (
                                      <tr key={`${pedido._id}-${item.interno}`} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-900">{item.interno}</td>
                                        <td className="px-4 py-3 text-gray-700">{item.version}</td>
                                        <td className="px-4 py-3 text-gray-700">{item.order}</td>
                                        <td className="px-4 py-3 text-gray-700">{item.cliente}</td>
                                        <td className="px-4 py-3 text-gray-700">{item.vendedor}</td>
                                        <td className="px-4 py-3 text-gray-700">{item.chasis}</td>
                                        <td className="px-4 py-3 text-center">
                                          <span
                                            className={[
                                              "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                                              item.PDI ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600",
                                            ].join(" ")}
                                          >
                                            {item.PDI ? "Si" : "No"}
                                          </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">{pedido.usuarioNombre}</td>
                                        <td className="px-4 py-3 text-gray-700">{formatDateTime(pedido.createdAt)}</td>
                                        <td className="px-4 py-3 text-center">
                                          <button
                                            type="button"
                                            onClick={() => handleEditPedido(pedido)}
                                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-950 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-gray-800"
                                          >
                                            <Pencil size={14} strokeWidth={1.8} />
                                            Editar
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}

                {!pedidos.length ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
                      Todavia no hay pedidos de unidades registrados.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-gray-500">
              Pagina {pagination?.page ?? 1} de {totalPages}
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
                disabled={page <= 1}
                className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Anterior
              </button>

              <button
                type="button"
                onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
                disabled={page >= totalPages}
                className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
