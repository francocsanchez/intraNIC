import { Dialog, Transition } from "@headlessui/react";
import Loading from "@/components/Loading";
import EChart from "@/components/charts/EChart";
import { getPresetChartColors } from "@/components/charts/presetChartTheme";
import { EditActionButton } from "@/components/ui/action-button";
import {
  getTableroCobranzasDetalleDiario,
  getTableroCobranzasDiario,
  getTableroCobranzasRecibosOperacion,
} from "@/services/operacionesService";
import type { TableroCobranzasDia } from "@/types/index";
import { useQuery } from "@tanstack/react-query";
import type { EChartsCoreOption } from "echarts/core";
import { CalendarDays, ListChecks, WalletCards, X } from "lucide-react";
import { Fragment, useMemo, useState } from "react";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
] as const;

const COLUMNS: Array<{ key: keyof Omit<TableroCobranzasDia, "dia">; label: string }> = [
  { key: "efectivo", label: "Efectivo" },
  { key: "acreditacionBancaria", label: "Acred. bancaria" },
  { key: "tarjetas", label: "Tarjetas" },
  { key: "chequesTerceros", label: "Cheques terceros" },
  { key: "chequesPropios", label: "Cheques propios" },
  { key: "retenciones", label: "Retenciones" },
  { key: "documentos", label: "Documentos" },
  { key: "prenda", label: "Prenda" },
  { key: "compensaciones", label: "Compensaciones" },
  { key: "certificados", label: "Certificados" },
  { key: "total", label: "Total" },
];

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const receiptPaymentLabels = [
  ["efectivo", "Efectivo"],
  ["acreditacionBancaria", "Acred. bancaria"],
  ["tarjetas", "Tarjetas"],
  ["chequesTerceros", "Cheques terceros"],
  ["chequesPropios", "Cheques propios"],
  ["retenciones", "Retenciones"],
  ["documentos", "Documentos"],
  ["prenda", "Prenda"],
  ["compensaciones", "Compensaciones"],
  ["certificados", "Certificados"],
] as const;

const WEEK_RANGES = [
  { desde: 1, hasta: 7, etiqueta: "1–7" },
  { desde: 8, hasta: 14, etiqueta: "8–14" },
  { desde: 15, hasta: 21, etiqueta: "15–21" },
  { desde: 22, hasta: 28, etiqueta: "22–28" },
  { desde: 29, hasta: 31, etiqueta: "29–fin" },
] as const;

export default function TableroCobranzasView() {
  const today = new Date();
  const [anio, setAnio] = useState(today.getFullYear());
  const [mes, setMes] = useState(today.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedOperation, setSelectedOperation] = useState<number | null>(null);
  const query = useQuery({
    queryKey: ["tablero-cobranzas-diario", anio, mes],
    queryFn: ({ signal }) => getTableroCobranzasDiario({ anio, mes }, signal),
    refetchOnWindowFocus: false,
  });
  const detailQuery = useQuery({
    queryKey: ["tablero-cobranzas-detalle-diario", anio, mes, selectedDay],
    queryFn: ({ signal }) => getTableroCobranzasDetalleDiario({ anio, mes, dia: selectedDay! }, signal),
    enabled: selectedDay !== null,
    refetchOnWindowFocus: false,
  });
  const receiptsQuery = useQuery({
    queryKey: ["tablero-cobranzas-recibos-operacion", selectedOperation],
    queryFn: ({ signal }) => getTableroCobranzasRecibosOperacion(selectedOperation!, signal),
    enabled: selectedOperation !== null,
    refetchOnWindowFocus: false,
  });
  const totals = useMemo(() => {
    const days = query.data?.data.dias ?? [];
    return COLUMNS.reduce<Record<string, number>>((acc, column) => {
      acc[column.key] = days.reduce((sum, day) => sum + day[column.key], 0);
      return acc;
    }, {});
  }, [query.data]);
  const weeklyCollections = useMemo(() => {
    const days = query.data?.data.dias ?? [];
    return WEEK_RANGES.map((week) => ({
      ...week,
      total: days
        .filter((day) => day.dia >= week.desde && day.dia <= week.hasta)
        .reduce((sum, day) => sum + day.total, 0),
    }));
  }, [query.data]);
  const weeklyChartOption = useMemo<EChartsCoreOption>(() => ({
    color: getPresetChartColors(),
    grid: { top: 18, right: 18, bottom: 34, left: 78 },
    tooltip: {
      trigger: "axis",
      valueFormatter: (value: number | string) => money.format(Number(value)),
    },
    xAxis: {
      type: "category",
      data: weeklyCollections.map((week) => week.etiqueta),
      axisTick: { alignWithLabel: true },
      axisLabel: { fontSize: 11 },
    },
    yAxis: {
      type: "value",
      axisLabel: { fontSize: 10, formatter: (value: number) => money.format(value) },
      splitLine: { lineStyle: { color: "var(--border)" } },
    },
    series: [{
      type: "bar",
      name: "Cobrado",
      data: weeklyCollections.map((week) => week.total),
      barMaxWidth: 54,
      itemStyle: { borderRadius: [3, 3, 0, 0] },
    }],
  }), [weeklyCollections]);

  if (query.isLoading) return <Loading />;
  if (query.isError) return <div className="bg-muted p-4 font-preset text-destructive">{query.error.message}</div>;

  const days = query.data?.data.dias ?? [];
  const operaciones = detailQuery.data?.data.operaciones ?? [];
  return (
    <div className="space-y-3 bg-muted p-2 font-preset">
      <section className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-card p-3">
        <div className="flex items-center gap-2 text-base font-semibold">
          <WalletCards className="size-4" />
          Tablero de cobranzas
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <CalendarDays className="size-4 text-muted-foreground" />
          <select aria-label="Mes" value={mes} onChange={(event) => { setMes(Number(event.target.value)); setSelectedDay(null); setSelectedOperation(null); }} className="h-9 rounded-md border border-border bg-background px-2 text-xs">
            {MONTHS.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}
          </select>
          <input aria-label="Año" type="number" min="2000" max="2100" value={anio} onChange={(event) => { setAnio(Number(event.target.value) || today.getFullYear()); setSelectedDay(null); setSelectedOperation(null); }} className="h-9 w-24 rounded-md border border-border bg-background px-2 text-xs" />
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-border bg-card">
        <div className="border-b border-border px-3 py-2">
          <h2 className="text-sm font-semibold">Cobranzas por semana</h2>
          <p className="text-[11px] text-muted-foreground">Total cobrado por semana de {MONTHS[mes - 1]} {anio}.</p>
        </div>
        <div className="h-56 p-2"><EChart option={weeklyChartOption} /></div>
      </section>

      <section className="overflow-x-auto rounded-md border border-border bg-card">
        <table className="w-full min-w-[1540px] text-[11px]">
          <thead className="border-b border-border bg-muted text-right">
            <tr>
              <th className="px-1.5 py-1.5 text-left font-medium">Día</th>
              {COLUMNS.map((column) => <th key={column.key} className="px-1.5 py-1.5 font-medium whitespace-nowrap">{column.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day.dia} className={`border-b border-border last:border-0 hover:bg-muted/60 ${selectedDay === day.dia ? "bg-muted" : ""}`}>
                <td className="px-1.5 py-1 font-medium">
                  <button type="button" onClick={() => setSelectedDay(day.dia)} className="w-full text-left underline-offset-2 hover:underline" aria-label={`Ver operaciones del día ${day.dia}`}>{day.dia}</button>
                </td>
                {COLUMNS.map((column) => <td key={column.key} className="px-1.5 py-1 text-right tabular-nums">{money.format(day[column.key])}</td>)}
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-border bg-muted text-right font-semibold">
            <tr>
              <td className="px-1.5 py-1.5 text-left">Total</td>
              {COLUMNS.map((column) => <td key={column.key} className="px-1.5 py-1.5 tabular-nums">{money.format(totals[column.key] ?? 0)}</td>)}
            </tr>
          </tfoot>
        </table>
      </section>

      <section className="rounded-md border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <ListChecks className="size-4" />
          <h2 className="text-sm font-semibold">Operaciones cobradas por día</h2>
          {selectedDay !== null && <span className="text-xs text-muted-foreground">Día {selectedDay} de {MONTHS[mes - 1]} {anio}</span>}
        </div>
        {selectedDay === null ? (
          <p className="px-3 py-4 text-xs text-muted-foreground">Seleccioná un día de la tabla superior para ver las operaciones involucradas.</p>
        ) : detailQuery.isLoading ? (
          <div className="p-4"><Loading /></div>
        ) : detailQuery.isError ? (
          <p className="p-3 text-xs text-destructive">{detailQuery.error.message}</p>
        ) : (
          <div className="p-3">
            {operaciones.length === 0 ? <p className="text-xs text-muted-foreground">No hay recibos de anticipo imputados a una operación para este día.</p> : (
              <div className="overflow-x-auto border border-border">
                <table className="w-full min-w-[760px] text-xs">
                  <thead className="border-b border-border bg-muted text-left">
                    <tr>
                      <th className="px-2 py-2 font-medium">N° operación</th>
                      <th className="px-2 py-2 font-medium">Cliente</th>
                      <th className="px-2 py-2 font-medium">Modelo</th>
                      <th className="px-2 py-2 font-medium">Versión</th>
                      <th className="px-2 py-2 text-right font-medium">Monto abonado</th>
                      <th className="px-2 py-2 text-right font-medium">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operaciones.map((operacion) => (
                      <tr key={operacion.codigoOperacion} className="border-b border-border last:border-0">
                        <td className="px-2 py-1.5 tabular-nums">{operacion.codigoOperacion}</td>
                        <td className="px-2 py-1.5">{operacion.cliente}</td>
                        <td className="px-2 py-1.5">{operacion.modelo}</td>
                        <td className="px-2 py-1.5">{operacion.version}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums">{money.format(operacion.monto)}</td>
                        <td className="px-2 py-1.5 text-right">
                          <EditActionButton className="h-7 px-2 text-xs" onClick={() => setSelectedOperation(operacion.codigoOperacion)}>Ver</EditActionButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>

      <Transition appear show={selectedOperation !== null} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setSelectedOperation(null)}>
          <Transition.Child as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-foreground/20" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto p-4">
            <div className="flex min-h-full items-center justify-center">
              <Transition.Child as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-100" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-4xl overflow-hidden rounded-md border border-border bg-card shadow-xl">
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <div>
                      <Dialog.Title className="text-sm font-semibold">Recibos de anticipo — OP {selectedOperation}</Dialog.Title>
                      <p className="text-xs text-muted-foreground">Recibos vinculados a la operación en SIAC.</p>
                    </div>
                    <EditActionButton className="size-8 p-0" aria-label="Cerrar" onClick={() => setSelectedOperation(null)}><X className="size-4" /></EditActionButton>
                  </div>
                  <div className="max-h-[70vh] overflow-auto p-4">
                    {receiptsQuery.isLoading ? <Loading /> : receiptsQuery.isError ? (
                      <p className="text-xs text-destructive">{receiptsQuery.error.message}</p>
                    ) : (receiptsQuery.data?.data.recibos.length ?? 0) === 0 ? (
                      <p className="text-xs text-muted-foreground">No hay recibos de anticipo vinculados a esta operación.</p>
                    ) : (
                      <table className="w-full min-w-[720px] text-xs">
                        <thead className="border-b border-border bg-muted text-left">
                          <tr><th className="px-2 py-2 font-medium">Fecha</th><th className="px-2 py-2 font-medium">Comprobante</th><th className="px-2 py-2 font-medium">Medios de pago</th><th className="px-2 py-2 text-right font-medium">Total</th></tr>
                        </thead>
                        <tbody>
                          {receiptsQuery.data?.data.recibos.map((recibo) => (
                            <tr key={`${recibo.fecha}-${recibo.comprobante}`} className="border-b border-border last:border-0">
                              <td className="px-2 py-1.5 tabular-nums">{recibo.fecha.split("-").reverse().join("/")}</td>
                              <td className="px-2 py-1.5 tabular-nums">{recibo.comprobante}</td>
                              <td className="px-2 py-1.5">{receiptPaymentLabels.filter(([key]) => recibo[key] > 0).map(([key, label]) => `${label}: ${money.format(recibo[key])}`).join(" · ") || "-"}</td>
                              <td className="px-2 py-1.5 text-right tabular-nums">{money.format(recibo.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
