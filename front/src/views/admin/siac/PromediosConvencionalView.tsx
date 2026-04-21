import Loading from "@/components/Loading";
import { getPromedioOperacionesConvencional } from "@/api/dms/dmsAPI";
import type { PromedioOperacionesConvencionalResponse } from "@/types/index";
import { useQuery } from "@tanstack/react-query";
import { Fragment, useMemo, useState } from "react";

const MESES = [
  { label: "Enero", shortLabel: "ene", value: 1 },
  { label: "Febrero", shortLabel: "feb", value: 2 },
  { label: "Marzo", shortLabel: "mar", value: 3 },
  { label: "Abril", shortLabel: "abr", value: 4 },
  { label: "Mayo", shortLabel: "may", value: 5 },
  { label: "Junio", shortLabel: "jun", value: 6 },
  { label: "Julio", shortLabel: "jul", value: 7 },
  { label: "Agosto", shortLabel: "ago", value: 8 },
  { label: "Septiembre", shortLabel: "sep", value: 9 },
  { label: "Octubre", shortLabel: "oct", value: 10 },
  { label: "Noviembre", shortLabel: "nov", value: 11 },
  { label: "Diciembre", shortLabel: "dic", value: 12 },
];

function getPromedioCellClass(value: number) {
  if (value >= 11) return "bg-emerald-100 text-emerald-800";
  if (value >= 6) return "bg-amber-100 text-amber-800";
  return "bg-rose-100 text-rose-700";
}

function getMesCellClass(value: number) {
  if (value >= 15) return "text-[#15aa9a] font-semibold";
  if (value === 0) return "text-gray-300";
  return "text-gray-700";
}

export default function PromediosConvencionalView() {
  const now = new Date();
  const anioActual = now.getFullYear();
  const [mes, setMes] = useState<number>(now.getMonth() + 1);
  const [anio, setAnio] = useState<number>(anioActual);

  const anios = useMemo(() => Array.from({ length: 6 }, (_, index) => anioActual - index), [anioActual]);

  const { data, isLoading, isError, error } = useQuery<PromedioOperacionesConvencionalResponse>({
    queryKey: ["promedio-operaciones-convencional", mes, anio],
    queryFn: () => getPromedioOperacionesConvencional(mes, anio),
    refetchOnWindowFocus: true,
  });

  const resumen = data?.resumen;
  const meses = resumen?.meses ?? [];
  const sucursales = resumen?.sucursales ?? [];
  const vendedores = resumen?.vendedores ?? [];

  const cards = useMemo(() => {
    const totalVendedores = vendedores.length;
    const promedioGeneral = totalVendedores
      ? Math.round(vendedores.reduce((acc, item) => acc + item.promedio, 0) / totalVendedores)
      : 0;
    const mejorPromedio = vendedores.length ? Math.max(...vendedores.map((item) => item.promedio)) : 0;
    const ventasMesActual = vendedores.reduce((acc, item) => acc + item.ventasMesActual, 0);

    return {
      totalVendedores,
      promedioGeneral,
      mejorPromedio,
      ventasMesActual,
    };
  }, [vendedores]);

  const mesSeleccionadoLabel = MESES.find((item) => item.value === mes)?.label ?? "";
  const mejorSucursal = useMemo(
    () => sucursales.reduce((best, item) => (item.promedio > best.promedio ? item : best), { sucursal: "-", promedio: 0 }),
    [sucursales],
  );

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="w-full px-4 py-6">
        <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900">
            Error al cargar promedio de operaciones
          </h1>
          <p className="mt-2 text-sm text-red-600">
            {error instanceof Error ? error.message : "No fue posible obtener la información."}
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-4 py-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
              Convencional
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">
              Promedio de operaciones por vendedor
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-gray-500">
              Semestre móvil de seis meses. Cada mes excluye el mismo mes de hace seis meses e
              incluye el mes actual seleccionado.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm font-semibold text-gray-900">Mes</span>
              <select
                value={mes}
                onChange={(e) => setMes(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-[#15aa9a]"
              >
                {MESES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-sm font-semibold text-gray-900">Año</span>
              <select
                value={anio}
                onChange={(e) => setAnio(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-[#15aa9a]"
              >
                {anios.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            Vendedores
          </p>
          <p className="mt-3 text-3xl font-bold text-gray-900">{cards.totalVendedores}</p>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            Mes actual
          </p>
          <p className="mt-3 text-3xl font-bold text-[#15aa9a]">{cards.ventasMesActual}</p>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            Promedio general
          </p>
          <p className="mt-3 text-3xl font-bold text-gray-900">{cards.promedioGeneral}</p>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            Mejor promedio
          </p>
          <p className="mt-3 text-3xl font-bold text-[#15aa9a]">{cards.mejorPromedio}</p>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            Mejor sucursal
          </p>
          <p className="mt-3 truncate text-lg font-bold text-gray-900">{mejorSucursal.sucursal}</p>
          <p className="mt-1 text-sm font-semibold text-[#15aa9a]">Promedio {mejorSucursal.promedio}</p>
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 bg-gradient-to-r from-[#f4fbfa] to-white px-6 py-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-gray-900">
                Tabla de promedios
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Cierre en {mesSeleccionadoLabel.toLowerCase()} de {anio}. Ventana móvil de los
                últimos 6 meses.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="rounded-full bg-rose-100 px-2.5 py-1 font-semibold text-rose-700">
                Bajo
              </span>
              <span className="rounded-full bg-amber-100 px-2.5 py-1 font-semibold text-amber-700">
                Medio
              </span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-semibold text-emerald-700">
                Alto
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1080px] w-full border-separate border-spacing-0 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="sticky left-0 z-20 border-b border-gray-200 bg-gray-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Sucursal
                </th>
                <th className="sticky left-[180px] z-20 border-b border-gray-200 bg-gray-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Vendedor
                </th>
                {meses.map((item) => (
                  <th
                    key={item.key}
                    className="border-b border-gray-200 px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-gray-500"
                  >
                    {item.label}
                  </th>
                ))}
                <th className="border-b border-gray-200 bg-[#f4fbfa] px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-gray-600">
                  Mes
                </th>
                <th className="border-b border-gray-200 bg-[#f8fafc] px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-gray-600">
                  Prom
                </th>
              </tr>
            </thead>

            <tbody>
              {sucursales.map((sucursal) => (
                <Fragment key={sucursal.sucursal}>
                  {sucursal.vendedores.map((vendedor, index) => (
                    <tr
                      key={`${sucursal.sucursal}-${vendedor.vendedor}`}
                      className={index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                    >
                      {index === 0 ? (
                        <td
                          rowSpan={sucursal.vendedores.length + 1}
                          className="sticky left-0 z-10 border-b border-gray-200 bg-white px-4 py-4 align-middle text-left font-semibold uppercase tracking-[0.08em] text-gray-700"
                        >
                          <div className="min-w-[180px]">{sucursal.sucursal}</div>
                        </td>
                      ) : null}

                      <td className="sticky left-[180px] z-10 border-b border-gray-200 bg-inherit px-4 py-3 font-medium text-gray-900">
                        <div className="min-w-[220px]">{vendedor.vendedor}</div>
                      </td>

                      {meses.map((mesItem) => {
                        const value = vendedor.meses[mesItem.key] ?? 0;

                        return (
                          <td
                            key={`${vendedor.vendedor}-${mesItem.key}`}
                            className={`border-b border-gray-200 px-4 py-3 text-center ${getMesCellClass(value)}`}
                          >
                            {value}
                          </td>
                        );
                      })}

                      <td className="border-b border-gray-200 bg-[#f4fbfa] px-4 py-3 text-center font-semibold text-[#0f8f82]">
                        {vendedor.ventasMesActual}
                      </td>

                      <td className="border-b border-gray-200 px-4 py-3 text-center">
                        <span
                          className={`inline-flex min-w-10 justify-center rounded-md px-2.5 py-1 font-semibold ${getPromedioCellClass(
                            vendedor.promedio,
                          )}`}
                        >
                          {vendedor.promedio}
                        </span>
                      </td>
                    </tr>
                  ))}

                  <tr key={`${sucursal.sucursal}-promedio`} className="bg-[#eef9f7]">
                    <td className="sticky left-[180px] z-10 border-b border-gray-200 bg-[#eef9f7] px-4 py-3 font-semibold uppercase tracking-[0.08em] text-[#0f8f82]">
                      <div className="min-w-[220px]">Promedio sucursal</div>
                    </td>

                    {meses.map((mesItem) => {
                      const value = sucursal.meses[mesItem.key] ?? 0;

                      return (
                        <td
                          key={`${sucursal.sucursal}-${mesItem.key}-promedio`}
                          className="border-b border-gray-200 px-4 py-3 text-center font-semibold text-[#0f8f82]"
                        >
                          {value}
                        </td>
                      );
                    })}

                    <td className="border-b border-gray-200 bg-[#dcf4f0] px-4 py-3 text-center font-bold text-[#0a766b]">
                      {sucursal.ventasMesActual}
                    </td>

                    <td className="border-b border-gray-200 px-4 py-3 text-center">
                      <span
                        className={`inline-flex min-w-10 justify-center rounded-md px-2.5 py-1 font-semibold ${getPromedioCellClass(
                          sucursal.promedio,
                        )}`}
                      >
                        {sucursal.promedio}
                      </span>
                    </td>
                  </tr>
                </Fragment>
              ))}

              {!sucursales.length && (
                <tr>
                  <td
                    colSpan={meses.length + 4}
                    className="px-6 py-12 text-center text-sm text-gray-500"
                  >
                    No hay datos para el período seleccionado.
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
