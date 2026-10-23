import {
  getDashboardSalonSettings,
  getDashboardSalonModelImages,
  updateDashboardSalonSettings,
  saveDashboardSalonModelImage,
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
  const [modeloImagen, setModeloImagen] = useState("");
  const [enlaceImagen, setEnlaceImagen] = useState("");
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
  const modelImagesQuery = useQuery({
    queryKey: ["configuracion", "dashboard-salon", "modelos"],
    queryFn: getDashboardSalonModelImages,
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
  const saveModelImageMutation = useMutation({
    mutationFn: saveDashboardSalonModelImage,
    onSuccess: (response) => {
      toast.success(response.message ?? "Imagen actualizada correctamente");
      setModeloImagen("");
      setEnlaceImagen("");
      queryClient.invalidateQueries({ queryKey: ["configuracion", "dashboard-salon", "modelos"] });
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

  const saveModelImage = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!modeloImagen.trim() || !enlaceImagen.trim()) {
      toast.error("Indicá el modelo y el enlace de la imagen.");
      return;
    }
    saveModelImageMutation.mutate({ modelo: modeloImagen, imageUrl: enlaceImagen });
  };
  const imageUrl = (value: string) => {
    if (/^https?:\/\//i.test(value)) return value;
    const apiUrl = String(import.meta.env.VITE_API_URL ?? "");
    const apiOrigin = apiUrl.replace(/\/api\/?$/, "");
    return apiOrigin ? `${apiOrigin}${value}` : value;
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

      <section className="rounded-lg border border-border bg-card p-3 shadow-sm">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Dashboard Salón</p>
          <h2 className="mt-1 text-lg font-semibold text-foreground">Imágenes por modelo</h2>
          <p className="mt-1 text-sm text-muted-foreground">La imagen se muestra junto al modelo en el gráfico. Al guardar otro enlace para el mismo modelo, reemplaza el anterior.</p>
        </div>
        <form onSubmit={saveModelImage} className="mt-3 grid grid-cols-1 items-end gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <label className="text-sm font-semibold text-foreground">Modelo
            <input value={modeloImagen} onChange={(event) => setModeloImagen(event.target.value)} placeholder="Ej. HILUX" className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm font-normal text-foreground" />
          </label>
          <label className="text-sm font-semibold text-foreground">Enlace de imagen
            <input type="url" value={enlaceImagen} onChange={(event) => setEnlaceImagen(event.target.value)} placeholder="https://ejemplo.com/hilux.png" className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm font-normal text-foreground" />
          </label>
          <ActionButton type="submit" disabled={saveModelImageMutation.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">{saveModelImageMutation.isPending ? "Guardando..." : "Guardar enlace"}</ActionButton>
        </form>
        {modelImagesQuery.isError ? <p className="mt-3 text-sm text-destructive">No se pudieron cargar las imágenes configuradas.</p> : null}
        {modelImagesQuery.data?.data.length ? <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{modelImagesQuery.data.data.map((item) => <div key={item.modelo} className="overflow-hidden rounded-md border border-border bg-background"><img src={imageUrl(item.imageUrl)} alt={item.modelo} className="h-20 w-full object-contain" /><p className="truncate border-t border-border px-2 py-1 text-center text-xs font-medium text-foreground">{item.modelo}</p></div>)}</div> : <p className="mt-3 text-sm text-muted-foreground">Todavía no hay imágenes cargadas.</p>}
      </section>
    </div>
  );
}
