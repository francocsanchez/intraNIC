import { getDashboardAdministracionCobranzasSettings, updateDashboardAdministracionCobranzasSettings } from "@/api/configuracionAPI";
import { ActionButton } from "@/components/ui/action-button";
import { paths } from "@/routes/paths";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const WEEKS = ["1–7", "8–14", "15–21", "22–28", "29–fin"];
const today = new Date();
const pesos = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
const digitsOnly = (value: string) => value.replace(/\D/g, "");
const formatPesosInput = (value: string | number | null | undefined) => {
  const digits = digitsOnly(String(value ?? ""));
  return digits ? pesos.format(Number(digits)) : "";
};

export default function ConfiguracionDashboardAdministracionView() {
  const queryClient = useQueryClient();
  const [anio, setAnio] = useState(String(today.getFullYear()));
  const [mes, setMes] = useState(String(today.getMonth() + 1));
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const period = { anio: Number(anio), mes: Number(mes) };
  const validPeriod = Number.isInteger(period.anio) && period.anio >= 2000 && Number.isInteger(period.mes) && period.mes >= 1 && period.mes <= 12;
  const settingsQuery = useQuery({ queryKey: ["configuracion", "dashboard-administracion", "cobranzas", period], queryFn: () => getDashboardAdministracionCobranzasSettings(period), enabled: validPeriod });
  const saveMutation = useMutation({
    mutationFn: updateDashboardAdministracionCobranzasSettings,
    onSuccess: (response) => {
      toast.success(response.message);
      setDrafts({});
      queryClient.invalidateQueries({ queryKey: ["configuracion", "dashboard-administracion", "cobranzas"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-administracion-cobranzas"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const save = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validPeriod) return toast.error("Seleccioná un período válido.");
    const objetivos = WEEKS.map((_, index) => {
      const value = digitsOnly(drafts[index] ?? (settingsQuery.data?.data.objetivos[index] == null ? "" : String(settingsQuery.data.data.objetivos[index])));
      if (!value.trim()) return null;
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : Number.NaN;
    });
    if (objetivos.some((value) => typeof value === "number" && !Number.isFinite(value))) return toast.error("Cada objetivo debe ser un importe válido.");
    saveMutation.mutate({ ...period, objetivos });
  };
  const changePeriod = (update: () => void) => { setDrafts({}); update(); };

  return <div className="w-full space-y-3 bg-muted px-2 py-3 font-preset">
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-3 shadow-sm"><div><p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Análisis</p><h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground">Objetivos de cobranzas semanales</h1><p className="mt-1 text-sm text-muted-foreground">Las metas se muestran como una línea punteada en Dashboard Administración.</p></div><Link to={paths.admin.configuracion} className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-xs font-semibold uppercase tracking-wide text-primary-foreground transition hover:bg-primary/90">Volver</Link></section>
    <form onSubmit={save} className="rounded-lg border border-border bg-card p-4 shadow-sm"><div className="grid gap-3 md:grid-cols-[140px_1fr_1fr]"><label className="text-sm font-semibold text-foreground">Año<input type="number" min="2000" value={anio} onChange={(event) => changePeriod(() => setAnio(event.target.value))} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm font-normal" /></label><label className="text-sm font-semibold text-foreground">Mes<select value={mes} onChange={(event) => changePeriod(() => setMes(event.target.value))} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm font-normal">{MONTHS.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}</select></label><p className="self-end pb-2 text-xs text-muted-foreground">Dejá vacío un período semanal para no mostrar objetivo.</p></div><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{WEEKS.map((week, index) => <label key={week} className="text-sm font-semibold text-foreground">Semana {week}<input type="text" inputMode="numeric" disabled={!validPeriod || settingsQuery.isLoading} value={drafts[index] ?? formatPesosInput(settingsQuery.data?.data.objetivos[index])} onChange={(event) => setDrafts((current) => ({ ...current, [index]: formatPesosInput(event.target.value) }))} placeholder="Sin objetivo" className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm font-normal disabled:cursor-not-allowed disabled:opacity-50" /></label>)}</div>{settingsQuery.isError ? <p className="mt-3 text-sm text-destructive">No se pudieron cargar los objetivos configurados.</p> : null}<div className="mt-5"><ActionButton type="submit" disabled={!validPeriod || settingsQuery.isLoading || saveMutation.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">{saveMutation.isPending ? "Guardando..." : "Guardar objetivos"}</ActionButton></div></form>
  </div>;
}
