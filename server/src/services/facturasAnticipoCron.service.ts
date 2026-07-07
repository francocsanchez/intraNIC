import OperacionFacturaAnticipo from "../models/OperacionFacturaAnticipo";
import User from "../models/User";
import { buildFacturasAnticipoTemplate } from "../emails/templates/facturasAnticipo.template";
import { getFacturadasByNumeroOp } from "./facturaAnticipoService";
import { sendMail } from "../utils/mail";
import { logError } from "../utils/logError";
import type { JobExecutionResult, JobMonitorTrigger } from "./jobs/jobMonitor.types";
import { ImportExecutionLoggerService } from "./imports/importExecutionLogger.service";

type OperacionFacturada = {
  _id: unknown;
  numeroOp: number;
  cliente: string;
  version: string;
  vendedor: string;
  chasis: string;
  usuarioCarga: string;
  fechaCarga: Date;
};

type OperacionesPorUsuario = {
  email: string;
  nombreUsuario: string;
  operaciones: OperacionFacturada[];
};

const SUBJECT = "Anulacion pendiente de facturas de anticipo";
const JOB_KEY = "facturas-anticipo";
const JOB_NAME = "facturas-anticipo";
const JOB_SCHEDULE_LABEL = "Todos los dias a las 21:00";

const normalizeText = (value: unknown) =>
  String(value ?? "")
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const normalizeUserLabel = (value: string) =>
  normalizeText(value)
    .replace(/\s*,\s*/g, ",")
    .replace(/\s+/g, " ");

const toDisplayName = (value: string) => {
  const cleaned = value.trim();
  if (!cleaned) return "usuario";

  return cleaned
    .split(" ")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
};

const resolveUsersByCarga = async (operaciones: OperacionFacturada[]) => {
  const labels = Array.from(new Set(operaciones.map((operacion) => normalizeUserLabel(operacion.usuarioCarga)).filter(Boolean)));
  const users = await User.find(
    {},
    {
      email: 1,
      name: 1,
      lastName: 1,
      enable: 1,
    },
  ).lean();

  const byLabel = new Map(
    users
      .filter((user) => user.enable && user.email)
      .map((user) => [
        normalizeUserLabel(`${user.lastName}, ${user.name}`),
        user,
      ]),
  );

  return labels.reduce((acc, label) => {
    const user = byLabel.get(label);
    if (user) {
      acc.set(label, user);
    }
    return acc;
  }, new Map<string, (typeof users)[number]>());
};

const groupFacturadasByUsuario = async (operaciones: OperacionFacturada[]) => {
  const usersByLabel = await resolveUsersByCarga(operaciones);
  const grouped = new Map<string, OperacionesPorUsuario>();
  const missingUserLabels = new Set<string>();

  operaciones.forEach((operacion) => {
    const label = normalizeUserLabel(operacion.usuarioCarga);
    const user = usersByLabel.get(label);

    if (!user?.email) {
      missingUserLabels.add(label);
      console.warn(
        `[facturas-anticipo-cron] no se encontro email para usuarioCarga="${operacion.usuarioCarga}" en OP ${operacion.numeroOp}`,
      );
      return;
    }

    const current = grouped.get(user.email) ?? {
      email: user.email,
      nombreUsuario: toDisplayName(`${user.name} ${user.lastName}`),
      operaciones: [],
    };

    current.operaciones.push(operacion);
    grouped.set(user.email, current);
  });

  return {
    groups: Array.from(grouped.values()).map((item) => ({
      ...item,
      operaciones: [...item.operaciones].sort((a, b) => a.numeroOp - b.numeroOp),
    })),
    missingUserLabels,
  };
};

export const runFacturasAnticipoCron = async () => {
  return runFacturasAnticipoJob("cron");
};

export class FacturasAnticipoAlreadyRunningError extends Error {}

let isRunning = false;

export const isFacturasAnticipoJobRunning = () => isRunning;
export const getFacturasAnticipoJobKey = () => JOB_KEY;
export const getFacturasAnticipoJobName = () => JOB_NAME;
export const getFacturasAnticipoScheduleLabel = () => JOB_SCHEDULE_LABEL;

export const runFacturasAnticipoJob = async (trigger: JobMonitorTrigger): Promise<JobExecutionResult> => {
  if (isRunning) {
    throw new FacturasAnticipoAlreadyRunningError("Ya hay una ejecucion de facturas anticipo en curso");
  }

  isRunning = true;
  const startedAt = new Date();
  console.log(`[facturas-anticipo-cron] inicio ${startedAt.toISOString()}`);
  const log = await ImportExecutionLoggerService.startExecution({
    jobKey: JOB_KEY,
    jobName: JOB_NAME,
    sourceType: "database",
    trigger,
    scheduleLabel: JOB_SCHEDULE_LABEL,
    sourcePath: "OperacionFacturaAnticipo",
    message: "Iniciando revision de operaciones de facturas anticipo",
  });

  try {
    const registros = await OperacionFacturaAnticipo.find().lean();
    console.log(`[facturas-anticipo-cron] operaciones revisadas: ${registros.length}`);

    if (!registros.length) {
      console.log("[facturas-anticipo-cron] sin registros para revisar");
      const finishedAt = new Date();
      const message = "No hay registros para revisar";
      await ImportExecutionLoggerService.finishExecution(String(log._id), {
        status: "skipped",
        message,
        metrics: {
          registrosRevisados: 0,
          operacionesFacturadas: 0,
          emailsEnviados: 0,
          usuariosSinEmail: 0,
        },
        sourceSummary: {
          title: "Recibido",
          lines: ["OperacionFacturaAnticipo: 0 registros"],
        },
        resultSummary: {
          title: "Resultado",
          lines: [message],
        },
      });
      return {
        status: "skipped",
        fileName: null,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        message,
        errorSummary: [],
        metrics: {
          registrosRevisados: 0,
          operacionesFacturadas: 0,
          emailsEnviados: 0,
          usuariosSinEmail: 0,
        },
        sourceSummary: {
          title: "Recibido",
          lines: ["OperacionFacturaAnticipo: 0 registros"],
        },
        resultSummary: {
          title: "Resultado",
          lines: [message],
        },
        requestSample: [],
        responseSample: [],
      };
    }

    const facturadasSet = await getFacturadasByNumeroOp(registros.map((registro) => registro.numeroOp));
    const facturadas: OperacionFacturada[] = registros
      .filter((registro) => facturadasSet.has(registro.numeroOp))
      .map((registro) => ({
        _id: registro._id,
        numeroOp: registro.numeroOp,
        cliente: registro.cliente,
        version: registro.version,
        vendedor: registro.vendedor,
        chasis: registro.chasis,
        usuarioCarga: registro.usuarioCarga,
        fechaCarga: registro.fechaCarga,
      }));
    console.log(`[facturas-anticipo-cron] operaciones facturadas detectadas: ${facturadas.length}`);

    if (!facturadas.length) {
      console.log("[facturas-anticipo-cron] no hay operaciones facturadas para notificar");
      const finishedAt = new Date();
      const message = "No hay operaciones facturadas para notificar";
      await ImportExecutionLoggerService.finishExecution(String(log._id), {
        status: "success",
        message,
        totalRead: registros.length,
        metrics: {
          registrosRevisados: registros.length,
          operacionesFacturadas: 0,
          emailsEnviados: 0,
          usuariosSinEmail: 0,
        },
        sourceSummary: {
          title: "Recibido",
          lines: [`OperacionFacturaAnticipo: ${registros.length} registros`],
        },
        resultSummary: {
          title: "Resultado",
          lines: [message],
        },
        requestSample: registros.slice(0, 5).map((registro) => ({
          numeroOp: registro.numeroOp,
          usuarioCarga: registro.usuarioCarga,
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
          registrosRevisados: registros.length,
          operacionesFacturadas: 0,
          emailsEnviados: 0,
          usuariosSinEmail: 0,
        },
        sourceSummary: {
          title: "Recibido",
          lines: [`OperacionFacturaAnticipo: ${registros.length} registros`],
        },
        resultSummary: {
          title: "Resultado",
          lines: [message],
        },
        requestSample: registros.slice(0, 5).map((registro) => ({
          numeroOp: registro.numeroOp,
          usuarioCarga: registro.usuarioCarga,
        })),
        responseSample: [],
      };
    }

    const { groups, missingUserLabels } = await groupFacturadasByUsuario(facturadas);
    let sentEmails = 0;
    const failedEmails: string[] = [];
    const usuariosSinEmail = missingUserLabels;

    for (const group of groups) {
      try {
        await sendMail({
          to: group.email,
          subject: SUBJECT,
          html: buildFacturasAnticipoTemplate({
            nombreUsuario: group.nombreUsuario,
            operaciones: group.operaciones,
          }),
        });

        sentEmails += 1;
        console.log(
          `[facturas-anticipo-cron] email enviado a ${group.email} con ${group.operaciones.length} operaciones`,
        );
      } catch (error) {
        logError("facturasAnticipoCron.sendMail");
        console.error(error);
        failedEmails.push(group.email);
      }
    }

    console.log(`[facturas-anticipo-cron] emails enviados: ${sentEmails}`);
    const finishedAt = new Date();
    const status = failedEmails.length > 0 || usuariosSinEmail.size > 0 ? "partial" : "success";
    const message =
      failedEmails.length > 0
        ? `Proceso finalizado con incidencias: ${sentEmails} emails enviados y ${failedEmails.length} fallidos`
        : `Proceso finalizado: ${sentEmails} emails enviados`;

    await ImportExecutionLoggerService.finishExecution(String(log._id), {
      status,
      message,
      totalRead: registros.length,
      inserted: sentEmails,
      discarded: usuariosSinEmail.size,
      errored: failedEmails.length,
      metrics: {
        registrosRevisados: registros.length,
        operacionesFacturadas: facturadas.length,
        gruposNotificados: groups.length,
        emailsEnviados: sentEmails,
        emailsFallidos: failedEmails.length,
        usuariosSinEmail: usuariosSinEmail.size,
      },
      errorSummary: [
        ...failedEmails.map((email) => `No se pudo enviar el email a ${email}`),
        ...Array.from(usuariosSinEmail).map((label) => `No se encontro email para ${label}`),
      ],
      sourceSummary: {
        title: "Recibido",
        lines: [
          `OperacionFacturaAnticipo: ${registros.length} registros`,
          `Operaciones facturadas detectadas: ${facturadas.length}`,
        ],
      },
      resultSummary: {
        title: "Enviado",
        lines: [
          `Emails enviados: ${sentEmails}`,
          `Emails fallidos: ${failedEmails.length}`,
          `Usuarios sin email: ${usuariosSinEmail.size}`,
        ],
      },
      requestSample: facturadas.slice(0, 5).map((operacion) => ({
        numeroOp: operacion.numeroOp,
        usuarioCarga: operacion.usuarioCarga,
        cliente: operacion.cliente,
      })),
      responseSample: groups.slice(0, 10).map((group) => ({
        email: group.email,
        nombreUsuario: group.nombreUsuario,
        operaciones: group.operaciones.length,
      })),
    });

    return {
      status,
      fileName: null,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      message,
      errorSummary: [
        ...failedEmails.map((email) => `No se pudo enviar el email a ${email}`),
        ...Array.from(usuariosSinEmail).map((label) => `No se encontro email para ${label}`),
      ],
      metrics: {
        registrosRevisados: registros.length,
        operacionesFacturadas: facturadas.length,
        gruposNotificados: groups.length,
        emailsEnviados: sentEmails,
        emailsFallidos: failedEmails.length,
        usuariosSinEmail: usuariosSinEmail.size,
      },
      sourceSummary: {
        title: "Recibido",
        lines: [
          `OperacionFacturaAnticipo: ${registros.length} registros`,
          `Operaciones facturadas detectadas: ${facturadas.length}`,
        ],
      },
      resultSummary: {
        title: "Enviado",
        lines: [
          `Emails enviados: ${sentEmails}`,
          `Emails fallidos: ${failedEmails.length}`,
          `Usuarios sin email: ${usuariosSinEmail.size}`,
        ],
      },
      requestSample: facturadas.slice(0, 5).map((operacion) => ({
        numeroOp: operacion.numeroOp,
        usuarioCarga: operacion.usuarioCarga,
        cliente: operacion.cliente,
      })),
      responseSample: groups.slice(0, 10).map((group) => ({
        email: group.email,
        nombreUsuario: group.nombreUsuario,
        operaciones: group.operaciones.length,
      })),
    };
  } catch (error) {
    logError("facturasAnticipoCron.run");
    console.error(error);
    const message = error instanceof Error ? error.message : "No se pudo ejecutar el cron de facturas anticipo";
    await ImportExecutionLoggerService.finishExecution(String(log._id), {
      status: "failed",
      message,
      errorSummary: [message],
      sourceSummary: {
        title: "Recibido",
        lines: ["OperacionFacturaAnticipo"],
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
