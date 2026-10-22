import {
  getDashboardSalonSettings,
  updateDashboardSalonSettings,
} from "@/api/configuracionAPI";
import { getSucursalesSiac } from "@/api/dms/dmsAPI";
import { ActionButton } from "@/components/ui/action-button";
import { paths } from "@/routes/paths";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const today = new Date();

export default function ConfiguracionDashboardSalonView() {
  const queryClient = useQueryClient();
  const [sucursalCodigo, setSucursalCodigo] = useState("");
  const [anio, setAnio] = useState(String(today.getFullYear()));
  const [mes, setMes] = useState(String(today.getMonth() + 1));
  const [objetivoDraft, setObjetivoDraft] = useState<string | null>(null);
  const [objetivoTotalDraft, setObjetivoTotalDraft] = useState<string | null>(null);
  const sucursalesQuery = useQuery({ queryKey: ["sucursales-siac"], queryFn: getSucursalesSiac });
  const period = { anio: Number(anio), mes: Number(mes) };
  const isPeriodValid = Number.isInteger(period.anio) && period.anio >= 2000 && Number.isInteger(period.mes) && period.mes >= 1 && period.mes <= 12;
  const scope = { ...period, sucursalCodigo: Number(sucursalCodigo) };
  const isScopeValid = isPeriodValid && Number.isInteger(scope.sucursalCodigo) && scope.sucursalCodigo > 0;
  const settingsQuery = useQuery({
    queryKey: ["configuracion", "dashboard-salon", scope],
    queryFn: () => getDashboardSalonSettings(scope),
    enabled: isScopeValid,
  });
  const totalSettingsQuery = useQuery({
    queryKey: ["configuracion", "dashboard-salon", "total", period],
    queryFn: () => getDashboardSalonSettings(period),
    enabled: isPeriodValid,
  });

  const saveMutation = useMutation({
    mutationFn: updateDashboardSalonSettings,
    onSuccess: (response) => {
      toast.success(response.message ?? "Objetivo actualizado correctamente");
      queryClient.invalidateQueries({ queryKey: ["configuracion", "dashboard-salon"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-salon"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateScope = (update: () => void) => {
    setObjetivoDraft(null);
    setObjetivoTotalDraft(null);
    update();
  };

  const save = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const objetivoVendedores = Number(objetivoDraft ?? settingsQuery.data?.data.objetivoVendedores ?? "");
    if (!isScopeValid || !Number.isInteger(objetivoVendedores) || objetivoVendedores < 1) {
      toast.error("Seleccioná una sucursal, período y objetivo válido.");
      return;
    }
    saveMutation.mutate({ ...scope, objetivoVendedores });
  };

  const saveTotal = () => {
    const objetivoOperacionesTotales = Number(objetivoTotalDraft ?? totalSettingsQuery.data?.data.objetivoOperacionesTotales ?? "");
    if (!isPeriodValid || !Number.isInteger(objetivoOperacionesTotales) || objetivoOperacionesTotales < 1) {
      toast.error("Seleccioná un período y objetivo total válido.");
      return;
    }
    saveMutation.mutate({ ...period, objetivoOperacionesTotales });
  };

  return (
    <div className="font-preset w-full space-y-3 bg-muted px-2 py-3">
      <section className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-3 shadow-sm">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Análisis</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground">Objetivo de vendedores</h1>
          <p className="mt-1 text-sm text-muted-foreground">Define la meta mensual por sucursal aplicada al Dashboard Salón.</p>
        </div>
        <Link to={paths.admin.configuracion} className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-xs font-semibold uppercase tracking-wide text-primary-foreground transition hover:bg-primary/90">Volver</Link>
      </section>

      <form onSubmit={save} className="rounded-lg border border-border bg-card p-3 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <label className="text-sm font-semibold text-foreground">Sucursal SIAC
            <select value={sucursalCodigo} onChange={(event) => updateScope(() => setSucursalCodigo(event.target.value))} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm font-normal text-foreground">
              <option value="">Seleccionar sucursal</option>
              {(sucursalesQuery.data?.data ?? []).map((sucursal) => <option key={sucursal.codigo} value={sucursal.codigo}>{sucursal.nombre}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold text-foreground">Año
            <input type="number" min="2000" step="1" value={anio} onChange={(event) => updateScope(() => setAnio(event.target.value))} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm font-normal text-foreground" />
          </label>
          <label className="text-sm font-semibold text-foreground">Mes
            <select value={mes} onChange={(event) => updateScope(() => setMes(event.target.value))} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm font-normal text-foreground">
              {MONTHS.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold text-foreground">Objetivo de vendedores
            <input type="number" min="1" step="1" inputMode="numeric" disabled={!isScopeValid || settingsQuery.isLoading} value={objetivoDraft ?? (settingsQuery.data?.data.objetivoVendedores ? String(settingsQuery.data.data.objetivoVendedores) : "")} onChange={(event) => setObjetivoDraft(event.target.value)} placeholder="Ej. 15" className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm font-normal text-foreground disabled:cursor-not-allowed disabled:opacity-50" />
          </label>
          <label className="text-sm font-semibold text-foreground">Objetivo operaciones totales
            <input type="number" min="1" step="1" inputMode="numeric" disabled={!isPeriodValid || totalSettingsQuery.isLoading} value={objetivoTotalDraft ?? (totalSettingsQuery.data?.data.objetivoOperacionesTotales ? String(totalSettingsQuery.data.data.objetivoOperacionesTotales) : "")} onChange={(event) => setObjetivoTotalDraft(event.target.value)} placeholder="Ej. 200" className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm font-normal text-foreground disabled:cursor-not-allowed disabled:opacity-50" />
          </label>
        </div>
        {sucursalesQuery.isError ? <p className="mt-3 text-sm text-destructive">No se pudieron cargar las sucursales SIAC.</p> : null}
        {settingsQuery.isError || totalSettingsQuery.isError ? <p className="mt-3 text-sm text-destructive">No se pudo cargar el objetivo del período seleccionado.</p> : null}
        <p className="mt-3 text-sm text-muted-foreground">Vendedores: verde al alcanzar, amarillo desde el 70% y rojo por debajo. Operaciones totales: el velocímetro pasa a rojo al alcanzar la meta.</p>
        <div className="mt-3 flex flex-wrap gap-2"><ActionButton type="submit" disabled={!isScopeValid || saveMutation.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">{saveMutation.isPending ? "Guardando..." : "Guardar objetivo vendedores"}</ActionButton><ActionButton type="button" onClick={saveTotal} disabled={!isPeriodValid || saveMutation.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">Guardar objetivo total</ActionButton></div>
      </form>
    </div>
  );
}
