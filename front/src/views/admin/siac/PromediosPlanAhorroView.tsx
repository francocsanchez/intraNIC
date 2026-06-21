import Loading from "@/components/Loading";
import { getPromediosPlanAhorro } from "@/api/dms/dmsAPI";
import type { PromedioPlanAhorroResponse } from "@/types/index";
import { useQuery } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { Fragment, useMemo, useState } from "react";

const CURRENT_YEAR = new Date().getFullYear();

const EMPTY_MESES: NonNullable<PromedioPlanAhorroResponse["resumen"]>["meses"] = [];
const EMPTY_SUCURSALES: NonNullable<PromedioPlanAhorroResponse["resumen"]>["sucursales"] = [];
const EMPTY_VENDEDORES: NonNullable<PromedioPlanAhorroResponse["resumen"]>["vendedores"] = [];

function formatPromedio(value: number) {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2).replace(/\.?0+$/, "");
}

function getPromedioCellClass(value: number) {
  if (value >= 9) return "bg-emerald-100 text-emerald-800";
  if (value >= 6) return "bg-amber-100 text-amber-800";
  if (value === 0) return "bg-gray-100 text-gray-500";
  return "bg-rose-100 text-rose-700";
}

function getMesCellClass(value: number) {
  if (value >= 9) return "text-[#15aa9a] font-semibold";
  if (value >= 6) return "text-amber-700 font-medium";
  if (value === 0) return "text-gray-300";
  return "text-gray-700";
}

function PromedioMesCell({ value }: { value: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      <span>{formatPromedio(value)}</span>
      {value >= 9 ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <X className="h-4 w-4 text-red-600" />
      )}
    </div>
  );
}

export default function PromediosPlanAhorroView() {
  const [anio, setAnio] = useState<number>(CURRENT_YEAR);
  const anios = useMemo(() => Array.from({ length: 6 }, (_, index) => CURRENT_YEAR - index), []);

  const { data, isLoading, isError, error } = useQuery<PromedioPlanAhorroResponse>({
    queryKey: ["promedios-plan-ahorro", anio],
    queryFn: () => getPromediosPlanAhorro(anio),
    refetchOnWindowFocus: true,
  });

  const resumen = data?.resumen;
  const meses = resumen?.meses ?? EMPTY_MESES;
  const sucursales = resumen?.sucursales ?? EMPTY_SUCURSALES;
  const vendedores = resumen?.vendedores ?? EMPTY_VENDEDORES;
  const metricas = resumen?.metricas;

  const cards = useMemo(
    () => ({
      totalVendedores: metricas?.totalVendedores ?? vendedores.length,
      promedioGeneral: metricas?.promedioGeneral ?? 0,
      mejorPromedio: metricas?.mejorPromedio ?? 0,
      mejorSucursal: metricas?.mejorSucursal?.sucursal ?? "-",
      mejorSucursalPromedio: metricas?.mejorSucursal?.promedioAnualParcial ?? 0,
    }),
    [metricas, vendedores.length],
  );

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="w-full px-4 py-6">
        <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900">
            Error al cargar promedios de plan de ahorro
          </h1>
          <p className="mt-2 text-sm text-red-600">
            {error instanceof Error ? error.message : "No fue posible obtener la informacion."}
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
              Plan de ahorro
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">
              Promedios de ventas por vendedor
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-gray-500">
              Vista anual con promedio movil de seis meses por vendedor. Se muestran columnas desde enero hasta el ultimo mes visible del ano.
            </p>
          </div>

          <label className="space-y-1">
            <span className="text-sm font-semibold text-gray-900">Ano</span>
            <select
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
              className="w-full min-w-36 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-[#15aa9a]"
            >
              {anios.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            Vendedores
          </p>
          <p className="mt-3 text-3xl font-bold text-gray-900">{cards.totalVendedores}</p>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            Promedio general
          </p>
          <p className="mt-3 text-3xl font-bold text-gray-900">{formatPromedio(cards.promedioGeneral)}</p>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            Mejor promedio
          </p>
          <p className="mt-3 text-3xl font-bold text-[#15aa9a]">{formatPromedio(cards.mejorPromedio)}</p>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            Mejor sucursal
          </p>
          <p className="mt-3 truncate text-lg font-bold text-gray-900">{cards.mejorSucursal}</p>
          <p className="mt-1 text-sm font-semibold text-[#15aa9a]">
            Promedio {formatPromedio(cards.mejorSucursalPromedio)}
          </p>
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
                Promedios de enero a {meses[meses.length - 1]?.label ?? "-"} de {anio}.
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
          <table className="min-w-[980px] w-full border-separate border-spacing-0 text-sm">
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
                            <PromedioMesCell value={value} />
                          </td>
                        );
                      })}

                      <td className="border-b border-gray-200 px-4 py-3 text-center">
                        <span
                          className={`inline-flex min-w-14 justify-center rounded-md px-2.5 py-1 font-semibold ${getPromedioCellClass(
                            vendedor.promedioAnualParcial,
                          )}`}
                        >
                          {formatPromedio(vendedor.promedioAnualParcial)}
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
                          <PromedioMesCell value={value} />
                        </td>
                      );
                    })}

                    <td className="border-b border-gray-200 px-4 py-3 text-center">
                      <span
                        className={`inline-flex min-w-14 justify-center rounded-md px-2.5 py-1 font-semibold ${getPromedioCellClass(
                          sucursal.promedioAnualParcial,
                        )}`}
                      >
                        {formatPromedio(sucursal.promedioAnualParcial)}
                      </span>
                    </td>
                  </tr>
                </Fragment>
              ))}

              {!sucursales.length && (
                <tr>
                  <td colSpan={meses.length + 3} className="px-6 py-12 text-center text-sm text-gray-500">
                    No hay datos para el ano seleccionado.
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
