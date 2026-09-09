import { getPrediccionAsignaciones } from "@/api/dms/prediccionAsignacionesAPI";
import Loading from "@/components/Loading";
import { textToColor } from "@/helpers/colores";
import type { PrediccionAsignacionItem } from "@/types/index";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, RefreshCw } from "lucide-react";

function ColorBadge({ color }: { color: string }) {
  return (
    <span className={`inline-flex rounded-md border border-border px-2 py-0.5 text-[10px] font-medium ${textToColor(color)}`}>
      {color}
    </span>
  );
}

export default function PrediccionAsignacionesView() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["prediccion-asignaciones"],
    queryFn: getPrediccionAsignaciones,
    refetchOnWindowFocus: true,
  });

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="font-preset w-full bg-muted px-2 py-3">
        <section className="rounded-lg border border-destructive/30 bg-card p-3">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Error al cargar predicciones</h1>
          <p className="mt-2 text-sm text-destructive">{error.message}</p>
        </section>
      </div>
    );
  }

  const predictions = data?.data ?? [];

  return (
    <div className="font-preset w-full max-w-none space-y-3 bg-muted px-2 py-3">
      <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground">
        <div className="flex flex-col gap-3 px-3 py-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Gestion convencional</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground">Prediccion de asignaciones</h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Alertas de unidades disponibles mas antiguas del mismo modelo, version y color para priorizar la rotacion de stock.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="border-l border-border pl-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Coincidencias</p>
              <p className="mt-1 text-lg font-semibold tracking-tight text-foreground">{predictions.length}</p>
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-xs font-semibold text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={15} className={isFetching ? "animate-spin" : undefined} />
              Actualizar
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <AlertTriangle size={16} className="text-muted-foreground" />
          <h2 className="text-base font-semibold tracking-tight text-foreground">Posibles re-asignaciones</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[1740px] w-full text-xs">
            <thead className="bg-muted text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <tr>
                <th className="px-3 py-2">N OP</th>
                <th className="px-3 py-2">Cliente</th>
                <th className="px-3 py-2">Vendedor</th>
                <th className="px-3 py-2">Version asignada</th>
                <th className="px-3 py-2">C. asignado</th>
                <th className="px-3 py-2">Interno</th>
                <th className="px-3 py-2">Mes produccion</th>
                <th className="px-3 py-2">Ubicacion</th>
                <th className="border-l-4 border-l-primary/60 px-3 py-2">Ubicacion</th>
                <th className="px-3 py-2">Posible Interno</th>
                <th className="px-3 py-2">Mes produccion</th>
                <th className="px-3 py-2">Color posible</th>
                <th className="px-3 py-2">Version posible</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {predictions.map((prediction: PrediccionAsignacionItem) => (
                <tr key={`${prediction.codigoOp}-${prediction.stockPosibleReasignacion}`} className="hover:bg-muted/70">
                  <td className="px-3 py-1.5 font-medium text-foreground">{prediction.codigoOp}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">{prediction.cliente}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">{prediction.vendedor}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">{prediction.versionAsignada}</td>
                  <td className="px-3 py-1.5"><ColorBadge color={prediction.colorAsignado} /></td>
                  <td className="px-3 py-1.5 text-muted-foreground">{prediction.stockActual}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">{prediction.produccionActual}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">{prediction.ubicacionActual}</td>
                  <td className={`border-l-4 border-l-primary/60 px-3 py-1.5 font-medium ${prediction.criterioPrioridad === "ubicacion" ? "bg-emerald-100/70 text-emerald-950" : "text-foreground"}`}>{prediction.ubicacionPosible}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">{prediction.stockPosibleReasignacion}</td>
                  <td className={`px-3 py-1.5 ${prediction.criterioPrioridad === "produccion" ? "bg-emerald-100/70 font-semibold text-emerald-950" : "text-muted-foreground"}`}>{prediction.produccionPosible}</td>
                  <td className="px-3 py-1.5"><ColorBadge color={prediction.colorStockPosible} /></td>
                  <td className="px-3 py-1.5 text-muted-foreground">{prediction.versionStockPosible}</td>
                </tr>
              ))}
              {!predictions.length && (
                <tr>
                  <td colSpan={13} className="px-3 py-12 text-center text-xs text-muted-foreground">
                    No hay coincidencias de re-asignacion para las operaciones pendientes.
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
