import { Request, Response } from "express";
import mongoose from "mongoose";
import Color from "../models/Color";
import TestDrive from "../models/TestDrive";
import Version from "../models/Version";
import {
  hasEnabledModule,
  sanitizeUserModules,
  type ModuleKey,
} from "../constants/modules";
import {
  canAccessByRole,
  hasSuperAdminRole,
  type RoleAccessKey,
} from "../constants/roleAccess";
import { logError } from "../utils/logError";

const CURRENT_YEAR = new Date().getFullYear() + 1;
const MIN_YEAR = 1980;

const normalizeText = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const normalizeUpperText = (value: unknown) => normalizeText(value).toUpperCase();
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const VALID_NEGOCIOS = ["convencional", "planAhorro"] as const;
type RegistroNegocio = (typeof VALID_NEGOCIOS)[number];

const registroAccessByNegocio: Record<
  RegistroNegocio,
  {
    module: ModuleKey;
    read: RoleAccessKey;
  }
> = {
  convencional: {
    module: "registroTestDriveConvencional",
    read: "comercial.testDriveRegistroConvencional.read",
  },
  planAhorro: {
    module: "registroTestDrive",
    read: "planAhorro.testDriveRegistro.read",
  },
};

const isValidObjectId = (value: unknown) =>
  typeof value === "string" && mongoose.Types.ObjectId.isValid(value);

const normalizeNegocio = (value: unknown): RegistroNegocio | null => {
  const negocio = normalizeText(value) as RegistroNegocio;
  return VALID_NEGOCIOS.includes(negocio) ? negocio : null;
};

const canAccessNegocioOptions = (req: Request, negocio: RegistroNegocio) => {
  if (!req.user) {
    return false;
  }

  if (hasSuperAdminRole(req.user.role)) {
    return true;
  }

  const modules = sanitizeUserModules(req.user.modules);
  const config = registroAccessByNegocio[negocio];

  if (hasEnabledModule(modules, ["testDrive"]) && canAccessByRole(req.user.role, "sistema.testDrive")) {
    return true;
  }

  return hasEnabledModule(modules, [config.module]) && canAccessByRole(req.user.role, config.read);
};

const formatRow = (item: any) => ({
  _id: String(item._id),
  dominio: item.dominio,
  modelo: item.modelo,
  version: item.version?._id ? String(item.version._id) : String(item.version),
  versionNombre: item.version?.nombre ?? "",
  chasis: item.chasis,
  color: item.color?._id ? String(item.color._id) : String(item.color),
  colorNombre: item.color?.nombre ?? "",
  negocio: item.negocio,
  anio: item.anio,
  permiteStarlink: Boolean(item.permiteStarlink),
  activo: item.activo,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

const validatePayload = async (payload: Record<string, unknown>, currentId?: string) => {
  const dominio = normalizeUpperText(payload.dominio);
  const modelo = normalizeText(payload.modelo);
  const chasis = normalizeUpperText(payload.chasis);
  const versionId = typeof payload.versionId === "string" ? payload.versionId.trim() : "";
  const colorId = typeof payload.colorId === "string" ? payload.colorId.trim() : "";
  const negocio = normalizeText(payload.negocio) as "convencional" | "planAhorro";
  const anio = Number(payload.anio);
  const permiteStarlink = Boolean(payload.permiteStarlink);

  if (!dominio) {
    return { error: "El dominio es obligatorio" };
  }

  if (!modelo) {
    return { error: "El modelo es obligatorio" };
  }

  if (!chasis) {
    return { error: "El chasis es obligatorio" };
  }

  if (!isValidObjectId(versionId)) {
    return { error: "La version seleccionada no es valida" };
  }

  if (!isValidObjectId(colorId)) {
    return { error: "El color seleccionado no es valido" };
  }

  if (!["convencional", "planAhorro"].includes(negocio)) {
    return { error: "El negocio seleccionado no es valido" };
  }

  if (!Number.isInteger(anio) || anio < MIN_YEAR || anio > CURRENT_YEAR) {
    return { error: `El anio debe estar entre ${MIN_YEAR} y ${CURRENT_YEAR}` };
  }

  const [version, color] = await Promise.all([
    Version.findById(versionId).lean(),
    Color.findById(colorId).lean(),
  ]);

  if (!version) {
    return { error: "La version seleccionada no existe" };
  }

  if (!color) {
    return { error: "El color seleccionado no existe" };
  }

  const duplicateFilterBase = currentId ? { _id: { $ne: currentId } } : {};

  const [existingDominio, existingChasis] = await Promise.all([
    TestDrive.findOne({
      ...duplicateFilterBase,
      dominio: new RegExp(`^${escapeRegex(dominio)}$`, "i"),
    }).lean(),
    TestDrive.findOne({
      ...duplicateFilterBase,
      chasis: new RegExp(`^${escapeRegex(chasis)}$`, "i"),
    }).lean(),
  ]);

  if (existingDominio) {
    return { error: "Ya existe una unidad de TestDrive con ese dominio" };
  }

  if (existingChasis) {
    return { error: "Ya existe una unidad de TestDrive con ese chasis" };
  }

  return {
    data: {
      dominio,
      modelo,
      version: version._id,
      chasis,
      color: color._id,
      negocio,
      anio,
      permiteStarlink,
    },
  };
};

export class TestDriveController {
  static listActiveOptions = async (req: Request, res: Response) => {
    try {
      const negocio = normalizeNegocio(req.query.negocio);

      if (req.query.negocio !== undefined && !negocio) {
        return res.status(400).json({ error: "El negocio seleccionado no es valido" });
      }

      if (negocio && !canAccessNegocioOptions(req, negocio)) {
        return res.status(403).json({
          error: "No tienes permisos para acceder a las unidades de este negocio",
        });
      }

      const filter = negocio ? { activo: true, negocio } : { activo: true };

      const data = await TestDrive.find(filter)
        .populate("version", "nombre")
        .sort({ dominio: 1 })
        .lean();

      return res.status(200).json({
        data: data.map((item: any) => ({
          _id: String(item._id),
          dominio: item.dominio,
          version: item.version?._id ? String(item.version._id) : "",
          versionNombre: item.version?.nombre ?? "",
          permiteStarlink: Boolean(item.permiteStarlink),
        })),
      });
    } catch (error) {
      logError("TestDriveController.listActiveOptions");
      console.error(error);
      return res.status(500).json({ message: "Error al listar las unidades activas de TestDrive" });
    }
  };

  static list = async (_req: Request, res: Response) => {
    try {
      const data = await TestDrive.find({})
        .populate("version", "nombre")
        .populate("color", "nombre")
        .sort({ activo: -1, dominio: 1, modelo: 1 })
        .lean();

      return res.status(200).json({
        data: data.map(formatRow),
      });
    } catch (error) {
      logError("TestDriveController.list");
      console.error(error);
      return res.status(500).json({ message: "Error al listar las unidades de TestDrive" });
    }
  };

  static create = async (req: Request, res: Response) => {
    try {
      const validation = await validatePayload(req.body ?? {});

      if ("error" in validation) {
        return res.status(400).json({ error: validation.error });
      }

      const data = await TestDrive.create(validation.data);
      const populated = await TestDrive.findById(data._id)
        .populate("version", "nombre")
        .populate("color", "nombre")
        .lean();

      return res.status(201).json({
        message: "Unidad de TestDrive creada correctamente",
        data: populated ? formatRow(populated) : null,
      });
    } catch (error: any) {
      logError("TestDriveController.create");
      console.error(error);

      if (error?.code === 11000) {
        return res.status(400).json({ error: "Ya existe una unidad con ese dominio o chasis" });
      }

      return res.status(500).json({ message: "Error al crear la unidad de TestDrive" });
    }
  };

  static update = async (req: Request, res: Response) => {
    try {
      const testDrive = await TestDrive.findById(req.params.id);

      if (!testDrive) {
        return res.status(404).json({ error: "Unidad de TestDrive no encontrada" });
      }

      const validation = await validatePayload(req.body ?? {}, String(req.params.id));

      if ("error" in validation) {
        return res.status(400).json({ error: validation.error });
      }

      Object.assign(testDrive, validation.data);
      await testDrive.save();

      const populated = await TestDrive.findById(testDrive._id)
        .populate("version", "nombre")
        .populate("color", "nombre")
        .lean();

      return res.status(200).json({
        message: "Unidad de TestDrive actualizada correctamente",
        data: populated ? formatRow(populated) : null,
      });
    } catch (error: any) {
      logError("TestDriveController.update");
      console.error(error);

      if (error?.code === 11000) {
        return res.status(400).json({ error: "Ya existe una unidad con ese dominio o chasis" });
      }

      return res.status(500).json({ message: "Error al actualizar la unidad de TestDrive" });
    }
  };

  static changeStatus = async (req: Request, res: Response) => {
    try {
      const testDrive = await TestDrive.findById(req.params.id);

      if (!testDrive) {
        return res.status(404).json({ error: "Unidad de TestDrive no encontrada" });
      }

      testDrive.activo = !testDrive.activo;
      await testDrive.save();

      return res.status(200).json({
        message: `Unidad ${testDrive.activo ? "activada" : "desactivada"} correctamente`,
        data: { activo: testDrive.activo },
      });
    } catch (error) {
      logError("TestDriveController.changeStatus");
      console.error(error);
      return res.status(500).json({ message: "Error al cambiar el estado de la unidad de TestDrive" });
    }
  };
}
