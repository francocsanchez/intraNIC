import { Request, Response } from "express";
import TestDrive from "../models/TestDrive";
import TestDriveRegistro from "../models/TestDriveRegistro";
import {
  hasEnabledModule,
  sanitizeUserModules,
  type ModuleKey,
} from "../constants/modules";
import {
  canAccessByRole,
  hasSuperAdminRole,
  normalizeRoles,
  type RoleAccessKey,
} from "../constants/roleAccess";
import { logError } from "../utils/logError";

const normalizeDate = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const normalizeTime = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const normalizeText = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const VALID_NEGOCIOS = ["convencional", "planAhorro"] as const;
type RegistroNegocio = (typeof VALID_NEGOCIOS)[number];

const registroAccessByNegocio: Record<
  RegistroNegocio,
  {
    module: ModuleKey;
    read: RoleAccessKey;
    create: RoleAccessKey;
    updateOwn: RoleAccessKey;
    deleteOwn: RoleAccessKey;
    deleteManaged: RoleAccessKey;
  }
> = {
  convencional: {
    module: "registroTestDriveConvencional",
    read: "comercial.testDriveRegistroConvencional.read",
    create: "comercial.testDriveRegistroConvencional.create",
    updateOwn: "comercial.testDriveRegistroConvencional.updateOwn",
    deleteOwn: "comercial.testDriveRegistroConvencional.deleteOwn",
    deleteManaged: "comercial.testDriveRegistroConvencional.deleteManaged",
  },
  planAhorro: {
    module: "registroTestDrive",
    read: "planAhorro.testDriveRegistro.read",
    create: "planAhorro.testDriveRegistro.create",
    updateOwn: "planAhorro.testDriveRegistro.updateOwn",
    deleteOwn: "planAhorro.testDriveRegistro.deleteOwn",
    deleteManaged: "planAhorro.testDriveRegistro.deleteManaged",
  },
};

const buildDateTime = (date: string, time: string) => {
  const parsed = new Date(`${date}T${time}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeNegocio = (value: unknown): RegistroNegocio | null => {
  const negocio = normalizeText(value) as RegistroNegocio;
  return VALID_NEGOCIOS.includes(negocio) ? negocio : null;
};

const hasStarted = (retiroAt: Date | string) => {
  const parsed = new Date(retiroAt);
  return !Number.isNaN(parsed.getTime()) && parsed.getTime() <= Date.now();
};

const userHasNegocioModule = (user: Request["user"], negocio: RegistroNegocio) => {
  if (!user) {
    return false;
  }

  if (hasSuperAdminRole(user.role)) {
    return true;
  }

  const modules = sanitizeUserModules(user.modules);
  return hasEnabledModule(modules, [registroAccessByNegocio[negocio].module]);
};

const userCanAccessNegocio = (
  user: Request["user"],
  negocio: RegistroNegocio,
  action: "read" | "create" | "updateOwn" | "deleteOwn" | "deleteManaged",
) => {
  if (!user) {
    return false;
  }

  if (hasSuperAdminRole(user.role)) {
    return true;
  }

  if (!userHasNegocioModule(user, negocio)) {
    return false;
  }

  if (negocio === "planAhorro") {
    if (action === "deleteManaged") {
      return false;
    }

    return true;
  }

  return canAccessByRole(user.role, registroAccessByNegocio[negocio][action]);
};

const canDeleteManaged = (roles: unknown) => {
  if (hasSuperAdminRole(roles)) {
    return true;
  }

  const normalizedRoles = new Set(normalizeRoles(roles));
  return normalizedRoles.has("supervisor") || normalizedRoles.has("gerente");
};

const formatRegistro = (item: any) => ({
  _id: String(item._id),
  unidadId: item.unidadId?._id ? String(item.unidadId._id) : String(item.unidadId),
  dominio: item.unidadId?.dominio ?? item.dominio ?? "",
  versionNombre: item.unidadId?.version?.nombre ?? item.versionNombre ?? "",
  negocio: item.unidadId?.negocio ?? item.negocio ?? "",
  permiteStarlink: Boolean(item.unidadId?.permiteStarlink),
  fechaSolicitado: item.fechaSolicitado,
  fechaRetiro: item.fechaRetiro,
  horaRetiro: item.horaRetiro,
  fechaRegreso: item.fechaRegreso,
  horaRegreso: item.horaRegreso,
  retiroAt: item.retiroAt,
  regresoAt: item.regresoAt,
  starlink: Boolean(item.starlink),
  observacion: item.observacion ?? "",
  solicitadoPorId: item.solicitadoPorId,
  solicitadoPorNombre: item.solicitadoPorNombre,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

const validatePayload = async (
  payload: Record<string, unknown>,
  negocio: RegistroNegocio,
  currentId?: string,
) => {
  const unidadId = typeof payload.unidadId === "string" ? payload.unidadId.trim() : "";
  const fechaRetiro = normalizeDate(payload.fechaRetiro);
  const horaRetiro = normalizeTime(payload.horaRetiro);
  const fechaRegreso = normalizeDate(payload.fechaRegreso);
  const horaRegreso = normalizeTime(payload.horaRegreso);
  const starlink = Boolean(payload.starlink);
  const observacion = normalizeText(payload.observacion);

  if (!unidadId) {
    return { error: "La unidad es obligatoria" };
  }

  if (!fechaRetiro) {
    return { error: "La fecha de retiro es obligatoria" };
  }

  if (!horaRetiro) {
    return { error: "La hora de retiro es obligatoria" };
  }

  if (!fechaRegreso) {
    return { error: "La fecha de regreso es obligatoria" };
  }

  if (!horaRegreso) {
    return { error: "La hora de regreso es obligatoria" };
  }

  const retiroAt = buildDateTime(fechaRetiro, horaRetiro);
  const regresoAt = buildDateTime(fechaRegreso, horaRegreso);

  if (!retiroAt) {
    return { error: "La fecha y hora de retiro no son validas" };
  }

  if (!regresoAt) {
    return { error: "La fecha y hora de regreso no son validas" };
  }

  if (regresoAt <= retiroAt) {
    return { error: "La fecha y hora de regreso deben ser posteriores al retiro" };
  }

  const unidad = await TestDrive.findById(unidadId)
    .populate("version", "nombre")
    .lean();

  if (!unidad) {
    return { error: "La unidad seleccionada no existe" };
  }

  if (!unidad.activo) {
    return { error: "La unidad seleccionada no esta activa" };
  }

  if (unidad.negocio !== negocio) {
    return { error: "La unidad seleccionada no corresponde a este negocio" };
  }

  if (starlink && !unidad.permiteStarlink) {
    return { error: "La unidad seleccionada no tiene StarLink disponible" };
  }

  const conflict = await TestDriveRegistro.findOne({
    ...(currentId ? { _id: { $ne: currentId } } : {}),
    unidadId,
    retiroAt: { $lt: regresoAt },
    regresoAt: { $gt: retiroAt },
  }).lean();

  if (conflict) {
    return { error: "La unidad ya esta ocupada en ese periodo" };
  }

  return {
    data: {
      unidadId: unidad._id,
      fechaRetiro,
      horaRetiro,
      fechaRegreso,
      horaRegreso,
      retiroAt,
      regresoAt,
      starlink,
      observacion,
    },
  };
};

const resolveUnidadIdsByNegocio = async (negocio: RegistroNegocio, unidadId?: string) => {
  const filter: Record<string, unknown> = { negocio };

  if (unidadId) {
    filter._id = unidadId;
  }

  const unidades = await TestDrive.find(filter).select("_id").lean();
  return unidades.map((unidad: any) => unidad._id);
};

export class TestDriveRegistroController {
  static list = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      const negocio = normalizeNegocio(req.query.negocio);

      if (!negocio) {
        return res.status(400).json({ error: "El negocio seleccionado no es valido" });
      }

      if (!userCanAccessNegocio(req.user, negocio, "read")) {
        return res.status(403).json({
          error: "No tienes permisos para acceder a los registros de este negocio",
        });
      }

      const from = typeof req.query.from === "string" ? req.query.from.trim() : "";
      const to = typeof req.query.to === "string" ? req.query.to.trim() : "";
      const unidadId = typeof req.query.unidadId === "string" ? req.query.unidadId.trim() : "";

      const filter: Record<string, unknown> = {};
      const allowedUnidadIds = await resolveUnidadIdsByNegocio(negocio, unidadId || undefined);
      filter.unidadId = { $in: allowedUnidadIds };

      const fromDate = from ? new Date(from) : null;
      const toDate = to ? new Date(to) : null;

      if (fromDate && !Number.isNaN(fromDate.getTime()) && toDate && !Number.isNaN(toDate.getTime())) {
        filter.retiroAt = { $lt: toDate };
        filter.regresoAt = { $gt: fromDate };
      }

      const data = await TestDriveRegistro.find(filter)
        .populate({
          path: "unidadId",
          select: "dominio version activo negocio permiteStarlink",
          populate: {
            path: "version",
            select: "nombre",
          },
        })
        .lean();

      const sortedData = data.sort((a: any, b: any) => {
        const dominioA = String(a.unidadId?.dominio ?? "").localeCompare(String(b.unidadId?.dominio ?? ""), "es", {
          sensitivity: "base",
        });

        if (dominioA !== 0) {
          return dominioA;
        }

        const retiroDiff = new Date(a.retiroAt).getTime() - new Date(b.retiroAt).getTime();
        if (retiroDiff !== 0) {
          return retiroDiff;
        }

        return new Date(b.fechaSolicitado).getTime() - new Date(a.fechaSolicitado).getTime();
      });

      return res.status(200).json({ data: sortedData.map(formatRegistro) });
    } catch (error) {
      logError("TestDriveRegistroController.list");
      console.error(error);
      return res.status(500).json({ message: "Error al listar los registros de TestDrive" });
    }
  };

  static create = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      const negocio = normalizeNegocio(req.body?.negocio);

      if (!negocio) {
        return res.status(400).json({ error: "El negocio seleccionado no es valido" });
      }

      if (!userCanAccessNegocio(req.user, negocio, "create")) {
        return res.status(403).json({
          error: "No tienes permisos para crear registros en este negocio",
        });
      }

      const validation = await validatePayload(req.body ?? {}, negocio);
      if ("error" in validation) {
        return res.status(400).json({ error: validation.error });
      }

      const data = await TestDriveRegistro.create({
        ...validation.data,
        fechaSolicitado: new Date(),
        solicitadoPorId: req.user._id,
        solicitadoPorNombre: `${req.user.lastName}, ${req.user.name}`,
      });

      const populated = await TestDriveRegistro.findById(data._id)
        .populate({
          path: "unidadId",
          select: "dominio version activo negocio permiteStarlink",
          populate: {
            path: "version",
            select: "nombre",
          },
        })
        .lean();

      return res.status(201).json({
        message: "Registro de TestDrive creado correctamente",
        data: populated ? formatRegistro(populated) : null,
      });
    } catch (error) {
      logError("TestDriveRegistroController.create");
      console.error(error);
      return res.status(500).json({ message: "Error al crear el registro de TestDrive" });
    }
  };

  static update = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      const registro = await TestDriveRegistro.findById(req.params.id);
      if (!registro) {
        return res.status(404).json({ error: "Registro de TestDrive no encontrado" });
      }

      const currentUnidad = await TestDrive.findById(registro.unidadId).select("negocio").lean();

      const negocio = normalizeNegocio(req.body?.negocio);

      if (!negocio) {
        return res.status(400).json({ error: "El negocio seleccionado no es valido" });
      }

      if (currentUnidad?.negocio !== negocio) {
        return res.status(403).json({ error: "No puedes mover un registro a otro negocio" });
      }

      if (!userCanAccessNegocio(req.user, negocio, "updateOwn")) {
        return res.status(403).json({
          error: "No tienes permisos para editar registros de este negocio",
        });
      }

      if (!hasSuperAdminRole(req.user.role) && negocio === "planAhorro" && hasStarted(registro.retiroAt)) {
        return res.status(403).json({
          error: "No puedes editar un registro de TestDrive una vez iniciada la fecha y hora del turno",
        });
      }

      if (!hasSuperAdminRole(req.user.role) && registro.solicitadoPorId !== req.user._id) {
        return res.status(403).json({ error: "Solo puedes editar registros cargados por tu usuario" });
      }

      const validation = await validatePayload(req.body ?? {}, negocio, String(req.params.id));
      if ("error" in validation) {
        return res.status(400).json({ error: validation.error });
      }

      Object.assign(registro, validation.data);
      await registro.save();

      const populated = await TestDriveRegistro.findById(registro._id)
        .populate({
          path: "unidadId",
          select: "dominio version activo negocio permiteStarlink",
          populate: {
            path: "version",
            select: "nombre",
          },
        })
        .lean();

      return res.status(200).json({
        message: "Registro de TestDrive actualizado correctamente",
        data: populated ? formatRegistro(populated) : null,
      });
    } catch (error) {
      logError("TestDriveRegistroController.update");
      console.error(error);
      return res.status(500).json({ message: "Error al actualizar el registro de TestDrive" });
    }
  };

  static remove = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      const registro = await TestDriveRegistro.findById(req.params.id);
      if (!registro) {
        return res.status(404).json({ error: "Registro de TestDrive no encontrado" });
      }

      const unidad = await TestDrive.findById(registro.unidadId).select("negocio").lean();
      const negocio = unidad?.negocio as RegistroNegocio | undefined;

      if (!unidad || !negocio || !VALID_NEGOCIOS.includes(negocio)) {
        return res.status(400).json({ error: "No se pudo determinar el negocio del registro" });
      }

      if (!hasSuperAdminRole(req.user.role) && negocio === "planAhorro" && hasStarted(registro.retiroAt)) {
        return res.status(403).json({
          error: "No puedes eliminar un registro de TestDrive una vez iniciada la fecha y hora del turno",
        });
      }

      const isOwnRecord = registro.solicitadoPorId === req.user._id;
      const canDelete =
        (isOwnRecord && userCanAccessNegocio(req.user, negocio, "deleteOwn")) ||
        (!isOwnRecord && userCanAccessNegocio(req.user, negocio, "deleteManaged")) ||
        (isOwnRecord && canDeleteManaged(req.user.role) && userHasNegocioModule(req.user, negocio));

      if (!canDelete) {
        return res.status(403).json({ error: "No tienes permisos para eliminar este registro" });
      }

      await registro.deleteOne();

      return res.status(200).json({
        message: "Registro de TestDrive eliminado correctamente",
        data: null,
      });
    } catch (error) {
      logError("TestDriveRegistroController.remove");
      console.error(error);
      return res.status(500).json({ message: "Error al eliminar el registro de TestDrive" });
    }
  };
}
