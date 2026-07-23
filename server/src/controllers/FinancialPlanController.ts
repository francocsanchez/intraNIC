import { Request, Response } from "express";
import * as XLSX from "xlsx";
import FinancialPlan, { type FinancialValueType } from "../models/FinancialPlan";
import { logError } from "../utils/logError";

const parseActivo = (value: unknown) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
};

const normalizeText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const normalizeNumber = (value: unknown, { min = 0, integer = false }: { min?: number; integer?: boolean } = {}) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min) {
    return null;
  }

  if (integer && !Number.isInteger(parsed)) {
    return null;
  }

  return parsed;
};

const normalizeValueType = (value: unknown): FinancialValueType | null => {
  return value === "porcentaje" || value === "monto" ? value : null;
};

const normalizeSpreadsheetText = (value: unknown) => String(value ?? "").trim();

const normalizeBoolean = (value: unknown) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return ["1", "true", "si", "sí", "yes", "activo"].includes(normalized);
  }

  return false;
};

const hasValidExcelExtension = (filename: string) => /\.(xls|xlsx)$/i.test(filename);

const EXCEL_MIME_TYPES = new Set([
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/octet-stream",
]);

const isExcelCompatibleFile = (file: Express.Multer.File) =>
  hasValidExcelExtension(file.originalname) || EXCEL_MIME_TYPES.has(file.mimetype);

type NormalizedTerm = {
  plazo: number;
  tna: number;
  quebrantoTipo: FinancialValueType;
  quebrantoValor: number;
  maxFinanciacionTipo: FinancialValueType;
  maxFinanciacionValor: number;
  activo: boolean;
};

const normalizeTerms = (value: unknown) => {
  if (!Array.isArray(value) || !value.length) {
    return { error: "Debe cargar al menos un plazo" } as const;
  }

  const plazos: NormalizedTerm[] = [];

  for (const [index, term] of value.entries()) {
    const plazo = normalizeNumber((term as Record<string, unknown>)?.plazo, { min: 1, integer: true });
    const tna = normalizeNumber((term as Record<string, unknown>)?.tna, { min: 0 });
    const quebrantoTipo = normalizeValueType((term as Record<string, unknown>)?.quebrantoTipo);
    const quebrantoValor = normalizeNumber((term as Record<string, unknown>)?.quebrantoValor, { min: 0 });
    const maxFinanciacionTipo = normalizeValueType((term as Record<string, unknown>)?.maxFinanciacionTipo);
    const maxFinanciacionValor = normalizeNumber((term as Record<string, unknown>)?.maxFinanciacionValor, { min: 0 });

    if (!plazo) {
      return { error: `El plazo de la fila ${index + 1} es invalido` } as const;
    }

    if (tna === null) {
      return { error: `La TNA de la fila ${index + 1} es invalida` } as const;
    }

    if (!quebrantoTipo) {
      return { error: `El tipo de quebranto de la fila ${index + 1} es obligatorio` } as const;
    }

    if (quebrantoValor === null) {
      return { error: `El quebranto de la fila ${index + 1} es invalido` } as const;
    }

    if (!maxFinanciacionTipo) {
      return { error: `El tipo de maximo financiable de la fila ${index + 1} es obligatorio` } as const;
    }

    if (maxFinanciacionValor === null) {
      return { error: `El maximo financiable de la fila ${index + 1} es invalido` } as const;
    }

    plazos.push({
      plazo,
      tna,
      quebrantoTipo,
      quebrantoValor,
      maxFinanciacionTipo,
      maxFinanciacionValor,
      activo: Boolean((term as Record<string, unknown>)?.activo ?? true),
    });
  }

  const uniquePlazos = new Set(plazos.map((item) => item.plazo));
  if (uniquePlazos.size !== plazos.length) {
    return { error: "No puede repetir el mismo plazo dentro de un plan" } as const;
  }

  return { data: plazos };
};

export class FinancialPlanController {
  static list = async (req: Request, res: Response) => {
    try {
      const activo = parseActivo(req.query.activo);
      const entidad = normalizeText(req.query.entidad);
      const filter: Record<string, unknown> = {};

      if (typeof activo === "boolean") {
        filter.activo = activo;
      }

      if (entidad) {
        filter.entidad = new RegExp(`^${entidad}$`, "i");
      }

      const data = await FinancialPlan.find(filter).sort({ entidad: 1, nombre: 1 }).lean();
      return res.status(200).json({ data });
    } catch (error) {
      logError("FinancialPlanController.list");
      console.error(error);
      return res.status(500).json({ message: "Error al listar planes financieros" });
    }
  };

  static create = async (req: Request, res: Response) => {
    const entidad = normalizeText(req.body?.entidad);
    const nombre = normalizeText(req.body?.nombre);
    const activo = req.body?.activo ?? true;
    const normalizedTerms = normalizeTerms(req.body?.plazos);

    if (!entidad) {
      return res.status(400).json({ error: "La entidad financiera es obligatoria" });
    }

    if (!nombre) {
      return res.status(400).json({ error: "El nombre del plan es obligatorio" });
    }

    if ("error" in normalizedTerms) {
      return res.status(400).json({ error: normalizedTerms.error });
    }

    try {
      const existing = await FinancialPlan.findOne({
        entidad: new RegExp(`^${entidad}$`, "i"),
        nombre: new RegExp(`^${nombre}$`, "i"),
      }).lean();

      if (existing) {
        return res.status(400).json({ error: "Ya existe un plan con esa entidad y nombre" });
      }

      const data = await FinancialPlan.create({
        entidad,
        nombre,
        activo: Boolean(activo),
        plazos: normalizedTerms.data,
      });

      return res.status(201).json({ message: "Plan financiero creado correctamente", data });
    } catch (error) {
      logError("FinancialPlanController.create");
      console.error(error);
      return res.status(500).json({ message: "Error al crear el plan financiero" });
    }
  };

  static update = async (req: Request, res: Response) => {
    const entidad = normalizeText(req.body?.entidad);
    const nombre = normalizeText(req.body?.nombre);
    const normalizedTerms = normalizeTerms(req.body?.plazos);

    if (!entidad) {
      return res.status(400).json({ error: "La entidad financiera es obligatoria" });
    }

    if (!nombre) {
      return res.status(400).json({ error: "El nombre del plan es obligatorio" });
    }

    if ("error" in normalizedTerms) {
      return res.status(400).json({ error: normalizedTerms.error });
    }

    try {
      const plan = await FinancialPlan.findById(req.params.id);
      if (!plan) {
        return res.status(404).json({ error: "Plan financiero no encontrado" });
      }

      const existing = await FinancialPlan.findOne({
        _id: { $ne: plan._id },
        entidad: new RegExp(`^${entidad}$`, "i"),
        nombre: new RegExp(`^${nombre}$`, "i"),
      }).lean();

      if (existing) {
        return res.status(400).json({ error: "Ya existe un plan con esa entidad y nombre" });
      }

      plan.entidad = entidad;
      plan.nombre = nombre;
      plan.activo = Boolean(req.body?.activo ?? plan.activo);
      plan.plazos = normalizedTerms.data;
      await plan.save();

      return res.status(200).json({ message: "Plan financiero actualizado correctamente", data: plan });
    } catch (error) {
      logError("FinancialPlanController.update");
      console.error(error);
      return res.status(500).json({ message: "Error al actualizar el plan financiero" });
    }
  };

  static remove = async (req: Request, res: Response) => {
    try {
      const data = await FinancialPlan.findByIdAndDelete(req.params.id).lean();

      if (!data) {
        return res.status(404).json({ error: "Plan financiero no encontrado" });
      }

      return res.status(200).json({ message: "Plan financiero eliminado correctamente", data });
    } catch (error) {
      logError("FinancialPlanController.remove");
      console.error(error);
      return res.status(500).json({ message: "Error al eliminar el plan financiero" });
    }
  };

  static exportExcel = async (_req: Request, res: Response) => {
    try {
      const data = await FinancialPlan.find({}).sort({ entidad: 1, nombre: 1 }).lean();

      const rows = data.flatMap((plan) =>
        plan.plazos.map((term) => ({
          planId: String(plan._id),
          entidad: plan.entidad,
          nombre: plan.nombre,
          planActivo: plan.activo ? "SI" : "NO",
          plazo: term.plazo,
          tna: term.tna,
          quebrantoTipo: term.quebrantoTipo,
          quebrantoValor: term.quebrantoValor,
          maxFinanciacionTipo: term.maxFinanciacionTipo,
          maxFinanciacionValor: term.maxFinanciacionValor,
          plazoActivo: term.activo ? "SI" : "NO",
        })),
      );

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Planes");

      const fileBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", 'attachment; filename="cotizador-planes.xlsx"');
      return res.status(200).send(fileBuffer);
    } catch (error) {
      logError("FinancialPlanController.exportExcel");
      console.error(error);
      return res.status(500).json({ message: "Error al exportar los planes financieros" });
    }
  };

  static importExcel = async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: "Debes seleccionar un archivo para importar" });
    }

    if (!isExcelCompatibleFile(req.file)) {
      return res.status(400).json({ error: "El archivo debe ser .xls o .xlsx" });
    }

    try {
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        return res.status(400).json({ error: "El archivo no contiene hojas para importar" });
      }

      const worksheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: "" });

      if (!rows.length) {
        return res.status(400).json({ error: "El archivo no contiene filas de datos" });
      }

      const groups = new Map<string, { entidad: string; nombre: string; activo: boolean; plazos: NormalizedTerm[] }>();

      for (const [index, row] of rows.entries()) {
        const entidad = normalizeSpreadsheetText(row.entidad);
        const nombre = normalizeSpreadsheetText(row.nombre);
        const plazo = normalizeNumber(row.plazo, { min: 1, integer: true });
        const tna = normalizeNumber(row.tna, { min: 0 });
        const quebrantoTipo = normalizeValueType(row.quebrantoTipo);
        const quebrantoValor = normalizeNumber(row.quebrantoValor, { min: 0 });
        const maxFinanciacionTipo = normalizeValueType(row.maxFinanciacionTipo);
        const maxFinanciacionValor = normalizeNumber(row.maxFinanciacionValor, { min: 0 });

        if (!entidad) {
          return res.status(400).json({ error: `La fila ${index + 2} no tiene entidad.` });
        }

        if (!nombre) {
          return res.status(400).json({ error: `La fila ${index + 2} no tiene nombre de plan.` });
        }

        if (!plazo) {
          return res.status(400).json({ error: `La fila ${index + 2} tiene un plazo invalido.` });
        }

        if (tna === null) {
          return res.status(400).json({ error: `La fila ${index + 2} tiene una TNA invalida.` });
        }

        if (!quebrantoTipo || quebrantoValor === null) {
          return res.status(400).json({ error: `La fila ${index + 2} tiene un quebranto invalido.` });
        }

        if (!maxFinanciacionTipo || maxFinanciacionValor === null) {
          return res.status(400).json({ error: `La fila ${index + 2} tiene un maximo financiable invalido.` });
        }

        const key = `${entidad.toLowerCase()}::${nombre.toLowerCase()}`;
        const current = groups.get(key) ?? {
          entidad,
          nombre,
          activo: normalizeBoolean(row.planActivo),
          plazos: [],
        };

        current.plazos.push({
          plazo,
          tna,
          quebrantoTipo,
          quebrantoValor,
          maxFinanciacionTipo,
          maxFinanciacionValor,
          activo: normalizeBoolean(row.plazoActivo),
        });

        groups.set(key, current);
      }

      let created = 0;
      let updated = 0;

      for (const group of groups.values()) {
        const uniquePlazos = new Set(group.plazos.map((item) => item.plazo));
        if (uniquePlazos.size !== group.plazos.length) {
          return res.status(400).json({ error: `El plan ${group.entidad} / ${group.nombre} repite plazos en el archivo.` });
        }

        const existing = await FinancialPlan.findOne({
          entidad: new RegExp(`^${group.entidad}$`, "i"),
          nombre: new RegExp(`^${group.nombre}$`, "i"),
        });

        if (existing) {
          existing.entidad = group.entidad;
          existing.nombre = group.nombre;
          existing.activo = group.activo;
          existing.plazos = group.plazos;
          await existing.save();
          updated += 1;
          continue;
        }

        await FinancialPlan.create(group);
        created += 1;
      }

      return res.status(200).json({
        message: `Importacion completada. ${created} creados y ${updated} actualizados.`,
        data: { created, updated, processed: rows.length, plans: groups.size },
      });
    } catch (error) {
      logError("FinancialPlanController.importExcel");
      console.error(error);
      return res.status(500).json({ message: "Error al importar los planes financieros" });
    }
  };
}
