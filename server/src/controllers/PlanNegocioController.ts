import { Request, Response } from "express";
import { QueryTypes } from "sequelize";
import PlanNegocio from "../models/PlanNegocio";
import { sequelizeNIC } from "../config/database";
import { getAsignacionesPlanNegocio, getModelosPlanNegocio } from "./querys/dms.query";
import { logError } from "../utils/logError";

const MONTH_KEYS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"] as const;

type MonthKey = (typeof MONTH_KEYS)[number];

type PlanNegocioAsignacionRow = {
  modelo: string | null;
  mes: number;
  cantidad: number;
};

const parseActivo = (value: unknown) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
};

const normalizeModelo = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const normalizeAnio = (value: unknown) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 2000 || parsed > 2100) {
    return null;
  }

  return parsed;
};

const normalizeObjetivo = (value: unknown) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
};

const getRemainingMonths = (anio: number) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (anio < currentYear) return 0;
  if (anio > currentYear) return 12;

  return Math.max(12 - currentMonth, 0);
};

const emptyMonths = () =>
  MONTH_KEYS.reduce(
    (acc, monthKey) => {
      acc[monthKey] = 0;
      return acc;
    },
    {} as Record<MonthKey, number>,
  );

export class PlanNegocioController {
  static list = async (req: Request, res: Response) => {
    try {
      const activo = parseActivo(req.query.activo);
      const anio = normalizeAnio(req.query.anio);
      const filter: Record<string, unknown> = {};

      if (typeof activo === "boolean") {
        filter.activo = activo;
      }

      if (anio) {
        filter.anio = anio;
      }

      const data = await PlanNegocio.find(filter).sort({ anio: -1, modelo: 1 }).lean();
      return res.status(200).json({ data });
    } catch (error) {
      logError("PlanNegocioController.list");
      console.error(error);
      return res.status(500).json({ message: "Error al listar plan de negocio" });
    }
  };

  static modelos = async (_req: Request, res: Response) => {
    try {
      const data = await sequelizeNIC.query<{ modelo: string | null }>(getModelosPlanNegocio(), {
        type: QueryTypes.SELECT,
      });

      const modelos = Array.from(
        new Set(
          data
            .map((item) => normalizeModelo(item.modelo))
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b, "es"));

      return res.status(200).json({ data: modelos });
    } catch (error) {
      logError("PlanNegocioController.modelos");
      console.error(error);
      return res.status(500).json({ message: "Error al obtener modelos de plan de negocio" });
    }
  };

  static create = async (req: Request, res: Response) => {
    const modelo = normalizeModelo(req.body?.modelo);
    const anio = normalizeAnio(req.body?.anio);
    const objetivo = normalizeObjetivo(req.body?.objetivo);
    const activo = req.body?.activo ?? true;

    if (!modelo) {
      return res.status(400).json({ error: "El modelo es obligatorio" });
    }

    if (!anio) {
      return res.status(400).json({ error: "El año es obligatorio" });
    }

    if (objetivo === null) {
      return res.status(400).json({ error: "El objetivo debe ser un entero mayor o igual a 0" });
    }

    try {
      const existing = await PlanNegocio.findOne({
        anio,
        modelo: new RegExp(`^${modelo}$`, "i"),
      }).lean();

      if (existing) {
        return res.status(400).json({ error: "Ya existe un objetivo para ese modelo y año" });
      }

      const data = await PlanNegocio.create({
        modelo,
        anio,
        objetivo,
        activo: Boolean(activo),
      });

      return res.status(201).json({ message: "Plan de negocio creado correctamente", data });
    } catch (error) {
      logError("PlanNegocioController.create");
      console.error(error);
      return res.status(500).json({ message: "Error al crear el plan de negocio" });
    }
  };

  static update = async (req: Request, res: Response) => {
    const modelo = normalizeModelo(req.body?.modelo);
    const anio = normalizeAnio(req.body?.anio);
    const objetivo = normalizeObjetivo(req.body?.objetivo);

    if (!modelo) {
      return res.status(400).json({ error: "El modelo es obligatorio" });
    }

    if (!anio) {
      return res.status(400).json({ error: "El año es obligatorio" });
    }

    if (objetivo === null) {
      return res.status(400).json({ error: "El objetivo debe ser un entero mayor o igual a 0" });
    }

    try {
      const plan = await PlanNegocio.findById(req.params.id);

      if (!plan) {
        return res.status(404).json({ error: "Plan de negocio no encontrado" });
      }

      const existing = await PlanNegocio.findOne({
        _id: { $ne: plan._id },
        anio,
        modelo: new RegExp(`^${modelo}$`, "i"),
      }).lean();

      if (existing) {
        return res.status(400).json({ error: "Ya existe un objetivo para ese modelo y año" });
      }

      plan.modelo = modelo;
      plan.anio = anio;
      plan.objetivo = objetivo;
      plan.activo = Boolean(req.body?.activo ?? plan.activo);
      await plan.save();

      return res.status(200).json({ message: "Plan de negocio actualizado correctamente", data: plan });
    } catch (error) {
      logError("PlanNegocioController.update");
      console.error(error);
      return res.status(500).json({ message: "Error al actualizar el plan de negocio" });
    }
  };

  static remove = async (req: Request, res: Response) => {
    try {
      const data = await PlanNegocio.findByIdAndDelete(req.params.id).lean();

      if (!data) {
        return res.status(404).json({ error: "Plan de negocio no encontrado" });
      }

      return res.status(200).json({ message: "Plan de negocio eliminado correctamente", data });
    } catch (error) {
      logError("PlanNegocioController.remove");
      console.error(error);
      return res.status(500).json({ message: "Error al eliminar el plan de negocio" });
    }
  };

  static resumen = async (req: Request, res: Response) => {
    const anio = normalizeAnio(req.params.anio);

    if (!anio) {
      return res.status(400).json({ error: "Año no válido" });
    }

    try {
      const [planes, asignaciones] = await Promise.all([
        PlanNegocio.find({ anio, activo: true }).sort({ modelo: 1 }).lean(),
        sequelizeNIC.query<PlanNegocioAsignacionRow>(getAsignacionesPlanNegocio(), {
          type: QueryTypes.SELECT,
          replacements: { anio: String(anio).slice(-2) },
        }),
      ]);

      const rows = new Map<
        string,
        {
          modelo: string;
          objetivo: number;
          totalAsignado: number;
          avance: number;
          restante: number;
          xMes: number;
          meses: Record<MonthKey, number>;
        }
      >();

      for (const plan of planes) {
        rows.set(plan.modelo, {
          modelo: plan.modelo,
          objetivo: plan.objetivo,
          totalAsignado: 0,
          avance: 0,
          restante: plan.objetivo,
          xMes: 0,
          meses: emptyMonths(),
        });
      }

      for (const asignacion of asignaciones) {
        const modelo = normalizeModelo(asignacion.modelo);
        if (!modelo) continue;

        const monthIndex = Number(asignacion.mes) - 1;
        if (monthIndex < 0 || monthIndex >= MONTH_KEYS.length) continue;

        const current =
          rows.get(modelo) ??
          {
            modelo,
            objetivo: 0,
            totalAsignado: 0,
            avance: 0,
            restante: 0,
            xMes: 0,
            meses: emptyMonths(),
          };

        const monthKey = MONTH_KEYS[monthIndex];
        current.meses[monthKey] += Number(asignacion.cantidad ?? 0);
        rows.set(modelo, current);
      }

      const mesesRestantes = getRemainingMonths(anio);

      const data = Array.from(rows.values())
        .sort((a, b) => a.modelo.localeCompare(b.modelo, "es"))
        .map((row) => {
          const totalAsignado = MONTH_KEYS.reduce((acc, monthKey) => acc + row.meses[monthKey], 0);
          const restante = row.objetivo - totalAsignado;
          const avance = row.objetivo > 0 ? Math.round((totalAsignado / row.objetivo) * 100) : 0;
          const xMes = mesesRestantes > 0 ? Math.round(restante / mesesRestantes) : 0;

          return {
            modelo: row.modelo,
            objetivo: row.objetivo,
            ...row.meses,
            totalAsignado,
            avance,
            restante,
            xMes,
          };
        });

      const totalObjetivo = data.reduce((acc, row) => acc + row.objetivo, 0);
      const totalAsignado = data.reduce((acc, row) => acc + row.totalAsignado, 0);
      const totalMeses = MONTH_KEYS.reduce(
        (acc, monthKey) => {
          acc[monthKey] = data.reduce((monthTotal, row) => monthTotal + row[monthKey], 0);
          return acc;
        },
        {} as Record<MonthKey, number>,
      );
      const totalRestante = totalObjetivo - totalAsignado;
      const totalAvance = totalObjetivo > 0 ? Math.round((totalAsignado / totalObjetivo) * 100) : 0;
      const totalXMes = mesesRestantes > 0 ? Math.round(totalRestante / mesesRestantes) : 0;

      return res.status(200).json({
        data,
        total: {
          modelo: "TOTAL",
          objetivo: totalObjetivo,
          ...totalMeses,
          totalAsignado,
          avance: totalAvance,
          restante: totalRestante,
          xMes: totalXMes,
        },
        meta: {
          anio,
          mesesRestantes,
        },
      });
    } catch (error) {
      logError("PlanNegocioController.resumen");
      console.error(error);
      return res.status(500).json({ message: "Error al generar el resumen del plan de negocio" });
    }
  };
}
