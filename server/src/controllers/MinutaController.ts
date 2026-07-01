import mongoose from "mongoose";
import { Request, Response } from "express";
import Minuta from "../models/Minuta";
import User from "../models/User";
import { logError } from "../utils/logError";
import { generateMinutaPdfBuffer } from "../utils/minutaPdf";
import { sendMail } from "../utils/mail";
import { buildMinutaMailTemplate } from "../emails/templates/minuta.template";
import { hasMeaningfulRichText, sanitizeRichTextHtml } from "../utils/sanitizeHtml";

const minutaPopulate: Array<{ path: string; select: string }> = [
  { path: "moderador", select: "name lastName email" },
  { path: "participantes", select: "name lastName email enable" },
];

const normalizeText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const formatDateLabel = (value: Date | string) =>
  new Date(value).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const buildUserSummary = (value: any) => ({
  _id: String(value?._id ?? ""),
  name: value?.name ?? "",
  lastName: value?.lastName ?? "",
});

const buildFullName = (value: { name?: string; lastName?: string } | null | undefined) =>
  [value?.lastName ?? "", value?.name ?? ""].filter(Boolean).join(", ");

const buildMinutaResponse = (item: any) => ({
  _id: String(item._id),
  fecha: new Date(item.fecha).toISOString(),
  fechaLabel: formatDateLabel(item.fecha),
  tema: item.tema ?? "",
  moderador: buildUserSummary(item.moderador),
  participantes: Array.isArray(item.participantes)
    ? item.participantes.map(buildUserSummary)
    : [],
  participantesCount: Array.isArray(item.participantes) ? item.participantes.length : 0,
  temasCount: Array.isArray(item.temario) ? item.temario.length : 0,
  temario: Array.isArray(item.temario)
    ? item.temario.map((tema: any) => ({
        orden: Number(tema?.orden ?? 0),
        nombre: tema?.nombre ?? "",
        desarrollo: tema?.desarrollo ?? "",
      }))
    : [],
  createdBy: String(item.createdBy ?? ""),
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

const validateParticipantes = async (value: unknown): Promise<
  { error: string } | { data: mongoose.Types.ObjectId[] }
> => {
  if (!Array.isArray(value) || !value.length) {
    return { error: "Debes seleccionar al menos un participante" };
  }

  const uniqueIds = [...new Set(value.map((entry) => String(entry ?? "").trim()).filter(Boolean))];

  if (!uniqueIds.length) {
    return { error: "Debes seleccionar al menos un participante" };
  }

  if (uniqueIds.some((id) => !mongoose.isValidObjectId(id))) {
    return { error: "Hay participantes con formato invalido" };
  }

  const users = await User.find({
    _id: { $in: uniqueIds },
    enable: true,
  })
    .select("_id")
    .lean();

  if (users.length !== uniqueIds.length) {
    return { error: "Uno o mas participantes no existen o estan deshabilitados" };
  }

  return {
    data: users.map((user) => new mongoose.Types.ObjectId(String(user._id))),
  };
};

const validateTemario = (
  value: unknown,
): { error: string } | { data: ValidatedMinutaPayload["temario"] } => {
  if (!Array.isArray(value) || !value.length) {
    return { error: "Debes agregar al menos un tema al temario" };
  }

  const normalized = value.map((item, index) => ({
    orden: index + 1,
    nombre: normalizeText((item as Record<string, unknown>)?.nombre),
    desarrollo: sanitizeRichTextHtml(normalizeText((item as Record<string, unknown>)?.desarrollo)),
  }));

  if (normalized.some((item) => !item.nombre)) {
    return { error: "Todos los temas deben tener nombre" };
  }

  if (normalized.some((item) => !hasMeaningfulRichText(item.desarrollo))) {
    return { error: "Todos los temas deben tener desarrollo" };
  }

  return { data: normalized };
};

const validatePayload = async (
  payload: Record<string, unknown>,
): Promise<{ error: string } | { data: ValidatedMinutaPayload }> => {
  const fechaRaw = normalizeText(payload.fecha);
  const tema = normalizeText(payload.tema);

  if (!fechaRaw) {
    return { error: "La fecha es obligatoria" };
  }

  const fecha = new Date(`${fechaRaw}T00:00:00`);
  if (Number.isNaN(fecha.getTime())) {
    return { error: "La fecha no es valida" };
  }

  if (!tema) {
    return { error: "El tema es obligatorio" };
  }

  const participantesValidation = await validateParticipantes(payload.participantes);
  if ("error" in participantesValidation) {
    return participantesValidation;
  }

  const temarioValidation = validateTemario(payload.temario);
  if ("error" in temarioValidation) {
    return temarioValidation;
  }

  return {
    data: {
      fecha,
      tema,
      participantes: participantesValidation.data,
      temario: temarioValidation.data,
    },
  };
};

const findActiveMinutaById = async (id: string) => {
  if (!mongoose.isValidObjectId(id)) {
    return null;
  }

  return Minuta.findOne({ _id: id, deletedAt: null }).populate(minutaPopulate).lean();
};

const getMinutaEmailRecipients = (item: any) => {
  const recipients = [
    item?.moderador,
    ...(Array.isArray(item?.participantes) ? item.participantes : []),
  ]
    .map((user) => ({
      email: typeof user?.email === "string" ? user.email.trim().toLowerCase() : "",
      name: buildFullName(user),
    }))
    .filter((user) => user.email);

  const uniqueRecipients = new Map<string, { email: string; name: string }>();

  recipients.forEach((user) => {
    if (!uniqueRecipients.has(user.email)) {
      uniqueRecipients.set(user.email, user);
    }
  });

  return [...uniqueRecipients.values()];
};

export class MinutaController {
  static list = async (_req: Request, res: Response) => {
    try {
      const data = await Minuta.find({ deletedAt: null })
        .populate(minutaPopulate)
        .sort({ fecha: -1, createdAt: -1 })
        .lean();

      return res.status(200).json({
        data: data.map(buildMinutaResponse),
      });
    } catch (error) {
      logError("MinutaController.list");
      console.error(error);
      return res.status(500).json({ message: "Error al listar minutas" });
    }
  };

  static getById = async (req: Request, res: Response) => {
    try {
      const data = await findActiveMinutaById(String(req.params.id));

      if (!data) {
        return res.status(404).json({ error: "Minuta no encontrada" });
      }

      return res.status(200).json({ data: buildMinutaResponse(data) });
    } catch (error) {
      logError("MinutaController.getById");
      console.error(error);
      return res.status(500).json({ message: "Error al obtener la minuta" });
    }
  };

  static listParticipants = async (_req: Request, res: Response) => {
    try {
      const users = await User.find({ enable: true }, { password: 0 })
        .sort({ lastName: 1, name: 1 })
        .lean();

      return res.status(200).json({
        data: users.map((user) => ({
          _id: String(user._id),
          name: user.name,
          lastName: user.lastName,
          email: user.email,
        })),
      });
    } catch (error) {
      logError("MinutaController.listParticipants");
      console.error(error);
      return res.status(500).json({ message: "Error al listar participantes" });
    }
  };

  static create = async (req: Request, res: Response) => {
    try {
      if (!req.user?._id) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      const validated = await validatePayload(req.body ?? {});
      if ("error" in validated) {
        return res.status(400).json({ error: validated.error });
      }

      const data = await Minuta.create({
        ...validated.data,
        moderador: new mongoose.Types.ObjectId(req.user._id),
        createdBy: new mongoose.Types.ObjectId(req.user._id),
      });

      const populated = await findActiveMinutaById(String(data._id));

      return res.status(201).json({
        message: "Minuta creada correctamente",
        data: populated ? buildMinutaResponse(populated) : null,
      });
    } catch (error) {
      logError("MinutaController.create");
      console.error(error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "No se pudo crear la minuta",
      });
    }
  };

  static update = async (req: Request, res: Response) => {
    try {
      if (!req.user?._id) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      const minuta = await Minuta.findOne({ _id: String(req.params.id), deletedAt: null }).select("_id");

      if (!minuta) {
        return res.status(404).json({ error: "Minuta no encontrada" });
      }

      return res.status(403).json({
        error: "La minuta no puede editarse una vez creada",
      });
    } catch (error) {
      logError("MinutaController.update");
      console.error(error);
      return res.status(500).json({ message: "Error al actualizar la minuta" });
    }
  };

  static remove = async (req: Request, res: Response) => {
    try {
      if (!req.user?._id) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      const minuta = await Minuta.findOne({ _id: req.params.id, deletedAt: null });

      if (!minuta) {
        return res.status(404).json({ error: "Minuta no encontrada" });
      }

      if (String(minuta.createdBy) !== String(req.user._id)) {
        return res.status(403).json({
          error: "Solo el usuario creador puede eliminar esta minuta",
        });
      }

      minuta.deletedAt = new Date();
      minuta.updatedBy = new mongoose.Types.ObjectId(req.user._id);
      await minuta.save();

      return res.status(200).json({
        message: "Minuta eliminada correctamente",
        data: null,
      });
    } catch (error) {
      logError("MinutaController.remove");
      console.error(error);
      return res.status(500).json({ message: "Error al eliminar la minuta" });
    }
  };

  static exportPdf = async (req: Request, res: Response) => {
    try {
      const data = await findActiveMinutaById(String(req.params.id));

      if (!data) {
        return res.status(404).json({ error: "Minuta no encontrada" });
      }

      const response = buildMinutaResponse(data);
      const pdfBuffer = await generateMinutaPdfBuffer({
        _id: response._id,
        fecha: response.fecha,
        fechaLabel: response.fechaLabel,
        tema: response.tema,
        moderador: response.moderador,
        participantes: response.participantes,
        temario: response.temario,
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="minuta-${response.fechaLabel.replace(/\//g, "-")}.pdf"`,
      );

      return res.status(200).send(pdfBuffer);
    } catch (error) {
      logError("MinutaController.exportPdf");
      console.error(error);
      return res.status(500).json({ message: "Error al exportar la minuta a PDF" });
    }
  };

  static sendByEmail = async (req: Request, res: Response) => {
    try {
      if (!req.user?._id) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      const data = await findActiveMinutaById(String(req.params.id));

      if (!data) {
        return res.status(404).json({ error: "Minuta no encontrada" });
      }

      const response = buildMinutaResponse(data);
      const pdfBuffer = await generateMinutaPdfBuffer({
        _id: response._id,
        fecha: response.fecha,
        fechaLabel: response.fechaLabel,
        tema: response.tema,
        moderador: response.moderador,
        participantes: response.participantes,
        temario: response.temario,
      });

      const recipients = getMinutaEmailRecipients(data);

      if (!recipients.length) {
        return res.status(400).json({
          error: "La minuta no tiene destinatarios con email configurado",
        });
      }

      await Promise.all(
        recipients.map((recipient) =>
          sendMail({
            to: recipient.email,
            subject: `Minuta interna - ${response.fechaLabel}`,
            html: buildMinutaMailTemplate({
              fechaLabel: response.fechaLabel,
              moderador: buildFullName(response.moderador),
              tema: response.tema,
              toName: recipient.name || "equipo",
            }),
            attachments: [
              {
                filename: `minuta-${response.fechaLabel.replace(/\//g, "-")}.pdf`,
                content: pdfBuffer,
                contentType: "application/pdf",
              },
            ],
          }),
        ),
      );

      console.log(
        `[minutas-email] minuta ${response._id} enviada a ${recipients.length} destinatario(s): ${recipients.map((recipient) => recipient.email).join(", ")}`,
      );

      return res.status(200).json({
        data: null,
        message: `Minuta enviada correctamente a ${recipients.length} destinatario(s)`,
      });
    } catch (error) {
      logError("MinutaController.sendByEmail");
      console.error(error);
      return res.status(500).json({ message: "Error al enviar la minuta por email" });
    }
  };
}
type ValidatedMinutaPayload = {
  fecha: Date;
  tema: string;
  participantes: mongoose.Types.ObjectId[];
  temario: Array<{
    orden: number;
    nombre: string;
    desarrollo: string;
  }>;
};
