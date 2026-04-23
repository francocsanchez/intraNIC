import Loading from "@/components/Loading";
import { getEstadoInternosPedido } from "@/api/dms/pedidoUnidadAPI";
import { useAuth } from "@/hooks/useAuthe";
import { hasAnyRole } from "@/helpers/access";
import { useQuery } from "@tanstack/react-query";
import { Check, Clock3 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { textToColor } from "@/helpers/colores";
import { getAsignaciones } from "@/api/dms/dmsAPI";

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

const CHART_COLORS = [
  "#15aa9a",
  "#52beb2",
  "#8fd2ca",
  "#b7e3dd",
  "#d9f1ef",
  "#7fc9e7",
  "#a9dbef",
  "#cfeaf6",
];

type FiltroEstado = "todos" | "recibidos" | "pendientes";

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
  const canManagePedidos = hasAnyRole(user, ["admin", "stock"]);
  const canSeePedidoStatus = hasAnyRole(user, ["admin", "gerente", "stock"]);
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

  const registros = data?.data ?? [];
  const resumen = data?.resumen;

  const { data: estadoPedidos = {}, isLoading: pedidosLoading } = useQuery({
    queryKey: ["pedido-unidades-estado", registros.map((item: any) => item.interno).join("-")],
    queryFn: () => getEstadoInternosPedido(registros.map((item: any) => Number(item.interno))),
    enabled: registros.length > 0 && canSeePedidoStatus,
    refetchOnWindowFocus: true,
  });

  const recepcionesPorDia = useMemo(() => {
    return (resumen?.porDiaRecepcion ?? []).map((item: any) => ({
      ...item,
      fechaCorta: formatShortDate(item.fecha),
    }));
  }, [resumen]);

  const estadoRecepcion = useMemo(() => {
    return resumen?.estadoRecepcion ?? [];
  }, [resumen]);

  const registrosFiltrados = useMemo(() => {
    if (filtroEstado === "todos") return registros;

    return registros.filter((item: any) => {
      const recibido = Boolean(item.fechaRecepcionRemito);
      return filtroEstado === "recibidos" ? recibido : !recibido;
    });
  }, [registros, filtroEstado]);

  const totalUnidades = resumen?.total ?? registros.length;
  const totalRecibidos = resumen?.recibidos ?? 0;
  const totalPendientes = resumen?.pendientes ?? 0;
  const mesActivo = MESES.find((item) => item.value === mes)?.label ?? "";

  if (isLoading || pedidosLoading) return <Loading />;

  if (isError) {
    return (
      <div className="w-full px-4 py-6">
        <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900">
            Error al cargar asignación de recepción
          </h1>
          <p className="mt-2 text-sm text-red-600">
            No fue posible obtener la información.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-4 py-6">
      <section className="min-w-0 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              Asignación de recepción
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Seguimiento de unidades recibidas y pendientes por mes.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start">
            {canManagePedidos ? (
              <Link
                to="/pedido-unidades"
                className="rounded-lg bg-[#15aa9a] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#129181]"
              >
                Solicitar unidades
              </Link>
            ) : null}

            <label
              htmlFor="anio"
              className="text-sm font-semibold text-gray-900"
            >
              Seleccione un año
            </label>

            <select
              id="anio"
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-gray-500"
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
                "h-12 rounded-xl border text-sm font-semibold transition-colors",
                activo
                  ? "border-gray-950 bg-gray-950 text-white shadow-sm"
                  : "border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200",
              ].join(" ")}
            >
              {item.label}
            </button>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            Total unidades
          </p>
          <p className="mt-3 text-3xl font-bold text-gray-900">{totalUnidades}</p>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            Recibidas
          </p>
          <p className="mt-3 text-3xl font-bold text-[#15aa9a]">{totalRecibidos}</p>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            Pendientes
          </p>
          <p className="mt-3 text-3xl font-bold text-gray-900">{totalPendientes}</p>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <article className="min-w-0 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold tracking-tight text-gray-900">
            Recepciones por día
          </h2>

          <div className="mt-6 h-72 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recepcionesPorDia}>
                <XAxis dataKey="fechaCorta" axisLine={false} tickLine={false} />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                />
                <Tooltip formatter={(value) => [Number(value ?? 0), "Recibidas"]} />
                <Bar
                  dataKey="cantidad"
                  radius={[6, 6, 0, 0]}
                  fill="#15aa9a"
                  maxBarSize={42}
                >
                  <LabelList
                    dataKey="cantidad"
                    position="top"
                    style={{ fill: "#374151", fontSize: 12 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="min-w-0 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold tracking-tight text-gray-900">
            Estado de recepción
          </h2>

          <div className="relative mt-6 h-72 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={estadoRecepcion}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                >
                  {estadoRecepcion.map((entry: any, index: number) => (
                    <Cell
                      key={`${entry.name}-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>

                <Tooltip
                  formatter={(value, _name, props) => [
                    Number(value ?? 0),
                    props?.payload?.name ?? "Estado",
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">{totalUnidades}</p>
                <p className="text-xs uppercase tracking-wider text-gray-500">
                  Total
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-4">
            {estadoRecepcion.map((item: any, index: number) => (
              <div key={item.name} className="flex items-center gap-2 text-sm text-gray-700">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{
                    backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                  }}
                />
                <span>
                  {item.name}: {item.value}
                </span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-gray-900">
                Unidades del mes
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {totalUnidades} unidades registradas en {mesActivo.toLowerCase()} de {anio}.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFiltroEstado("todos")}
                className={[
                  "rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
                  filtroEstado === "todos"
                    ? "bg-gray-950 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200",
                ].join(" ")}
              >
                Todos
              </button>

              <button
                type="button"
                onClick={() => setFiltroEstado("recibidos")}
                className={[
                  "rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
                  filtroEstado === "recibidos"
                    ? "bg-[#15aa9a] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200",
                ].join(" ")}
              >
                Recibidos
              </button>

              <button
                type="button"
                onClick={() => setFiltroEstado("pendientes")}
                className={[
                  "rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
                  filtroEstado === "pendientes"
                    ? "bg-amber-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200",
                ].join(" ")}
              >
                Pendientes
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
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

            <tbody className="divide-y divide-gray-100">
              {registrosFiltrados.map((item: any, index: number) => {
                const recibido = Boolean(item.fechaRecepcionRemito);
                const fuePedido = Boolean(estadoPedidos[String(item.interno)]);

                return (
                  <tr key={`${item.interno}-${item.nrofab}`} className="hover:bg-gray-50">
                    <td className="px-6 py-3">{index + 1}</td>
                    <td className="px-6 py-3 font-medium">{item.interno}</td>
                    <td className="px-6 py-3">{item.nrofab}</td>
                    <td className="px-6 py-3">{item.version}</td>
                    <td className="px-6 py-3">{item.chasis ?? "-"}</td>
                    <td className="px-4 py-4">
                      <div
                        className={`inline-block rounded-md border border-slate-200 px-2 py-1 text-xs font-medium ${textToColor(
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
                          <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">
                            Si
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                            No
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex justify-center">
                        {recibido ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            <Check size={14} strokeWidth={2.5} />
                            Recibido
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
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
                  <td colSpan={11} className="px-6 py-10 text-center text-sm text-gray-500">
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
