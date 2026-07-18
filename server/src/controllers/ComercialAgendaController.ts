import mongoose from "mongoose";
import { Request, Response } from "express";
import ComercialAgendaPuesto from "../models/ComercialAgendaPuesto";
import ComercialAgendaAsignacion from "../models/ComercialAgendaAsignacion";
import User from "../models/User";
import { logError } from "../utils/logError";
import UnidadNegocio from "../models/UnidadNegocio";

const DAY_MS = 24 * 60 * 60 * 1000;

const normalizeText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const hasSuperAdminAccess = (req: Request) =>
  (req.user?.role ?? []).some((role) => String(role).trim().toLowerCase() === "superadmin");

const hasSupervisorAccess = (req: Request) =>
  (req.user?.role ?? []).some((role) => String(role).trim().toLowerCase() === "supervisor");

const hasManageAccess = (req: Request) =>
  hasSuperAdminAccess(req) || hasSupervisorAccess(req);

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

const startOfWeek = (date: Date) => {
  const current = startOfDay(date);
  const day = current.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(current, diff);
};

const endOfWeek = (date: Date) => addDays(startOfWeek(date), 6);

const parseDateInput = (value: unknown) => {
  const normalized = normalizeText(value);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return null;
  }

  const parsed = new Date(`${normalized}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return startOfDay(parsed);
};

const formatDateLabel = (date: Date) =>
  date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const formatWeekDayLabel = (date: Date) =>
  date.toLocaleDateString("es-AR", {
    weekday: "long",
  });

const buildUserSummary = (value: any) => ({
  _id: String(value?._id ?? ""),
  name: value?.name ?? "",
  lastName: value?.lastName ?? "",
  email: value?.email ?? "",
});

const buildPuestoResponse = (item: any) => ({
  _id: String(item._id),
  unidadNegocioId: String(item.unidadNegocio),
  nombre: item.nombre ?? "",
  orden: Number(item.orden ?? 0),
  activo: Boolean(item.activo),
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

const buildCellResponse = (params: {
  fecha: Date;
  puesto: any;
  asignacion?: any | null;
}) => ({
  fecha: params.fecha.toISOString(),
  fechaLabel: formatDateLabel(params.fecha),
  puestoId: String(params.puesto._id),
  puestoNombre: params.puesto.nombre ?? "",
  asignacionId: params.asignacion ? String(params.asignacion._id) : null,
  asistentes: Array.isArray(params.asignacion?.asistentes)
    ? params.asignacion.asistentes.map(buildUserSummary)
    : [],
});

const validateAsistentes = async (
  value: unknown,
  unidadNegocioId: mongoose.Types.ObjectId,
) => {
  if (!Array.isArray(value)) {
    return { error: "Los asistentes deben enviarse como una lista" } as const;
  }

  const uniqueIds = [...new Set(value.map((entry) => String(entry ?? "").trim()).filter(Boolean))];

  if (!uniqueIds.length) {
    return { data: [] as mongoose.Types.ObjectId[] } as const;
  }

  if (uniqueIds.some((id) => !mongoose.isValidObjectId(id))) {
    return { error: "Hay asistentes con formato invalido" } as const;
  }

  const users = await User.find({
    _id: { $in: uniqueIds },
    enable: true,
    unidadNegocio: unidadNegocioId,
  })
    .select("_id")
    .lean();

  if (users.length !== uniqueIds.length) {
    return { error: "Uno o mas asistentes no existen o estan deshabilitados" } as const;
  }

  return {
    data: users.map((user) => new mongoose.Types.ObjectId(String(user._id))),
  } as const;
};

const buildUnidadNegocioResponse = (item: any) => ({
  _id: String(item._id),
  nombre: item.nombre ?? "",
  activo: Boolean(item.activo),
  orden: Number(item.orden ?? 0),
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

export class ComercialAgendaController {
  static ensureReadAccess(req: Request, res: Response) {
    if (!req.user?._id) {
      res.status(401).json({ error: "Usuario no autenticado" });
      return false;
    }

    return true;
  }

  static ensureManageAccess(req: Request, res: Response) {
    if (!ComercialAgendaController.ensureReadAccess(req, res)) {
      return false;
    }

    if (!hasManageAccess(req)) {
      res.status(403).json({ error: "Solo superAdmin o supervisor pueden administrar la agenda comercial" });
      return false;
    }

    return true;
  }

  static resolveUnidadNegocioId = async (
    req: Request,
    res: Response,
    value: unknown,
  ): Promise<mongoose.Types.ObjectId | null> => {
    const unidadNegocioId = normalizeText(value);

    if (!unidadNegocioId) {
      res.status(400).json({ error: "La unidad de negocio es obligatoria" });
      return null;
    }

    if (!mongoose.isValidObjectId(unidadNegocioId)) {
      res.status(400).json({ error: "La unidad de negocio seleccionada no es valida" });
      return null;
    }

    const unidadNegocio = await UnidadNegocio.findById(unidadNegocioId).lean();
    if (!unidadNegocio) {
      res.status(404).json({ error: "La unidad de negocio seleccionada no existe" });
      return null;
    }

    return new mongoose.Types.ObjectId(unidadNegocioId);
  };

  static listUnidadesNegocio = async (req: Request, res: Response) => {
    try {
      if (!ComercialAgendaController.ensureReadAccess(req, res)) {
        return;
      }

      const unidades = await UnidadNegocio.find({ activo: true })
        .sort({ orden: 1, nombre: 1 })
        .lean();

      return res.status(200).json({
        data: unidades.map(buildUnidadNegocioResponse),
      });
    } catch (error) {
      logError("ComercialAgendaController.listUnidadesNegocio");
      console.error(error);
      return res.status(500).json({ message: "Error al listar unidades de negocio" });
    }
  };

  static listEligibleUsers = async (req: Request, res: Response) => {
    try {
      if (!ComercialAgendaController.ensureManageAccess(req, res)) {
        return;
      }

      const unidadNegocioId = await ComercialAgendaController.resolveUnidadNegocioId(
        req,
        res,
        req.query.unidadNegocioId,
      );
      if (!unidadNegocioId) {
        return;
      }

      const users = await User.find(
        { enable: true, unidadNegocio: unidadNegocioId },
        { password: 0 },
      )
        .sort({ lastName: 1, name: 1 })
        .lean();

      return res.status(200).json({
        data: users.map(buildUserSummary),
      });
    } catch (error) {
      logError("ComercialAgendaController.listEligibleUsers");
      console.error(error);
      return res.status(500).json({ message: "Error al listar usuarios elegibles" });
    }
  };

  static listPuestos = async (req: Request, res: Response) => {
    try {
      if (!ComercialAgendaController.ensureReadAccess(req, res)) {
        return;
      }

      const unidadNegocioId = await ComercialAgendaController.resolveUnidadNegocioId(
        req,
        res,
        req.query.unidadNegocioId,
      );
      if (!unidadNegocioId) {
        return;
      }

      const includeInactive =
        hasManageAccess(req) && String(req.query.includeInactive ?? "0") === "1";
      const puestos = await ComercialAgendaPuesto.find(
        includeInactive
          ? { unidadNegocio: unidadNegocioId }
          : { unidadNegocio: unidadNegocioId, activo: true },
      )
        .sort({ orden: 1, nombre: 1 })
        .lean();

      return res.status(200).json({
        data: puestos.map(buildPuestoResponse),
      });
    } catch (error) {
      logError("ComercialAgendaController.listPuestos");
      console.error(error);
      return res.status(500).json({ message: "Error al listar puestos" });
    }
  };

  static savePuestos = async (req: Request, res: Response) => {
    try {
      if (!ComercialAgendaController.ensureManageAccess(req, res)) {
        return;
      }

      const rawItems = Array.isArray(req.body?.puestos) ? req.body.puestos : null;
      if (!rawItems) {
        return res.status(400).json({ error: "Debes enviar la lista completa de puestos" });
      }

      const unidadNegocioId = await ComercialAgendaController.resolveUnidadNegocioId(
        req,
        res,
        req.body?.unidadNegocioId,
      );
      if (!unidadNegocioId) {
        return;
      }

      const currentUserId = new mongoose.Types.ObjectId(req.user!._id);
      const existing = await ComercialAgendaPuesto.find({ unidadNegocio: unidadNegocioId }).sort({
        orden: 1,
        nombre: 1,
      });
      const existingById = new Map(existing.map((item) => [String(item._id), item]));
      const seenIds = new Set<string>();

      for (let index = 0; index < rawItems.length; index += 1) {
        const item = rawItems[index] as Record<string, unknown>;
        const id = normalizeText(item._id);
        const nombre = normalizeText(item.nombre);
        const activo = item.activo !== false;

        if (!nombre) {
          return res.status(400).json({ error: `El puesto en la fila ${index + 1} debe tener nombre` });
        }

        if (id) {
          if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ error: `El puesto ${nombre} tiene un id invalido` });
          }

          if (seenIds.has(id)) {
            return res.status(400).json({ error: `El puesto ${nombre} esta repetido en la configuracion enviada` });
          }

          seenIds.add(id);

          const existingItem = existingById.get(id);
          if (!existingItem) {
            return res.status(404).json({ error: `El puesto ${nombre} ya no existe` });
          }

          existingItem.nombre = nombre;
          existingItem.orden = index;
          existingItem.activo = activo;
          existingItem.updatedBy = currentUserId;
          await existingItem.save();
          continue;
        }

        const created = await ComercialAgendaPuesto.create({
          unidadNegocio: unidadNegocioId,
          nombre,
          orden: index,
          activo,
          createdBy: currentUserId,
          updatedBy: currentUserId,
        });

        seenIds.add(String(created._id));
      }

      for (const item of existing) {
        const itemId = String(item._id);
        if (seenIds.has(itemId)) {
          continue;
        }

        item.activo = false;
        item.updatedBy = currentUserId;
        await item.save();
      }

      const puestos = await ComercialAgendaPuesto.find({ unidadNegocio: unidadNegocioId })
        .sort({ orden: 1, nombre: 1 })
        .lean();

      return res.status(200).json({
        data: puestos.map(buildPuestoResponse),
        message: "Puestos guardados correctamente",
      });
    } catch (error) {
      logError("ComercialAgendaController.savePuestos");
      console.error(error);
      return res.status(500).json({ message: "Error al guardar los puestos" });
    }
  };

  static getWeek = async (req: Request, res: Response) => {
    try {
      if (!ComercialAgendaController.ensureReadAccess(req, res)) {
        return;
      }

      const referenceDate = parseDateInput(req.query.from) ?? startOfDay(new Date());
      const unidadNegocioId = await ComercialAgendaController.resolveUnidadNegocioId(
        req,
        res,
        req.query.unidadNegocioId,
      );
      if (!unidadNegocioId) {
        return;
      }
      const weekStart = startOfWeek(referenceDate);
      const weekEnd = endOfWeek(referenceDate);

      const [puestos, asignaciones] = await Promise.all([
        ComercialAgendaPuesto.find({ unidadNegocio: unidadNegocioId, activo: true })
          .sort({ orden: 1, nombre: 1 })
          .lean(),
        ComercialAgendaAsignacion.find({
          unidadNegocio: unidadNegocioId,
          fecha: {
            $gte: weekStart,
            $lte: weekEnd,
          },
        })
          .populate("asistentes", "name lastName email")
          .lean(),
      ]);

      const assignmentMap = new Map<string, any>();
      asignaciones.forEach((item) => {
        const fechaKey = startOfDay(new Date(item.fecha)).toISOString();
        assignmentMap.set(`${fechaKey}:${String(item.puesto)}`, item);
      });

      const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)).map((date) => ({
        fecha: date.toISOString(),
        fechaLabel: formatDateLabel(date),
        weekdayLabel: formatWeekDayLabel(date),
        cells: puestos.map((puesto) =>
          buildCellResponse({
            fecha: date,
            puesto,
            asignacion: assignmentMap.get(`${date.toISOString()}:${String(puesto._id)}`) ?? null,
          }),
        ),
      }));

      return res.status(200).json({
        data: {
          weekStart: weekStart.toISOString(),
          weekEnd: weekEnd.toISOString(),
          weekLabel: `Semana del ${formatDateLabel(weekStart)} al ${formatDateLabel(weekEnd)}`,
          puestos: puestos.map(buildPuestoResponse),
          days,
        },
      });
    } catch (error) {
      logError("ComercialAgendaController.getWeek");
      console.error(error);
      return res.status(500).json({ message: "Error al obtener la agenda semanal" });
    }
  };

  static saveCell = async (req: Request, res: Response) => {
    try {
      if (!ComercialAgendaController.ensureManageAccess(req, res)) {
        return;
      }

      const fecha = parseDateInput(req.body?.fecha);
      const puestoId = normalizeText(req.body?.puestoId);

      const unidadNegocioId = await ComercialAgendaController.resolveUnidadNegocioId(
        req,
        res,
        req.body?.unidadNegocioId,
      );
      if (!unidadNegocioId) {
        return;
      }

      if (!fecha) {
        return res.status(400).json({ error: "La fecha es obligatoria y debe tener formato YYYY-MM-DD" });
      }

      if (!mongoose.isValidObjectId(puestoId)) {
        return res.status(400).json({ error: "El puesto seleccionado no es valido" });
      }

      const puesto = await ComercialAgendaPuesto.findOne({
        _id: new mongoose.Types.ObjectId(puestoId),
        unidadNegocio: unidadNegocioId,
      }).lean();
      if (!puesto) {
        return res.status(404).json({ error: "El puesto seleccionado no existe" });
      }

      const asistentesValidation = await validateAsistentes(
        req.body?.asistentes,
        unidadNegocioId,
      );
      if ("error" in asistentesValidation) {
        return res.status(400).json({ error: asistentesValidation.error });
      }

      const currentUserId = new mongoose.Types.ObjectId(req.user!._id);
      let asignacion = await ComercialAgendaAsignacion.findOne({
        unidadNegocio: unidadNegocioId,
        fecha,
        puesto: new mongoose.Types.ObjectId(puestoId),
      });

      if (!asistentesValidation.data.length) {
        if (asignacion) {
          await ComercialAgendaAsignacion.deleteOne({ _id: asignacion._id });
        }

        return res.status(200).json({
          data: buildCellResponse({ fecha, puesto, asignacion: null }),
          message: "Asignacion eliminada correctamente",
        });
      }

      if (!asignacion) {
        asignacion = await ComercialAgendaAsignacion.create({
          fecha,
          unidadNegocio: unidadNegocioId,
          puesto: new mongoose.Types.ObjectId(puestoId),
          asistentes: asistentesValidation.data,
          createdBy: currentUserId,
          updatedBy: currentUserId,
        });
      } else {
        asignacion.asistentes = asistentesValidation.data;
        asignacion.updatedBy = currentUserId;
        await asignacion.save();
      }

      const populated = await ComercialAgendaAsignacion.findById(asignacion._id)
        .populate("asistentes", "name lastName email")
        .lean();

      return res.status(200).json({
        data: buildCellResponse({ fecha, puesto, asignacion: populated }),
        message: "Asignacion guardada correctamente",
      });
    } catch (error) {
      logError("ComercialAgendaController.saveCell");
      console.error(error);
      return res.status(500).json({ message: "Error al guardar la asignacion" });
    }
  };
}
