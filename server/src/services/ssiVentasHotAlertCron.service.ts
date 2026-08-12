import SsiVentasAttempt from "../models/SsiVentasAttempt";
import SsiVentasCase from "../models/SsiVentasCase";
import SsiVentasHotAlertConfig from "../models/SsiVentasHotAlertConfig";
import { ImportExecutionLoggerService } from "./imports/importExecutionLogger.service";
import type { JobExecutionResult, JobMonitorTrigger } from "./jobs/jobMonitor.types";
import { sendMail } from "../utils/mail";
import { logError } from "../utils/logError";

const JOB_KEY = "ssi-ventas-hot-alert-envio";
const JOB_NAME = "ssi-ventas-hot-alert-envio";
const JOB_SCHEDULE_LABEL = "Todos los dias a las 20:00";
const JOB_TIMEZONE = "America/Argentina/Buenos_Aires";
const JOB_OFFSET = "-03:00";

type HotAlertMailRow = {
  operacion: number;
  fechaEncuesta: Date;
  cliente: string;
  telefono: string;
  vendedor: string;
  sucursal: string;
  modelo: string;
  observaciones: string;
  administrativa: string;
  origen: "manual" | "centralTelefonica";
  respuestas: {
    instalacionesConcesionario: number | null;
    atencionVendedor: number | null;
    atencionAdministrativa: number | null;
    informacionFechaEntrega: number | null;
    atencionAsesorEntregas: number | null;
    recomendariaConcesionario: number | null;
    usadoPartePago: string;
    financiacionCompra: string;
    seguroVehiculo: string;
    accesoriosVehiculo: string;
    aplicacionToyota: string;
    toyotaServiciosConectados: string;
  };
};

export class SsiVentasHotAlertAlreadyRunningError extends Error {}

let isRunning = false;

const getZonedDateParts = (date: Date) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: JOB_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const [year, month, day] = formatter.format(date).split("-");
  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
  };
};

const getZonedNowDateKey = () => {
  const { year, month, day } = getZonedDateParts(new Date());
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

const getZonedDateRange = (dateKey: string) => {
  const start = new Date(`${dateKey}T00:00:00${JOB_OFFSET}`);
  const end = new Date(`${dateKey}T23:59:59.999${JOB_OFFSET}`);
  return { start, end };
};

const formatMailDate = (date: Date) =>
  date.toLocaleDateString("es-AR", {
    timeZone: JOB_TIMEZONE,
  });

const formatMailDateTime = (date: Date) =>
  date.toLocaleString("es-AR", {
    timeZone: JOB_TIMEZONE,
    dateStyle: "short",
    timeStyle: "short",
  });

const formatBinaryAnswer = (value?: string | null) => {
  if (value === "si") {
    return "Si";
  }

  if (value === "no") {
    return "No";
  }

  if (value === "noSabe") {
    return "No sabe";
  }

  return "-";
};

const buildMailText = (dateKey: string, rows: HotAlertMailRow[]) => {
  const lines: string[] = [
    `Hot Alert SSI Ventas - ${formatMailDate(new Date(`${dateKey}T12:00:00${JOB_OFFSET}`))}`,
    "",
    `Total de casos: ${rows.length}`,
    "",
  ];

  rows.forEach((row, index) => {
    lines.push(
      `${index + 1}. OP ${row.operacion}`,
      `Fecha/Hora: ${formatMailDateTime(row.fechaEncuesta)}`,
      `Cliente: ${row.cliente || "-"}`,
      `Telefono: ${row.telefono || "-"}`,
      `Vendedor: ${row.vendedor || "-"}`,
      `Sucursal: ${row.sucursal || "-"}`,
      `Modelo: ${row.modelo || "-"}`,
      `ADM: ${row.administrativa || "-"}`,
      `Origen: ${row.origen === "centralTelefonica" ? "Central telefonica" : "Manual"}`,
      "Calificaciones:",
      `- Instalaciones del concesionario: ${row.respuestas.instalacionesConcesionario ?? "-"}`,
      `- Atencion del vendedor/a: ${row.respuestas.atencionVendedor ?? "-"}`,
      `- Atencion administrativa: ${row.respuestas.atencionAdministrativa ?? "-"}`,
      `- Informacion sobre la fecha de entrega: ${row.respuestas.informacionFechaEntrega ?? "-"}`,
      `- Atencion del asesor/a de entregas: ${row.respuestas.atencionAsesorEntregas ?? "-"}`,
      `- Probabilidad de recomendar el concesionario: ${row.respuestas.recomendariaConcesionario ?? "-"}`,
      "Respuestas complementarias:",
      `- Usado como parte de pago: ${row.respuestas.usadoPartePago}`,
      `- Financiacion de la compra: ${row.respuestas.financiacionCompra}`,
      `- Seguro para el vehiculo: ${row.respuestas.seguroVehiculo}`,
      `- Accesorios para el vehiculo: ${row.respuestas.accesoriosVehiculo}`,
      `- Aplicacion Toyota: ${row.respuestas.aplicacionToyota}`,
      `- Toyota Servicios Conectados: ${row.respuestas.toyotaServiciosConectados}`,
      `Observaciones: ${row.observaciones || "-"}`,
      "",
    );
  });

  return lines.join("\n");
};

export const getSsiVentasHotAlertJobKey = () => JOB_KEY;
export const getSsiVentasHotAlertJobName = () => JOB_NAME;
export const getSsiVentasHotAlertScheduleLabel = () => JOB_SCHEDULE_LABEL;
export const isSsiVentasHotAlertJobRunning = () => isRunning;
export const runSsiVentasHotAlertCron = async () => runSsiVentasHotAlertJob("cron");

export const runSsiVentasHotAlertJob = async (
  trigger: JobMonitorTrigger,
): Promise<JobExecutionResult> => {
  if (isRunning) {
    throw new SsiVentasHotAlertAlreadyRunningError("Ya hay una ejecucion de Hot Alert en curso");
  }

  isRunning = true;
  const startedAt = new Date();
  const dateKey = getZonedNowDateKey();
  const { start, end } = getZonedDateRange(dateKey);
  const log = await ImportExecutionLoggerService.startExecution({
    jobKey: JOB_KEY,
    jobName: JOB_NAME,
    sourceType: "internal",
    trigger,
    scheduleLabel: JOB_SCHEDULE_LABEL,
    sourcePath: "SsiVentasHotAlert",
    message: `Iniciando envio diario de Hot Alert para ${dateKey}`,
  });

  try {
    const config = await SsiVentasHotAlertConfig.findOne({}).lean();
    const emails = Array.isArray(config?.emails)
      ? config.emails.map((email) => String(email ?? "").trim().toLowerCase()).filter(Boolean)
      : [];
    const isActive = config ? Boolean(config.activo) : true;

    if (!isActive) {
      const message = "Configuracion de Hot Alert inactiva";
      await ImportExecutionLoggerService.finishExecution(String(log._id), {
        status: "success",
        message,
        discarded: 1,
        metrics: {
          configuracionActiva: 0,
          destinatarios: emails.length,
          hotAlertsEncontrados: 0,
          emailsEnviados: 0,
        },
        sourceSummary: {
          title: "Recibido",
          lines: [`Fecha: ${dateKey}`],
        },
        resultSummary: {
          title: "Resultado",
          lines: [message],
        },
        responseSample: [{ motivo: "configuracion_inactiva" }],
      });

      const finishedAt = new Date();
      return {
        status: "success",
        fileName: null,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        message,
        errorSummary: [],
        metrics: {
          configuracionActiva: 0,
          destinatarios: emails.length,
          hotAlertsEncontrados: 0,
          emailsEnviados: 0,
        },
        sourceSummary: {
          title: "Recibido",
          lines: [`Fecha: ${dateKey}`],
        },
        resultSummary: {
          title: "Resultado",
          lines: [message],
        },
        requestSample: [],
        responseSample: [{ motivo: "configuracion_inactiva" }],
      };
    }

    if (!emails.length) {
      const message = "No hay destinatarios configurados para Hot Alert";
      await ImportExecutionLoggerService.finishExecution(String(log._id), {
        status: "success",
        message,
        discarded: 1,
        metrics: {
          configuracionActiva: 1,
          destinatarios: 0,
          hotAlertsEncontrados: 0,
          emailsEnviados: 0,
        },
        sourceSummary: {
          title: "Recibido",
          lines: [`Fecha: ${dateKey}`],
        },
        resultSummary: {
          title: "Resultado",
          lines: [message],
        },
        responseSample: [{ motivo: "sin_destinatarios" }],
      });

      const finishedAt = new Date();
      return {
        status: "success",
        fileName: null,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        message,
        errorSummary: [],
        metrics: {
          configuracionActiva: 1,
          destinatarios: 0,
          hotAlertsEncontrados: 0,
          emailsEnviados: 0,
        },
        sourceSummary: {
          title: "Recibido",
          lines: [`Fecha: ${dateKey}`],
        },
        resultSummary: {
          title: "Resultado",
          lines: [message],
        },
        requestSample: [],
        responseSample: [{ motivo: "sin_destinatarios" }],
      };
    }

    const attempts = await SsiVentasAttempt.find({
      result: "respondio",
      "surveyData.hotAlert": true,
      createdAt: { $gte: start, $lte: end },
    })
      .sort({ createdAt: 1, operacion: 1 })
      .lean();

    if (!attempts.length) {
      const message = "No hay Hot Alert para enviar en la fecha seleccionada";
      await ImportExecutionLoggerService.finishExecution(String(log._id), {
        status: "success",
        message,
        totalRead: 0,
        discarded: 1,
        metrics: {
          configuracionActiva: 1,
          destinatarios: emails.length,
          hotAlertsEncontrados: 0,
          emailsEnviados: 0,
        },
        sourceSummary: {
          title: "Recibido",
          lines: [`Fecha: ${dateKey}`, `Destinatarios: ${emails.length}`],
        },
        resultSummary: {
          title: "Resultado",
          lines: [message],
        },
        responseSample: [{ motivo: "sin_hot_alert" }],
      });

      const finishedAt = new Date();
      return {
        status: "success",
        fileName: null,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        message,
        errorSummary: [],
        metrics: {
          configuracionActiva: 1,
          destinatarios: emails.length,
          hotAlertsEncontrados: 0,
          emailsEnviados: 0,
        },
        sourceSummary: {
          title: "Recibido",
          lines: [`Fecha: ${dateKey}`, `Destinatarios: ${emails.length}`],
        },
        resultSummary: {
          title: "Resultado",
          lines: [message],
        },
        requestSample: [],
        responseSample: [{ motivo: "sin_hot_alert" }],
      };
    }

    const operaciones = attempts.map((attempt) => Number(attempt.operacion));
    const cases = await SsiVentasCase.find({ operacion: { $in: operaciones } }).lean();
    const caseByOperacion = new Map(cases.map((item) => [Number(item.operacion), item]));

    const rows: HotAlertMailRow[] = attempts.map((attempt) => {
      const relatedCase = caseByOperacion.get(Number(attempt.operacion));

      return {
        operacion: Number(attempt.operacion),
        fechaEncuesta: new Date(attempt.createdAt),
        cliente: relatedCase?.cliente ?? "",
        telefono: relatedCase?.telefonoCliente ?? "",
        vendedor: relatedCase?.vendedor ?? "",
        sucursal: relatedCase?.sucursal ?? "",
        modelo: relatedCase?.modelo ?? "",
        observaciones: attempt.observaciones?.trim() || attempt.surveyData?.observaciones?.trim() || "",
        administrativa: relatedCase?.administrativaNombre ?? "",
        origen: attempt.centralTelefonica ? "centralTelefonica" : "manual",
        respuestas: {
          instalacionesConcesionario: attempt.surveyData?.numeric?.instalacionesConcesionario ?? null,
          atencionVendedor: attempt.surveyData?.numeric?.atencionVendedor ?? null,
          atencionAdministrativa: attempt.surveyData?.numeric?.atencionAdministrativa ?? null,
          informacionFechaEntrega: attempt.surveyData?.numeric?.informacionFechaEntrega ?? null,
          atencionAsesorEntregas: attempt.surveyData?.numeric?.atencionAsesorEntregas ?? null,
          recomendariaConcesionario: attempt.surveyData?.numeric?.recomendariaConcesionario ?? null,
          usadoPartePago: formatBinaryAnswer(attempt.surveyData?.binary?.usadoPartePago),
          financiacionCompra: formatBinaryAnswer(attempt.surveyData?.binary?.financiacionCompra),
          seguroVehiculo: formatBinaryAnswer(attempt.surveyData?.binary?.seguroVehiculo),
          accesoriosVehiculo: formatBinaryAnswer(attempt.surveyData?.binary?.accesoriosVehiculo),
          aplicacionToyota: formatBinaryAnswer(attempt.surveyData?.binary?.aplicacionToyota),
          toyotaServiciosConectados: formatBinaryAnswer(
            attempt.surveyData?.binary?.toyotaServiciosConectados,
          ),
        },
      };
    });

    await sendMail({
      to: emails,
      subject: `Hot Alert SSI Ventas - ${formatMailDate(new Date(`${dateKey}T12:00:00${JOB_OFFSET}`))}`,
      text: buildMailText(dateKey, rows),
    });

    const message = `Proceso finalizado: 1 correo enviado con ${rows.length} Hot Alert`;
    const finishedAt = new Date();

    await ImportExecutionLoggerService.finishExecution(String(log._id), {
      status: "success",
      message,
      totalRead: rows.length,
      inserted: 1,
      metrics: {
        configuracionActiva: 1,
        destinatarios: emails.length,
        hotAlertsEncontrados: rows.length,
        emailsEnviados: 1,
      },
      sourceSummary: {
        title: "Recibido",
        lines: [`Fecha: ${dateKey}`, `Destinatarios: ${emails.length}`],
      },
      resultSummary: {
        title: "Resultado",
        lines: [`Hot Alert encontrados: ${rows.length}`, "Emails enviados: 1"],
      },
      requestSample: emails.slice(0, 10).map((email) => ({ email })),
      responseSample: rows.slice(0, 10).map((row) => ({
        operacion: row.operacion,
        cliente: row.cliente,
        origen: row.origen,
      })),
    });

    return {
      status: "success",
      fileName: null,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      message,
      errorSummary: [],
      metrics: {
        configuracionActiva: 1,
        destinatarios: emails.length,
        hotAlertsEncontrados: rows.length,
        emailsEnviados: 1,
      },
      sourceSummary: {
        title: "Recibido",
        lines: [`Fecha: ${dateKey}`, `Destinatarios: ${emails.length}`],
      },
      resultSummary: {
        title: "Resultado",
        lines: [`Hot Alert encontrados: ${rows.length}`, "Emails enviados: 1"],
      },
      requestSample: emails.slice(0, 10).map((email) => ({ email })),
      responseSample: rows.slice(0, 10).map((row) => ({
        operacion: row.operacion,
        cliente: row.cliente,
        origen: row.origen,
      })),
    };
  } catch (error) {
    logError("ssiVentasHotAlertCron.run");
    console.error(error);
    const message = error instanceof Error ? error.message : "No se pudo ejecutar el envio de Hot Alert";

    await ImportExecutionLoggerService.finishExecution(String(log._id), {
      status: "failed",
      message,
      errorSummary: [message],
      sourceSummary: {
        title: "Recibido",
        lines: [`Fecha: ${dateKey}`],
      },
      resultSummary: {
        title: "Resultado",
        lines: [message],
      },
      responseSample: [{ message }],
    });

    throw error;
  } finally {
    isRunning = false;
  }
};
