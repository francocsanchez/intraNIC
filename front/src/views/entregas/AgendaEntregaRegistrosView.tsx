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
    return <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">Cargando registros de auditoria...</div>;
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-6 text-red-600 shadow-sm">
        {error instanceof Error ? error.message : "Error al cargar registros de auditoria"}
      </div>
    );
  }

  const items = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Entregas</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">Registros y auditoria</h1>
          <p className="mt-1 text-sm text-gray-500">
            Consulta quien crea, modifica o elimina internos dentro de la agenda.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <input
            type="text"
            placeholder="Interno"
            value={filters.interno}
            onChange={(event) => setFilters((current) => ({ ...current, interno: event.target.value, page: 1 }))}
            className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-500"
          />
          <input
            type="text"
            placeholder="Usuario"
            value={filters.usuario}
            onChange={(event) => setFilters((current) => ({ ...current, usuario: event.target.value, page: 1 }))}
            className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-500"
          />
          <input
            type="date"
            value={filters.from}
            onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value, page: 1 }))}
            className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-500"
          />
          <input
            type="date"
            value={filters.to}
            onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value, page: 1 }))}
            className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-500"
          />
          <button
            type="button"
            onClick={() => setFilters({ interno: "", usuario: "", from: "", to: "", page: 1 })}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Limpiar filtros
          </button>
        </div>
      </section>

      <AgendaEntregaLogsTable items={items} />

      {pagination ? (
        <section className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="text-sm text-gray-500">
            Pagina {pagination.page} de {pagination.totalPages} - {pagination.total} registros
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
