import Loading from "@/components/Loading";
import { getResumenRegistroAsignaciones } from "@/api/dms/registroAsignacionAPI";
import { paths } from "@/routes/paths";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { useMemo, useState } from "react";
import type { EChartsCoreOption } from "echarts/core";
import EChart from "@/components/charts/EChart";
import { getPresetChartColors } from "@/components/charts/presetChartTheme";
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

function AsignacionesChart({ data }: { data: Array<{ label: string; asignadas: number; desasignadas: number }> }) {
  const option = useMemo<EChartsCoreOption>(() => ({
    color: getPresetChartColors(),
    grid: { top: 28, right: 16, bottom: 38, left: 38 },
    legend: { bottom: 0 },
    tooltip: { trigger: "axis", backgroundColor: "var(--popover)", borderColor: "var(--border)", textStyle: { color: "var(--popover-foreground)" } },
    xAxis: { type: "category", data: data.map((item) => item.label), axisTick: { show: false }, axisLabel: { color: "var(--muted-foreground)", fontSize: 11 } },
    yAxis: { type: "value", minInterval: 1, axisTick: { show: false }, axisLabel: { color: "var(--muted-foreground)", fontSize: 11 }, splitLine: { lineStyle: { color: "var(--border)", type: "dashed" } } },
    series: [
      { type: "bar", name: "Asignadas", data: data.map((item) => item.asignadas), barMaxWidth: 28 },
      { type: "bar", name: "Desasignadas", data: data.map((item) => item.desasignadas), barMaxWidth: 28 },
    ],
  }), [data]);
  return <EChart option={option} />;
}

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
        <section className="rounded-lg border border-destructive/30 bg-card p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Error al cargar el resumen de asignaciones
          </h1>
          <p className="mt-2 text-sm text-destructive">{error.message}</p>
        </section>
      </div>
    );
  }

  if (!data) return <Loading />;

  const resumenMensual = data.resumenMensual;
  const resumenAnual = data.resumenAnual;
  const nombreMes = MESES.find((item) => item.value === mes)?.label ?? "";
  const buildDetalleLink = (
    tipo: "Asignado" | "Desasignado",
    modelo?: string,
  ) => {
    const params = new URLSearchParams({
      tipo,
      mes: String(mes),
      ano: String(ano),
    });

    if (modelo) {
      params.set("modelo", modelo);
    }

    return `${paths.convencional.registroAsignaciones}?${params.toString()}`;
  };

  return (
    <div className="w-full space-y-6 px-4 py-6">
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Resumen de registro asignaciones
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Consulta mensual por modelo y comparativo anual de asignadas vs desasignadas.
            </p>
          </div>

          <Link
            to={paths.convencional.registroAsignaciones}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted"
          >
            <CalendarDays size={16} strokeWidth={1.75} />
            Volver a registros
          </Link>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <label className="flex flex-col gap-2 text-sm font-medium text-muted-foreground">
              Mes
              <select
                value={mes}
                onChange={(event) => setMes(Number(event.target.value))}
                className="rounded-lg border border-input bg-card px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-ring"
              >
                {MESES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-muted-foreground">
              Año
              <select
                value={ano}
                onChange={(event) => setAno(Number(event.target.value))}
                className="rounded-lg border border-input bg-card px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-ring"
              >
                {ANIOS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:min-w-[820px] xl:flex-1 xl:max-w-[1120px]">
            <Link
              to={buildDetalleLink("Asignado")}
              className="rounded-lg border border-border bg-card px-5 py-4 shadow-sm transition hover:border-border hover:bg-secondary/40"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Asignadas {nombreMes}
              </p>
              <p className="mt-2 text-2xl font-bold text-primary">
                {resumenMensual.total.asignadas}
              </p>
              <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-primary">
                Ver detalle del mes
              </p>
            </Link>

            <Link
              to={buildDetalleLink("Desasignado")}
              className="rounded-lg border border-border bg-card px-5 py-4 shadow-sm transition hover:border-border hover:bg-secondary/40"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Desasignadas {nombreMes}
              </p>
              <p className="mt-2 text-2xl font-bold text-destructive">
                {resumenMensual.total.desasignadas}
              </p>
              <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-destructive">
                Ver detalle del mes
              </p>
            </Link>

            <article className="rounded-lg border border-border bg-card px-5 py-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Neto del mes
              </p>
              <p className="mt-2 text-2xl font-bold text-foreground">
                {resumenMensual.total.neto}
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <article className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Resumen mensual por modelo
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {nombreMes} {ano}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full text-sm">
              <thead className="bg-muted text-xs uppercase tracking-[0.18em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Modelo</th>
                  <th className="px-4 py-3 text-center">Asignadas</th>
                  <th className="px-4 py-3 text-center">Desasignadas</th>
                  <th className="px-4 py-3 text-center">Neto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {resumenMensual.porModelo.map((item) => (
                  <tr key={item.modelo} className="hover:bg-muted">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {item.modelo}
                    </td>
                    <td className="px-4 py-3 text-center text-primary">{item.asignadas}</td>
                    <td className="px-4 py-3 text-center text-destructive">{item.desasignadas}</td>
                    <td className="px-4 py-3 text-center font-semibold text-foreground">
                      {item.neto}
                    </td>
                  </tr>
                ))}

                <tr className="bg-muted font-semibold text-foreground">
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3 text-center text-primary">
                    {resumenMensual.total.asignadas}
                  </td>
                  <td className="px-4 py-3 text-center text-destructive">
                    {resumenMensual.total.desasignadas}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {resumenMensual.total.neto}
                  </td>
                </tr>

                {!resumenMensual.porModelo.length ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-muted-foreground">
                      No hay registros para el periodo seleccionado.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>

        <article className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Movimiento entre sucursales y modelo
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Matriz mensual con total neto y detalle asignadas/desasignadas por sucursal.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full text-sm">
              <thead className="bg-muted text-xs uppercase tracking-[0.18em] text-muted-foreground">
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
              <tbody className="divide-y divide-border">
                {resumenMensual.porModeloSucursal.map((item) => (
                  <tr key={item.modelo} className="hover:bg-muted">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {item.modelo}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-foreground">
                      {item.total}
                    </td>
                    {resumenMensual.sucursales.map((sucursal) => {
                      const detalle = item.sucursales[sucursal];
                      return (
                        <td key={`${item.modelo}-${sucursal}`} className="px-4 py-3 text-center">
                          <div className="font-semibold text-foreground">{detalle.neto}</div>
                          <div className="text-xs text-primary">A {detalle.asignadas}</div>
                          <div className="text-xs text-destructive">D {detalle.desasignadas}</div>
                        </td>
                      );
                    })}
                  </tr>
                ))}

                <tr className="bg-muted font-semibold text-foreground">
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3 text-center">{resumenMensual.total.neto}</td>
                  {resumenMensual.resumenSucursales.map((item) => (
                    <td key={`total-${item.sucursal}`} className="px-4 py-3 text-center">
                      <div>{item.neto}</div>
                      <div className="text-xs text-primary">A {item.asignadas}</div>
                      <div className="text-xs text-destructive">D {item.desasignadas}</div>
                    </td>
                  ))}
                </tr>

                {!resumenMensual.porModeloSucursal.length ? (
                  <tr>
                    <td
                      colSpan={Math.max(resumenMensual.sucursales.length + 2, 2)}
                      className="px-6 py-12 text-center text-sm text-muted-foreground"
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

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Asignadas y desasignadas por sucursal
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Totales del mes seleccionado.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[560px] w-full text-sm">
            <thead className="bg-muted text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Sucursal</th>
                <th className="px-4 py-3 text-right">Asignadas</th>
                <th className="px-4 py-3 text-right">Desasignadas</th>
                <th className="px-4 py-3 text-right">Neto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {resumenMensual.resumenSucursales.map((item) => (
                <tr key={item.sucursal} className="hover:bg-muted">
                  <td className="px-4 py-3 font-medium text-foreground">{item.sucursal}</td>
                  <td className="px-4 py-3 text-right text-primary">{item.asignadas}</td>
                  <td className="px-4 py-3 text-right text-destructive">{item.desasignadas}</td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground">{item.neto}</td>
                </tr>
              ))}

              {!resumenMensual.resumenSucursales.length ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    No hay sucursales con movimientos en el periodo seleccionado.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <article className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Asignadas vs desasignadas por día
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Evolución diaria de {nombreMes} {ano}.
          </p>

          <div className="mt-3 h-[320px]"><AsignacionesChart data={resumenMensual.porDia} /></div>
        </article>

        <article className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Asignadas vs desasignadas por mes
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Evolución del año {resumenAnual.ano}.
          </p>

          <div className="mt-3 h-[320px]"><AsignacionesChart data={resumenAnual.porMes} /></div>
        </article>
      </section>
    </div>
  );
}
