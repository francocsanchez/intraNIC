import type { Request, Response } from "express";
import mongoose from "mongoose";
import KintoFlota from "../models/KintoFlota";
import KintoMulta, { type KintoMultaAuditAction } from "../models/KintoMulta";
import { logError } from "../utils/logError";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
const upper = (value: unknown) => text(value).toUpperCase();
const actorName = (req: Request) => `${req.user?.lastName ?? ""}, ${req.user?.name ?? ""}`.replace(/^,\s*|,\s*$/g, "").trim() || "Usuario";
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const statusOf = (item: { cobrado: boolean; facturado: boolean; pagado: boolean }) => item.pagado ? "PAGADO" : item.facturado ? "PEND_PAGAR" : item.cobrado ? "PEND_FACTURAR" : "PEND_COBRAR";
const format = (item: any) => ({
  _id: String(item._id), flotaId: String(item.flota), dominio: item.dominio, sucursal: item.sucursal,
  fecha: item.fecha, booking: item.booking, monto: item.monto, cobrado: item.cobrado, facturado: item.facturado, pagado: item.pagado,
  estado: statusOf(item), createdAt: item.createdAt, updatedAt: item.updatedAt,
});
const formatAudit = (entry: any) => ({ _id: String(entry._id), accion: entry.accion, actorNombre: entry.actorNombre, before: entry.before ?? {}, after: entry.after ?? {}, createdAt: entry.createdAt });

const audit = (item: any, req: Request, accion: KintoMultaAuditAction, before: Record<string, unknown>, after: Record<string, unknown>) => {
  item.auditoria ??= [];
  for (const entry of item.auditoria) {
    if (!entry.before || Object.keys(entry.before).length === 0) entry.before = { registroPrevio: false };
    if (!entry.after || Object.keys(entry.after).length === 0) entry.after = { sinCambios: true };
  }
  item.auditoria.push({ accion, actorId: new mongoose.Types.ObjectId(req.user!._id), actorNombre: actorName(req), before, after, createdAt: new Date() });
};

const findFleet = async (flotaId: unknown) => {
  const id = text(flotaId);
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return KintoFlota.findById(id).populate("sucursalEntrega", "nombre").lean();
};

const validateBase = async (body: Record<string, unknown>) => {
  const fecha = text(body.fecha); const booking = text(body.booking); const monto = Number(body.monto);
  if (!datePattern.test(fecha)) return { error: "La fecha de la multa es obligatoria y debe ser válida" };
  if (!booking) return { error: "El número de booking es obligatorio" };
  if (!Number.isFinite(monto) || monto < 0) return { error: "El monto debe ser un número igual o mayor a cero" };
  const flota = await findFleet(body.flotaId);
  if (!flota) return { error: "La unidad seleccionada no existe en Flota" };
  return { data: { flotaId: String(flota._id), dominio: flota.dominio, sucursal: (flota.sucursalEntrega as any)?.nombre ?? "Sin asignar", fecha, booking, monto } };
};

export class KintoMultasController {
  static domains = async (req: Request, res: Response) => {
    const q = upper(req.query.q);
    if (q.length < 2) return res.status(200).json({ data: [] });
    try {
      const rows = await KintoFlota.find({ dominio: new RegExp(escapeRegex(q), "i") }).sort({ dominio: 1 }).limit(12).lean();
      return res.status(200).json({ data: rows.map((row) => ({ _id: String(row._id), dominio: row.dominio, modelo: row.modelo, activo: row.activo !== false })) });
    } catch (error) { logError("KintoMultasController.domains"); console.error(error); return res.status(500).json({ message: "No se pudieron buscar dominios" }); }
  };

  static list = async (req: Request, res: Response) => {
    const estado = text(req.query.estado);
    const filters: Record<string, unknown> = { deletedAt: null };
    const statusFilters: Record<string, Record<string, boolean>> = {
      PEND_COBRAR: { cobrado: false }, PEND_FACTURAR: { cobrado: true, facturado: false }, PEND_PAGAR: { facturado: true, pagado: false }, PAGADO: { pagado: true },
    };
    if (estado && !statusFilters[estado]) return res.status(400).json({ error: "El estado seleccionado no es válido" });
    Object.assign(filters, statusFilters[estado || "PEND_COBRAR"]);
    try { const data = await KintoMulta.find(filters).sort({ fecha: -1, createdAt: -1 }).lean(); return res.status(200).json({ data: data.map(format) }); }
    catch (error) { logError("KintoMultasController.list"); console.error(error); return res.status(500).json({ message: "No se pudieron cargar las multas" }); }
  };

  static create = async (req: Request, res: Response) => {
    try {
      const validation = await validateBase(req.body ?? {});
      if ("error" in validation) return res.status(400).json({ error: validation.error });
      const created = await KintoMulta.create({ flota: validation.data.flotaId, dominio: validation.data.dominio, sucursal: validation.data.sucursal, fecha: validation.data.fecha, booking: validation.data.booking, monto: validation.data.monto });
      audit(created, req, "CARGO_CREATED", { registroPrevio: false }, { dominio: created.dominio, sucursal: created.sucursal, fecha: created.fecha, booking: created.booking, monto: created.monto });
      await created.save();
      return res.status(201).json({ message: "Multa registrada correctamente", data: format(created) });
    } catch (error) { logError("KintoMultasController.create"); console.error(error); return res.status(500).json({ message: "No se pudo registrar la multa" }); }
  };

  static update = async (req: Request, res: Response) => {
    const id = text(req.params.id); if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "La multa no es válida" });
    try {
      const validation = await validateBase(req.body ?? {}); if ("error" in validation) return res.status(400).json({ error: validation.error });
      const item = await KintoMulta.findOne({ _id: id, deletedAt: null }); if (!item) return res.status(404).json({ error: "Multa no encontrada" });
      const before = { dominio: item.dominio, sucursal: item.sucursal, fecha: item.fecha, booking: item.booking, monto: item.monto };
      const after = { dominio: validation.data.dominio, sucursal: validation.data.sucursal, fecha: validation.data.fecha, booking: validation.data.booking, monto: validation.data.monto };
      if (JSON.stringify(before) === JSON.stringify(after)) return res.status(400).json({ error: "La multa no tuvo cambios" });
      item.flota = new mongoose.Types.ObjectId(validation.data.flotaId); Object.assign(item, after); audit(item, req, "UPDATED", before, after); await item.save();
      return res.status(200).json({ message: "Multa actualizada correctamente", data: format(item) });
    } catch (error) { logError("KintoMultasController.update"); console.error(error); return res.status(500).json({ message: "No se pudo actualizar la multa" }); }
  };

  static updateStatus = async (req: Request, res: Response) => {
    const id = text(req.params.id); const field = text(req.body?.field); const value = req.body?.value;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "La multa no es válida" });
    if (!(["cobrado", "facturado", "pagado"] as string[]).includes(field) || typeof value !== "boolean") return res.status(400).json({ error: "El estado indicado no es válido" });
    try {
      const item = await KintoMulta.findOne({ _id: id, deletedAt: null }); if (!item) return res.status(404).json({ error: "Multa no encontrada" });
      if (field === "facturado" && value && !item.cobrado) return res.status(400).json({ error: "Primero debés marcar la multa como cobrada" });
      if (field === "pagado" && value && !item.facturado) return res.status(400).json({ error: "Primero debés marcar la multa como facturada" });
      const changes: Array<["cobrado" | "facturado" | "pagado", boolean]> = [[field as "cobrado" | "facturado" | "pagado", value]];
      if (field === "cobrado" && !value) changes.push(["facturado", false], ["pagado", false]);
      if (field === "facturado" && !value) changes.push(["pagado", false]);
      for (const [key, next] of changes) { if (item[key] !== next) { const previous = item[key]; item[key] = next; audit(item, req, "STATUS_CHANGED", { [key]: previous }, { [key]: next }); } }
      await item.save(); return res.status(200).json({ message: "Estado de la multa actualizado", data: format(item) });
    } catch (error) { logError("KintoMultasController.updateStatus"); console.error(error); return res.status(500).json({ message: "No se pudo actualizar el estado de la multa" }); }
  };

  static history = async (req: Request, res: Response) => {
    const id = text(req.params.id); if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "La multa no es válida" });
    try { const item = await KintoMulta.findById(id).lean(); if (!item) return res.status(404).json({ error: "Multa no encontrada" }); return res.status(200).json({ data: (item.auditoria ?? []).slice().reverse().map(formatAudit) }); }
    catch (error) { logError("KintoMultasController.history"); console.error(error); return res.status(500).json({ message: "No se pudo cargar el historial de la multa" }); }
  };

  static remove = async (req: Request, res: Response) => {
    const id = text(req.params.id); if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "La multa no es válida" });
    try { const item = await KintoMulta.findOne({ _id: id, deletedAt: null }); if (!item) return res.status(404).json({ error: "Multa no encontrada" }); item.deletedAt = new Date(); audit(item, req, "DELETED", { deletedAt: null }, { deletedAt: item.deletedAt.toISOString() }); await item.save(); return res.status(200).json({ message: "Multa eliminada correctamente" }); }
    catch (error) { logError("KintoMultasController.remove"); console.error(error); return res.status(500).json({ message: "No se pudo eliminar la multa" }); }
  };
}
