import Loading from "@/components/Loading";
import {
  createPedidoUnidad,
  getEstadoInternosArribo,
  getPedidoUnidadInfoInterno,
  getPedidosUnidades,
  getPedidoUnidadesPrevias,
  getPedidosUnidadesRegistro,
} from "@/api/dms/pedidoUnidadAPI";
import { hasModuleAccess, hasPathAccess } from "@/helpers/access";
import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";
import type { PedidoUnidad, PedidoUnidadItem, PedidoUnidadPrevia, PedidoUnidadPrioridad, PedidoUnidadRegistro } from "@/types/index";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, ChevronDown, ChevronUp, ClipboardList, Clock3, Download, House, List, Plus, Trash2, Truck } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
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
type RegistroEstadoFilter = "todos" | "entregada" | "en-viaje" | "pendiente";

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
  normal: "bg-muted text-muted-foreground",
  media: "bg-secondary text-secondary-foreground",
  urgente: "bg-destructive/10 text-destructive",
};

const REGISTRO_ESTADO_FILTERS: Array<{ value: RegistroEstadoFilter; label: string }> = [
  { value: "todos", label: "Todos" },
  { value: "entregada", label: "Entregadas" },
  { value: "en-viaje", label: "En viaje" },
  { value: "pendiente", label: "Pendientes" },
];

function normalizeRegistroEstado(value: string | null | undefined) {
  return (value ?? "").trim().toUpperCase();
}

function matchesRegistroEstadoFilter(estado: string | null | undefined, filter: RegistroEstadoFilter) {
  const normalized = normalizeRegistroEstado(estado);

  if (filter === "todos") return true;
  if (filter === "entregada") return normalized === "ENTREGADA";
  if (filter === "en-viaje") return normalized === "EN VIAJE";
  if (filter === "pendiente") return normalized === "PENDIENTE";

  return true;
}

function getRegistroEstadoBadge(estado: string | null | undefined) {
  const normalized = normalizeRegistroEstado(estado);

  if (normalized === "ENTREGADA") {
    return {
      label: "ENTREGADA",
      className: "bg-secondary text-secondary-foreground",
      Icon: House,
    };
  }

  if (normalized === "EN VIAJE") {
    return {
      label: "EN VIAJE",
      className: "bg-secondary text-secondary-foreground",
      Icon: Truck,
    };
  }

  if (normalized === "PENDIENTE") {
    return {
      label: "PENDIENTE",
      className: "bg-muted text-muted-foreground",
      Icon: Clock3,
    };
  }

  return null;
}

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
    estadoUnidad: null,
    prioridad: item.prioridad,
    PDI: false,
    listaPreviaCreatedAt: item.createdAt,
  };
}

export default function PedidoUnidadesView() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const requestedView = searchParams.get("view");
  const isAdminRegistrosRoute = pathname === paths.administracion.pedidoUnidadesRegistros;
  const canManagePriority = hasModuleAccess(user, "pedidoUnidades");
  const canManagePedidos = hasModuleAccess(user, "pedidoUnidades");
  const canOpenAsignaciones = hasModuleAccess(user, "asignaciones");
  const canAccess = isAdminRegistrosRoute
    ? hasPathAccess(user, paths.administracion.pedidoUnidadesRegistros)
    : hasPathAccess(user, paths.convencional.pedidoUnidades);
  const canOpenListaPrevia = hasModuleAccess(user, "listaPrevia");
  const [fecha, setFecha] = useState<string>("");
  const [internoInput, setInternoInput] = useState<string>("");
  const [items, setItems] = useState<PedidoUnidadItem[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (!canManagePedidos) {
      return "registros";
    }

    return requestedView === "registros" ? "registros" : "carga";
  });
  const [page, setPage] = useState<number>(1);
  const [expandedFecha, setExpandedFecha] = useState<string | null>(null);
  const [registroInternoInput, setRegistroInternoInput] = useState<string>("");
  const [registroInterno, setRegistroInterno] = useState<string>("");
  const [registroEstadoFilter, setRegistroEstadoFilter] = useState<RegistroEstadoFilter>("todos");
  const [selectedPrevias, setSelectedPrevias] = useState<number[]>([]);
  const effectiveViewMode: ViewMode = canManagePedidos ? viewMode : "registros";

  const { data: pedidosResponse, isLoading: isLoadingPedidos, isError: isErrorPedidos, error: pedidosError } = useQuery({
    queryKey: ["pedido-unidades", page],
    queryFn: () => getPedidosUnidades(page, PAGE_SIZE),
    enabled: canManagePedidos && effectiveViewMode === "registros",
    refetchOnWindowFocus: true,
  });

  const { data: registrosResponse, isLoading: isLoadingRegistros, isError: isErrorRegistros, error: registrosError } = useQuery({
    queryKey: ["pedido-unidades-registros", page, registroInterno],
    queryFn: () => getPedidosUnidadesRegistro(page, PAGE_SIZE, registroInterno),
    enabled: !canManagePedidos && effectiveViewMode === "registros",
    refetchOnWindowFocus: true,
  });

  const { data: previasData = EMPTY_PREVIAS, isLoading: isLoadingPrevias } = useQuery({
    queryKey: ["pedido-unidades-previas"],
    queryFn: getPedidoUnidadesPrevias,
    enabled: canManagePedidos && canOpenListaPrevia && effectiveViewMode === "carga",
    refetchOnWindowFocus: true,
  });

  const pedidos = pedidosResponse?.data ?? EMPTY_PEDIDOS;
  const registros = registrosResponse?.data ?? EMPTY_REGISTROS;
  const pagination = canManagePedidos ? pedidosResponse?.pagination : registrosResponse?.pagination;
  const previasOrdenadas = useMemo(() => [...previasData].sort(comparePrevia), [previasData]);
  const itemsOrdenados = useMemo(() => [...items].sort(comparePedidoItem), [items]);
  const registroEstadoCounts = useMemo(
    () => ({
      todos: registros.length,
      entregada: registros.filter((registro) => matchesRegistroEstadoFilter(registro.estadoUnidad, "entregada")).length,
      "en-viaje": registros.filter((registro) => matchesRegistroEstadoFilter(registro.estadoUnidad, "en-viaje")).length,
      pendiente: registros.filter((registro) => matchesRegistroEstadoFilter(registro.estadoUnidad, "pendiente")).length,
    }),
    [registros],
  );
  const registrosFiltrados = useMemo(
    () => registros.filter((registro) => matchesRegistroEstadoFilter(registro.estadoUnidad, registroEstadoFilter)),
    [registros, registroEstadoFilter],
  );

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
  const pedidoEstadoCounts = useMemo(
    () => ({
      todos: pedidosAgrupadosPorFecha.reduce((acc, grupo) => acc + grupo.detalleItems.length, 0),
      entregada: pedidosAgrupadosPorFecha.reduce(
        (acc, grupo) =>
          acc + grupo.detalleItems.filter(({ item }) => matchesRegistroEstadoFilter(item.estadoUnidad, "entregada")).length,
        0,
      ),
      "en-viaje": pedidosAgrupadosPorFecha.reduce(
        (acc, grupo) =>
          acc + grupo.detalleItems.filter(({ item }) => matchesRegistroEstadoFilter(item.estadoUnidad, "en-viaje")).length,
        0,
      ),
      pendiente: pedidosAgrupadosPorFecha.reduce(
        (acc, grupo) =>
          acc + grupo.detalleItems.filter(({ item }) => matchesRegistroEstadoFilter(item.estadoUnidad, "pendiente")).length,
        0,
      ),
    }),
    [pedidosAgrupadosPorFecha],
  );
  const pedidosAgrupadosFiltrados = useMemo(
    () =>
      pedidosAgrupadosPorFecha
        .map((grupo) => {
          const detalleItems = grupo.detalleItems.filter(({ item }) =>
            matchesRegistroEstadoFilter(item.estadoUnidad, registroEstadoFilter),
          );

          return {
            ...grupo,
            detalleItems,
            totalUnidades: detalleItems.length,
            totalConPDI: detalleItems.filter(({ item }) => item.PDI).length,
          };
        })
        .filter((grupo) => grupo.detalleItems.length > 0),
    [pedidosAgrupadosPorFecha, registroEstadoFilter],
  );

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
    enabled: canManagePedidos && effectiveViewMode === "registros" && internosEnPagina.length > 0,
    refetchOnWindowFocus: true,
  });

  const internosRegistros = useMemo(
    () => Array.from(new Set(registros.map((registro) => Number(registro.interno)))),
    [registros],
  );

  const { data: estadoRegistros = {}, isLoading: isLoadingEstadoRegistros } = useQuery({
    queryKey: ["pedido-unidades-estado-arribo-registros", internosRegistros.join("-")],
    queryFn: () => getEstadoInternosArribo(internosRegistros),
    enabled: !canManagePedidos && effectiveViewMode === "registros" && internosRegistros.length > 0,
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
      setItems((current) => [...current, { ...data, estadoUnidad: null, prioridad: "normal", PDI: false }]);
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
    (effectiveViewMode === "carga" && canManagePedidos && canOpenListaPrevia && isLoadingPrevias) ||
    (effectiveViewMode === "registros" && canManagePedidos && isLoadingPedidos) ||
    (effectiveViewMode === "registros" && canManagePedidos && isLoadingEstadoPedidos) ||
    (effectiveViewMode === "registros" && !canManagePedidos && isLoadingEstadoRegistros) ||
    (effectiveViewMode === "registros" && !canManagePedidos && isLoadingRegistros);

  const hasActiveError = canManagePedidos ? isErrorPedidos : isErrorRegistros;
  const activeError = canManagePedidos ? pedidosError : registrosError;

  if (isLoading) return <Loading />;

  if (hasActiveError) {
    return (
      <div className="w-full px-4 py-6">
        <section className="rounded-lg border border-destructive/30 bg-card p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Error al cargar pedidos de unidades
          </h1>
          <p className="mt-2 text-sm text-destructive">{activeError instanceof Error ? activeError.message : "Error desconocido"}</p>
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
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Solicitar unidades
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Registra pedidos consolidados de hasta 8 unidades y consulta el historial en un listado paginado.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {canOpenListaPrevia ? (
              <Link
                to={paths.administracion.pedidoUnidadesListaPrevia}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted"
              >
                <ClipboardList size={16} strokeWidth={1.75} />
                Lista previa
              </Link>
            ) : null}

            {canOpenAsignaciones && (
              <Link
                to={paths.convencional.asignaciones}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted"
              >
                <CalendarDays size={16} strokeWidth={1.75} />
                Volver a asignaciones
              </Link>
            )}

            <button
              type="button"
              onClick={() => setViewMode("registros")}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-muted"
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
              "rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
              effectiveViewMode === "carga" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground border border-border hover:bg-muted",
            ].join(" ")}
          >
            Nueva carga
          </button>
        )}

        <button
          type="button"
          onClick={() => setViewMode("registros")}
          className={[
            "rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
            effectiveViewMode === "registros" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground border border-border hover:bg-muted",
          ].join(" ")}
        >
          Registros
        </button>
      </section>

      {effectiveViewMode === "carga" && canManagePedidos ? (
        <section>
          <article className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-foreground">Nuevo pedido</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Carga internos uno por uno y consolida cuando el pedido este completo.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
                {items.length}/{MAX_UNIDADES} unidades
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-[220px_minmax(0,1fr)_auto]">
              <label className="flex flex-col gap-2 text-sm font-medium text-muted-foreground">
                Fecha del pedido
                <input
                  type="date"
                  value={fecha}
                  onChange={(event) => setFecha(event.target.value)}
                  className="rounded-lg border border-input px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-ring"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-muted-foreground">
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
                  className="rounded-lg border border-input px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-ring"
                />
              </label>

              <button
                type="button"
                onClick={handleAddInterno}
                disabled={addInternoMutation.isPending || !canAddMore}
                className="inline-flex items-center justify-center gap-2 self-end rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted"
              >
                <Plus size={16} strokeWidth={2} />
                Agregar
              </button>
            </div>

            {canOpenListaPrevia ? (
              <div className="mt-6 rounded-lg border border-border bg-muted p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Seleccionar desde lista previa</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Puedes mezclar unidades previas con carga manual en el mismo pedido.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddSelectedPrevias}
                    disabled={!selectedPrevias.length || !canAddMore}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:bg-muted"
                  >
                    <Plus size={16} strokeWidth={2} />
                    Agregar seleccionadas
                  </button>
                </div>

                <div className="mt-4 max-h-64 overflow-auto rounded-lg border border-border bg-card">
                  <table className="min-w-[1320px] w-full text-sm">
                    <thead className="sticky top-0 bg-muted text-xs uppercase tracking-[0.18em] text-muted-foreground">
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
                    <tbody className="divide-y divide-border">
                      {previasOrdenadas.map((previa) => {
                        const alreadyAdded = items.some((item) => item.interno === previa.interno);
                        const checked = selectedPrevias.includes(previa.interno);

                        return (
                          <tr key={previa._id} className={alreadyAdded ? "bg-muted text-muted-foreground" : "hover:bg-muted"}>
                            <td className="px-4 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={alreadyAdded}
                                onChange={() => handleTogglePreviaSelection(previa.interno)}
                                className="h-4 w-4 rounded border-input text-primary focus:ring-ring disabled:cursor-not-allowed"
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
                            <td className="px-4 py-3 text-muted-foreground">{formatDateTime(previa.createdAt)}</td>
                            <td className="px-4 py-3 text-muted-foreground">{previa.usuario}</td>
                          </tr>
                        );
                      })}

                      {!previasData.length ? (
                        <tr>
                          <td colSpan={10} className="px-6 py-8 text-center text-sm text-muted-foreground">
                            Todavia no hay unidades en la lista previa.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            <div className="mt-6 overflow-hidden rounded-lg border border-border">
              <div className="overflow-x-auto">
                <table className="min-w-[980px] w-full text-sm">
                  <thead className="bg-muted text-xs uppercase tracking-[0.18em] text-muted-foreground">
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

                  <tbody className="divide-y divide-border bg-card">
                    {itemsOrdenados.map((item) => (
                      <tr key={item.interno} className="hover:bg-muted">
                        <td className="px-4 py-3 font-semibold text-foreground">{item.interno}</td>
                        <td className="px-4 py-3 text-muted-foreground">{item.version}</td>
                        <td className="px-4 py-3 text-muted-foreground">{item.order}</td>
                        <td className="px-4 py-3 text-muted-foreground">{item.modelo}</td>
                        <td className="px-4 py-3 text-muted-foreground">{item.cliente}</td>
                        <td className="px-4 py-3 text-muted-foreground">{item.vendedor}</td>
                        <td className="px-4 py-3 text-muted-foreground">{item.chasis ?? "-"}</td>
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
                        <td className="px-4 py-3 text-muted-foreground">
                          {item.listaPreviaCreatedAt ? formatDateTime(item.listaPreviaCreatedAt) : "-"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={item.PDI}
                            onChange={() => handleTogglePDI(item.interno)}
                            className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.interno)}
                            className="inline-flex h-6 items-center gap-1 rounded-md border border-destructive/30 bg-destructive/10 px-2 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/20 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 size={14} strokeWidth={1.8} />
                            Quitar
                          </button>
                        </td>
                      </tr>
                    ))}

                    {!items.length && (
                      <tr>
                        <td colSpan={11} className="px-6 py-10 text-center text-sm text-muted-foreground">
                          Todavia no agregaste internos al pedido.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                El registro guardara la fecha seleccionada y el usuario autenticado que consolida el pedido.
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSavePedido}
                  disabled={savePedidoMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:bg-muted"
                >
                  <ClipboardList size={16} strokeWidth={2} />
                  Consolidar carga
                </button>
              </div>
            </div>
          </article>
        </section>
      ) : (
        <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          {canManagePedidos ? (
            <>
              <div className="flex flex-col gap-3 border-b border-border px-6 py-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-base font-semibold tracking-tight text-foreground">
                    Registros de pedidos
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Historial paginado con vista resumida por fecha y detalle expandible.
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
                  {pedidosResponse?.pagination?.totalRecords ?? totalRecords} registros
                </div>
              </div>

              <div className="flex flex-col gap-4 border-b border-border px-6 py-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Estado de unidad</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Filtra los detalles visibles de esta pagina segun el estado actual informado en dealers.
                  </p>
                </div>

                <div className="inline-flex w-full rounded-lg bg-muted p-1 md:w-auto">
                  {REGISTRO_ESTADO_FILTERS.map((filter) => (
                    <button
                      key={filter.value}
                      type="button"
                      onClick={() => setRegistroEstadoFilter(filter.value)}
                      className={[
                        "flex-1 rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors md:flex-none",
                        registroEstadoFilter === filter.value
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      ].join(" ")}
                    >
                      {filter.label} ({pedidoEstadoCounts[filter.value]})
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[980px] w-full text-sm">
                  <thead className="bg-muted text-xs uppercase tracking-[0.18em] text-muted-foreground">
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

                  <tbody className="divide-y divide-border">
                    {pedidosAgrupadosFiltrados.map((grupo) => {
                      const expanded = expandedFecha === grupo.fecha;
                      const registrosLabel = grupo.pedidos.length === 1 ? "registro" : "registros";

                      return (
                        <Fragment key={grupo.fecha}>
                          <tr key={`resumen-${grupo.fecha}`} className="hover:bg-muted">
                            <td className="px-4 py-3 font-semibold text-foreground">{formatDate(grupo.fecha)}</td>
                            <td className="px-4 py-3 text-center text-muted-foreground">
                              {grupo.pedidos.length} {registrosLabel}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{grupo.usuarios.join(", ")}</td>
                            <td className="px-4 py-3 text-center text-muted-foreground">{grupo.totalUnidades}</td>
                            <td className="px-4 py-3 text-center text-muted-foreground">{grupo.totalConPDI}</td>
                            <td className="px-4 py-3 text-muted-foreground">{formatDateTime(grupo.latestCreatedAt)}</td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setExpandedFecha(expanded ? null : grupo.fecha)}
                                  className="inline-flex items-center gap-2 rounded-lg border border-input bg-card px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted"
                                >
                                  {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                  {expanded ? "Ocultar" : "Expandir"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDownloadGrupo(grupo)}
                                  className="inline-flex items-center gap-2 rounded-lg border border-input bg-card px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted"
                                >
                                  <Download size={14} />
                                  Descargar
                                </button>
                              </div>
                            </td>
                          </tr>

                          {expanded ? (
                            <tr key={`detalle-${grupo.fecha}`} className="bg-muted">
                              <td colSpan={7} className="px-4 py-4">
                                <div className="overflow-hidden rounded-lg border border-border bg-card">
                                  <div className="overflow-x-auto">
                                    <table className="min-w-[1320px] w-full text-sm">
                                      <thead className="bg-muted text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                        <tr>
                                          <th className="px-4 py-3 text-left">Interno</th>
                                          <th className="px-4 py-3 text-left">Version</th>
                                          <th className="px-4 py-3 text-left">Order</th>
                                          <th className="px-4 py-3 text-left">Cliente</th>
                                          <th className="px-4 py-3 text-left">Vendedor</th>
                                          <th className="px-4 py-3 text-left">Chasis</th>
                                          <th className="px-4 py-3 text-left">Estado</th>
                                          <th className="px-4 py-3 text-left">Prioridad</th>
                                          <th className="px-4 py-3 text-left">F. Sol</th>
                                          <th className="px-4 py-3 text-center">Llegó</th>
                                          <th className="px-4 py-3 text-left">Consolidado</th>
                                          <th className="px-4 py-3 text-left">ADM</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-border">
                                        {grupo.detalleItems.map(({ pedido, item }) => {
                                          const unidadArribada = Boolean(estadoPedidos[String(item.interno)]);
                                          const estadoBadge = getRegistroEstadoBadge(item.estadoUnidad);

                                          return (
                                          <tr
                                            key={`${pedido._id}-${item.interno}`}
                                            className={[
                                              unidadArribada
                                                ? "bg-secondary hover:bg-secondary"
                                                : "hover:bg-muted",
                                            ].join(" ")}
                                          >
                                            <td className="px-4 py-3 font-medium text-foreground">
                                              <span>{item.interno}</span>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">{item.version}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{item.order}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{item.cliente}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{item.vendedor}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{item.chasis ?? "-"}</td>
                                            <td className="px-4 py-3">
                                              {estadoBadge ? (
                                                <span className={["inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", estadoBadge.className].join(" ")}>
                                                  <estadoBadge.Icon size={14} strokeWidth={2} />
                                                  {estadoBadge.label}
                                                </span>
                                              ) : (
                                                <span className="text-muted-foreground">-</span>
                                              )}
                                            </td>
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
                                            <td className="px-4 py-3 text-muted-foreground">
                                              {item.listaPreviaCreatedAt ? formatDateTime(item.listaPreviaCreatedAt) : "-"}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                              <span
                                                className={[
                                                  "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                                                  unidadArribada ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground",
                                                ].join(" ")}
                                              >
                                                {unidadArribada ? "Si" : "No"}
                                              </span>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">{formatDateTime(pedido.createdAt)}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{item.listaPreviaUsuario ?? "-"}</td>
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

                    {!pedidosAgrupadosFiltrados.length ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-sm text-muted-foreground">
                          {pedidos.length
                            ? "No hay registros en esta pagina para el filtro seleccionado."
                            : "Todavia no hay pedidos de unidades registrados."}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-3 border-b border-border px-6 py-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-base font-semibold tracking-tight text-foreground">
                    Registro de unidades pedidas
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Consulta cada unidad consolidada, la fecha del pedido y el momento exacto en que se registro.
                  </p>
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <label className="flex min-w-[240px] flex-col gap-2 text-sm font-medium text-muted-foreground">
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
                      className="rounded-lg border border-input px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-ring"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleBuscarRegistro}
                    className="inline-flex items-center justify-center gap-2 self-end rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Buscar
                  </button>

                  <div className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
                    {totalRecords} unidades
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 border-b border-border px-6 py-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Estado de unidad</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Filtra los registros visibles de esta pagina segun el estado actual informado en dealers.
                  </p>
                </div>

                <div className="inline-flex w-full rounded-lg bg-muted p-1 md:w-auto">
                  {REGISTRO_ESTADO_FILTERS.map((filter) => (
                    <button
                      key={filter.value}
                      type="button"
                      onClick={() => setRegistroEstadoFilter(filter.value)}
                      className={[
                        "flex-1 rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors md:flex-none",
                        registroEstadoFilter === filter.value
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      ].join(" ")}
                    >
                      {filter.label} ({registroEstadoCounts[filter.value]})
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[1240px] w-full text-sm">
                  <thead className="bg-muted text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left">Interno</th>
                      <th className="px-4 py-3 text-center">Llegó</th>
                      <th className="px-4 py-3 text-left">Fecha pedido</th>
                      <th className="px-4 py-3 text-left">Consolidado</th>
                      <th className="px-4 py-3 text-left">Cliente</th>
                      <th className="px-4 py-3 text-left">Vendedor</th>
                      <th className="px-4 py-3 text-left">Version</th>
                      <th className="px-4 py-3 text-left">Chasis</th>
                      <th className="px-4 py-3 text-left">Estado</th>
                      <th className="px-4 py-3 text-left">Prioridad</th>
                      <th className="px-4 py-3 text-left">Usuario lista previa</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border">
                    {registrosFiltrados.map((registro) => {
                      const unidadArribada = Boolean(estadoRegistros[String(registro.interno)]);
                      const estadoBadge = getRegistroEstadoBadge(registro.estadoUnidad);

                      return (
                      <tr
                        key={`${registro.pedidoId}-${registro.interno}`}
                        className={unidadArribada ? "bg-secondary hover:bg-secondary" : "hover:bg-muted"}
                      >
                        <td className="px-4 py-3 font-semibold text-foreground">{registro.interno}</td>
                        <td className="px-4 py-3 text-center">
                          {unidadArribada ? (
                            <span className="inline-flex rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
                              Si
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                              No
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(registro.fecha)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDateTime(registro.createdAt)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{registro.cliente}</td>
                        <td className="px-4 py-3 text-muted-foreground">{registro.vendedor}</td>
                        <td className="px-4 py-3 text-muted-foreground">{registro.version}</td>
                        <td className="px-4 py-3 text-muted-foreground">{registro.chasis ?? "-"}</td>
                        <td className="px-4 py-3">
                          {estadoBadge ? (
                            <span className={["inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", estadoBadge.className].join(" ")}>
                              <estadoBadge.Icon size={14} strokeWidth={2} />
                              {estadoBadge.label}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
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
                        <td className="px-4 py-3 text-muted-foreground">{registro.listaPreviaUsuario ?? "-"}</td>
                      </tr>
                    )})}

                    {!registrosFiltrados.length ? (
                      <tr>
                        <td colSpan={10} className="px-6 py-12 text-center text-sm text-muted-foreground">
                          {registros.length
                            ? "No hay unidades en esta pagina para el filtro seleccionado."
                            : registroInterno
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

          <div className="flex flex-col gap-3 border-t border-border px-6 py-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-muted-foreground">
              Pagina {pagination?.page ?? 1} de {totalPages}
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
                disabled={page <= 1}
                className="rounded-lg border border-input bg-card px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                Anterior
              </button>

              <button
                type="button"
                onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
                disabled={page >= totalPages}
                className="rounded-lg border border-input bg-card px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
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

