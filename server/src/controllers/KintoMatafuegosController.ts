import type { Request, Response } from "express";
import mongoose from "mongoose";
import KintoFlota from "../models/KintoFlota";
import KintoMatafuegoRecarga from "../models/KintoMatafuegoRecarga";
import { logError } from "../utils/logError";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const todayBuenosAires = () => {
  const parts = new Intl.DateTimeFormat("en", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
};
const actorName = (req: Request) => `${req.user?.lastName ?? ""}, ${req.user?.name ?? ""}`.replace(/^,\s*|,\s*$/g, "").trim() || "Usuario";
const daysUntil = (date: string | null, today: string) => date ? Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000) : null;

const formatHistory = (item: any) => ({
  _id: String(item._id), fechaRecarga: item.fechaRecarga, fechaVencimiento: item.fechaVencimiento,
  observaciones: item.observaciones ?? "", actorNombre: item.actorNombre, createdAt: item.createdAt,
});

export class KintoMatafuegosController {
  static list = async (_req: Request, res: Response) => {
    try {
      const [fleet, recargas] = await Promise.all([
        KintoFlota.find({ activo: { $ne: false } }).populate("sucursalEntrega", "nombre").sort({ dominio: 1 }).lean(),
        KintoMatafuegoRecarga.find({}).sort({ fechaRecarga: -1, createdAt: -1 }).lean(),
      ]);
      const latestByFleet = new Map<string, any>();
      for (const recarga of recargas) {
        const key = String(recarga.flota);
        if (!latestByFleet.has(key)) latestByFleet.set(key, recarga);
      }
      const today = todayBuenosAires();
      const data = fleet.map((unit: any) => {
        const recarga = latestByFleet.get(String(unit._id));
        const fechaVencimiento = recarga?.fechaVencimiento ?? null;
        return {
          flotaId: String(unit._id), dominio: unit.dominio, modelo: unit.modelo, anio: unit.anio,
          kmActual: unit.kmActual ?? unit.kmIniciales, sucursal: unit.sucursalEntrega?.nombre ?? "Sin asignar",
          fechaVencimiento, diasRestantes: daysUntil(fechaVencimiento, today), estado: fechaVencimiento && fechaVencimiento > today ? "OK" : "VENCIDO",
        };
      });
      return res.status(200).json({ data });
    } catch (error) {
      logError("KintoMatafuegosController.list"); console.error(error);
      return res.status(500).json({ message: "No se pudo cargar el control de matafuegos" });
    }
  };

  static createRecarga = async (req: Request, res: Response) => {
    const flotaId = typeof req.params.flotaId === "string" ? req.params.flotaId : "";
    const fechaRecarga = typeof req.body?.fechaRecarga === "string" ? req.body.fechaRecarga.trim() : "";
    const fechaVencimiento = typeof req.body?.fechaVencimiento === "string" ? req.body.fechaVencimiento.trim() : "";
    const observaciones = typeof req.body?.observaciones === "string" ? req.body.observaciones.trim() : "";
    if (!mongoose.Types.ObjectId.isValid(flotaId)) return res.status(400).json({ error: "La unidad de flota no es válida" });
    if (!datePattern.test(fechaRecarga) || !datePattern.test(fechaVencimiento)) return res.status(400).json({ error: "Las fechas de recarga y vencimiento son obligatorias" });
    if (fechaVencimiento <= fechaRecarga) return res.status(400).json({ error: "La fecha de vencimiento debe ser posterior a la fecha de recarga" });
    try {
      const unit = await KintoFlota.exists({ _id: flotaId, activo: { $ne: false } });
      if (!unit) return res.status(404).json({ error: "La unidad activa de flota no fue encontrada" });
      const created = await KintoMatafuegoRecarga.create({ flota: flotaId, fechaRecarga, fechaVencimiento, observaciones, actorId: req.user!._id, actorNombre: actorName(req) });
      return res.status(201).json({ message: "Recarga registrada correctamente", data: formatHistory(created) });
    } catch (error) {
      logError("KintoMatafuegosController.createRecarga"); console.error(error);
      return res.status(500).json({ message: "No se pudo registrar la recarga" });
    }
  };

  static history = async (req: Request, res: Response) => {
    const flotaId = typeof req.params.flotaId === "string" ? req.params.flotaId : "";
    if (!mongoose.Types.ObjectId.isValid(flotaId)) return res.status(400).json({ error: "La unidad de flota no es válida" });
    try {
      const data = await KintoMatafuegoRecarga.find({ flota: flotaId }).sort({ fechaRecarga: -1, createdAt: -1 }).lean();
      return res.status(200).json({ data: data.map(formatHistory) });
    } catch (error) {
      logError("KintoMatafuegosController.history"); console.error(error);
      return res.status(500).json({ message: "No se pudo cargar el historial de recargas" });
    }
  };
}
