import Loading from "@/components/Loading";
import { getSaldoOperacion } from "@/services/operacionesService";
import type { SaldoOperacionItem } from "@/types/index";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Inbox } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const ESTADO_TODOS = "__TODOS__";
const PAGE_SIZE = 100;

const formatMoney = (value: number | null) => {
  if (value === null || Number.isNaN(value)) {
    return "-";
  }

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const calculateSaldo = (
  total: number | null,
  abonado: number | null,
  usado: number | null,
  creditoBanco: number | null,
) => {
  if (total === null) {
    return null;
  }

  return total - (abonado ?? 0) - (usado ?? 0) - (creditoBanco ?? 0);
};

function buildRowKey(row: SaldoOperacionItem) {
  return [row.codigoOperacion ?? "sin-operacion", row.numeroFabrica].join("-");
}

export default function SaldoOperacionView() {
  const [estado, setEstado] = useState<string>(ESTADO_TODOS);
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["saldo-operacion", estado, page],
    queryFn: () =>
      getSaldoOperacion({
        estado: estado === ESTADO_TODOS ? undefined : estado,
        page,
        limit: PAGE_SIZE,
      }),
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (error instanceof Error) {
      toast.error(error.message);
    }
  }, [error]);

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="w-full px-4 py-6">
        <section className="rounded-[28px] border border-red-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 text-red-600">
            <AlertCircle size={18} />
            <h1 className="text-lg font-semibold tracking-tight text-gray-900">Error al cargar Saldo de operacion</h1>
          </div>
          <p className="mt-2 text-sm text-red-600">
            {error instanceof Error ? error.message : "No fue posible obtener los registros solicitados."}
          </p>
        </section>
      </div>
    );
  }

  if (!data) return <Loading />;

  return (
    <div className="w-full space-y-4 px-4 py-4">
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,280px)_1fr] md:items-end">
          <div className="space-y-2">
            <label
              htmlFor="saldo-operacion-estado"
              className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500"
            >
              Estado
            </label>
            <select
              id="saldo-operacion-estado"
              value={estado}
              onChange={(event) => {
                setEstado(event.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-gray-500"
            >
              <option value={ESTADO_TODOS}>Todos</option>
              {data.meta.estados.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Registros</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">{data.pagination.total}</p>
            </div>
            <div className="text-right text-xs text-gray-500">
              {isFetching ? "Actualizando..." : "Solo se muestran operaciones NIC con codigo de operacion no facturadas"}
            </div>
          </div>
        </div>
      </section>

      {!data.data.length ? (
        <section className="rounded-xl border border-dashed border-[#b7d8e3] bg-white px-5 py-10 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#e4f3fa] text-[#15aa9a]">
            <Inbox size={20} />
          </div>
          <h2 className="mt-3 text-lg font-semibold text-gray-900">No hay registros para mostrar</h2>
          <p className="mt-1 text-sm text-gray-500">Proba cambiar el filtro de estado para ampliar el resultado.</p>
        </section>
      ) : (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-3 py-2">
            <p className="text-sm font-medium text-gray-600">
              {data.pagination.total} registros encontrados{estado !== ESTADO_TODOS ? ` para ${estado}.` : "."}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    colSpan={6}
                    className="border-b border-gray-200 px-2 py-1 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500"
                  >
                    Operacion
                  </th>
                  <th
                    colSpan={7}
                    className="border-b border-gray-200 px-2 py-1 text-right text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500"
                  >
                    Resumen economico
                  </th>
                </tr>
                <tr>
                  <th className="whitespace-nowrap px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500">
                    OP
                  </th>
                  <th className="whitespace-nowrap px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500">
                    Numero Fabrica
                  </th>
                  <th className="whitespace-nowrap px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500">
                    Version
                  </th>
                  <th className="whitespace-nowrap px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500">
                    Modelo
                  </th>
                  
                  <th className="whitespace-nowrap px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500">
                    Cliente
                  </th>
                  <th className="whitespace-nowrap px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500">
                    Vendedor
                  </th>
                  <th className="whitespace-nowrap px-2 py-2 text-right text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500">
                    $ Uni
                  </th>
                  <th className="whitespace-nowrap px-2 py-2 text-right text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500">
                    $ Desc
                  </th>
                  <th className="whitespace-nowrap px-2 py-2 text-right text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500">
                    $ Ges
                  </th>
                  <th className="whitespace-nowrap px-2 py-2 text-right text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500">
                    $ Total
                  </th>
                  <th className="whitespace-nowrap px-2 py-2 text-right text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500">
                    $ Abonado
                  </th>
                  <th className="whitespace-nowrap px-2 py-2 text-right text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500">
                    $ Usado
                  </th>
                  <th className="whitespace-nowrap px-2 py-2 text-right text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500">
                    $ Credito
                  </th>
                  <th className="whitespace-nowrap px-2 py-2 text-right text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500">
                    $ Saldo
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {data.data.map((row) => (
                  <tr key={buildRowKey(row)} className="hover:bg-gray-50/70">
                    <td className="whitespace-nowrap px-2 py-1.5 text-gray-700">{row.codigoOperacion ?? "-"}</td>
                    <td className="whitespace-nowrap px-2 py-1.5 font-medium text-gray-900">{row.numeroFabrica}</td>
                    <td className="whitespace-nowrap px-2 py-1.5 text-gray-700">{row.version || "-"}</td>
                    <td className="whitespace-nowrap px-2 py-1.5 text-gray-700">{row.modeloGeneral || "-"}</td>
         
                    <td className="whitespace-nowrap px-2 py-1.5 text-gray-700">{row.clienteNombre}</td>
                    <td className="whitespace-nowrap px-2 py-1.5 text-gray-700">{row.vendedor}</td>
                    <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums text-gray-700">{formatMoney(row.pcioVenta)}</td>
                    <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums text-gray-700">{formatMoney(row.bonifVenta)}</td>
                    <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums text-gray-700">{formatMoney(row.gestoria)}</td>
                    <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums font-semibold text-gray-900">{formatMoney(row.total)}</td>
                    <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums text-gray-700">{formatMoney(row.senas)}</td>
                    <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums text-gray-700">{formatMoney(row.usado)}</td>
                    <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums text-gray-700">{formatMoney(row.creditoBanco)}</td>
                    <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums font-semibold text-amber-700">
                      {formatMoney(calculateSaldo(row.total, row.senas, row.usado, row.creditoBanco))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {data.pagination.totalPages > 1 ? (
        <section className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-sm text-gray-600">
            Pagina {data.pagination.page} de {data.pagination.totalPages}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={data.pagination.page <= 1}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(data.pagination.totalPages, current + 1))}
              disabled={data.pagination.page >= data.pagination.totalPages}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
