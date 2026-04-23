import Loading from "@/components/Loading";
import { getResumenRegistroAsignaciones } from "@/api/dms/registroAsignacionAPI";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Link } from "react-router-dom";

const MESES = [
  { label: "Enero", value: 1 },
  { label: "Febrero", value: 2 },
  { label: "Marzo", value: 3 },
  { label: "Abril", value: 4 },
  { label: "Mayo", value: 5 },
  { label: "Junio", value: 6 },
  { label: "Julio", value: 7 },
  { label: "Agosto", value: 8 },
  { label: "Septiembre", value: 9 },
  { label: "Octubre", value: 10 },
  { label: "Noviembre", value: 11 },
  { label: "Diciembre", value: 12 },
];

export default function RegistroAsignacionesResumenView() {
  const anioActual = new Date().getFullYear();
  const mesActual = new Date().getMonth() + 1;
  const [mes, setMes] = useState<number>(mesActual);
  const [ano, setAno] = useState<number>(anioActual);

  const ANIOS = Array.from({ length: 5 }, (_, index) => anioActual - index);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["registro-asignaciones-resumen", mes, ano],
    queryFn: () => getResumenRegistroAsignaciones(mes, ano),
    refetchOnWindowFocus: true,
  });

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="w-full px-4 py-6">
        <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900">
            Error al cargar el resumen de asignaciones
          </h1>
          <p className="mt-2 text-sm text-red-600">{error.message}</p>
        </section>
      </div>
    );
  }

  if (!data) return <Loading />;

  const resumenMensual = data.resumenMensual;
  const resumenAnual = data.resumenAnual;
  const nombreMes = MESES.find((item) => item.value === mes)?.label ?? "";

  return (
    <div className="w-full space-y-6 px-4 py-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              Resumen de registro asignaciones
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-gray-500">
              Consulta mensual por modelo y comparativo anual de asignadas vs desasignadas.
            </p>
          </div>

          <Link
            to="/registro-asignaciones"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
          >
            <CalendarDays size={16} strokeWidth={1.75} />
            Volver a registros
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
              Mes
              <select
                value={mes}
                onChange={(event) => setMes(Number(event.target.value))}
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-[#15aa9a]"
              >
                {MESES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
              Año
              <select
                value={ano}
                onChange={(event) => setAno(Number(event.target.value))}
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-[#15aa9a]"
              >
                {ANIOS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:min-w-[820px] xl:flex-1 xl:max-w-[1120px]">
            <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                Asignadas {nombreMes}
              </p>
              <p className="mt-3 text-3xl font-bold text-[#15aa9a]">
                {resumenMensual.total.asignadas}
              </p>
            </article>

            <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                Desasignadas {nombreMes}
              </p>
              <p className="mt-3 text-3xl font-bold text-rose-600">
                {resumenMensual.total.desasignadas}
              </p>
            </article>

            <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                Neto del mes
              </p>
              <p className="mt-3 text-3xl font-bold text-gray-900">
                {resumenMensual.total.neto}
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-base font-semibold tracking-tight text-gray-900">
              Resumen mensual por modelo
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {nombreMes} {ano}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-[0.18em] text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Modelo</th>
                  <th className="px-4 py-3 text-center">Asignadas</th>
                  <th className="px-4 py-3 text-center">Desasignadas</th>
                  <th className="px-4 py-3 text-center">Neto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {resumenMensual.porModelo.map((item) => (
                  <tr key={item.modelo} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {item.modelo}
                    </td>
                    <td className="px-4 py-3 text-center text-[#15aa9a]">
                      {item.asignadas}
                    </td>
                    <td className="px-4 py-3 text-center text-rose-600">
                      {item.desasignadas}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-gray-900">
                      {item.neto}
                    </td>
                  </tr>
                ))}

                <tr className="bg-gray-50 font-semibold text-gray-900">
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3 text-center text-[#15aa9a]">
                    {resumenMensual.total.asignadas}
                  </td>
                  <td className="px-4 py-3 text-center text-rose-600">
                    {resumenMensual.total.desasignadas}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {resumenMensual.total.neto}
                  </td>
                </tr>

                {!resumenMensual.porModelo.length ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">
                      No hay registros para el periodo seleccionado.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>

        <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-base font-semibold tracking-tight text-gray-900">
              Movimiento entre sucursales y modelo
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Matriz mensual con total neto y detalle asignadas/desasignadas por sucursal.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-[0.18em] text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Modelo</th>
                  <th className="px-4 py-3 text-center">Total</th>
                  {resumenMensual.sucursales.map((sucursal) => (
                    <th key={sucursal} className="px-4 py-3 text-center">
                      {sucursal}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {resumenMensual.porModeloSucursal.map((item) => (
                  <tr key={item.modelo} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {item.modelo}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-gray-900">
                      {item.total}
                    </td>
                    {resumenMensual.sucursales.map((sucursal) => {
                      const detalle = item.sucursales[sucursal];
                      return (
                        <td key={`${item.modelo}-${sucursal}`} className="px-4 py-3 text-center">
                          <div className="font-semibold text-gray-900">{detalle.neto}</div>
                          <div className="text-xs text-[#15aa9a]">A {detalle.asignadas}</div>
                          <div className="text-xs text-rose-600">D {detalle.desasignadas}</div>
                        </td>
                      );
                    })}
                  </tr>
                ))}

                <tr className="bg-gray-50 font-semibold text-gray-900">
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3 text-center">{resumenMensual.total.neto}</td>
                  {resumenMensual.resumenSucursales.map((item) => (
                    <td key={`total-${item.sucursal}`} className="px-4 py-3 text-center">
                      <div>{item.neto}</div>
                      <div className="text-xs text-[#15aa9a]">A {item.asignadas}</div>
                      <div className="text-xs text-rose-600">D {item.desasignadas}</div>
                    </td>
                  ))}
                </tr>

                {!resumenMensual.porModeloSucursal.length ? (
                  <tr>
                    <td
                      colSpan={Math.max(resumenMensual.sucursales.length + 2, 2)}
                      className="px-6 py-12 text-center text-sm text-gray-500"
                    >
                      No hay movimientos por sucursal para el periodo seleccionado.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold tracking-tight text-gray-900">
            Asignadas y desasignadas por sucursal
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Totales del mes seleccionado.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[560px] w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-[0.18em] text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Sucursal</th>
                <th className="px-4 py-3 text-right">Asignadas</th>
                <th className="px-4 py-3 text-right">Desasignadas</th>
                <th className="px-4 py-3 text-right">Neto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {resumenMensual.resumenSucursales.map((item) => (
                <tr key={item.sucursal} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{item.sucursal}</td>
                  <td className="px-4 py-3 text-right text-[#15aa9a]">{item.asignadas}</td>
                  <td className="px-4 py-3 text-right text-rose-600">{item.desasignadas}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{item.neto}</td>
                </tr>
              ))}

              {!resumenMensual.resumenSucursales.length ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">
                    No hay sucursales con movimientos en el periodo seleccionado.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold tracking-tight text-gray-900">
            Asignadas vs desasignadas por día
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Evolución diaria de {nombreMes} {ano}.
          </p>

          <div className="mt-6 h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resumenMensual.porDia}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="asignadas"
                  name="Asignadas"
                  fill="#15aa9a"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="desasignadas"
                  name="Desasignadas"
                  fill="#e11d48"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold tracking-tight text-gray-900">
            Asignadas vs desasignadas por mes
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Evolución del año {resumenAnual.ano}.
          </p>

          <div className="mt-6 h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resumenAnual.porMes}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="asignadas"
                  name="Asignadas"
                  fill="#15aa9a"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="desasignadas"
                  name="Desasignadas"
                  fill="#e11d48"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>
    </div>
  );
}
