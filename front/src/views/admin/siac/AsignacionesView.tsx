import Loading from "@/components/Loading";
import { getEstadoInternosPedido } from "@/api/dms/pedidoUnidadAPI";
import { useAuth } from "@/hooks/useAuthe";
import { hasModuleAccess, hasPathAccess } from "@/helpers/access";
import { useQuery } from "@tanstack/react-query";
import { Check, Clock3 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { EChartsCoreOption } from "echarts/core";
import EChart from "@/components/charts/EChart";
import { getPresetChartColors } from "@/components/charts/presetChartTheme";
import { textToColor } from "@/helpers/colores";
import { getAsignaciones } from "@/api/dms/dmsAPI";
import { paths } from "@/routes/paths";
import type {
  AsignacionRecepcionItem,
  GetAsignacionRecepcionResponse,
  PedidoUnidadInternosEstadoResponse,
  ResumenAsignacionRecepcion,
} from "@/types/index";

const MESES = [
  { label: "ENERO", value: 1 },
  { label: "FEBRERO", value: 2 },
  { label: "MARZO", value: 3 },
  { label: "ABRIL", value: 4 },
  { label: "MAYO", value: 5 },
  { label: "JUNIO", value: 6 },
  { label: "JULIO", value: 7 },
  { label: "AGOSTO", value: 8 },
  { label: "SEPTIEMBRE", value: 9 },
  { label: "OCTUBRE", value: 10 },
  { label: "NOVIEMBRE", value: 11 },
  { label: "DICIEMBRE", value: 12 },
];

type FiltroEstado = "todos" | "recibidos" | "pendientes";

const EMPTY_ASIGNACIONES: GetAsignacionRecepcionResponse["data"] = [];

function formatShortDate(dateString?: string | null) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return String(dateString);
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function formatFullDate(dateString?: string | null) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return String(dateString);
  return date.toLocaleDateString("es-AR");
}

export default function AsignacionesView() {
  const { user } = useAuth();
  const canManagePedidos =
    hasModuleAccess(user, "pedidoUnidades") &&
    hasPathAccess(user, paths.convencional.pedidoUnidades);
  const canSeePedidoStatus = hasModuleAccess(user, "asignaciones");
  const anioActual = new Date().getFullYear();
  const [anio, setAnio] = useState<number>(anioActual);
  const [mes, setMes] = useState<number>(() => new Date().getMonth() + 1);
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos");

  const ANIOS = Array.from({ length: 5 }, (_, i) => anioActual - i);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["asignacionRecepcion", mes, anio],
    queryFn: () => {
      const mesFormatted = mes.toString().padStart(2, "0");
      const anioFormatted = anio.toString().slice(-2);
      return getAsignaciones(mesFormatted, anioFormatted);
    },
    refetchOnWindowFocus: true
  });

  const registros: GetAsignacionRecepcionResponse["data"] = data?.data ?? EMPTY_ASIGNACIONES;
  const resumen: ResumenAsignacionRecepcion | undefined = data?.resumen;

  const { data: estadoPedidos = {}, isLoading: pedidosLoading } = useQuery({
    queryKey: ["pedido-unidades-estado", registros.map((item) => item.interno).join("-")],
    queryFn: () => getEstadoInternosPedido(registros.map((item) => Number(item.interno))),
    enabled: registros.length > 0 && canSeePedidoStatus,
    refetchOnWindowFocus: true,
  });
  const pedidoStatus = estadoPedidos as PedidoUnidadInternosEstadoResponse["data"];

  const recepcionesPorDia = useMemo(() => {
    return (resumen?.porDiaRecepcion ?? []).map((item) => ({
      ...item,
      fechaCorta: formatShortDate(item.fecha),
    }));
  }, [resumen]);

  const estadoRecepcion = useMemo(() => {
    return resumen?.estadoRecepcion ?? [];
  }, [resumen]);

  const registrosFiltrados = useMemo(() => {
    if (filtroEstado === "todos") return registros;

    return registros.filter((item) => {
      const recibido = Boolean(item.fechaRecepcionRemito);
      return filtroEstado === "recibidos" ? recibido : !recibido;
    });
  }, [registros, filtroEstado]);

  const totalUnidades = resumen?.total ?? registros.length;
  const totalRecibidos = resumen?.recibidos ?? 0;
  const totalPendientes = resumen?.pendientes ?? 0;
  const mesActivo = MESES.find((item) => item.value === mes)?.label ?? "";
  const chartColors = getPresetChartColors();
  const recepcionesOption = useMemo<EChartsCoreOption>(() => ({
    color: chartColors,
    grid: { top: 24, right: 16, bottom: 30, left: 38 },
    tooltip: { trigger: "axis", backgroundColor: "var(--popover)", borderColor: "var(--border)", textStyle: { color: "var(--popover-foreground)" } },
    xAxis: { type: "category", data: recepcionesPorDia.map((item) => item.fechaCorta), axisTick: { show: false }, axisLabel: { color: "var(--muted-foreground)", fontSize: 11 } },
    yAxis: { type: "value", minInterval: 1, axisTick: { show: false }, axisLabel: { color: "var(--muted-foreground)", fontSize: 11 }, splitLine: { lineStyle: { color: "var(--border)", type: "dashed" } } },
    series: [{ type: "bar", name: "Recibidas", data: recepcionesPorDia.map((item) => item.cantidad), barMaxWidth: 42, label: { show: true, position: "top", color: "var(--foreground)", fontSize: 11 } }],
  }), [chartColors, recepcionesPorDia]);
  const estadoOption = useMemo<EChartsCoreOption>(() => ({
    color: chartColors,
    tooltip: { trigger: "item", backgroundColor: "var(--popover)", borderColor: "var(--border)", textStyle: { color: "var(--popover-foreground)" }, formatter: "{b}: {c}" },
    series: [{ type: "pie", radius: ["54%", "78%"], avoidLabelOverlap: true, label: { show: false }, data: estadoRecepcion }],
  }), [chartColors, estadoRecepcion]);

  if (isLoading || pedidosLoading) return <Loading />;

  if (isError) {
    return (
      <div className="w-full px-4 py-6">
        <section className="rounded-lg border border-destructive/30 bg-card p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Error al cargar asignación de recepción
          </h1>
          <p className="mt-2 text-sm text-destructive">
            No fue posible obtener la información.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-4 py-6">
      <section className="min-w-0 rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Asignación de recepción
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Seguimiento de unidades recibidas y pendientes por mes.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start">
            {canManagePedidos ? (
              <Link
              to={paths.convencional.pedidoUnidades}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-secondary"
              >
                Solicitar unidades
              </Link>
            ) : null}

            <label
              htmlFor="anio"
              className="text-sm font-semibold text-foreground"
            >
              Seleccione un año
            </label>

            <select
              id="anio"
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
              className="rounded-lg border border-input bg-card px-4 py-2 text-sm text-foreground outline-none transition-colors focus:ring-2 focus:ring-ring"
            >
              {ANIOS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-12">
        {MESES.map((item) => {
          const activo = mes === item.value;

          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setMes(item.value)}
              className={[
                "h-12 rounded-lg border text-sm font-semibold transition-colors",
                activo
                  ? "border-border bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-muted text-muted-foreground hover:bg-muted",
              ].join(" ")}
            >
              {item.label}
            </button>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Total unidades
          </p>
          <p className="mt-3 text-3xl font-bold text-foreground">{totalUnidades}</p>
        </article>

        <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Recibidas
          </p>
          <p className="mt-3 text-3xl font-bold text-primary">{totalRecibidos}</p>
        </article>

        <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Pendientes
          </p>
          <p className="mt-3 text-3xl font-bold text-foreground">{totalPendientes}</p>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <article className="min-w-0 rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Recepciones por día
          </h2>

          <div className="mt-3 h-72 min-w-0"><EChart option={recepcionesOption} /></div>
        </article>

        <article className="min-w-0 rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Estado de recepción
          </h2>

          <div className="relative mt-3 h-72 min-w-0">
            <EChart option={estadoOption} />

            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">{totalUnidades}</p>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Total
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-4">
            {estadoRecepcion.map((item, index: number) => (
              <div key={item.name} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: chartColors[index % chartColors.length] }}
                />
                <span>
                  {item.name}: {item.value}
                </span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-foreground">
                Unidades del mes
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                {totalUnidades} unidades registradas en {mesActivo.toLowerCase()} de {anio}.
              </p>
            </div>

            <div className="inline-flex w-full rounded-lg bg-muted p-1 lg:w-auto">
              <button
                type="button"
                onClick={() => setFiltroEstado("todos")}
                className={[
                  "flex-1 rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors lg:flex-none",
                  filtroEstado === "todos" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                Todos ({totalUnidades})
              </button>

              <button
                type="button"
                onClick={() => setFiltroEstado("recibidos")}
                className={[
                  "flex-1 rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors lg:flex-none",
                  filtroEstado === "recibidos" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                Recibidos ({totalRecibidos})
              </button>

              <button
                type="button"
                onClick={() => setFiltroEstado("pendientes")}
                className={[
                  "flex-1 rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors lg:flex-none",
                  filtroEstado === "pendientes" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                Pendientes ({totalPendientes})
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-3 text-left">#</th>
                <th className="px-6 py-3 text-left">Interno</th>
                <th className="px-6 py-3 text-left">Nro. fab</th>
                <th className="px-6 py-3 text-left">Versión</th>
                <th className="px-6 py-3 text-left">Chasis</th>
                <th className="px-6 py-3 text-left">Color</th>
                <th className="px-6 py-3 text-left">F. probable</th>
                <th className="px-6 py-3 text-center">Opera</th>
                <th className="px-6 py-3 text-center">Sucursal</th>
                <th className="px-6 py-3 text-center">Pedido</th>
                <th className="px-6 py-3 text-center">Estado</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {registrosFiltrados.map((item: AsignacionRecepcionItem, index: number) => {
                const recibido = Boolean(item.fechaRecepcionRemito);
                const fuePedido = Boolean(pedidoStatus[String(item.interno)]);

                return (
                  <tr key={`${item.interno}-${item.nrofab}`} className="hover:bg-muted">
                    <td className="px-6 py-3">{index + 1}</td>
                    <td className="px-6 py-3 font-medium">{item.interno}</td>
                    <td className="px-6 py-3">{item.nrofab}</td>
                    <td className="px-6 py-3">{item.version}</td>
                    <td className="px-6 py-3">{item.chasis ?? "-"}</td>
                    <td className="px-4 py-4">
                      <div
                        className={`inline-block rounded-md border border-border px-2 py-1 text-xs font-medium ${textToColor(
                          item.color
                        )}`}
                      >
                        {item.color}
                      </div>
                    </td>
                    <td className="px-6 py-3">{formatFullDate(item.fechaProblableRecep)}</td>
                    <td className="px-6 py-3 text-center">
                      {item.opera == 0 ? "-" : item.opera}
                    </td>
                    <td className="px-6 py-3 text-center">
                      {item.opera == 0 ? "-" : item.sucursal}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex justify-center">
                        {fuePedido ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-primary">
                            Si
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                            No
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex justify-center">
                        {recibido ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
                            <Check size={14} strokeWidth={2.5} />
                            Recibido
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
                            <Clock3 size={14} strokeWidth={2.5} />
                            Pendiente
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!registrosFiltrados.length && (
                <tr>
                  <td colSpan={11} className="px-6 py-10 text-center text-sm text-muted-foreground">
                    No hay unidades para el filtro seleccionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
