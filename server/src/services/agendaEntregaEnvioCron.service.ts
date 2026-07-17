import AgendaEnvioConfig from "../models/AgendaEnvioConfig";
import SucursalEntrega from "../models/SucursalEntrega";
import { buildAgendaEntregaMailTemplate } from "../emails/templates/agendaEntrega.template";
import { ImportExecutionLoggerService } from "./imports/importExecutionLogger.service";
import type { JobExecutionResult, JobMonitorTrigger } from "./jobs/jobMonitor.types";
import { getAgendaEntregaDailyReport } from "./agendaEntregaReport.service";
import { sendMail } from "../utils/mail";
import { generateAgendaEntregaPdfBuffer } from "../utils/agendaEntregaPdf";
import { logError } from "../utils/logError";

const JOB_KEY = "agenda-entrega-envio";
const JOB_NAME = "agenda-entrega-envio";
const JOB_SCHEDULE_LABEL = "Todos los dias a las 20:00";
const JOB_TIMEZONE = "America/Argentina/Buenos_Aires";

export class AgendaEntregaEnvioAlreadyRunningError extends Error {}

let isRunning = false;

const getZonedNowDate = () => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: JOB_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(new Date());
};

export const getAgendaEntregaEnvioJobKey = () => JOB_KEY;
export const getAgendaEntregaEnvioJobName = () => JOB_NAME;
export const getAgendaEntregaEnvioScheduleLabel = () => JOB_SCHEDULE_LABEL;
export const isAgendaEntregaEnvioJobRunning = () => isRunning;

export const runAgendaEntregaEnvioCron = async () => runAgendaEntregaEnvioJob("cron");

export const runAgendaEntregaEnvioJob = async (
  trigger: JobMonitorTrigger,
): Promise<JobExecutionResult> => {
  if (isRunning) {
    throw new AgendaEntregaEnvioAlreadyRunningError("Ya hay una ejecucion de envio de agenda en curso");
  }

  isRunning = true;
  const startedAt = new Date();
  const fechaAgenda = getZonedNowDate();
  const log = await ImportExecutionLoggerService.startExecution({
    jobKey: JOB_KEY,
    jobName: JOB_NAME,
    sourceType: "internal",
    trigger,
    scheduleLabel: JOB_SCHEDULE_LABEL,
    sourcePath: "AgendaEntrega",
    message: `Iniciando envio automatico de agendas para ${fechaAgenda}`,
  });

  try {
    const [sucursales, configs] = await Promise.all([
      SucursalEntrega.find({ activa: true }).sort({ nombre: 1 }).lean(),
      AgendaEnvioConfig.find({ activo: true }).lean(),
    ]);

    const configBySucursalId = new Map(
      configs.map((config) => [String(config.sucursal), config]),
    );

    let sucursalesSinDestinatarios = 0;
    let sucursalesSinAgenda = 0;
    let pdfsGenerados = 0;
    let emailsEnviados = 0;
    let emailsFallidos = 0;
    const errorSummary: string[] = [];
    const responseSample: Array<Record<string, unknown>> = [];

    for (const sucursal of sucursales) {
      const config = configBySucursalId.get(String(sucursal._id));
      const emails = Array.isArray(config?.emails)
        ? config.emails
          .map((email) => String(email ?? "").trim().toLowerCase())
          .filter(Boolean)
        : [];

      if (!emails.length) {
        sucursalesSinDestinatarios += 1;
        responseSample.push({
          sucursal: sucursal.nombre,
          estado: "omitida",
          motivo: "sin_destinatarios",
        });
        continue;
      }

      const report = await getAgendaEntregaDailyReport(String(sucursal._id), fechaAgenda);

      if (!report || !report.items.length) {
        sucursalesSinAgenda += 1;
        responseSample.push({
          sucursal: sucursal.nombre,
          estado: "omitida",
          motivo: "sin_agenda",
        });
        continue;
      }

      try {
        const pdfBuffer = await generateAgendaEntregaPdfBuffer(report);
        pdfsGenerados += 1;

        await sendMail({
          to: emails,
          subject: `Agenda de entrega - ${report.sucursal.nombre} - ${fechaAgenda}`,
          html: buildAgendaEntregaMailTemplate({
            sucursal: report.sucursal.nombre,
            fecha: fechaAgenda,
            totalTurnos: report.items.length,
          }),
          attachments: [
            {
              filename: `agenda-entrega-${report.sucursal.nombre.toLowerCase().replace(/\s+/g, "-")}-${fechaAgenda}.pdf`,
              content: pdfBuffer,
              contentType: "application/pdf",
            },
          ],
        });

        emailsEnviados += 1;
        responseSample.push({
          sucursal: sucursal.nombre,
          estado: "enviado",
          destinatarios: emails.length,
          registros: report.items.length,
        });
      } catch (error) {
        emailsFallidos += 1;
        const message = error instanceof Error ? error.message : "No se pudo enviar el email";
        errorSummary.push(`${sucursal.nombre}: ${message}`);
        responseSample.push({
          sucursal: sucursal.nombre,
          estado: "fallido",
          error: message,
        });
        logError("agendaEntregaEnvioCron.sendMail");
        console.error(error);
      }
    }

    const finishedAt = new Date();
    const status = emailsFallidos > 0 ? "partial" : "success";
    const message =
      emailsEnviados > 0
        ? `Proceso finalizado: ${emailsEnviados} agendas enviadas`
        : "No hubo agendas para enviar";

    await ImportExecutionLoggerService.finishExecution(String(log._id), {
      status,
      message,
      totalRead: sucursales.length,
      inserted: emailsEnviados,
      discarded: sucursalesSinDestinatarios + sucursalesSinAgenda,
      errored: emailsFallidos,
      metrics: {
        sucursalesEvaluadas: sucursales.length,
        sucursalesSinDestinatarios,
        sucursalesSinAgenda,
        pdfsGenerados,
        emailsEnviados,
        emailsFallidos,
      },
      errorSummary,
      sourceSummary: {
        title: "Recibido",
        lines: [
          `Fecha agenda: ${fechaAgenda}`,
          `Sucursales activas: ${sucursales.length}`,
          `Configuraciones activas: ${configs.length}`,
        ],
      },
      resultSummary: {
        title: "Resultado",
        lines: [
          `Emails enviados: ${emailsEnviados}`,
          `Emails fallidos: ${emailsFallidos}`,
          `Sin destinatarios: ${sucursalesSinDestinatarios}`,
          `Sin agenda: ${sucursalesSinAgenda}`,
        ],
      },
      requestSample: sucursales.slice(0, 10).map((sucursal) => ({
        sucursal: sucursal.nombre,
        activa: sucursal.activa,
      })),
      responseSample: responseSample.slice(0, 10),
    });

    return {
      status,
      fileName: null,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      message,
      errorSummary,
      metrics: {
        sucursalesEvaluadas: sucursales.length,
        sucursalesSinDestinatarios,
        sucursalesSinAgenda,
        pdfsGenerados,
        emailsEnviados,
        emailsFallidos,
      },
      sourceSummary: {
        title: "Recibido",
        lines: [
          `Fecha agenda: ${fechaAgenda}`,
          `Sucursales activas: ${sucursales.length}`,
          `Configuraciones activas: ${configs.length}`,
        ],
      },
      resultSummary: {
        title: "Resultado",
        lines: [
          `Emails enviados: ${emailsEnviados}`,
          `Emails fallidos: ${emailsFallidos}`,
          `Sin destinatarios: ${sucursalesSinDestinatarios}`,
          `Sin agenda: ${sucursalesSinAgenda}`,
        ],
      },
      requestSample: sucursales.slice(0, 10).map((sucursal) => ({
        sucursal: sucursal.nombre,
        activa: sucursal.activa,
      })),
      responseSample: responseSample.slice(0, 10),
    };
  } catch (error) {
    logError("agendaEntregaEnvioCron.run");
    console.error(error);
    const message = error instanceof Error ? error.message : "No se pudo ejecutar el envio automatico de agendas";
    await ImportExecutionLoggerService.finishExecution(String(log._id), {
      status: "failed",
      message,
      errorSummary: [message],
      sourceSummary: {
        title: "Recibido",
        lines: [`Fecha agenda: ${fechaAgenda}`],
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
