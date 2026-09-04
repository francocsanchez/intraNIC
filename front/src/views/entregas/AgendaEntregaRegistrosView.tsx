import { getAgendaEntregaLogs } from "@/api/entregasAPI";
import AgendaEntregaLogsTable from "@/components/entregas/AgendaEntregaLogsTable";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export default function AgendaEntregaRegistrosView() {
  const [filters, setFilters] = useState({
    interno: "",
    usuario: "",
    from: "",
    to: "",
    page: 1,
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["entregas", "logs", filters],
    queryFn: () =>
      getAgendaEntregaLogs({
        interno: filters.interno || undefined,
        usuario: filters.usuario || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
        page: filters.page,
        limit: 20,
      }),
  });

  if (isLoading) {
    return <div className="font-preset rounded-lg border border-border bg-card p-3 text-card-foreground shadow-sm">Cargando registros de auditoria...</div>;
  }

  if (isError) {
    return (
      <div className="font-preset rounded-lg border border-destructive/30 bg-card p-3 text-destructive shadow-sm">
        {error instanceof Error ? error.message : "Error al cargar registros de auditoria"}
      </div>
    );
  }

  const items = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="font-preset space-y-3">
      <section className="rounded-lg border border-border bg-card p-3 shadow-sm">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Entregas</p>
          <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-card-foreground">Registros y auditoria</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Consulta quien crea, modifica o elimina internos dentro de la agenda.
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-2 shadow-sm">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
          <input
            type="text"
            placeholder="Interno"
            value={filters.interno}
            onChange={(event) => setFilters((current) => ({ ...current, interno: event.target.value, page: 1 }))}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="text"
            placeholder="Usuario"
            value={filters.usuario}
            onChange={(event) => setFilters((current) => ({ ...current, usuario: event.target.value, page: 1 }))}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="date"
            value={filters.from}
            onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value, page: 1 }))}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="date"
            value={filters.to}
            onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value, page: 1 }))}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="button"
            onClick={() => setFilters({ interno: "", usuario: "", from: "", to: "", page: 1 })}
            className="h-9 rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground transition hover:bg-secondary"
          >
            Limpiar filtros
          </button>
        </div>
      </section>

      <AgendaEntregaLogsTable items={items} />

      {pagination ? (
        <section className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 shadow-sm">
          <div className="text-sm text-muted-foreground">
            Pagina {pagination.page} de {pagination.totalPages} - {pagination.total} registros
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}
              className="h-9 rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground transition hover:bg-secondary disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}
              className="h-9 rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground transition hover:bg-secondary disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
