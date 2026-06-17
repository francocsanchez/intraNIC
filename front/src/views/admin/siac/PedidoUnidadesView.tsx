import Loading from "@/components/Loading";
import {
  createPedidoUnidad,
  getEstadoInternosArribo,
  getPedidoUnidadInfoInterno,
  getPedidosUnidades,
  getPedidoUnidadesPrevias,
  getPedidosUnidadesRegistro,
} from "@/api/dms/pedidoUnidadAPI";
import { hasModuleAccess } from "@/helpers/access";
import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";
import type { PedidoUnidad, PedidoUnidadItem, PedidoUnidadPrevia, PedidoUnidadPrioridad, PedidoUnidadRegistro } from "@/types/index";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, ChevronDown, ChevronUp, ClipboardList, Download, List, Plus, Trash2 } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const MAX_UNIDADES = 8;
const PAGE_SIZE = 20;
const EMPTY_PEDIDOS: PedidoUnidad[] = [];
const EMPTY_REGISTROS: PedidoUnidadRegistro[] = [];
const EMPTY_PREVIAS: PedidoUnidadPrevia[] = [];
const PRIORIDAD_OPTIONS: PedidoUnidadPrioridad[] = ["normal", "media", "urgente"];
const PRIORIDAD_ORDER: Record<PedidoUnidadPrioridad, number> = {
  urgente: 0,
  media: 1,
  normal: 2,
};

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

const prioridadBadgeClass: Record<PedidoUnidadPrioridad, string> = {
  normal: "bg-gray-100 text-gray-700",
  media: "bg-yellow-100 text-yellow-800",
  urgente: "bg-red-100 text-red-700",
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

function comparePrioridad(a: PedidoUnidadPrioridad, b: PedidoUnidadPrioridad) {
  return PRIORIDAD_ORDER[a] - PRIORIDAD_ORDER[b];
}

function comparePedidoItem(a: PedidoUnidadItem, b: PedidoUnidadItem) {
  const priorityDiff = comparePrioridad(a.prioridad, b.prioridad);
  if (priorityDiff !== 0) return priorityDiff;

  return a.interno - b.interno;
}

function comparePrevia(a: PedidoUnidadPrevia, b: PedidoUnidadPrevia) {
  const priorityDiff = comparePrioridad(a.prioridad, b.prioridad);
  if (priorityDiff !== 0) return priorityDiff;

  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
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

function escapeCsvCell(value: unknown) {
  const normalized = value == null ? "" : String(value);
  return `"${normalized.replace(/"/g, '""')}"`;
}

function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const csv = `\uFEFF${rows.map((row) => row.map(escapeCsvCell).join(";")).join("\r\n")}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

function mapPreviaToPedidoItem(item: PedidoUnidadPrevia): PedidoUnidadItem {
  return {
    interno: item.interno,
    version: item.version,
    order: "-",
    cliente: item.clienteNombre,
    vendedor: item.vendedorNombre,
    chasis: item.chasis,
    modelo: item.modelo,
    prioridad: item.prioridad,
    PDI: false,
    listaPreviaCreatedAt: item.createdAt,
  };
}

export default function PedidoUnidadesView() {
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const [fecha, setFecha] = useState<string>("");
  const [internoInput, setInternoInput] = useState<string>("");
  const [items, setItems] = useState<PedidoUnidadItem[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("carga");
  const [page, setPage] = useState<number>(1);
  const [expandedFecha, setExpandedFecha] = useState<string | null>(null);
  const [registroInternoInput, setRegistroInternoInput] = useState<string>("");
  const [registroInterno, setRegistroInterno] = useState<string>("");
  const [selectedPrevias, setSelectedPrevias] = useState<number[]>([]);
  const canManagePriority = hasModuleAccess(user, "pedidoUnidades");
  const canManagePedidos = hasModuleAccess(user, "pedidoUnidades");
  const canOpenAsignaciones = hasModuleAccess(user, "asignaciones");
  const canAccess = hasModuleAccess(user, "pedidoUnidades");
  const canOpenListaPrevia = hasModuleAccess(user, "listaPrevia");

  const { data: pedidosResponse, isLoading: isLoadingPedidos, isError: isErrorPedidos, error: pedidosError } = useQuery({
    queryKey: ["pedido-unidades", page],
    queryFn: () => getPedidosUnidades(page, PAGE_SIZE),
    enabled: canManagePedidos && viewMode === "registros",
    refetchOnWindowFocus: true,
  });

  const { data: registrosResponse, isLoading: isLoadingRegistros, isError: isErrorRegistros, error: registrosError } = useQuery({
    queryKey: ["pedido-unidades-registros", page, registroInterno],
    queryFn: () => getPedidosUnidadesRegistro(page, PAGE_SIZE, registroInterno),
    enabled: !canManagePedidos && viewMode === "registros",
    refetchOnWindowFocus: true,
  });

  const { data: previasData = EMPTY_PREVIAS, isLoading: isLoadingPrevias } = useQuery({
    queryKey: ["pedido-unidades-previas"],
    queryFn: getPedidoUnidadesPrevias,
    enabled: canManagePedidos,
    refetchOnWindowFocus: true,
  });

  const pedidos = pedidosResponse?.data ?? EMPTY_PEDIDOS;
  const registros = registrosResponse?.data ?? EMPTY_REGISTROS;
  const pagination = canManagePedidos ? pedidosResponse?.pagination : registrosResponse?.pagination;
  const previasOrdenadas = useMemo(() => [...previasData].sort(comparePrevia), [previasData]);
  const itemsOrdenados = useMemo(() => [...items].sort(comparePedidoItem), [items]);

  useEffect(() => {
    const requestedView = searchParams.get("view");

    if (!canManagePedidos) {
      setViewMode("registros");
      return;
    }

    if (requestedView === "registros") {
      setViewMode("registros");
      return;
    }

    if (requestedView === "carga") {
      setViewMode("carga");
    }
  }, [canManagePedidos, searchParams]);

  useEffect(() => {
    setPage(1);
  }, [registroInterno]);

  const pedidosAgrupadosPorFecha = useMemo<PedidoUnidadDateGroup[]>(() => {
    const groups = new Map<string, PedidoUnidad[]>();

    pedidos.forEach((pedido) => {
      const pedidosDelDia = groups.get(pedido.fecha) ?? [];
      pedidosDelDia.push(pedido);
      groups.set(pedido.fecha, pedidosDelDia);
    });

    return Array.from(groups.entries()).map(([fechaGrupo, pedidosDelDia]) => {
      const detalleItems = pedidosDelDia
        .flatMap((pedido) =>
          pedido.items.map((item) => ({
            pedido,
            item,
          })),
        )
        .sort((a, b) => comparePedidoItem(a.item, b.item));

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

  const internosEnPagina = useMemo(
    () =>
      Array.from(
        new Set(
          pedidosAgrupadosPorFecha.flatMap((grupo) =>
            grupo.detalleItems.map(({ item }) => Number(item.interno)),
          ),
        ),
      ),
    [pedidosAgrupadosPorFecha],
  );

  const { data: estadoPedidos = {}, isLoading: isLoadingEstadoPedidos } = useQuery({
    queryKey: ["pedido-unidades-estado-arribo", internosEnPagina.join("-")],
    queryFn: () => getEstadoInternosArribo(internosEnPagina),
    enabled: canManagePedidos && viewMode === "registros" && internosEnPagina.length > 0,
    refetchOnWindowFocus: true,
  });

  const internosRegistros = useMemo(
    () => Array.from(new Set(registros.map((registro) => Number(registro.interno)))),
    [registros],
  );

  const { data: estadoRegistros = {}, isLoading: isLoadingEstadoRegistros } = useQuery({
    queryKey: ["pedido-unidades-estado-arribo-registros", internosRegistros.join("-")],
    queryFn: () => getEstadoInternosArribo(internosRegistros),
    enabled: !canManagePedidos && viewMode === "registros" && internosRegistros.length > 0,
    refetchOnWindowFocus: true,
  });

  const removeInternosFromPreviasCache = (internos: number[]) => {
    if (!internos.length) return;

    queryClient.setQueryData<PedidoUnidadPrevia[]>(["pedido-unidades-previas"], (current) =>
      current?.filter((item) => !internos.includes(item.interno)) ?? current,
    );
  };

  const handleBuscarRegistro = () => {
    setRegistroInterno(registroInternoInput.trim());
    setPage(1);
  };

  const handleDownloadGrupo = (grupo: PedidoUnidadDateGroup) => {
    const rows = [
      ["Fecha pedido", formatDate(grupo.fecha)],
      ["Usuarios", grupo.usuarios.join(", ")],
      ["Total unidades", String(grupo.totalUnidades)],
      [],
      ["Interno", "Version", "Order", "Modelo", "Cliente", "Vendedor", "Chasis", "Prioridad", "Lista previa", "PDI", "Usuario", "Consolidado"],
      ...grupo.detalleItems.map(({ pedido, item }) => [
        item.interno,
        item.version,
        item.order,
        item.modelo,
        item.cliente,
        item.vendedor,
        item.chasis ?? "-",
        item.prioridad,
        item.listaPreviaCreatedAt ? formatDateTime(item.listaPreviaCreatedAt) : "-",
        item.PDI ? "Si" : "No",
        pedido.usuarioNombre,
        formatDateTime(pedido.createdAt),
      ]),
    ];

    downloadCsv(`pedido-unidades-${grupo.fecha}.csv`, rows);
  };

  const addInternoMutation = useMutation({
    mutationFn: getPedidoUnidadInfoInterno,
    onSuccess: (data) => {
      setItems((current) => [...current, { ...data, prioridad: "normal", PDI: false }]);
      removeInternosFromPreviasCache([data.interno]);
      setSelectedPrevias((current) => current.filter((interno) => interno !== data.interno));
      setInternoInput("");
    },
    onError: (mutationError: Error) => {
      toast.error(mutationError.message || "No se pudo obtener la informacion del interno");
    },
  });

  const savePedidoMutation = useMutation({
    mutationFn: async () => {
      return createPedidoUnidad({
        fecha,
        items: items.map((item) => ({
          interno: item.interno,
          PDI: item.PDI,
          prioridad: item.prioridad,
          listaPreviaCreatedAt: item.listaPreviaCreatedAt ?? null,
        })),
      });
    },
    onSuccess: (response) => {
      toast.success(response.message);
      setFecha("");
      setInternoInput("");
      setItems([]);
      setExpandedFecha(null);
      setViewMode("registros");
      queryClient.invalidateQueries({ queryKey: ["pedido-unidades"] });
      queryClient.invalidateQueries({ queryKey: ["pedido-unidades-registros"] });
      queryClient.invalidateQueries({ queryKey: ["pedido-unidades-previas"] });
    },
    onError: (mutationError: Error) => {
      toast.error(mutationError.message || "No se pudo guardar el pedido");
    },
  });

  const isLoading =
    authLoading ||
    (viewMode === "carga" && canManagePedidos && isLoadingPrevias) ||
    (viewMode === "registros" && canManagePedidos && isLoadingPedidos) ||
    (viewMode === "registros" && canManagePedidos && isLoadingEstadoPedidos) ||
    (viewMode === "registros" && !canManagePedidos && isLoadingEstadoRegistros) ||
    (viewMode === "registros" && !canManagePedidos && isLoadingRegistros);

  const hasActiveError = canManagePedidos ? isErrorPedidos : isErrorRegistros;
  const activeError = canManagePedidos ? pedidosError : registrosError;

  if (isLoading) return <Loading />;

  if (hasActiveError) {
    return (
      <div className="w-full px-4 py-6">
        <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900">
            Error al cargar pedidos de unidades
          </h1>
          <p className="mt-2 text-sm text-red-600">{activeError instanceof Error ? activeError.message : "Error desconocido"}</p>
        </section>
      </div>
    );
  }

  if (!canAccess) {
    return null;
  }

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

  const handleChangePrioridad = (interno: number, prioridad: PedidoUnidadPrioridad) => {
    setItems((current) =>
      current.map((item) => (item.interno === interno ? { ...item, prioridad } : item)),
    );
  };

  const handleTogglePreviaSelection = (interno: number) => {
    setSelectedPrevias((current) =>
      current.includes(interno) ? current.filter((value) => value !== interno) : [...current, interno],
    );
  };

  const handleAddSelectedPrevias = () => {
    if (!fecha) {
      toast.error("Debes seleccionar la fecha del pedido");
      return;
    }

    const previasSeleccionadas = previasData.filter((item) => selectedPrevias.includes(item.interno));

    if (!previasSeleccionadas.length) {
      toast.error("Selecciona al menos una unidad de la lista previa");
      return;
    }

    const repetidas = previasSeleccionadas.filter((previa) =>
      items.some((item) => item.interno === previa.interno),
    );

    if (repetidas.length) {
      toast.error(`Ya agregaste estos internos al pedido: ${repetidas.map((item) => item.interno).join(", ")}`);
      return;
    }

    if (items.length + previasSeleccionadas.length > MAX_UNIDADES) {
      toast.error("Solo puedes consolidar hasta 8 unidades por pedido");
      return;
    }

    setItems((current) => [...current, ...previasSeleccionadas.map(mapPreviaToPedidoItem)]);
    removeInternosFromPreviasCache(previasSeleccionadas.map((item) => item.interno));
    setSelectedPrevias([]);
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

  const totalRecords = canManagePedidos
    ? pedidosResponse?.pagination?.totalRecords ?? 0
    : pagination?.total ?? 0;
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
            {canOpenListaPrevia ? (
              <Link
                to={paths.administracion.pedidoUnidadesListaPrevia}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
              >
                <ClipboardList size={16} strokeWidth={1.75} />
                Lista previa
              </Link>
            ) : null}

            {canOpenAsignaciones && (
              <Link
                to={paths.convencional.asignaciones}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
              >
                <CalendarDays size={16} strokeWidth={1.75} />
                Volver a asignaciones
              </Link>
            )}

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
        {canManagePedidos && (
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
        )}

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

      {viewMode === "carga" && canManagePedidos ? (
        <section>
          <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-gray-900">Nuevo pedido</h2>
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

            <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Seleccionar desde lista previa</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Puedes mezclar unidades previas con carga manual en el mismo pedido.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddSelectedPrevias}
                  disabled={!selectedPrevias.length || !canAddMore}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  <Plus size={16} strokeWidth={2} />
                  Agregar seleccionadas
                </button>
              </div>

              <div className="mt-4 max-h-64 overflow-auto rounded-2xl border border-gray-200 bg-white">
                <table className="min-w-[1320px] w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50 text-xs uppercase tracking-[0.18em] text-gray-500">
                    <tr>
                      <th className="px-4 py-3 text-center">Sel.</th>
                      <th className="px-4 py-3 text-left">Interno</th>
                      <th className="px-4 py-3 text-left">Cliente</th>
                      <th className="px-4 py-3 text-left">Vendedor</th>
                      <th className="px-4 py-3 text-left">Version</th>
                      <th className="px-4 py-3 text-left">Modelo</th>
                      <th className="px-4 py-3 text-left">Chasis</th>
                      <th className="px-4 py-3 text-left">Prioridad</th>
                      <th className="px-4 py-3 text-left">Cargado</th>
                      <th className="px-4 py-3 text-left">Adm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {previasOrdenadas.map((previa) => {
                      const alreadyAdded = items.some((item) => item.interno === previa.interno);
                      const checked = selectedPrevias.includes(previa.interno);

                      return (
                        <tr key={previa._id} className={alreadyAdded ? "bg-gray-50 text-gray-400" : "hover:bg-gray-50"}>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={alreadyAdded}
                              onChange={() => handleTogglePreviaSelection(previa.interno)}
                              className="h-4 w-4 rounded border-gray-300 text-[#15aa9a] focus:ring-[#15aa9a] disabled:cursor-not-allowed"
                            />
                          </td>
                          <td className="px-4 py-3 font-semibold">{previa.interno}</td>
                          <td className="px-4 py-3">{previa.clienteNombre}</td>
                          <td className="px-4 py-3">{previa.vendedorNombre}</td>
                          <td className="px-4 py-3">{previa.version}</td>
                          <td className="px-4 py-3">{previa.modelo}</td>
                          <td className="px-4 py-3">{previa.chasis ?? "-"}</td>
                          <td className="px-4 py-3">
                            <span
                              className={[
                                "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                                prioridadBadgeClass[previa.prioridad],
                              ].join(" ")}
                            >
                              {previa.prioridad}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{formatDateTime(previa.createdAt)}</td>
                          <td className="px-4 py-3 text-gray-700">{previa.usuario}</td>
                        </tr>
                      );
                    })}

                    {!previasData.length ? (
                      <tr>
                        <td colSpan={10} className="px-6 py-8 text-center text-sm text-gray-500">
                          Todavia no hay unidades en la lista previa.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-[980px] w-full text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-[0.18em] text-gray-500">
                    <tr>
                      <th className="px-4 py-3 text-left">Interno</th>
                      <th className="px-4 py-3 text-left">Version</th>
                      <th className="px-4 py-3 text-left">Order</th>
                      <th className="px-4 py-3 text-left">Modelo</th>
                      <th className="px-4 py-3 text-left">Cliente</th>
                      <th className="px-4 py-3 text-left">Vendedor</th>
                      <th className="px-4 py-3 text-left">Chasis</th>
                      <th className="px-4 py-3 text-left">Prioridad</th>
                      <th className="px-4 py-3 text-left">Lista previa</th>
                      <th className="px-4 py-3 text-center">PDI</th>
                      <th className="px-4 py-3 text-center">Accion</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 bg-white">
                    {itemsOrdenados.map((item) => (
                      <tr key={item.interno} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-semibold text-gray-900">{item.interno}</td>
                        <td className="px-4 py-3 text-gray-700">{item.version}</td>
                        <td className="px-4 py-3 text-gray-700">{item.order}</td>
                        <td className="px-4 py-3 text-gray-700">{item.modelo}</td>
                        <td className="px-4 py-3 text-gray-700">{item.cliente}</td>
                        <td className="px-4 py-3 text-gray-700">{item.vendedor}</td>
                        <td className="px-4 py-3 text-gray-700">{item.chasis ?? "-"}</td>
                        <td className="px-4 py-3">
                          {canManagePriority ? (
                            <select
                              value={item.prioridad}
                              onChange={(event) =>
                                handleChangePrioridad(item.interno, event.target.value as PedidoUnidadPrioridad)
                              }
                              className={[
                                "rounded-full border-0 px-3 py-1 text-xs font-semibold outline-none",
                                prioridadBadgeClass[item.prioridad],
                              ].join(" ")}
                            >
                              {PRIORIDAD_OPTIONS.map((prioridad) => (
                                <option key={prioridad} value={prioridad}>
                                  {prioridad}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span
                              className={[
                                "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                                prioridadBadgeClass[item.prioridad],
                              ].join(" ")}
                            >
                              {item.prioridad}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {item.listaPreviaCreatedAt ? formatDateTime(item.listaPreviaCreatedAt) : "-"}
                        </td>
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
                        <td colSpan={11} className="px-6 py-10 text-center text-sm text-gray-500">
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
                <button
                  type="button"
                  onClick={handleSavePedido}
                  disabled={savePedidoMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-gray-950 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  <ClipboardList size={16} strokeWidth={2} />
                  Consolidar carga
                </button>
              </div>
            </div>
          </article>
        </section>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {canManagePedidos ? (
            <>
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
                  {pedidosResponse?.pagination?.totalRecords ?? totalRecords} registros
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[980px] w-full text-sm">
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
                          <tr key={`resumen-${grupo.fecha}`} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-semibold text-gray-900">{formatDate(grupo.fecha)}</td>
                            <td className="px-4 py-3 text-center text-gray-700">
                              {grupo.pedidos.length} {registrosLabel}
                            </td>
                            <td className="px-4 py-3 text-gray-700">{grupo.usuarios.join(", ")}</td>
                            <td className="px-4 py-3 text-center text-gray-700">{grupo.totalUnidades}</td>
                            <td className="px-4 py-3 text-center text-gray-700">{grupo.totalConPDI}</td>
                            <td className="px-4 py-3 text-gray-700">{formatDateTime(grupo.latestCreatedAt)}</td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setExpandedFecha(expanded ? null : grupo.fecha)}
                                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                                >
                                  {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                  {expanded ? "Ocultar" : "Expandir"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDownloadGrupo(grupo)}
                                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                                >
                                  <Download size={14} />
                                  Descargar
                                </button>
                              </div>
                            </td>
                          </tr>

                          {expanded ? (
                            <tr key={`detalle-${grupo.fecha}`} className="bg-gray-50">
                              <td colSpan={7} className="px-4 py-4">
                                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                                  <div className="overflow-x-auto">
                                    <table className="min-w-[1360px] w-full text-sm">
                                      <thead className="bg-gray-50 text-xs uppercase tracking-[0.18em] text-gray-500">
                                        <tr>
                                          <th className="px-4 py-3 text-left">Interno</th>
                                          <th className="px-4 py-3 text-left">Version</th>
                                          <th className="px-4 py-3 text-left">Order</th>
                                          <th className="px-4 py-3 text-left">Modelo</th>
                                          <th className="px-4 py-3 text-left">Cliente</th>
                                          <th className="px-4 py-3 text-left">Vendedor</th>
                                          <th className="px-4 py-3 text-left">Chasis</th>
                                          <th className="px-4 py-3 text-left">Prioridad</th>
                                          <th className="px-4 py-3 text-left">F. Sol</th>
                                          <th className="px-4 py-3 text-center">PDI</th>
                                          <th className="px-4 py-3 text-center">Llegó</th>
                                          <th className="px-4 py-3 text-left">Consolidado</th>
                                          <th className="px-4 py-3 text-left">ADM</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-100">
                                        {grupo.detalleItems.map(({ pedido, item }) => {
                                          const unidadArribada = Boolean(estadoPedidos[String(item.interno)]);

                                          return (
                                          <tr
                                            key={`${pedido._id}-${item.interno}`}
                                            className={[
                                              unidadArribada
                                                ? "bg-emerald-50 hover:bg-emerald-100"
                                                : "hover:bg-gray-50",
                                            ].join(" ")}
                                          >
                                            <td className="px-4 py-3 font-medium text-gray-900">
                                              <div className="flex flex-col">
                                                <span>{item.interno}</span>
                                                {unidadArribada ? (
                                                  <span className="text-xs font-semibold text-emerald-700">Arribada</span>
                                                ) : null}
                                              </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">{item.version}</td>
                                            <td className="px-4 py-3 text-gray-700">{item.order}</td>
                                            <td className="px-4 py-3 text-gray-700">{item.modelo}</td>
                                            <td className="px-4 py-3 text-gray-700">{item.cliente}</td>
                                            <td className="px-4 py-3 text-gray-700">{item.vendedor}</td>
                                            <td className="px-4 py-3 text-gray-700">{item.chasis ?? "-"}</td>
                                            <td className="px-4 py-3">
                                              <span
                                                className={[
                                                  "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                                                  prioridadBadgeClass[item.prioridad],
                                                ].join(" ")}
                                              >
                                                {item.prioridad}
                                              </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">
                                              {item.listaPreviaCreatedAt ? formatDateTime(item.listaPreviaCreatedAt) : "-"}
                                            </td>
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
                                            <td className="px-4 py-3 text-center">
                                              <span
                                                className={[
                                                  "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                                                  unidadArribada ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600",
                                                ].join(" ")}
                                              >
                                                {unidadArribada ? "Si" : "No"}
                                              </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">{formatDateTime(pedido.createdAt)}</td>
                                            <td className="px-4 py-3 text-gray-700">{item.listaPreviaUsuario ?? "-"}</td>
                                          </tr>
                                        )})}
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
            </>
          ) : (
            <>
              <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-base font-semibold tracking-tight text-gray-900">
                    Registro de unidades pedidas
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Consulta cada unidad consolidada, la fecha del pedido y el momento exacto en que se registro.
                  </p>
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <label className="flex min-w-[240px] flex-col gap-2 text-sm font-medium text-gray-700">
                    Buscar por interno
                    <input
                      type="text"
                      inputMode="numeric"
                      value={registroInternoInput}
                      onChange={(event) => setRegistroInternoInput(event.target.value.replace(/\D/g, ""))}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          handleBuscarRegistro();
                        }
                      }}
                      placeholder="Ej: 65799"
                      className="rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-[#15aa9a]"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleBuscarRegistro}
                    className="inline-flex items-center justify-center gap-2 self-end rounded-xl bg-[#15aa9a] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#129181]"
                  >
                    Buscar
                  </button>

                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                    {totalRecords} unidades
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[1320px] w-full text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-[0.18em] text-gray-500">
                    <tr>
                      <th className="px-4 py-3 text-left">Interno</th>
                      <th className="px-4 py-3 text-center">Llegó</th>
                      <th className="px-4 py-3 text-left">Fecha pedido</th>
                      <th className="px-4 py-3 text-left">Consolidado</th>
                      <th className="px-4 py-3 text-left">Cliente</th>
                      <th className="px-4 py-3 text-left">Vendedor</th>
                      <th className="px-4 py-3 text-left">Modelo</th>
                      <th className="px-4 py-3 text-left">Version</th>
                      <th className="px-4 py-3 text-left">Chasis</th>
                      <th className="px-4 py-3 text-left">Prioridad</th>
                      <th className="px-4 py-3 text-center">PDI</th>
                      <th className="px-4 py-3 text-left">Usuario lista previa</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {registros.map((registro) => {
                      const unidadArribada = Boolean(estadoRegistros[String(registro.interno)]);

                      return (
                      <tr
                        key={`${registro.pedidoId}-${registro.interno}`}
                        className={unidadArribada ? "bg-emerald-50 hover:bg-emerald-100" : "hover:bg-gray-50"}
                      >
                        <td className="px-4 py-3 font-semibold text-gray-900">{registro.interno}</td>
                        <td className="px-4 py-3 text-center">
                          {unidadArribada ? (
                            <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                              Si
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                              No
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{formatDate(registro.fecha)}</td>
                        <td className="px-4 py-3 text-gray-700">{formatDateTime(registro.createdAt)}</td>
                        <td className="px-4 py-3 text-gray-700">{registro.cliente}</td>
                        <td className="px-4 py-3 text-gray-700">{registro.vendedor}</td>
                        <td className="px-4 py-3 text-gray-700">{registro.modelo}</td>
                        <td className="px-4 py-3 text-gray-700">{registro.version}</td>
                        <td className="px-4 py-3 text-gray-700">{registro.chasis ?? "-"}</td>
                        <td className="px-4 py-3">
                          <span
                            className={[
                              "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                              prioridadBadgeClass[registro.prioridad],
                            ].join(" ")}
                          >
                            {registro.prioridad}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={[
                              "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                              registro.PDI ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600",
                            ].join(" ")}
                          >
                            {registro.PDI ? "Si" : "No"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{registro.listaPreviaUsuario ?? "-"}</td>
                      </tr>
                    )})}

                    {!registros.length ? (
                      <tr>
                        <td colSpan={12} className="px-6 py-12 text-center text-sm text-gray-500">
                          {registroInterno
                            ? "No se encontraron unidades para ese interno."
                            : "Todavia no hay unidades pedidas registradas."}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </>
          )}

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

