import Loading from "@/components/Loading";
import { getTableroCobranzasDetalleDiario, getTableroCobranzasDiario } from "@/services/operacionesService";
import type { TableroCobranzasDia } from "@/types/index";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ListChecks, WalletCards } from "lucide-react";
import { useMemo, useState } from "react";

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
  { key: "divisas", label: "Divisas" },
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

export default function TableroCobranzasView() {
  const today = new Date();
  const [anio, setAnio] = useState(today.getFullYear());
  const [mes, setMes] = useState(today.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
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
  const totals = useMemo(() => {
    const days = query.data?.data.dias ?? [];
    return COLUMNS.reduce<Record<string, number>>((acc, column) => {
      acc[column.key] = days.reduce((sum, day) => sum + day[column.key], 0);
      return acc;
    }, {});
  }, [query.data]);

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
          <select aria-label="Mes" value={mes} onChange={(event) => { setMes(Number(event.target.value)); setSelectedDay(null); }} className="h-9 rounded-md border border-border bg-background px-2 text-xs">
            {MONTHS.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}
          </select>
          <input aria-label="Año" type="number" min="2000" max="2100" value={anio} onChange={(event) => { setAnio(Number(event.target.value) || today.getFullYear()); setSelectedDay(null); }} className="h-9 w-24 rounded-md border border-border bg-background px-2 text-xs" />
        </div>
      </section>

      <section className="overflow-x-auto rounded-md border border-border bg-card">
        <table className="w-full min-w-[1900px] text-xs">
          <thead className="border-b border-border bg-muted text-right">
            <tr>
              <th className="px-2 py-2 text-left font-medium">Día</th>
              {COLUMNS.map((column) => <th key={column.key} className="px-2 py-2 font-medium whitespace-nowrap">{column.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day.dia} className={`border-b border-border last:border-0 hover:bg-muted/60 ${selectedDay === day.dia ? "bg-muted" : ""}`}>
                <td className="px-2 py-1.5 font-medium">
                  <button type="button" onClick={() => setSelectedDay(day.dia)} className="w-full text-left underline-offset-2 hover:underline" aria-label={`Ver operaciones del día ${day.dia}`}>{day.dia}</button>
                </td>
                {COLUMNS.map((column) => <td key={column.key} className="px-2 py-1.5 text-right tabular-nums">{money.format(day[column.key])}</td>)}
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-border bg-muted text-right font-semibold">
            <tr>
              <td className="px-2 py-2 text-left">Total</td>
              {COLUMNS.map((column) => <td key={column.key} className="px-2 py-2 tabular-nums">{money.format(totals[column.key] ?? 0)}</td>)}
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
