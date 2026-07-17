import mongoose from "mongoose";
import { Request, Response } from "express";
import Minuta from "../models/Minuta";
import MinutaGrupo from "../models/MinutaGrupo";
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

const minutaGrupoPopulate: Array<{ path: string; select: string }> = [
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

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

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
  sentAt: item.sentAt ? new Date(item.sentAt).toISOString() : null,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

const buildMinutaGrupoResponse = (item: any) => ({
  _id: String(item._id),
  nombre: item.nombre ?? "",
  participantes: Array.isArray(item.participantes)
    ? item.participantes.map(buildUserSummary)
    : [],
  participantesCount: Array.isArray(item.participantes) ? item.participantes.length : 0,
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

const validateGrupoPayload = async (
  payload: Record<string, unknown>,
): Promise<{ error: string } | { data: ValidatedMinutaGrupoPayload }> => {
  const nombre = normalizeText(payload.nombre);

  if (!nombre) {
    return { error: "El nombre del grupo es obligatorio" };
  }

  const participantesValidation = await validateParticipantes(payload.participantes);
  if ("error" in participantesValidation) {
    return participantesValidation;
  }

  return {
    data: {
      nombre,
      participantes: participantesValidation.data,
    },
  };
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

const findActiveMinutaGrupoById = async (id: string, userId: string) => {
  if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(userId)) {
    return null;
  }

  return MinutaGrupo.findOne({
    _id: id,
    createdBy: userId,
    deletedAt: null,
  })
    .populate(minutaGrupoPopulate)
    .lean();
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
    .filter((user) => user.email && isValidEmail(user.email));

  const uniqueRecipients = new Map<string, { email: string; name: string }>();

  recipients.forEach((user) => {
    if (!uniqueRecipients.has(user.email)) {
      uniqueRecipients.set(user.email, user);
    }
  });

  return [...uniqueRecipients.values()];
};

export class MinutaController {
  static listGroups = async (req: Request, res: Response) => {
    try {
      if (!req.user?._id) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      const data = await MinutaGrupo.find({
        createdBy: req.user._id,
        deletedAt: null,
      })
        .populate(minutaGrupoPopulate)
        .sort({ nombre: 1, createdAt: -1 })
        .lean();

      return res.status(200).json({
        data: data.map(buildMinutaGrupoResponse),
      });
    } catch (error) {
      logError("MinutaController.listGroups");
      console.error(error);
      return res.status(500).json({ message: "Error al listar grupos de difusion" });
    }
  };

  static createGroup = async (req: Request, res: Response) => {
    try {
      if (!req.user?._id) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      const validated = await validateGrupoPayload(req.body ?? {});
      if ("error" in validated) {
        return res.status(400).json({ error: validated.error });
      }

      const data = await MinutaGrupo.create({
        ...validated.data,
        createdBy: new mongoose.Types.ObjectId(req.user._id),
        updatedBy: new mongoose.Types.ObjectId(req.user._id),
      });

      const populated = await findActiveMinutaGrupoById(String(data._id), String(req.user._id));

      return res.status(201).json({
        message: "Grupo de difusion creado correctamente",
        data: populated ? buildMinutaGrupoResponse(populated) : null,
      });
    } catch (error) {
      logError("MinutaController.createGroup");
      console.error(error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "No se pudo crear el grupo de difusion",
      });
    }
  };

  static updateGroup = async (req: Request, res: Response) => {
    try {
      if (!req.user?._id) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      const grupo = await MinutaGrupo.findOne({
        _id: String(req.params.id),
        createdBy: req.user._id,
        deletedAt: null,
      });

      if (!grupo) {
        return res.status(404).json({ error: "Grupo de difusion no encontrado" });
      }

      const validated = await validateGrupoPayload(req.body ?? {});
      if ("error" in validated) {
        return res.status(400).json({ error: validated.error });
      }

      grupo.nombre = validated.data.nombre;
      grupo.participantes = validated.data.participantes;
      grupo.updatedBy = new mongoose.Types.ObjectId(req.user._id);

      await grupo.save();

      const populated = await findActiveMinutaGrupoById(String(grupo._id), String(req.user._id));

      return res.status(200).json({
        message: "Grupo de difusion actualizado correctamente",
        data: populated ? buildMinutaGrupoResponse(populated) : null,
      });
    } catch (error) {
      logError("MinutaController.updateGroup");
      console.error(error);
      return res.status(500).json({ message: "Error al actualizar el grupo de difusion" });
    }
  };

  static removeGroup = async (req: Request, res: Response) => {
    try {
      if (!req.user?._id) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      const grupo = await MinutaGrupo.findOne({
        _id: String(req.params.id),
        createdBy: req.user._id,
        deletedAt: null,
      });

      if (!grupo) {
        return res.status(404).json({ error: "Grupo de difusion no encontrado" });
      }

      grupo.deletedAt = new Date();
      grupo.updatedBy = new mongoose.Types.ObjectId(req.user._id);
      await grupo.save();

      return res.status(200).json({
        message: "Grupo de difusion eliminado correctamente",
        data: null,
      });
    } catch (error) {
      logError("MinutaController.removeGroup");
      console.error(error);
      return res.status(500).json({ message: "Error al eliminar el grupo de difusion" });
    }
  };

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

      const minuta = await Minuta.findOne({ _id: String(req.params.id), deletedAt: null });

      if (!minuta) {
        return res.status(404).json({ error: "Minuta no encontrada" });
      }

      if (String(minuta.createdBy) !== String(req.user._id)) {
        return res.status(403).json({
          error: "Solo el usuario creador puede editar esta minuta",
        });
      }

      if (minuta.sentAt) {
        return res.status(403).json({
          error: "La minuta no puede editarse porque ya fue enviada por email",
        });
      }

      const validated = await validatePayload(req.body ?? {});
      if ("error" in validated) {
        return res.status(400).json({ error: validated.error });
      }

      minuta.fecha = validated.data.fecha;
      minuta.tema = validated.data.tema;
      minuta.participantes = validated.data.participantes;
      minuta.temario = validated.data.temario;
      minuta.updatedBy = new mongoose.Types.ObjectId(req.user._id);

      await minuta.save();

      const populated = await findActiveMinutaById(String(minuta._id));

      return res.status(200).json({
        message: "Minuta actualizada correctamente",
        data: populated ? buildMinutaResponse(populated) : null,
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

      if (minuta.sentAt) {
        return res.status(403).json({
          error: "La minuta no puede eliminarse porque ya fue enviada por email",
        });
      }

      await Minuta.deleteOne({ _id: minuta._id });

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

      if (String(data.createdBy) !== String(req.user._id)) {
        return res.status(403).json({
          error: "Solo el usuario creador puede enviar esta minuta por email",
        });
      }

      if (data.sentAt) {
        return res.status(403).json({
          error: "La minuta ya fue enviada por email",
        });
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

      const recipientEmails = recipients.map((recipient) => recipient.email);
      const primaryRecipient = recipientEmails[0];
      const ccRecipients = recipientEmails.slice(1);

      try {
        await sendMail({
          to: primaryRecipient,
          cc: ccRecipients.length ? ccRecipients : undefined,
          subject: `Minuta interna - ${response.fechaLabel}`,
          html: buildMinutaMailTemplate({
            fechaLabel: response.fechaLabel,
            moderador: buildFullName(response.moderador),
            tema: response.tema,
            toName: "equipo",
          }),
          attachments: [
            {
              filename: `minuta-${response.fechaLabel.replace(/\//g, "-")}.pdf`,
              content: pdfBuffer,
              contentType: "application/pdf",
            },
          ],
        });
      } catch (mailError) {
        console.error(
          `[minutas-email] error enviando minuta ${response._id} a: ${recipientEmails.join(", ")}`,
        );
        console.error(mailError);

        return res.status(500).json({
          message: `No se pudo enviar la minuta a los destinatarios configurados`,
        });
      }

      await Minuta.updateOne(
        { _id: response._id, sentAt: null },
        {
          $set: {
            sentAt: new Date(),
            updatedBy: new mongoose.Types.ObjectId(req.user._id),
          },
        },
      );

      const updatedMinuta = await findActiveMinutaById(response._id);

      console.log(
        `[minutas-email] minuta ${response._id} enviada a ${recipients.length} destinatario(s): ${recipients.map((recipient) => recipient.email).join(", ")}`,
      );

      return res.status(200).json({
        data: updatedMinuta ? buildMinutaResponse(updatedMinuta) : null,
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

type ValidatedMinutaGrupoPayload = {
  nombre: string;
  participantes: mongoose.Types.ObjectId[];
};
