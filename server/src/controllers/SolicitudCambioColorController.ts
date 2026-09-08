import type { Request, Response } from "express";
import mongoose from "mongoose";
import { QueryTypes } from "sequelize";
import { sequelizeNIC } from "../config/database";
import Color from "../models/Color";
import SolicitudCambioColor, { solicitudCambioColorAuditAction } from "../models/SolicitudCambioColor";
import Version from "../models/Version";
import { unidadCambioColorQuery, unidadesCambioColorChasisQuery } from "./querys/solicitudCambioColor.query";
import { logError } from "../utils/logError";
import { getVendedoresActivosNic } from "./querys/dms.query";
import { hasSuperAdminRole, normalizeRoles } from "../constants/roleAccess";

type UnidadRow = { interno: number; version: string; color: string; chasis: string };
const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
const positiveInteger = (value: unknown) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};
const actorName = (user: NonNullable<Request["user"]>) => `${user.name} ${user.lastName}`.trim();
const canUpdateEstado = (roles: unknown) =>
  hasSuperAdminRole(roles) || normalizeRoles(roles).includes("stock");

const findUnidad = async (interno: number) => {
  const rows = await sequelizeNIC.query<UnidadRow>(unidadCambioColorQuery(), {
    type: QueryTypes.SELECT,
    replacements: { interno },
  });
  return rows[0] ?? null;
};
const findVendedor = async (codigo: number) => {
  const rows = await sequelizeNIC.query<{ codigo: number; vendedor: string }>(getVendedoresActivosNic(), { type: QueryTypes.SELECT });
  return rows.find((row) => Number(row.codigo) === codigo) ?? null;
};

const findChasisByInternos = async (internos: number[]) => {
  if (!internos.length) return new Map<number, string>();
  const rows = await sequelizeNIC.query<Pick<UnidadRow, "interno" | "chasis">>(unidadesCambioColorChasisQuery(), { type: QueryTypes.SELECT, replacements: { internos } });
  return new Map(rows.map((row) => [Number(row.interno), text(row.chasis)]));
};

const format = (item: any, chasis = "") => ({
  _id: String(item._id), interno: item.interno, versionOrigen: item.versionOrigen, colorOrigen: item.colorOrigen,
  versionDestino: { _id: String(item.versionDestinoId), nombre: item.versionDestinoNombre },
  colorDestino: { _id: String(item.colorDestinoId), nombre: item.colorDestinoNombre },
  colorDestino2: item.colorDestino2Id ? { _id: String(item.colorDestino2Id), nombre: item.colorDestino2Nombre ?? "" } : null,
  observaciones: item.observaciones ?? "",
  solicitadoPor: { codigo: item.solicitadoPorCodigo, nombre: item.solicitadoPorNombre },
  solicitudPedida: Boolean(item.solicitudPedida), solicitudCompletada: Boolean(item.solicitudCompletada),
  solicitudRechazada: Boolean(item.solicitudRechazada), tieneChasis: Boolean(chasis),
  createdBy: String(item.createdBy), createdByName: item.createdByName, createdAt: item.createdAt, updatedAt: item.updatedAt,
  audit: (item.audit ?? []).map((entry: any) => ({ _id: String(entry._id), action: entry.action, actorId: String(entry.actorId), actorName: entry.actorName, before: entry.before ?? {}, after: entry.after ?? {}, createdAt: entry.createdAt })),
});

const resolveDestination = async (payload: Record<string, unknown>) => {
  const versionDestinoId = text(payload.versionDestinoId);
  const colorDestinoId = text(payload.colorDestinoId);
  const colorDestino2Id = text(payload.colorDestino2Id);
  const observaciones = text(payload.observaciones);
  if (!mongoose.isValidObjectId(versionDestinoId) || !mongoose.isValidObjectId(colorDestinoId)) return { error: "La version y el color de destino son obligatorios" };
  if (colorDestino2Id && !mongoose.isValidObjectId(colorDestino2Id)) return { error: "El segundo color de destino no es valido" };
  if (colorDestino2Id && colorDestino2Id === colorDestinoId) return { error: "Los dos colores de destino deben ser distintos" };
  const [version, color, color2] = await Promise.all([Version.findOne({ _id: versionDestinoId, activo: true }).lean(), Color.findOne({ _id: colorDestinoId, activo: true }).lean(), colorDestino2Id ? Color.findOne({ _id: colorDestino2Id, activo: true }).lean() : Promise.resolve(null)]);
  if (!version) return { error: "La version de destino no existe o esta inactiva" };
  if (!color) return { error: "El color de destino no existe o esta inactivo" };
  if (colorDestino2Id && !color2) return { error: "El segundo color de destino no existe o esta inactivo" };
  return { data: { versionDestinoId: version._id, versionDestinoNombre: version.nombre, colorDestinoId: color._id, colorDestinoNombre: color.nombre, colorDestino2Id: color2?._id ?? null, colorDestino2Nombre: color2?.nombre ?? "", observaciones } };
};

export class SolicitudCambioColorController {
  static vendedores = async (_req: Request, res: Response) => {
    try { const data = await sequelizeNIC.query(getVendedoresActivosNic(), { type: QueryTypes.SELECT }); return res.json({ data }); }
    catch (error) { logError("SolicitudCambioColorController.vendedores"); console.error(error); return res.status(500).json({ message: "Error al listar vendedores" }); }
  };
  static list = async (req: Request, res: Response) => {
    try {
      const filter: Record<string, unknown> = {};
      const interno = text(req.query.interno);
      const estado = text(req.query.estado);
      if (interno) { const parsed = positiveInteger(interno); if (!parsed) return res.status(400).json({ error: "El interno debe ser un numero positivo" }); filter.interno = parsed; }
      if (estado === "pendientes") {
        filter.solicitudPedida = false;
        filter.solicitudRechazada = false;
      }
      if (estado === "pedidas") {
        filter.solicitudPedida = true;
        filter.solicitudCompletada = false;
        filter.solicitudRechazada = false;
      }
      if (estado === "completadas") {
        filter.solicitudCompletada = true;
        filter.solicitudRechazada = false;
      }
      if (estado === "rechazadas") filter.solicitudRechazada = true;
      const data = await SolicitudCambioColor.find(filter).sort({ createdAt: -1 }).lean();
      const chasisByInterno = await findChasisByInternos([...new Set(data.map((item) => item.interno))]);
      return res.json({ data: data.map((item) => format(item, chasisByInterno.get(item.interno) ?? "")) });
    } catch (error) { logError("SolicitudCambioColorController.list"); console.error(error); return res.status(500).json({ message: "Error al listar las solicitudes" }); }
  };

  static unidad = async (req: Request, res: Response) => {
    try {
      const interno = positiveInteger(req.params.interno);
      if (!interno) return res.status(400).json({ error: "El interno debe ser un numero positivo" });
      const unidad = await findUnidad(interno);
      if (!unidad) return res.status(404).json({ error: "No se encontro una unidad 0 km para el interno indicado" });
      if (unidad.chasis) return res.status(400).json({ error: "La unidad ya fue pagada y no se puede cambiar porque tiene chasis asignado" });
      return res.json({ data: unidad });
    } catch (error) { logError("SolicitudCambioColorController.unidad"); console.error(error); return res.status(500).json({ message: "Error al consultar el interno" }); }
  };

  static create = async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Usuario no autenticado" });
      const interno = positiveInteger(req.body?.interno);
      const solicitadoPorCodigo = positiveInteger(req.body?.solicitadoPorCodigo);
      if (!interno) return res.status(400).json({ error: "El interno debe ser un numero positivo" });
      if (!solicitadoPorCodigo) return res.status(400).json({ error: "Selecciona quien solicita el cambio" });
      const [unidad, destination, vendedor] = await Promise.all([findUnidad(interno), resolveDestination(req.body ?? {}), findVendedor(solicitadoPorCodigo)]);
      if (!unidad) return res.status(404).json({ error: "No se encontro una unidad 0 km para el interno indicado" });
      if (unidad.chasis) return res.status(400).json({ error: "La unidad ya fue pagada y no se puede cambiar porque tiene chasis asignado" });
      if ("error" in destination) return res.status(400).json({ error: destination.error });
      if (!vendedor) return res.status(400).json({ error: "El vendedor seleccionado no esta activo" });
      const name = actorName(req.user);
      const after = { interno, solicitadoPor: vendedor.vendedor, versionOrigen: unidad.version, colorOrigen: unidad.color, versionDestino: destination.data.versionDestinoNombre, colorDestino: destination.data.colorDestinoNombre, colorDestino2: destination.data.colorDestino2Nombre, observaciones: destination.data.observaciones, solicitudPedida: false, solicitudCompletada: false, solicitudRechazada: false };
      const data = await SolicitudCambioColor.create({ interno, solicitadoPorCodigo, solicitadoPorNombre: vendedor.vendedor, versionOrigen: unidad.version, colorOrigen: unidad.color, ...destination.data, createdBy: req.user._id, createdByName: name, audit: [{ action: solicitudCambioColorAuditAction.CREATED, actorId: req.user._id, actorName: name, before: {}, after }] });
      return res.status(201).json({ message: "Solicitud creada correctamente", data: format(data.toObject()) });
    } catch (error) { logError("SolicitudCambioColorController.create"); console.error(error); return res.status(500).json({ message: "Error al crear la solicitud" }); }
  };

  static update = async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Usuario no autenticado" });
      const item = await SolicitudCambioColor.findById(req.params.id);
      if (!item) return res.status(404).json({ error: "Solicitud no encontrada" });
      if (item.solicitudRechazada) return res.status(400).json({ error: "No se puede editar una solicitud rechazada" });
      const destination = await resolveDestination(req.body ?? {});
      if ("error" in destination) return res.status(400).json({ error: destination.error });
      const before = { versionDestino: item.versionDestinoNombre, colorDestino: item.colorDestinoNombre, colorDestino2: item.colorDestino2Nombre ?? "", observaciones: item.observaciones ?? "" };
      const after = { versionDestino: destination.data.versionDestinoNombre, colorDestino: destination.data.colorDestinoNombre, colorDestino2: destination.data.colorDestino2Nombre, observaciones: destination.data.observaciones };
      if (before.versionDestino === after.versionDestino && before.colorDestino === after.colorDestino && before.colorDestino2 === after.colorDestino2 && before.observaciones === after.observaciones) return res.json({ message: "La solicitud no tiene cambios", data: format(item.toObject()) });
      Object.assign(item, destination.data);
      item.audit.push({ action: solicitudCambioColorAuditAction.DESTINATION_UPDATED, actorId: new mongoose.Types.ObjectId(req.user._id), actorName: actorName(req.user), before, after, createdAt: new Date() });
      await item.save();
      return res.json({ message: "Solicitud actualizada correctamente", data: format(item.toObject()) });
    } catch (error) { logError("SolicitudCambioColorController.update"); console.error(error); return res.status(500).json({ message: "Error al actualizar la solicitud" }); }
  };

  static updateEstado = async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Usuario no autenticado" });
      if (!canUpdateEstado(req.user.role)) return res.status(403).json({ error: "Solo usuarios de Stock o superadministradores pueden actualizar los estados" });
      const field = text(req.body?.field);
      const value = req.body?.value;
      if ((field !== "solicitudPedida" && field !== "solicitudCompletada") || typeof value !== "boolean") return res.status(400).json({ error: "El estado solicitado no es valido" });
      const item = await SolicitudCambioColor.findById(req.params.id);
      if (!item) return res.status(404).json({ error: "Solicitud no encontrada" });
      if (item.solicitudRechazada) return res.status(400).json({ error: "No se puede cambiar el estado de una solicitud rechazada" });
      if (field === "solicitudCompletada" && value && !item.solicitudPedida) return res.status(400).json({ error: "Primero debe marcar la solicitud como pedida" });
      if (field === "solicitudPedida" && !value && item.solicitudCompletada) return res.status(400).json({ error: "No se puede desmarcar una solicitud completada" });
      if (item[field] === value) return res.json({ message: "El estado no tiene cambios", data: format(item.toObject()) });
      const before = { [field]: item[field] }; item[field] = value;
      item.audit.push({ action: field === "solicitudPedida" ? solicitudCambioColorAuditAction.REQUESTED_CHANGED : solicitudCambioColorAuditAction.COMPLETED_CHANGED, actorId: new mongoose.Types.ObjectId(req.user._id), actorName: actorName(req.user), before, after: { [field]: value }, createdAt: new Date() });
      await item.save();
      return res.json({ message: "Estado actualizado correctamente", data: format(item.toObject()) });
    } catch (error) { logError("SolicitudCambioColorController.updateEstado"); console.error(error); return res.status(500).json({ message: "Error al actualizar el estado" }); }
  };

  static reject = async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Usuario no autenticado" });
      if (!canUpdateEstado(req.user.role)) return res.status(403).json({ error: "Solo usuarios de Stock o superadministradores pueden rechazar solicitudes" });
      const item = await SolicitudCambioColor.findById(req.params.id);
      if (!item) return res.status(404).json({ error: "Solicitud no encontrada" });
      if (item.solicitudRechazada) return res.status(400).json({ error: "La solicitud ya fue rechazada" });
      if (item.solicitudCompletada) return res.status(400).json({ error: "No se puede rechazar una solicitud completada" });
      item.solicitudRechazada = true;
      item.audit.push({ action: solicitudCambioColorAuditAction.REJECTED, actorId: new mongoose.Types.ObjectId(req.user._id), actorName: actorName(req.user), before: { solicitudRechazada: false }, after: { solicitudRechazada: true, motivo: "No se pudo completar la operacion" }, createdAt: new Date() });
      await item.save();
      return res.json({ message: "Solicitud rechazada correctamente", data: format(item.toObject()) });
    } catch (error) { logError("SolicitudCambioColorController.reject"); console.error(error); return res.status(500).json({ message: "Error al rechazar la solicitud" }); }
  };
}
