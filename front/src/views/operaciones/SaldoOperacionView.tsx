import Loading from "@/components/Loading";
import {
  exportSaldoOperacion,
  getSaldoOperacion,
  getSaldoOperacionFilters,
  updateSaldoOperacionCancelada,
} from "@/services/operacionesService";
import type { SaldoOperacionItem } from "@/types/index";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, DollarSign, Download, Inbox } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const UBICACION_TODAS = "__TODAS__";
const PAGE_SIZE = 60;

type SaldoOperacionSection = "conSaldo" | "canceladas";

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

const getSaldoColorClass = (saldo: number | null) => {
  if (saldo === null) {
    return "text-gray-500";
  }

  return saldo <= 0 ? "text-emerald-700" : "text-red-600";
};

const getDiasAsignadaBadgeClass = (diasAsignada: number | null) => {
  if (diasAsignada === null) {
    return "bg-gray-100 text-gray-500";
  }

  if (diasAsignada < 10) {
    return "bg-emerald-100 text-emerald-800";
  }

  if (diasAsignada <= 15) {
    return "bg-amber-100 text-amber-800";
  }

  return "bg-red-100 text-red-700";
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

function buildRowKey(row: SaldoOperacionItem) {
  return [row.codigoOperacion ?? "sin-operacion", row.numeroFabrica].join("-");
}

export default function SaldoOperacionView() {
  const queryClient = useQueryClient();
  const [section, setSection] = useState<SaldoOperacionSection>("conSaldo");
  const [ubicacion, setUbicacion] = useState<string>(UBICACION_TODAS);
  const [page, setPage] = useState(1);
  const [updatingOperacion, setUpdatingOperacion] = useState<number | null>(null);

  const filtersQuery = useQuery({
    queryKey: ["saldo-operacion-filtros"],
    queryFn: () => getSaldoOperacionFilters(),
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["saldo-operacion", section, ubicacion, page],
    queryFn: () =>
      getSaldoOperacion({
        section,
        ubicacion: ubicacion === UBICACION_TODAS ? undefined : ubicacion,
        page,
        limit: PAGE_SIZE,
      }),
    refetchOnWindowFocus: false,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      codigoOperacion,
      cancelada,
      numeroFabrica,
    }: {
      codigoOperacion: number;
      cancelada: boolean;
      numeroFabrica: string;
    }) => updateSaldoOperacionCancelada(codigoOperacion, { cancelada, numeroFabrica }),
    onMutate: ({ codigoOperacion }) => {
      setUpdatingOperacion(codigoOperacion);
    },
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["saldo-operacion"] });
    },
    onError: (mutationError: Error) => {
      toast.error(mutationError.message);
    },
    onSettled: () => {
      setUpdatingOperacion(null);
    },
  });

  const exportMutation = useMutation({
    mutationFn: () =>
      exportSaldoOperacion({
        section,
        ubicacion: ubicacion === UBICACION_TODAS ? undefined : ubicacion,
      }),
    onSuccess: (blob) => {
      const today = new Date().toISOString().slice(0, 10);
      downloadBlob(blob, `saldo-operacion-${today}.xlsx`);
      toast.success("Excel exportado correctamente");
    },
    onError: (mutationError: Error) => {
      toast.error(mutationError.message);
    },
  });

  useEffect(() => {
    if (error instanceof Error) {
      toast.error(error.message);
    }
  }, [error]);

  useEffect(() => {
    if (filtersQuery.error instanceof Error) {
      toast.error(filtersQuery.error.message);
    }
  }, [filtersQuery.error]);

  if (isLoading || filtersQuery.isLoading) return <Loading />;

  if (isError || filtersQuery.isError) {
    return (
      <div className="w-full px-4 py-6">
        <section className="rounded-[28px] border border-red-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 text-red-600">
            <AlertCircle size={18} />
            <h1 className="text-lg font-semibold tracking-tight text-gray-900">Error al cargar Saldo de operacion</h1>
          </div>
          <p className="mt-2 text-sm text-red-600">
            {error instanceof Error
              ? error.message
              : filtersQuery.error instanceof Error
                ? filtersQuery.error.message
                : "No fue posible obtener los registros solicitados."}
          </p>
        </section>
      </div>
    );
  }

  if (!data || !filtersQuery.data) return <Loading />;

  const saldosPorModelo =
    data.meta.saldosPorModelo.length > 0
      ? data.meta.saldosPorModelo
      : Array.from(
          data.data.reduce(
            (accumulator, row) => {
              if (section !== "conSaldo") {
                return accumulator;
              }

              const saldo = calculateSaldo(row.total, row.senas, row.usado, row.creditoBanco);

              if (saldo === null || saldo <= 0) {
                return accumulator;
              }

              const modelo = row.modeloGeneral.trim() || "SIN MODELO";
              accumulator.set(modelo, (accumulator.get(modelo) ?? 0) + saldo);
              return accumulator;
            },
            new Map<string, number>(),
          ),
        )
          .map(([modelo, saldo]) => ({ modelo, saldo }))
          .sort((a, b) => b.saldo - a.saldo || a.modelo.localeCompare(b.modelo, "es"));

  return (
    <div className="w-full space-y-4 px-4 py-4">
      <section className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => {
                setSection("conSaldo");
                setPage(1);
              }}
              className={[
                "rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors",
                section === "conSaldo" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900",
              ].join(" ")}
            >
              Con saldo
            </button>
            <button
              type="button"
              onClick={() => {
                setSection("canceladas");
                setPage(1);
              }}
              className={[
                "rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors",
                section === "canceladas" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900",
              ].join(" ")}
            >
              Canceladas
            </button>
          </div>

          <div className="rounded-xl bg-gray-50 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Registros</p>
            <p className="mt-0.5 text-xl font-semibold tracking-tight text-gray-900">{data.pagination.total}</p>
          </div>

          <div className="flex flex-wrap rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => {
                setUbicacion(UBICACION_TODAS);
                setPage(1);
              }}
              className={[
                "rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors",
                ubicacion === UBICACION_TODAS ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900",
              ].join(" ")}
            >
              Todas
            </button>
            {filtersQuery.data.meta.ubicaciones.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setUbicacion(item);
                  setPage(1);
                }}
                className={[
                  "rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors",
                  ubicacion === item ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900",
                ].join(" ")}
              >
                {item}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
            title={exportMutation.isPending ? "Exportando..." : "Exportar Excel"}
            aria-label={exportMutation.isPending ? "Exportando..." : "Exportar Excel"}
            className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download size={14} />
          </button>
        </div>
      </section>

      {section === "conSaldo" && saldosPorModelo.length ? (
        <section className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-gray-900">Saldos restantes a cobrar por modelo</h2>
            <span className="text-[11px] text-gray-500">{saldosPorModelo.length} modelos</span>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {saldosPorModelo.map((item) => (
              <div key={item.modelo} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">{item.modelo}</p>
                <p className="mt-1 text-lg font-semibold tracking-tight text-red-600">{formatMoney(item.saldo)}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {!data.data.length ? (
        <section className="rounded-xl border border-dashed border-[#b7d8e3] bg-white px-5 py-10 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#e4f3fa] text-[#15aa9a]">
            <Inbox size={20} />
          </div>
          <h2 className="mt-3 text-lg font-semibold text-gray-900">No hay registros para mostrar</h2>
          <p className="mt-1 text-sm text-gray-500">
            {section === "conSaldo"
              ? "Proba cambiar los filtros para ampliar el resultado."
              : "No hay operaciones marcadas como canceladas para estos filtros."}
          </p>
        </section>
      ) : (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-3 py-2">
            <p className="text-sm font-medium text-gray-600">
              {data.pagination.total} registros encontrados en {section === "conSaldo" ? "Con saldo" : "Canceladas"}
              {ubicacion !== UBICACION_TODAS ? ` para ${ubicacion}.` : "."}
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
                    colSpan={8}
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
                  <th className="whitespace-nowrap px-2 py-2 text-right text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500">
                    Dias
                  </th>
                  <th className="whitespace-nowrap px-2 py-2 text-right text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500">
                    Accion
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {data.data.map((row) => {
                  const isUpdating = updatingOperacion === row.codigoOperacion;
                  const nextCancelada = !row.cancelada;
                  const saldo = calculateSaldo(row.total, row.senas, row.usado, row.creditoBanco);

                  return (
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
                      <td
                        className={[
                          "whitespace-nowrap px-2 py-1.5 text-right tabular-nums font-semibold",
                          getSaldoColorClass(saldo),
                        ].join(" ")}
                      >
                        {formatMoney(saldo)}
                      </td>
                      <td className="whitespace-nowrap px-2 py-1.5 text-right">
                        <span
                          className={[
                            "inline-flex min-w-[42px] items-center justify-center rounded-md px-2 py-1 text-xs font-semibold tabular-nums",
                            getDiasAsignadaBadgeClass(row.diasAsignada),
                          ].join(" ")}
                        >
                          {row.diasAsignada ?? "-"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-2 py-1.5 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            if (!row.codigoOperacion) {
                              return;
                            }

                            updateMutation.mutate({
                              codigoOperacion: row.codigoOperacion,
                              cancelada: nextCancelada,
                              numeroFabrica: row.numeroFabrica,
                            });
                          }}
                          disabled={isUpdating || !row.codigoOperacion}
                          title={nextCancelada ? "Marcar como cancelada por pago total" : "Volver a con saldo"}
                          aria-label={nextCancelada ? "Marcar como cancelada por pago total" : "Volver a con saldo"}
                          className={[
                            "inline-flex items-center justify-center rounded-lg border p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                            nextCancelada
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
                          ].join(" ")}
                        >
                          {isUpdating ? <span className="text-[11px] font-semibold">...</span> : <DollarSign size={16} strokeWidth={2} />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
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
