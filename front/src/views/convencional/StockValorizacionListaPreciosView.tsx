import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  exportStockValorizacionListaPreciosExcel,
  getStockValorizacionListaPrecios,
  importStockValorizacionListaPreciosExcel,
  saveStockValorizacionPrecio,
} from "@/api/convencional/stockAPI";
import { paths } from "@/routes/paths";
import type { StockValorizacionPrecioListResponse } from "@/types/index";
import { Download, Upload } from "lucide-react";
import { useRef } from "react";

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

const formatMoney = (value: number | null) =>
  value === null
    ? "-"
    : new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
      }).format(value);

export default function StockValorizacionListaPreciosView() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});

  const { data, isLoading, isError, error } = useQuery<StockValorizacionPrecioListResponse>({
    queryKey: ["stockValorizacion", "listaPrecios", "convencional"],
    queryFn: getStockValorizacionListaPrecios,
    refetchOnWindowFocus: true,
  });

  const saveMutation = useMutation({
    mutationFn: saveStockValorizacionPrecio,
    onSuccess: (response, variables) => {
      toast.success(response.message);
      setDraftValues((current) => ({
        ...current,
        [variables.version]: String(variables.valor),
      }));
      queryClient.invalidateQueries({ queryKey: ["stockValorizacion", "listaPrecios", "convencional"] });
      queryClient.invalidateQueries({ queryKey: ["stockValorizacion", "convencional"] });
    },
    onError: (mutationError: Error) => {
      toast.error(mutationError.message);
    },
  });

  const exportMutation = useMutation({
    mutationFn: exportStockValorizacionListaPreciosExcel,
    onSuccess: (blob) => {
      downloadBlob(blob, "valorizacion-lista-precios.xlsx");
      toast.success("Excel exportado correctamente");
    },
    onError: (mutationError: Error) => {
      toast.error(mutationError.message);
    },
  });

  const importMutation = useMutation({
    mutationFn: importStockValorizacionListaPreciosExcel,
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["stockValorizacion", "listaPrecios", "convencional"] });
      queryClient.invalidateQueries({ queryKey: ["stockValorizacion", "convencional"] });
    },
    onError: (mutationError: Error) => {
      toast.error(mutationError.message);
    },
  });

  const rows = data?.data ?? [];

  const summary = useMemo(
    () => ({
      versiones: rows.length,
      conPrecio: rows.filter((row) => row.tienePrecio).length,
      sinPrecio: rows.filter((row) => !row.tienePrecio).length,
      unidades: rows.reduce((acc, row) => acc + row.cantidadUnidades, 0),
    }),
    [rows],
  );

  if (isLoading) {
    return (
      <div className="w-full space-y-6 px-4 py-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="h-8 w-80 animate-pulse rounded bg-gray-200" />
          <div className="mt-3 h-4 w-72 animate-pulse rounded bg-gray-100" />
        </section>

        <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <article key={index} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
              <div className="mt-4 h-10 w-20 animate-pulse rounded bg-gray-100" />
            </article>
          ))}
        </section>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full px-4 py-6">
        <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">Error al cargar la lista de precios</h2>
          <p className="mt-2 text-sm text-red-600">{error instanceof Error ? error.message : "Error desconocido"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-4 py-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Convencional</p>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Lista de precios</h1>
            <p className="mt-2 text-sm text-gray-500">Descarga la plantilla con versiones vigentes, completa los precios en Excel y vuelve a importarla para actualizar la valorizacion.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  importMutation.mutate(file);
                }
                event.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => exportMutation.mutate()}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50"
            >
              <Download size={16} />
              Descargar Excel
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50"
            >
              <Upload size={16} />
              Importar Excel
            </button>
            <Link
              to={paths.convencional.stockValorizacion}
              className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-900"
            >
              Volver a valorizacion
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Versiones</p>
          <p className="mt-3 text-4xl font-semibold tracking-tight text-gray-900">{summary.versiones}</p>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Con precio</p>
          <p className="mt-3 text-4xl font-semibold tracking-tight text-gray-900">{summary.conPrecio}</p>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Sin precio</p>
          <p className="mt-3 text-4xl font-semibold tracking-tight text-gray-900">{summary.sinPrecio}</p>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Unidades</p>
          <p className="mt-3 text-4xl font-semibold tracking-tight text-gray-900">{summary.unidades}</p>
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold tracking-tight text-gray-900">Versiones en stock</h2>
          <p className="mt-1 text-sm text-gray-500">Se muestra un unico registro por version detectada en disponible, reservado o guardado.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Version</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Modelo</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Unidades</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Valor actual</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Nuevo valor</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Accion</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => {
                const draftValue = draftValues[row.version] ?? (row.valor !== null ? String(row.valor) : "");
                const isSaving = saveMutation.isPending && saveMutation.variables?.version === row.version;

                return (
                  <tr key={`${row.modelo}-${row.version}`} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{row.version}</td>
                    <td className="px-4 py-3 text-gray-700">{row.modelo}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{row.cantidadUnidades}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={[
                          "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                          row.tienePrecio ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800",
                        ].join(" ")}
                      >
                        {row.tienePrecio ? "Con precio" : "Sin precio"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">{formatMoney(row.valor)}</td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={draftValue}
                        onChange={(event) =>
                          setDraftValues((current) => ({
                            ...current,
                            [row.version]: event.target.value,
                          }))
                        }
                        className="w-full min-w-[160px] rounded-xl border border-gray-300 px-3 py-2 text-right text-sm text-gray-900 outline-none transition-colors focus:border-gray-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => {
                          const parsedValue = Number(draftValue);

                          if (!Number.isFinite(parsedValue) || parsedValue < 0) {
                            toast.error("Ingresa un valor valido mayor o igual a 0");
                            return;
                          }

                          saveMutation.mutate({
                            version: row.version,
                            modelo: row.modelo,
                            valor: parsedValue,
                          });
                        }}
                        className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSaving ? "Guardando..." : "Guardar"}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">
                    No hay versiones de stock disponibles para cargar precios.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
