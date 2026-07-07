import Loading from "@/components/Loading";
import { getJobMonitorDetail, getJobsMonitor, runJobMonitor, type JobMonitorDetail } from "@/services/jobsMonitorService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Play, RefreshCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const LOGS_PAGE_SIZE = 30;
const EXPECTED_CONTROL_JOBS: Array<Pick<ControlRow, "jobKey" | "title" | "scheduleLabel" | "canRun">> = [
  {
    jobKey: "patentamientos-import",
    title: "Importacion de patentamientos",
    scheduleLabel: "Todos los dias a las 02:00",
    canRun: true,
  },
  {
    jobKey: "transferencias-import",
    title: "Importacion de transferencias",
    scheduleLabel: "Todos los dias a las 03:00",
    canRun: true,
  },
  {
    jobKey: "unidades-dealers-sync",
    title: "Sincronizacion unidades dealers",
    scheduleLabel: "Todos los dias a las 01:00",
    canRun: true,
  },
  {
    jobKey: "facturas-anticipo",
    title: "Facturas anticipo",
    scheduleLabel: "Todos los dias a las 21:00",
    canRun: true,
  },
];

const STATUS_LABELS: Record<string, string> = {
  success: "Exitosa",
  partial: "Parcial",
  failed: "Fallida",
  skipped: "Sin novedades",
};

const STATUS_STYLES: Record<string, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  partial: "border-amber-200 bg-amber-50 text-amber-700",
  failed: "border-red-200 bg-red-50 text-red-700",
  skipped: "border-slate-200 bg-slate-50 text-slate-700",
  running: "border-sky-200 bg-sky-50 text-sky-700",
};

const formatDateTime = (value: string | null) => {
  if (!value) {
    return "Sin ejecucion";
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

const getStatusInfo = (item: { isRunning: boolean; lastStatus: string | null }) => {
  if (item.isRunning) {
    return {
      label: "En ejecucion",
      style: STATUS_STYLES.running,
    };
  }

  if (!item.lastStatus) {
    return {
      label: "Sin ejecuciones",
      style: STATUS_STYLES.skipped,
    };
  }

  return {
    label: STATUS_LABELS[item.lastStatus] ?? item.lastStatus,
    style: STATUS_STYLES[item.lastStatus] ?? STATUS_STYLES.skipped,
  };
};

const joinLines = (detail: JobMonitorDetail["sourceSummary"] | JobMonitorDetail["resultSummary"], fallback: string) =>
  detail?.lines?.length ? detail.lines.join(" | ") : fallback;

const buildResultText = (detail: JobMonitorDetail) => {
  if (detail.responseSample.length) {
    return detail.responseSample
      .slice(0, 2)
      .map((item) =>
        Object.entries(item)
          .slice(0, 3)
          .map((entry) => `${entry[0]}: ${String(entry[1] ?? "-")}`)
          .join(", "),
      )
      .join(" | ");
  }

  return joinLines(detail.resultSummary, detail.message);
};

const buildAlertText = (detail: JobMonitorDetail) => {
  if (!detail.errorSummary.length) {
    return "-";
  }

  return detail.errorSummary.slice(0, 2).join(" | ");
};

type ControlRow = {
  jobKey: string;
  title: string;
  scheduleLabel: string;
  canRun: boolean;
  lastExecutionAt: string | null;
  isRunning: boolean;
  lastStatus: string | null;
};

type LogRow = {
  id: string;
  jobKey: string;
  title: string;
  processedAt: string;
  result: string;
  alerts: string;
  status: string | null;
  isRunning: boolean;
};

const JobsControlTable = ({
  rows,
  activeJobKey,
  onRun,
}: {
  rows: ControlRow[];
  activeJobKey: string | undefined;
  onRun: (jobKey: string) => void;
}) => (
  <div className="overflow-x-auto">
    <table className="min-w-full border-collapse text-sm">
      <thead className="bg-gray-100 text-gray-700">
        <tr>
          <th className="border border-gray-200 px-2 py-2 text-left font-semibold">Cron</th>
          <th className="border border-gray-200 px-2 py-2 text-left font-semibold">Fecha</th>
          <th className="border border-gray-200 px-2 py-2 text-left font-semibold">Estado</th>
          <th className="border border-gray-200 px-2 py-2 text-left font-semibold">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => {
          const status = getStatusInfo(row);
          const isMutating = activeJobKey === row.jobKey;

          return (
            <tr key={row.jobKey} className={index % 2 === 0 ? "bg-white" : "bg-[#fafafa]"}>
              <td className="border border-gray-200 px-2 py-2 align-top text-gray-900">
                <div className="font-semibold">{row.title}</div>
                <div className="mt-0.5 text-xs text-gray-500">{row.scheduleLabel}</div>
              </td>
              <td className="border border-gray-200 px-2 py-2 align-top text-gray-700">{formatDateTime(row.lastExecutionAt)}</td>
              <td className="border border-gray-200 px-2 py-2 align-top">
                <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${status.style}`}>
                  {status.label}
                </span>
              </td>
              <td className="border border-gray-200 px-2 py-2 align-top">
                {row.canRun ? (
                  <button
                    type="button"
                    onClick={() => onRun(row.jobKey)}
                    disabled={row.isRunning || isMutating}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Play size={14} />
                    {row.isRunning || isMutating ? "Ejecutando..." : "Ejecutar"}
                  </button>
                ) : (
                  <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600">
                    Evento
                  </span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

const JobsLogTable = ({
  rows,
  page,
  totalPages,
  onPrevPage,
  onNextPage,
}: {
  rows: LogRow[];
  page: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
}) => (
  <div className="overflow-x-auto">
    <table className="min-w-full border-collapse text-xs">
      <thead className="bg-gray-100 text-gray-700">
        <tr>
          <th className="border border-gray-200 px-2 py-1.5 text-left font-semibold">Fecha de procesado</th>
          <th className="border border-gray-200 px-2 py-1.5 text-left font-semibold">Cron</th>
          <th className="border border-gray-200 px-2 py-1.5 text-left font-semibold">Resultado</th>
          <th className="border border-gray-200 px-2 py-1.5 text-left font-semibold">Alertas</th>
          <th className="border border-gray-200 px-2 py-1.5 text-left font-semibold">Estado</th>
        </tr>
      </thead>
      <tbody>
        {rows.length ? (
          rows.map((row, index) => {
            const status = getStatusInfo({ isRunning: row.isRunning, lastStatus: row.status });

            return (
              <tr key={row.id} className={index % 2 === 0 ? "bg-white" : "bg-[#fafafa]"}>
                <td className="border border-gray-200 px-2 py-1.5 align-top text-gray-700">{formatDateTime(row.processedAt)}</td>
                <td className="border border-gray-200 px-2 py-1.5 align-top text-gray-900">{row.title}</td>
                <td className="border border-gray-200 px-2 py-1.5 align-top leading-5 text-gray-700">{row.result}</td>
                <td className="border border-gray-200 px-2 py-1.5 align-top leading-5 text-gray-700">{row.alerts}</td>
                <td className="border border-gray-200 px-2 py-1.5 align-top">
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${status.style}`}>
                    {status.label}
                  </span>
                </td>
              </tr>
            );
          })
        ) : (
          <tr>
            <td colSpan={5} className="border border-gray-200 px-2 py-6 text-center text-sm text-gray-500">
              Todavia no hay ejecuciones registradas.
            </td>
          </tr>
        )}
      </tbody>
    </table>

    {totalPages > 1 ? (
      <div className="mt-3 flex items-center justify-between gap-3 px-1 text-xs text-gray-600">
        <span>
          Pagina {page} de {totalPages}
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrevPage}
            disabled={page === 1}
            className="rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={onNextPage}
            disabled={page === totalPages}
            className="rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>
    ) : null}
  </div>
);

export default function PatentamientosRegistrosView() {
  const queryClient = useQueryClient();
  const [logsPage, setLogsPage] = useState(1);

  const jobsQuery = useQuery({
    queryKey: ["jobs-monitor"],
    queryFn: getJobsMonitor,
    refetchInterval: (query) => (query.state.data?.some((job) => job.isRunning) ? 5000 : false),
  });

  const detailsQuery = useQuery({
    queryKey: ["jobs-monitor", "details"],
    queryFn: async () => Promise.all((jobsQuery.data ?? []).map((job) => getJobMonitorDetail(job.jobKey))),
    enabled: Boolean(jobsQuery.data),
    refetchInterval: () => (jobsQuery.data?.some((job) => job.isRunning) ? 5000 : false),
  });

  const runJobMutation = useMutation({
    mutationFn: runJobMonitor,
    onMutate: (jobKey) => {
      const jobTitle = jobsQuery.data?.find((job) => job.jobKey === jobKey)?.title ?? "cron";
      toast.loading(`Ejecutando ${jobTitle.toLowerCase()}...`, { id: `job-run-${jobKey}` });
    },
    onSuccess: async (result, jobKey) => {
      toast.success(result.message, { id: `job-run-${jobKey}` });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["jobs-monitor"] }),
        queryClient.invalidateQueries({ queryKey: ["jobs-monitor", "details"] }),
      ]);
    },
    onError: (error, jobKey) => {
      toast.error(error instanceof Error ? error.message : "No se pudo ejecutar el cron", {
        id: `job-run-${jobKey}`,
      });
    },
  });

  useEffect(() => {
    if (jobsQuery.error instanceof Error) {
      toast.error(jobsQuery.error.message);
    }
  }, [jobsQuery.error]);

  useEffect(() => {
    if (detailsQuery.error instanceof Error) {
      toast.error(detailsQuery.error.message);
    }
  }, [detailsQuery.error]);

  const details = detailsQuery.data ?? [];

  const controlRows = useMemo<ControlRow[]>(
    () => {
      const rowsFromDetails = details.map((detail) => ({
        jobKey: detail.jobKey,
        title: detail.title,
        scheduleLabel: detail.scheduleLabel,
        canRun: detail.canRun ?? true,
        lastExecutionAt: detail.lastExecutionAt,
        isRunning: detail.isRunning,
        lastStatus: detail.lastStatus,
      }));

      const existingKeys = new Set(rowsFromDetails.map((row) => row.jobKey));
      const missingExpectedRows = EXPECTED_CONTROL_JOBS
        .filter((job) => !existingKeys.has(job.jobKey))
        .map((job) => ({
          jobKey: job.jobKey,
          title: job.title,
          scheduleLabel: job.scheduleLabel,
          canRun: job.canRun,
          lastExecutionAt: null,
          isRunning: false,
          lastStatus: null,
        }));

      return [...rowsFromDetails, ...missingExpectedRows];
    },
    [details],
  );

  const logRows = useMemo<LogRow[]>(
    () =>
      details
        .flatMap((detail) =>
          detail.executionHistory.map((execution) => ({
            id: `${detail.jobKey}-${execution.id}`,
            jobKey: detail.jobKey,
            title: detail.title,
            processedAt: execution.finishedAt ?? execution.startedAt,
            result: execution.message || buildResultText(detail),
            alerts: buildAlertText(detail),
            status: execution.status === "running" ? null : execution.status,
            isRunning: execution.status === "running",
          })),
        )
        .sort((a, b) => new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime()),
    [details],
  );

  const totalLogPages = Math.max(1, Math.ceil(logRows.length / LOGS_PAGE_SIZE));
  const safeLogsPage = Math.min(logsPage, totalLogPages);
  const paginatedLogRows = useMemo(
    () => logRows.slice((safeLogsPage - 1) * LOGS_PAGE_SIZE, safeLogsPage * LOGS_PAGE_SIZE),
    [logRows, safeLogsPage],
  );

  useEffect(() => {
    if (logsPage !== safeLogsPage) {
      setLogsPage(safeLogsPage);
    }
  }, [logsPage, safeLogsPage]);

  if (jobsQuery.isLoading || detailsQuery.isLoading) {
    return <Loading />;
  }

  if (jobsQuery.error instanceof Error) {
    return (
      <div className="w-full px-1 py-1">
        <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900">Error al cargar el control de cronos</h1>
          <p className="mt-2 text-sm text-red-600">{jobsQuery.error.message}</p>
        </section>
      </div>
    );
  }

  if (detailsQuery.error instanceof Error) {
    return (
      <div className="w-full px-1 py-1">
        <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900">Error al cargar el detalle de cronos</h1>
          <p className="mt-2 text-sm text-red-600">{detailsQuery.error.message}</p>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3 px-1 py-1">
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-gray-900">Control de cronos</h1>
            <p className="mt-1 text-sm text-gray-600">
              Vista simplificada con lo que recibe y lo que devuelve cada cron.
            </p>
          </div>

          {controlRows.some((row) => row.isRunning) ? (
            <div className="inline-flex items-center gap-2 text-sm font-medium text-sky-700">
              <RefreshCcw size={14} className="animate-spin" />
              Actualizando automaticamente
            </div>
          ) : null}
        </div>
      </section>

      <section className="mt-4">
        <JobsControlTable
          rows={controlRows}
          activeJobKey={runJobMutation.isPending ? runJobMutation.variables : undefined}
          onRun={(jobKey) => runJobMutation.mutate(jobKey)}
        />
      </section>

      <section className="mt-6 rounded-2xl border border-black-200 bg-white p-6 shadow-sm">
        <div className="mb-4 px-1 text-md font-semibold text-gray-900">Registro de acciones</div>
        <JobsLogTable
          rows={paginatedLogRows}
          page={safeLogsPage}
          totalPages={totalLogPages}
          onPrevPage={() => setLogsPage((current) => Math.max(1, current - 1))}
          onNextPage={() => setLogsPage((current) => Math.min(totalLogPages, current + 1))}
        />
      </section>
    </div>
  );
}
