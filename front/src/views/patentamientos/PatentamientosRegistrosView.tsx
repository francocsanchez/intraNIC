import Loading from "@/components/Loading";
import {
  getPatentamientosImportStatus,
  runPatentamientosImport,
} from "@/services/patentamientosImportService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, CircleAlert, CircleCheckBig, FileSpreadsheet, RefreshCcw } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, string> = {
  success: "Exitosa",
  partial: "Parcial",
  failed: "Fallida",
  skipped: "Sin archivo",
};

const STATUS_STYLES: Record<string, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  partial: "border-amber-200 bg-amber-50 text-amber-700",
  failed: "border-red-200 bg-red-50 text-red-700",
  skipped: "border-slate-200 bg-slate-50 text-slate-700",
};

const formatDateTime = (value: string | null) => {
  if (!value) {
    return "Todavia no disponible";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Fecha invalida";
  }

  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const formatDuration = (durationMs: number | null) => {
  if (!durationMs || durationMs < 0) {
    return "Sin datos";
  }

  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
};

const formatInteger = (value: number) => value.toLocaleString("es-AR");

export default function PatentamientosRegistrosView() {
  const queryClient = useQueryClient();

  const statusQuery = useQuery({
    queryKey: ["patentamientos-import", "status"],
    queryFn: getPatentamientosImportStatus,
    refetchInterval: (query) => (query.state.data?.isRunning ? 5000 : false),
  });

  const runImportMutation = useMutation({
    mutationFn: runPatentamientosImport,
    onMutate: () => {
      toast.loading("Ejecutando actualizacion de registros...", { id: "patentamientos-import-run" });
    },
    onSuccess: async (result) => {
      toast.success(result.message, { id: "patentamientos-import-run" });
      await queryClient.invalidateQueries({ queryKey: ["patentamientos-import"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No se pudo ejecutar la actualizacion", {
        id: "patentamientos-import-run",
      });
    },
  });

  useEffect(() => {
    if (statusQuery.error instanceof Error) {
      toast.error(statusQuery.error.message);
    }
  }, [statusQuery.error]);

  if (statusQuery.isLoading) {
    return <Loading />;
  }

  if (statusQuery.error instanceof Error) {
    return (
      <div className="w-full px-1 py-1">
        <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900">Error al cargar Registros</h1>
          <p className="mt-2 text-sm text-red-600">{statusQuery.error.message}</p>
        </section>
      </div>
    );
  }

  if (!statusQuery.data) {
    return null;
  }

  const status = statusQuery.data;
  const statusKey = status.lastStatus ?? "skipped";
  const statusLabel = status.lastStatus ? STATUS_LABELS[status.lastStatus] : "Sin ejecuciones";
  const statusStyle = status.lastStatus ? STATUS_STYLES[status.lastStatus] : STATUS_STYLES.skipped;

  return (
    <div className="w-full space-y-6 px-1 py-1">
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#128c80]/20 bg-[#128c80]/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#128c80]">
              <FileSpreadsheet size={14} />
              Analisis / Registros
            </div>

            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-gray-900">Actualizacion de registros</h1>
          
          </div>

          <button
            type="button"
            onClick={() => runImportMutation.mutate()}
            disabled={runImportMutation.isPending || status.isRunning}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw size={16} className={runImportMutation.isPending || status.isRunning ? "animate-spin" : ""} />
            {runImportMutation.isPending || status.isRunning ? "Actualizando..." : "Actualizar registros"}
          </button>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-gray-900">
            <CalendarClock size={18} className="text-[#128c80]" />
            <h2 className="text-lg font-semibold tracking-tight">Ultima actualizacion</h2>
          </div>

          <p className="mt-4 text-2xl font-semibold tracking-tight text-gray-900">
            {formatDateTime(status.lastSuccessfulExecutionAt)}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Se muestra la ultima ejecucion completada con estado exitoso o parcial.
          </p>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-gray-900">
            {statusKey === "failed" ? (
              <CircleAlert size={18} className="text-red-500" />
            ) : (
              <CircleCheckBig size={18} className="text-[#128c80]" />
            )}
            <h2 className="text-lg font-semibold tracking-tight">Estado de la ultima ejecucion</h2>
          </div>

          <div className={`mt-4 inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${statusStyle}`}>
            {statusLabel}
          </div>

          <div className="mt-4 space-y-2 text-sm text-gray-600">
            <p>
              <span className="font-medium text-gray-900">Ultima ejecucion:</span> {formatDateTime(status.lastExecutionAt)}
            </p>
            <p>
              <span className="font-medium text-gray-900">Archivo:</span> {status.lastFileName ?? "Sin archivo"}
            </p>
            <p>
              <span className="font-medium text-gray-900">Duracion:</span> {formatDuration(status.durationMs)}
            </p>
          </div>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Leidos</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-gray-900">{status.totalRead}</p>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Insertados</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-emerald-700">{status.inserted}</p>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Actualizados</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-sky-700">{status.updated}</p>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Descartados</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-amber-700">{status.discarded}</p>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Con error</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-red-700">{status.errored}</p>
        </article>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight text-gray-900">Resumen operativo</h2>
        <p className="mt-3 text-sm leading-6 text-gray-600">{status.message}</p>

        {status.isRunning ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            Hay una importacion en curso. El estado se actualiza automaticamente.
          </div>
        ) : null}

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-collapse text-xs">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="border border-gray-200 px-3 py-2 text-left font-semibold">Fecha de procesado</th>
                <th className="border border-gray-200 px-3 py-2 text-left font-semibold">Nombre del archivo procesado</th>
                <th className="border border-gray-200 px-3 py-2 text-right font-semibold">Cant. leidos</th>
                <th className="border border-gray-200 px-3 py-2 text-right font-semibold">Insertados</th>
                <th className="border border-gray-200 px-3 py-2 text-right font-semibold">Actualizados</th>
                <th className="border border-gray-200 px-3 py-2 text-right font-semibold">Descartados</th>
                <th className="border border-gray-200 px-3 py-2 text-right font-semibold">Con error</th>
              </tr>
            </thead>
            <tbody>
              {status.executionHistory.length ? (
                status.executionHistory.map((execution, index) => (
                  <tr key={`${execution.processedAt ?? "sin-fecha"}-${execution.fileName ?? "sin-archivo"}-${index}`} className={index % 2 === 0 ? "bg-white" : "bg-[#fafafa]"}>
                    <td className="border border-gray-200 px-3 py-2 text-left text-gray-700">{formatDateTime(execution.processedAt)}</td>
                    <td className="border border-gray-200 px-3 py-2 text-left text-gray-700">{execution.fileName ?? "Sin archivo"}</td>
                    <td className="border border-gray-200 px-3 py-2 text-right text-gray-700">{formatInteger(execution.totalRead)}</td>
                    <td className="border border-gray-200 px-3 py-2 text-right text-emerald-700">{formatInteger(execution.inserted)}</td>
                    <td className="border border-gray-200 px-3 py-2 text-right text-sky-700">{formatInteger(execution.updated)}</td>
                    <td className="border border-gray-200 px-3 py-2 text-right text-amber-700">{formatInteger(execution.discarded)}</td>
                    <td className="border border-gray-200 px-3 py-2 text-right text-red-700">{formatInteger(execution.errored)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="border border-gray-200 px-3 py-6 text-center text-sm text-gray-500">
                    Todavia no hay ejecuciones registradas.
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
