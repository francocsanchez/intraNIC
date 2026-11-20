import {
  getLicitacionResumenUnidades,
  getLicitacionesResumen,
} from "@/api/licitacionesResumenAPI";
import Loading from "@/components/Loading";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, ChevronUp, ClipboardList } from "lucide-react";
import { useState } from "react";

const stateLabels = {
  PENDIENTE_TECNICA: "Pendiente de técnica",
  ESPERANDO_MANTENIMIENTO: "Esperando vencimiento de mantenimiento de oferta",
  PENDIENTE_PREADJUDICADO: "Pendiente de pre-adjudicación",
  PENDIENTE_PAGARE: "Pendiente de pagaré",
  PENDIENTE_OC: "Pendiente de OC",
  ADJUDICADA: "Adjudicada",
  PERDIDA: "Perdida",
} as const;

const stateClass = {
  PENDIENTE_TECNICA: "bg-muted text-muted-foreground",
  ESPERANDO_MANTENIMIENTO: "bg-amber-100 text-amber-900",
  PENDIENTE_PREADJUDICADO: "bg-amber-100 text-amber-900",
  PENDIENTE_PAGARE: "bg-blue-100 text-blue-900",
  PENDIENTE_OC: "bg-blue-100 text-blue-900",
  ADJUDICADA: "bg-emerald-100 text-emerald-900",
  PERDIDA: "bg-red-100 text-red-900",
} as const;

const progressColumns = [
  ["asignada", "Asignadas"],
  ["equipadaTransformada", "EQ / Transformadas"],
  ["arribada", "Arribadas"],
  ["patentada", "Patentadas"],
  ["pagada", "Pagadas"],
  ["entregada", "Entregadas"],
] as const;

function LicitacionCard({ id, entidad, totalUnidades, avance, estado }: {
  id: string;
  entidad: string;
  totalUnidades: number;
  avance: Record<(typeof progressColumns)[number][0], number>;
  estado: keyof typeof stateLabels;
}) {
  const [expanded, setExpanded] = useState(false);
  const unitsQuery = useQuery({
    queryKey: ["licitaciones", "resumen", id, "unidades"],
    queryFn: () => getLicitacionResumenUnidades(id),
    enabled: expanded,
  });

  return (
    <Card size="sm" className="gap-0 overflow-visible shadow-sm transition-shadow hover:shadow-md">
      <button
        type="button"
        className="grid w-full grid-cols-2 items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-muted/60 lg:grid-cols-[minmax(220px,1.5fr)_auto_repeat(6,minmax(86px,1fr))_auto]"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
      >
        <span className="line-clamp-2 min-w-0 break-words text-sm font-semibold leading-5 text-foreground lg:text-[15px]">{entidad}</span>
        <span className={`justify-self-end whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-semibold ${stateClass[estado]}`}>{stateLabels[estado]}</span>
        {progressColumns.map(([field, label]) => (
          <span key={field} className="hidden min-w-0 text-center lg:block">
            <span className="block truncate text-[9px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
            <strong className="block text-sm font-semibold tabular-nums text-foreground">{avance[field]}<span className="px-0.5 text-muted-foreground">/</span>{totalUnidades}</strong>
          </span>
        ))}
        <span className="col-span-2 flex items-center justify-end gap-2 text-xs text-muted-foreground lg:col-span-1 lg:col-start-9 lg:row-start-1">
          <strong className="text-sm font-semibold text-foreground">{totalUnidades}</strong> unidade{totalUnidades === 1 ? "" : "s"}
          <span className="ml-1 rounded-full bg-muted p-1 text-foreground">{expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</span>
        </span>
      </button>

      {expanded && (
        <CardContent className="border-t px-0 pt-0">
          {unitsQuery.isLoading ? (
            <div className="px-3 py-4 text-sm text-muted-foreground">Cargando unidades...</div>
          ) : unitsQuery.isError ? (
            <div className="px-3 py-4 text-sm text-destructive">{unitsQuery.error.message}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Versión</th>
                    <th className="w-28 px-3 py-2 text-center font-semibold">Asignada</th>
                    <th className="w-36 px-3 py-2 text-center font-semibold">EQ / Transformada</th>
                    <th className="w-28 px-3 py-2 text-center font-semibold">Arribada</th>
                    <th className="w-28 px-3 py-2 text-center font-semibold">Patentada</th>
                    <th className="w-28 px-3 py-2 text-center font-semibold">Pagada</th>
                    <th className="w-28 px-3 py-2 text-center font-semibold">Entregada</th>
                  </tr>
                </thead>
                <tbody>
                  {unitsQuery.data?.data.map((unit, index) => (
                    <tr key={`${unit.versionNombre}-${index}`} className="border-b last:border-b-0">
                      <td className="px-3 py-2 font-medium text-foreground">{unit.versionNombre || "-"}</td>
                      <td className="px-3 py-2 text-center">
                        {unit.asignada ? <Check aria-label="Asignada" size={18} className="mx-auto text-emerald-600" strokeWidth={3} /> : <span className="text-muted-foreground">-</span>}
                      </td>
                      {(["equipadaTransformada", "arribada", "patentada", "pagada", "entregada"] as const).map((field) => (
                        <td key={field} className="px-3 py-2 text-center">
                          {unit[field] ? <Check aria-label={field} size={18} className="mx-auto text-emerald-600" strokeWidth={3} /> : <span className="text-muted-foreground">-</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {!unitsQuery.data?.data.length && (
                    <tr><td colSpan={7} className="px-3 py-4 text-center text-muted-foreground">No hay unidades cargadas.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function LicitacionesResumenView() {
  const [tab, setTab] = useState<"gestion" | "finalizadas">("gestion");
  const listQuery = useQuery({
    queryKey: ["licitaciones", "resumen"],
    queryFn: getLicitacionesResumen,
  });

  if (listQuery.isLoading) return <Loading />;

  const licitaciones = listQuery.data?.data ?? [];
  const enGestion = licitaciones.filter((item) => !item.archivada);
  const finalizadas = licitaciones.filter((item) => item.archivada);
  const visibles = tab === "gestion" ? enGestion : finalizadas;

  return (
    <main className="w-full space-y-4 p-4 sm:p-6">
      <header className="flex items-center gap-3 rounded-lg bg-card p-4 ring-1 ring-foreground/10">
        <ClipboardList size={21} className="text-primary" />
        <div>
          <h1 className="text-lg font-semibold">Resumen de licitaciones</h1>
          <p className="text-sm text-muted-foreground">Unidades y asignaciones por licitación</p>
        </div>
      </header>

      {listQuery.isError ? (
        <div className="rounded-lg bg-card p-4 text-sm text-destructive ring-1 ring-foreground/10">{listQuery.error.message}</div>
      ) : (
        <>
          <div className="flex w-fit items-center rounded-lg border bg-card p-1" role="tablist" aria-label="Estado de licitaciones">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "gestion"}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${tab === "gestion" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setTab("gestion")}
            >
              En gestión <span className="ml-1 tabular-nums">{enGestion.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "finalizadas"}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${tab === "finalizadas" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setTab("finalizadas")}
            >
              Finalizadas <span className="ml-1 tabular-nums">{finalizadas.length}</span>
            </button>
          </div>

          {visibles.length ? (
            <section className="space-y-3" aria-label={tab === "gestion" ? "Licitaciones en gestión" : "Licitaciones finalizadas"}>
              {visibles.map((item) => (
            <LicitacionCard
              key={item._id}
              id={item._id}
              entidad={item.entidad}
              totalUnidades={item.totalUnidades}
              avance={item.avance}
              estado={item.estado}
            />
              ))}
            </section>
          ) : (
            <div className="rounded-lg bg-card p-6 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
              {tab === "gestion" ? "No hay licitaciones en gestión." : "No hay licitaciones finalizadas."}
            </div>
          )}
        </>
      )}
    </main>
  );
}
