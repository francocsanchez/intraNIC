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
  if (value === 0) return "bg-muted text-muted-foreground";
  return "bg-secondary text-secondary-foreground";
}

function PromedioMesCell({ value }: { value: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      <span>{formatPromedio(value)}</span>
      {value >= 9 ? (
        <Check className="h-4 w-4 text-foreground" />
      ) : (
        <X className="h-4 w-4 text-muted-foreground" />
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
      <div className="font-preset w-full bg-muted px-2 py-3">
        <section className="rounded-lg border border-destructive/30 bg-card p-3 shadow-sm">
          <h1 className="text-base font-semibold text-card-foreground">
            Error al cargar promedios de plan de ahorro
          </h1>
          <p className="mt-1 text-sm text-destructive">
            {error instanceof Error ? error.message : "No fue posible obtener la informacion."}
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="font-preset w-full space-y-3 bg-muted px-2 py-3">
      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 p-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Plan de ahorro
            </p>
            <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-card-foreground">
              Promedios de ventas por vendedor
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Vista anual con promedio movil de seis meses por vendedor. Se muestran columnas desde enero hasta el ultimo mes visible del ano.
            </p>
          </div>

          <label className="space-y-1">
            <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Ano</span>
            <select
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
              className="h-9 w-full min-w-36 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring"
            >
              {anios.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 border-t border-border lg:grid-cols-4">
          {[
            ["Vendedores", cards.totalVendedores],
            ["Promedio general", formatPromedio(cards.promedioGeneral)],
            ["Mejor promedio", formatPromedio(cards.mejorPromedio)],
            ["Mejor sucursal", cards.mejorSucursal],
          ].map(([label, value]) => (
            <div key={label} className="border-b border-r border-border px-3 py-2 last:border-r-0 lg:border-b-0">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
              <p className="mt-1 truncate text-lg font-semibold text-card-foreground">{value}</p>
              {label === "Mejor sucursal" ? <p className="text-xs text-muted-foreground">Promedio {formatPromedio(cards.mejorSucursalPromedio)}</p> : null}
            </div>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="border-b border-border px-3 py-2">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-card-foreground">
                Tabla de promedios
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Promedios de enero a {meses[meses.length - 1]?.label ?? "-"} de {anio}.
              </p>
            </div>

            <p className="text-xs text-muted-foreground">El promedio parcial se calcula con los meses visibles.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full border-separate border-spacing-0 text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="sticky left-0 z-20 border-b border-border bg-muted px-3 py-2 text-left text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Sucursal
                </th>
                <th className="sticky left-[180px] z-20 border-b border-border bg-muted px-3 py-2 text-left text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Vendedor
                </th>
                {meses.map((item) => (
                  <th
                    key={item.key}
                    className="border-b border-border px-3 py-2 text-center text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground"
                  >
                    {item.label}
                  </th>
                ))}
                <th className="border-b border-border bg-secondary px-3 py-2 text-center text-xs font-medium uppercase tracking-[0.16em] text-secondary-foreground">
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
                      className={index % 2 === 0 ? "bg-card" : "bg-muted/50"}
                    >
                      {index === 0 ? (
                        <td
                          rowSpan={sucursal.vendedores.length + 1}
                          className="sticky left-0 z-10 border-b border-border bg-card px-3 py-2 align-middle text-left font-semibold uppercase tracking-[0.08em] text-foreground"
                        >
                          <div className="min-w-[180px]">{sucursal.sucursal}</div>
                        </td>
                      ) : null}

                      <td className="sticky left-[180px] z-10 border-b border-border bg-inherit px-3 py-1.5 font-medium text-card-foreground">
                        <div className="min-w-[220px]">{vendedor.vendedor}</div>
                      </td>

                      {meses.map((mesItem) => {
                        const value = vendedor.meses[mesItem.key] ?? 0;

                        return (
                          <td
                            key={`${vendedor.vendedor}-${mesItem.key}`}
                            className={`border-b border-border px-3 py-1.5 text-center ${value === 0 ? "text-muted-foreground" : "text-card-foreground"}`}
                          >
                            <PromedioMesCell value={value} />
                          </td>
                        );
                      })}

                      <td className="border-b border-border px-3 py-1.5 text-center">
                        <span
                          className={`inline-flex min-w-14 justify-center rounded-md px-2 py-0.5 font-medium ${getPromedioCellClass(
                            vendedor.promedioAnualParcial,
                          )}`}
                        >
                          {formatPromedio(vendedor.promedioAnualParcial)}
                        </span>
                      </td>
                    </tr>
                  ))}

                  <tr key={`${sucursal.sucursal}-promedio`} className="bg-secondary">
                    <td className="sticky left-[180px] z-10 border-b border-border bg-secondary px-3 py-2 font-semibold uppercase tracking-[0.08em] text-secondary-foreground">
                      <div className="min-w-[220px]">Promedio sucursal</div>
                    </td>

                    {meses.map((mesItem) => {
                      const value = sucursal.meses[mesItem.key] ?? 0;

                      return (
                        <td
                          key={`${sucursal.sucursal}-${mesItem.key}-promedio`}
                          className="border-b border-border px-3 py-2 text-center font-semibold text-secondary-foreground"
                        >
                          <PromedioMesCell value={value} />
                        </td>
                      );
                    })}

                    <td className="border-b border-border px-3 py-2 text-center">
                      <span
                        className={`inline-flex min-w-14 justify-center rounded-md px-2 py-0.5 font-medium ${getPromedioCellClass(
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
                  <td colSpan={meses.length + 3} className="px-3 py-8 text-center text-sm text-muted-foreground">
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
