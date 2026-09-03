import { getPlanNegocioResumen } from "@/api/dms/planNegocioAPI";
import Loading from "@/components/Loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Goal, PackageCheck, Target } from "lucide-react";
import { useMemo, useState } from "react";

const MONTH_COLUMNS = [
  ["ene", "ENE"], ["feb", "FEB"], ["mar", "MAR"], ["abr", "ABR"],
  ["may", "MAY"], ["jun", "JUN"], ["jul", "JUL"], ["ago", "AGO"],
  ["sep", "SEP"], ["oct", "OCT"], ["nov", "NOV"], ["dic", "DIC"],
] as const;

export default function PlanNegocioView() {
  const currentYear = new Date().getFullYear();
  const currentMonthIndex = new Date().getMonth();
  const [anio, setAnio] = useState(currentYear);
  const years = useMemo(() => Array.from({ length: 6 }, (_, index) => currentYear + 1 - index), [currentYear]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["plan-negocio-resumen", anio],
    queryFn: () => getPlanNegocioResumen(anio),
  });

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="w-full px-4 py-6">
        <Card className="border border-destructive/30">
          <CardContent className="p-6">
            <h1 className="text-lg font-semibold tracking-tight text-foreground">Error al cargar Plan de negocio</h1>
            <p className="mt-2 text-sm text-destructive">{error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const rows = data?.data ?? [];
  const total = data?.total;
  const currentMonthKey = anio === currentYear ? MONTH_COLUMNS[currentMonthIndex]?.[0] : null;
  const totalObjetivo = total?.objetivo ?? 0;
  const totalAsignado = total?.totalAsignado ?? 0;
  const totalRestante = total?.restante ?? 0;
  const totalAvance = total?.avance ?? 0;
  const progressWidth = Math.max(0, Math.min(totalAvance, 100));
  const metrics = [
    { label: "Objetivo", value: totalObjetivo, icon: Target, accent: "bg-secondary text-foreground" },
    { label: "Asignado", value: totalAsignado, icon: PackageCheck, accent: "bg-secondary text-foreground" },
    { label: "Restante", value: totalRestante, icon: Goal, accent: "bg-secondary text-foreground" },
    { label: "Avance", value: `${totalAvance}%`, icon: CalendarDays, accent: "bg-primary text-primary-foreground" },
  ];

  return (
    <div className="font-preset w-full space-y-3 px-2 py-3 text-foreground">
      <Card className="border border-border bg-card [--card-spacing:--spacing(2)]">
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 p-3 lg:flex-row lg:items-end lg:justify-between lg:p-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="secondary">Gestion convencional</Badge>
                <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Corte anual</span>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Plan de negocio</h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Objetivos comerciales y asignaciones recibidas, organizados por modelo y mes.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="plan-negocio-anio" className="sr-only">Seleccione un año</label>
              <select id="plan-negocio-anio" value={anio} onChange={(event) => setAnio(Number(event.target.value))} className="h-9 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground outline-none transition focus:ring-2 focus:ring-ring">
                {years.map((year) => <option key={year} value={year}>Año {year}</option>)}
              </select>
              {anio !== currentYear ? <Button type="button" variant="outline" onClick={() => setAnio(currentYear)}>Año actual</Button> : null}
            </div>
          </div>

          <div className="grid border-t border-border sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric, index) => (
              <div key={metric.label} className={`flex items-center gap-3 px-3 py-3 ${index > 0 ? "xl:border-l xl:border-border" : ""} ${index > 1 ? "sm:border-t sm:border-border xl:border-t-0" : ""} ${index % 2 === 1 ? "sm:border-l sm:border-border xl:border-l" : ""}`}>
                <div className={`flex h-8 w-8 items-center justify-center rounded-md ${metric.accent}`}><metric.icon size={16} /></div>
                <div><p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{metric.label}</p><p className="text-xl font-semibold tracking-tight text-foreground">{metric.value}</p></div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 border-t border-border px-3 py-2">
            <span className="shrink-0 text-xs font-medium text-muted-foreground">Progreso anual</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progressWidth}%` }} /></div>
            <span className="text-xs font-semibold text-foreground">{totalAvance}%</span>
          </div>
        </CardContent>
      </Card>

      <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[1440px] text-sm">
            <thead className="border-b border-border bg-secondary text-xs uppercase tracking-[0.13em] text-muted-foreground">
              <tr>
                <th className="sticky left-0 z-20 bg-secondary px-3 py-2 text-left">Modelo</th><th className="px-3 py-2 text-center">Objetivo</th>
                {MONTH_COLUMNS.map(([key, label]) => <th key={label} className={`px-3 py-2 text-center ${currentMonthKey === key ? "bg-primary text-primary-foreground" : ""}`}>{label}</th>)}
                <th className="px-3 py-2 text-center">% avance</th><th className="px-3 py-2 text-center">Restante</th><th className="px-3 py-2 text-center">x mes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.modelo} className="transition-colors hover:bg-secondary">
                  <td className="sticky left-0 z-10 bg-card px-3 py-2.5 font-semibold text-foreground">{row.modelo}</td><td className="px-3 py-2.5 text-center font-semibold text-foreground">{row.objetivo}</td>
                  {MONTH_COLUMNS.map(([key]) => <td key={key} className={`px-3 py-2.5 text-center text-muted-foreground ${currentMonthKey === key ? "bg-secondary font-semibold text-foreground" : ""}`}>{row[key]}</td>)}
                  <td className={`px-3 py-2.5 text-center font-semibold ${row.avance >= 100 ? "text-emerald-600" : "text-foreground"}`}>{row.avance}%</td><td className="px-3 py-2.5 text-center font-semibold text-foreground">{row.restante}</td><td className="px-3 py-2.5 text-center font-semibold text-foreground">{row.xMes}</td>
                </tr>
              ))}
              {total ? (
                <tr className="bg-primary text-primary-foreground">
                  <td className="sticky left-0 z-10 bg-primary px-3 py-2.5 font-bold">{total.modelo}</td><td className="px-3 py-2.5 text-center font-bold">{total.objetivo}</td>
                  {MONTH_COLUMNS.map(([key]) => <td key={key} className="px-3 py-2.5 text-center font-bold">{total[key]}</td>)}
                  <td className={`px-3 py-2.5 text-center font-bold ${total.avance >= 100 ? "text-emerald-300" : ""}`}>{total.avance}%</td><td className="px-3 py-2.5 text-center font-bold">{total.restante}</td><td className="px-3 py-2.5 text-center font-bold">{total.xMes}</td>
                </tr>
              ) : null}
              {!rows.length ? <tr><td colSpan={16} className="px-4 py-14 text-center text-sm text-muted-foreground">No hay objetivos o asignaciones para {anio}.</td></tr> : null}
            </tbody>
          </table>
      </div>
    </div>
  );
}
