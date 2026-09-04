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

  const rows = useMemo(() => data?.data ?? [], [data?.data]);

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
      <div className="font-preset w-full space-y-3 bg-muted px-2 py-3">
        <section className="rounded-lg border border-border bg-card p-3 shadow-sm">
          <div className="h-7 w-72 animate-pulse rounded-md bg-muted" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded-md bg-muted" />
        </section>

        <section className="grid grid-cols-2 gap-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <article key={index} className="rounded-lg border border-border bg-card p-3 shadow-sm">
              <div className="h-3 w-20 animate-pulse rounded-md bg-muted" />
              <div className="mt-2 h-8 w-16 animate-pulse rounded-md bg-muted" />
            </article>
          ))}
        </section>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="font-preset w-full bg-muted px-2 py-3">
        <div className="rounded-lg border border-destructive/30 bg-card p-3 shadow-sm">
          <h2 className="text-base font-semibold text-card-foreground">Error al cargar la lista de precios</h2>
          <p className="mt-1 text-sm text-destructive">{error instanceof Error ? error.message : "Error desconocido"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="font-preset w-full space-y-3 bg-muted px-2 py-3">
      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="p-3">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Convencional</p>
            <h1 className="text-xl font-semibold tracking-tight text-card-foreground">Lista de precios</h1>
            <p className="mt-1 text-sm text-muted-foreground">Descarga la plantilla con versiones vigentes, completa los precios en Excel y vuelve a importarla para actualizar la valorizacion.</p>
          </div>

          <div className="flex flex-wrap gap-2 p-3 pt-0 md:pt-3">
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
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              <Download size={16} />
              Descargar Excel
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              <Upload size={16} />
              Importar Excel
            </button>
            <Link
              to={paths.convencional.stockValorizacion}
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Volver a valorizacion
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 border-t border-border sm:grid-cols-4">
          {[
            ["Versiones", summary.versiones],
            ["Con precio", summary.conPrecio],
            ["Sin precio", summary.sinPrecio],
            ["Unidades", summary.unidades],
          ].map(([label, value]) => (
            <div key={label} className="border-b border-r border-border px-3 py-2 last:border-r-0 sm:border-b-0">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
              <p className="mt-1 text-lg font-semibold tracking-tight text-card-foreground">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="border-b border-border px-3 py-2">
          <h2 className="text-sm font-semibold text-card-foreground">Versiones en stock</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Se muestra un unico registro por version detectada en disponible, reservado o guardado.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-border bg-muted">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Version</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Modelo</th>
                <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Unidades</th>
                <th className="px-3 py-2 text-center text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Estado</th>
                <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Valor actual</th>
                <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Nuevo valor</th>
                <th className="px-3 py-2 text-center text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Accion</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => {
                const draftValue = draftValues[row.version] ?? (row.valor !== null ? String(row.valor) : "");
                const isSaving = saveMutation.isPending && saveMutation.variables?.version === row.version;

                return (
                  <tr key={`${row.modelo}-${row.version}`} className="border-b border-border last:border-b-0 hover:bg-muted">
                    <td className="px-3 py-1.5 font-medium text-card-foreground">{row.version}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">{row.modelo}</td>
                    <td className="px-3 py-1.5 text-right text-muted-foreground">{row.cantidadUnidades}</td>
                    <td className="px-3 py-1.5 text-center">
                      <span
                        className={[
                          "inline-flex min-w-24 items-center justify-center rounded-md border border-border px-2 py-0.5 text-xs font-medium",
                          row.tienePrecio ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground",
                        ].join(" ")}
                      >
                        {row.tienePrecio ? "Con precio" : "Sin precio"}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-right font-medium text-card-foreground">{formatMoney(row.valor)}</td>
                    <td className="px-3 py-1.5">
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
                        className="h-8 w-full min-w-36 rounded-md border border-input bg-background px-2 text-right text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring"
                      />
                    </td>
                    <td className="px-3 py-1.5 text-center">
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
                        className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSaving ? "Guardando..." : "Guardar"}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-sm text-muted-foreground">
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
