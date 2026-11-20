import type { Request, Response } from "express";
import mongoose from "mongoose";
import LicitacionAdministracion from "../models/LicitacionAdministracion";
import { logError } from "../utils/logError";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const todayBuenosAires = () => {
  const parts = new Intl.DateTimeFormat("en", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
};
const expiration = (fechaApertura: string, dias: number) => {
  if (!datePattern.test(fechaApertura)) return "";
  const [year, month, day] = fechaApertura.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + dias - 1)).toISOString().slice(0, 10);
};
const stateOf = (item: { tecnica: boolean | null; preAdjudicado: boolean | null; pagare: boolean; oc: boolean; fechaApertura: string; diasMantenimientoOferta: number }) => {
  if (item.tecnica === false || item.preAdjudicado === false) return "PERDIDA";
  if (item.tecnica === null) return "PENDIENTE_TECNICA";
  const vencimientoMantenimiento = expiration(item.fechaApertura, item.diasMantenimientoOferta);
  if (item.preAdjudicado === null && todayBuenosAires() < vencimientoMantenimiento) return "ESPERANDO_MANTENIMIENTO";
  if (item.preAdjudicado === null) return "PENDIENTE_PREADJUDICADO";
  if (!item.pagare) return "PENDIENTE_PAGARE";
  if (!item.oc) return "PENDIENTE_OC";
  return "ADJUDICADA";
};

const progressFields = ["asignada", "equipadaTransformada", "arribada", "patentada", "pagada", "entregada"] as const;
type ProgressField = (typeof progressFields)[number];

const expandUnits = (units: any[] = []) =>
  units.flatMap((unit) =>
    Array.from({ length: Math.max(1, Number(unit.cantidad) || 1) }, () => ({
      versionNombre: String(unit.versionNombre ?? ""),
      asignada: Number.isInteger(Number(unit.interno)) && Number(unit.interno) > 0,
      equipadaTransformada: Boolean(unit.equipadaTransformada),
      arribada: Boolean(unit.arribada),
      patentada: Boolean(unit.patentada),
      pagada: Boolean(unit.pagada),
      entregada: Boolean(unit.entregada),
    })),
  ).sort((first, second) => first.versionNombre.localeCompare(second.versionNombre, "es"));

const progressOf = (units: ReturnType<typeof expandUnits>) =>
  progressFields.reduce((progress, field) => {
    progress[field] = units.filter((unit) => unit[field]).length;
    return progress;
  }, {} as Record<ProgressField, number>);

export class LicitacionesResumenController {
  static list = async (_req: Request, res: Response) => {
    try {
      const items = await LicitacionAdministracion.find({ deletedAt: null })
        .sort({ fechaApertura: -1, createdAt: -1 })
        .select({ entidad: 1, unidades: 1, tecnica: 1, preAdjudicado: 1, pagare: 1, oc: 1, fechaApertura: 1, diasMantenimientoOferta: 1 })
        .lean();
      return res.status(200).json({
        data: items.map((item) => {
          const units = expandUnits(item.unidades as any[]);
          return {
            _id: String(item._id),
            entidad: item.entidad,
            totalUnidades: units.length,
            avance: progressOf(units),
            archivada: units.length > 0 && units.every((unit) => unit.entregada),
            estado: stateOf(item),
          };
        }),
      });
    } catch (error) {
      logError("LicitacionesResumenController.list");
      console.error(error);
      return res.status(500).json({ message: "No se pudieron cargar los resúmenes de licitaciones" });
    }
  };

  static units = async (req: Request, res: Response) => {
    const id = String(req.params.id ?? "").trim();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "La licitación no es válida" });
    }

    try {
      const item = await LicitacionAdministracion.findOne({ _id: id, deletedAt: null })
        .select({ unidades: 1 })
        .lean();
      if (!item) return res.status(404).json({ error: "Licitación no encontrada" });
      return res.status(200).json({ data: expandUnits(item.unidades as any[]) });
    } catch (error) {
      logError("LicitacionesResumenController.units");
      console.error(error);
      return res.status(500).json({ message: "No se pudieron cargar las unidades de la licitación" });
    }
  };
}
