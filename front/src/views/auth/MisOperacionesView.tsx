import Loading from "@/components/Loading";
import { misOperaciones } from "@/api/convencional/stockAPI";
import { useAuth } from "@/hooks/useAuthe";
import { useQuery } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, LabelList } from "recharts";

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

const CHART_COLORS = ["#15aa9a", "#7bc8c2", "#b8e0d2", "#a7d8de", "#9fc3e6", "#b7b5e8", "#d2b7e5", "#e3bfd3"];

function buildFullName(name?: string, lastName?: string) {
  return `${name ?? ""} ${lastName ?? ""}`.trim().toUpperCase() || "MIS OPERACIONES";
}

function formatShortDate(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
  });
}

export default function MisOperacionesView() {
  const { user } = useAuth();

  const anioActual = new Date().getFullYear();
  const [anio, setAnio] = useState<number>(anioActual);
  const [mes, setMes] = useState<number>(() => new Date().getMonth() + 1);

  const ANIOS = Array.from({ length: 5 }, (_, i) => anioActual - i);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["misVentas", mes, anio],
    queryFn: () => misOperaciones(mes, anio),
    refetchOnWindowFocus: true,
    refetchInterval: 10000,
  });

  const operaciones = data?.data ?? [];
  const resumen = data?.resumen;

  const ventasPorDia = useMemo(() => {
    return Object.entries(resumen?.porDia ?? {})
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([fecha, total]) => ({
        fecha,
        fechaCorta: formatShortDate(fecha),
        total,
      }));
  }, [resumen]);

  const distribucionPorModelo = useMemo(() => {
    return Object.entries(resumen?.porModelo ?? {})
      .sort((a, b) => b[1] - a[1])
      .map(([modelo, total]) => ({
        modelo,
        total,
      }));
  }, [resumen]);

  const totalOperaciones = resumen?.total ?? operaciones.length;

  const nombreUsuario = buildFullName(user?.name, user?.lastName);
  const mesActivo = MESES.find((item) => item.value === mes)?.label ?? "";

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="w-full px-4 py-6">
        <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900">Error al cargar operaciones</h1>
          <p className="mt-2 text-sm text-red-600">No fue posible obtener la información.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-6 space-y-6">
      {/* HEADER */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{nombreUsuario}</h1>
            <p className="mt-1 text-sm text-gray-500">Análisis de operaciones.</p>
          </div>

          <div className="flex items-center gap-3 self-start">
            <label htmlFor="anio" className="text-sm font-semibold text-gray-900">
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

      {/* MESES */}
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
                activo ? "border-gray-950 bg-gray-950 text-white shadow-sm" : "border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200",
              ].join(" ")}
            >
              {item.label}
            </button>
          );
        })}
      </section>

      {/* GRAFICOS */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* BARRAS */}
        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold tracking-tight text-gray-900">Ventas por día</h2>

          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ventasPorDia}>
                <XAxis dataKey="fechaCorta" axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} width={30} />

                <Tooltip formatter={(value) => [Number(value ?? 0), "Ventas"]} />

                <Bar dataKey="total" radius={[6, 6, 0, 0]} fill="#15aa9a" maxBarSize={42}>
                  <LabelList dataKey="total" position="top" style={{ fill: "#374151", fontSize: 12 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* TORTA */}
        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold tracking-tight text-gray-900">Distribución por modelo</h2>

          <div className="mt-6 h-72 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={distribucionPorModelo} dataKey="total" nameKey="modelo" innerRadius={60} outerRadius={95} paddingAngle={3}>
                  {distribucionPorModelo.map((entry, index) => (
                    <Cell key={entry.modelo} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>

                <Tooltip formatter={(value, _name, props) => [Number(value ?? 0), props?.payload?.modelo ?? "Modelo"]} />
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">{totalOperaciones}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Total</p>
              </div>
            </div>
          </div>

          {/* LEYENDA */}
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            {distribucionPorModelo.map((item, index) => (
              <div key={item.modelo} className="flex items-center gap-2 text-sm text-gray-700">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                  }}
                />
                <span>{item.modelo}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      {/* TABLA */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold tracking-tight text-gray-900">Operaciones del mes</h2>

          <p className="mt-1 text-sm text-gray-500">
            {totalOperaciones} operaciones registradas en {mesActivo.toLowerCase()} de {anio}.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-6 py-3 text-left">#</th>
                <th className="px-6 py-3 text-left">Operación</th>
                <th className="px-6 py-3 text-left">Cliente</th>
                <th className="px-6 py-3 text-left">Interno</th>
                <th className="px-6 py-3 text-left">Modelo</th>
                <th className="px-6 py-3 text-left">Versión</th>
                <th className="px-6 py-3 text-center">Fac</th>
                <th className="px-6 py-3 text-center">Entregado</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {operaciones.map((item, index) => (
                <tr key={item.opera} className="hover:bg-gray-50">
                  <td className="px-6 py-3">{index + 1}</td>
                  <td className="px-6 py-3 font-medium">{item.opera}</td>
                  <td className="px-6 py-3">{item.clienteNombre}</td>
                  <td className="px-6 py-3">{item.interno}</td>
                  <td className="px-6 py-3">{item.modelo}</td>
                  <td className="px-6 py-3">{item.version}</td>

                  <td className="px-6 py-3">
                    <div className="flex justify-center">
                      {item.fechaFactura ? (
                        <span className="inline-flex items-center justify-center rounded-full bg-green-100 p-1 text-green-700">
                          <Check size={14} strokeWidth={2.5} />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center rounded-full bg-red-100 p-1 text-red-700">
                          <X size={14} strokeWidth={2.5} />
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-3">
                    <div className="flex justify-center">
                      {item.fechaEntrega ? (
                        <span className="inline-flex items-center justify-center rounded-full bg-green-100 p-1 text-green-700">
                          <Check size={14} strokeWidth={2.5} />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center rounded-full bg-red-100 p-1 text-red-700">
                          <X size={14} strokeWidth={2.5} />
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
