import { Request, Response } from "express";
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
}
