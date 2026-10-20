import type { Request, Response } from "express";
import mongoose from "mongoose";
import KintoFlota, { kintoGeotabStatuses, type KintoFlotaAuditAction, type KintoGeotabStatus } from "../models/KintoFlota";
import SucursalEntrega from "../models/SucursalEntrega";
import { KintoFlotaService } from "../services/kintoFlota.service";
import { logError } from "../utils/logError";

const normalizeText = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const normalizeUpperText = (value: unknown) => normalizeText(value).toUpperCase();
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const actorName = (req: Request) => `${req.user?.lastName ?? ""}, ${req.user?.name ?? ""}`.replace(/^,\s*|,\s*$/g, "").trim() || "Usuario";

const appendAudit = (
  item: any,
  req: Request,
  accion: KintoFlotaAuditAction,
  before: Record<string, unknown>,
  after: Record<string, unknown>,
) => {
  item.auditoria ??= [];
  item.auditoria.push({
    accion,
    actorId: new mongoose.Types.ObjectId(req.user!._id),
    actorNombre: actorName(req),
    before,
    after,
    createdAt: new Date(),
  });
};

const formatFlota = (item: any) => ({
  _id: String(item._id), dominio: item.dominio, modelo: item.modelo,
  anio: item.anio, vin: item.vin, kmIniciales: item.kmIniciales, kmActual: item.kmActual ?? item.kmIniciales, geotab: item.geotab,
  activo: item.activo !== false,
  sucursalEntregaId: item.sucursalEntrega?._id ? String(item.sucursalEntrega._id) : item.sucursalEntrega ? String(item.sucursalEntrega) : null,
  historialKm: (item.historialKm ?? []).map((entry: any) => ({ kmAnterior: entry.kmAnterior, kmActual: entry.kmActual, actorNombre: entry.actorNombre, createdAt: entry.createdAt })),
  auditoria: (item.auditoria ?? []).map((entry: any) => ({ accion: entry.accion, actorNombre: entry.actorNombre, before: entry.before ?? {}, after: entry.after ?? {}, createdAt: entry.createdAt })),
});

const validatePayload = async (payload: Record<string, unknown>) => {
  const dominio = normalizeUpperText(payload.dominio);
  const modelo = normalizeText(payload.modelo);
  const anio = Number(payload.anio);
  const vin = normalizeUpperText(payload.vin);
  const kmIniciales = Number(payload.kmIniciales);
  const geotab = normalizeText(payload.geotab) as KintoGeotabStatus;

  if (!dominio || !modelo || !vin) return { error: "Dominio, modelo y VIN son obligatorios" };
  if (!Number.isInteger(anio) || anio < 1900 || anio > new Date().getFullYear() + 1) return { error: "El año no es válido" };
  if (!Number.isInteger(kmIniciales) || kmIniciales < 0) return { error: "Los KM iniciales deben ser un entero igual o mayor a cero" };
  if (!kintoGeotabStatuses.includes(geotab)) return { error: "El estado de Geotab no es válido" };

  const [existingDominio, existingVin] = await Promise.all([
    KintoFlota.findOne({ dominio: new RegExp(`^${escapeRegex(dominio)}$`, "i") }).lean(),
    KintoFlota.findOne({ vin: new RegExp(`^${escapeRegex(vin)}$`, "i") }).lean(),
  ]);
  if (existingDominio) return { error: "Ya existe una unidad de flota con ese dominio" };
  if (existingVin) return { error: "Ya existe una unidad de flota con ese VIN" };

  return { data: { dominio, modelo, anio, vin, kmIniciales, geotab } };
};

export class KintoFlotaController {
  static list = async (_req: Request, res: Response) => {
    try {
      const data = await KintoFlota.find({}).populate("sucursalEntrega", "nombre activa").sort({ dominio: 1 }).lean();
      return res.status(200).json({ data: data.map(formatFlota) });
    } catch (error) {
      logError("KintoFlotaController.list"); console.error(error);
      return res.status(500).json({ message: "No se pudo cargar la flota" });
    }
  };

  static listSucursales = async (_req: Request, res: Response) => {
    try {
      const data = await SucursalEntrega.find({}).sort({ nombre: 1 }).lean();
      return res.status(200).json({ data });
    } catch (error) {
      logError("KintoFlotaController.listSucursales"); console.error(error);
      return res.status(500).json({ message: "No se pudieron cargar las sucursales" });
    }
  };

  static lookup = async (req: Request, res: Response) => {
    const patente = normalizeUpperText(req.query.patente);
    if (!patente) return res.status(400).json({ error: "La patente es obligatoria" });
    try {
      const matches = await KintoFlotaService.lookupVehicle(patente.replace(/\s/g, ""));
      return res.status(200).json({ data: matches.length === 1 ? matches[0] : null, matches: matches.length, patente });
    } catch (error) {
      logError("KintoFlotaController.lookup"); console.error(error);
      return res.status(500).json({ message: "No se pudo buscar la patente en SIAC" });
    }
  };

  static create = async (req: Request, res: Response) => {
    try {
      const validation = await validatePayload(req.body ?? {});
      if ("error" in validation) return res.status(400).json({ error: validation.error });
      const created = await KintoFlota.create({ ...validation.data, kmActual: validation.data.kmIniciales });
      return res.status(201).json({ message: "Unidad agregada a la flota correctamente", data: formatFlota(created) });
    } catch (error: any) {
      logError("KintoFlotaController.create"); console.error(error);
      if (error?.code === 11000) {
        const duplicateField = Object.keys(error?.keyPattern ?? {})[0];
        const messages: Record<string, string> = {
          dominio: "Ya existe una unidad de flota con ese dominio",
          vin: "Ya existe una unidad de flota con ese VIN",
        };
        return res.status(400).json({ error: messages[duplicateField] ?? "Ya existe una unidad con ese dominio o VIN" });
      }
      return res.status(500).json({ message: "No se pudo agregar la unidad a la flota" });
    }
  };

  static updateSucursal = async (req: Request, res: Response) => {
    const flotaId = typeof req.params.id === "string" ? req.params.id : "";
    const sucursalEntregaId = typeof req.body?.sucursalEntregaId === "string" ? req.body.sucursalEntregaId.trim() : "";

    if (!mongoose.Types.ObjectId.isValid(flotaId)) {
      return res.status(400).json({ error: "La unidad de flota no es válida" });
    }

    if (sucursalEntregaId && !mongoose.Types.ObjectId.isValid(sucursalEntregaId)) {
      return res.status(400).json({ error: "La sucursal seleccionada no es válida" });
    }

    try {
      if (sucursalEntregaId) {
        const sucursal = await SucursalEntrega.exists({ _id: sucursalEntregaId });
        if (!sucursal) return res.status(400).json({ error: "La sucursal seleccionada no existe" });
      }

      const item = await KintoFlota.findByIdAndUpdate(
        flotaId,
        { sucursalEntrega: sucursalEntregaId || null },
        { new: true },
      ).populate("sucursalEntrega", "nombre activa");

      if (!item) return res.status(404).json({ error: "Unidad de flota no encontrada" });
      return res.status(200).json({ message: "Sucursal actualizada correctamente", data: formatFlota(item) });
    } catch (error) {
      logError("KintoFlotaController.updateSucursal"); console.error(error);
      return res.status(500).json({ message: "No se pudo actualizar la sucursal" });
    }
  };

  static updateKm = async (req: Request, res: Response) => {
    const flotaId = typeof req.params.id === "string" ? req.params.id : "";
    const kmActual = Number(req.body?.kmActual);
    if (!mongoose.Types.ObjectId.isValid(flotaId)) return res.status(400).json({ error: "La unidad de flota no es válida" });
    if (!Number.isInteger(kmActual) || kmActual < 0) return res.status(400).json({ error: "El KM actual debe ser un entero igual o mayor a cero" });

    try {
      const item = await KintoFlota.findById(flotaId);
      if (!item) return res.status(404).json({ error: "Unidad de flota no encontrada" });
      const kmAnterior = item.kmActual ?? item.kmIniciales;
      if (kmActual < kmAnterior) return res.status(400).json({ error: "El KM actual no puede ser menor al KM registrado" });
      if (kmActual === kmAnterior) return res.status(400).json({ error: "El KM actual no cambió" });

      item.kmActual = kmActual;
      item.historialKm ??= [];
      item.historialKm.push({ kmAnterior, kmActual, actorId: new mongoose.Types.ObjectId(req.user!._id), actorNombre: actorName(req), createdAt: new Date() });
      appendAudit(item, req, "KM_UPDATED", { kmActual: kmAnterior }, { kmActual });
      await item.save();
      return res.status(200).json({ message: "KM actual actualizado correctamente", data: formatFlota(item) });
    } catch (error) {
      logError("KintoFlotaController.updateKm"); console.error(error);
      return res.status(500).json({ message: "No se pudo actualizar el KM actual" });
    }
  };

  static deactivate = async (req: Request, res: Response) => {
    const flotaId = typeof req.params.id === "string" ? req.params.id : "";
    if (!mongoose.Types.ObjectId.isValid(flotaId)) return res.status(400).json({ error: "La unidad de flota no es válida" });

    try {
      const item = await KintoFlota.findById(flotaId);
      if (!item) return res.status(404).json({ error: "Unidad de flota no encontrada" });
      if (item.activo === false) return res.status(400).json({ error: "La unidad ya está desactivada" });
      item.activo = false;
      appendAudit(item, req, "DEACTIVATED", { activo: true }, { activo: false });
      await item.save();
      return res.status(200).json({ message: "Unidad desactivada correctamente", data: formatFlota(item) });
    } catch (error) {
      logError("KintoFlotaController.deactivate"); console.error(error);
      return res.status(500).json({ message: "No se pudo desactivar la unidad" });
    }
  };

  static reactivate = async (req: Request, res: Response) => {
    const flotaId = typeof req.params.id === "string" ? req.params.id : "";
    if (!mongoose.Types.ObjectId.isValid(flotaId)) return res.status(400).json({ error: "La unidad de flota no es válida" });

    try {
      const item = await KintoFlota.findById(flotaId);
      if (!item) return res.status(404).json({ error: "Unidad de flota no encontrada" });
      if (item.activo !== false) return res.status(400).json({ error: "La unidad ya está activa" });
      item.activo = true;
      appendAudit(item, req, "REACTIVATED", { activo: false }, { activo: true });
      await item.save();
      return res.status(200).json({ message: "Unidad reactivada correctamente", data: formatFlota(item) });
    } catch (error) {
      logError("KintoFlotaController.reactivate"); console.error(error);
      return res.status(500).json({ message: "No se pudo reactivar la unidad" });
    }
  };

  static updateGeotab = async (req: Request, res: Response) => {
    const flotaId = typeof req.params.id === "string" ? req.params.id : "";
    const geotab = normalizeText(req.body?.geotab) as KintoGeotabStatus;
    if (!mongoose.Types.ObjectId.isValid(flotaId)) return res.status(400).json({ error: "La unidad de flota no es válida" });
    if (!kintoGeotabStatuses.includes(geotab)) return res.status(400).json({ error: "El estado de Geotab no es válido" });

    try {
      const item = await KintoFlota.findById(flotaId);
      if (!item) return res.status(404).json({ error: "Unidad de flota no encontrada" });
      const geotabAnterior = item.geotab;
      if (geotab === geotabAnterior) return res.status(400).json({ error: "Geotab ya tiene ese estado" });
      item.geotab = geotab;
      appendAudit(item, req, "GEOTAB_CHANGED", { geotab: geotabAnterior }, { geotab: item.geotab });
      await item.save();
      return res.status(200).json({ message: `Geotab actualizado a ${item.geotab}`, data: formatFlota(item) });
    } catch (error) {
      logError("KintoFlotaController.updateGeotab"); console.error(error);
      return res.status(500).json({ message: "No se pudo actualizar Geotab" });
    }
  };
}
