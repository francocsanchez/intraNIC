import OperacionFacturaAnticipo from "../models/OperacionFacturaAnticipo";
import User from "../models/User";
import { buildFacturasAnticipoTemplate } from "../emails/templates/facturasAnticipo.template";
import { getFacturadasByNumeroOp } from "./facturaAnticipoService";
import { sendMail } from "../utils/mail";
import { logError } from "../utils/logError";

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

  operaciones.forEach((operacion) => {
    const label = normalizeUserLabel(operacion.usuarioCarga);
    const user = usersByLabel.get(label);

    if (!user?.email) {
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

  return Array.from(grouped.values()).map((item) => ({
    ...item,
    operaciones: [...item.operaciones].sort((a, b) => a.numeroOp - b.numeroOp),
  }));
};

export const runFacturasAnticipoCron = async () => {
  const startedAt = new Date();
  console.log(`[facturas-anticipo-cron] inicio ${startedAt.toISOString()}`);

  try {
    const registros = await OperacionFacturaAnticipo.find().lean();
    console.log(`[facturas-anticipo-cron] operaciones revisadas: ${registros.length}`);

    if (!registros.length) {
      console.log("[facturas-anticipo-cron] sin registros para revisar");
      return;
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
      return;
    }

    const groups = await groupFacturadasByUsuario(facturadas);
    let sentEmails = 0;

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
      }
    }

    console.log(`[facturas-anticipo-cron] emails enviados: ${sentEmails}`);
  } catch (error) {
    logError("facturasAnticipoCron.run");
    console.error(error);
  }
};
