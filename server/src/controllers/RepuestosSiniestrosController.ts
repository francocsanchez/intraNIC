import type { Request, Response } from "express";
import mongoose from "mongoose";
import { QueryTypes } from "sequelize";
import { sequelizeNIC } from "../config/database";
import RepuestoSiniestro, { repuestoSiniestroAuditAction } from "../models/RepuestoSiniestro";
import { notaPedidoArticulosQuery, notaPedidoCabeceraQuery, notasPedidoPorNumeroQuery, unidadRepuestoSiniestroQuery } from "./querys/repuestosSiniestros.query";
import { logError } from "../utils/logError";

type Unidad = { interno: number; modelo: string; version: string; chasis: string; cliente: string };
type Nota = { operacion: number; numero: number; fecha: string; cuenta: number; cliente: string; sucursal: string; cantidadArticulos?: number };
type Articulo = { renglon: number; articulo: string; denominacion: string; cantidad: number };
type Etapa = "pendiente" | "pedido" | "arribado" | "retirado";
const positiveInteger = (value: unknown) => { const parsed = Number(value); return Number.isInteger(parsed) && parsed > 0 ? parsed : null; };
const actorName = (user: NonNullable<Request["user"]>) => `${user.name} ${user.lastName}`.trim();

const findUnidad = async (interno: number) => (await sequelizeNIC.query<Unidad>(unidadRepuestoSiniestroQuery(), { type: QueryTypes.SELECT, replacements: { interno } }))[0] ?? null;
const findNota = async (operacion: number) => {
  const [cabeceras, articulos] = await Promise.all([
    sequelizeNIC.query<Nota>(notaPedidoCabeceraQuery(), { type: QueryTypes.SELECT, replacements: { operacion } }),
    sequelizeNIC.query<Articulo>(notaPedidoArticulosQuery(), { type: QueryTypes.SELECT, replacements: { operacion } }),
  ]);
  const cabecera = cabeceras[0];
  return cabecera && articulos.length ? { ...cabecera, articulos } : null;
};
const articuloPerteneceEtapa = (articulo: { pedido: boolean; arribado: boolean; retirado: boolean }, etapa: Etapa) => {
  if (etapa === "pendiente") return !articulo.pedido;
  if (etapa === "pedido") return articulo.pedido && !articulo.arribado;
  if (etapa === "arribado") return articulo.arribado && !articulo.retirado;
  return articulo.retirado;
};
const etapaIncompleta = (avance: { total: number; pendientes: number; pedidos: number; arribados: number; retirados: number }, etapa: Etapa) => {
  if (etapa === "pendiente") return avance.pendientes > 0;
  if (etapa === "pedido") return avance.pedidos > 0 && avance.pedidos < avance.total;
  if (etapa === "arribado") return avance.arribados > 0 && avance.arribados < avance.pedidos;
  return avance.retirados > 0 && avance.retirados < avance.arribados;
};
const format = (item: any, etapa?: Etapa) => {
  const articulos = (item.articulos ?? []).map((articulo: any) => ({ renglon: articulo.renglon, articulo: articulo.articulo, denominacion: articulo.denominacion, cantidad: articulo.cantidad, pedido: Boolean(articulo.pedido), arribado: Boolean(articulo.arribado), retirado: Boolean(articulo.retirado) }));
  const avance = { total: articulos.length, pendientes: articulos.filter((articulo) => !articulo.pedido).length, pedidos: articulos.filter((articulo) => articulo.pedido).length, arribados: articulos.filter((articulo) => articulo.arribado).length, retirados: articulos.filter((articulo) => articulo.retirado).length };
  return {
    _id: String(item._id), interno: item.interno, unidad: item.unidad, nota: item.nota, articulos, articulosEtapa: etapa ? articulos.filter((articulo) => articuloPerteneceEtapa(articulo, etapa)) : articulos, avance,
    estado: item.estado, createdBy: String(item.createdBy), createdByName: item.createdByName, createdAt: item.createdAt, updatedAt: item.updatedAt,
    audit: (item.audit ?? []).map((entry: any) => ({ _id: String(entry._id), action: entry.action, actorId: String(entry.actorId), actorName: entry.actorName, before: entry.before ?? {}, after: entry.after ?? {}, createdAt: entry.createdAt })),
  };
};
const noteSnapshot = (nota: Nota & { articulos: Articulo[] }) => ({ operacion: Number(nota.operacion), numero: Number(nota.numero), fecha: nota.fecha, cuenta: Number(nota.cuenta), cliente: nota.cliente, sucursal: nota.sucursal });

export class RepuestosSiniestrosController {
  static list = async (req: Request, res: Response) => {
    try {
      const internoText = String(req.query.interno ?? "").trim();
      const estado = String(req.query.estado ?? "pendiente").trim();
      const etapa = String(req.query.etapa ?? "").trim();
      const filter: Record<string, unknown> = {};
      if (internoText) { const interno = positiveInteger(internoText); if (!interno) return res.status(400).json({ error: "El interno debe ser un numero positivo" }); filter.interno = interno; }
      if (etapa && !["pendiente", "pedido", "arribado", "retirado"].includes(etapa)) return res.status(400).json({ error: "La etapa indicada no es valida" });
      if (!["pendiente", "completado", "eliminado", "todos"].includes(estado)) return res.status(400).json({ error: "El estado indicado no es valido" });
      if (etapa) filter.estado = { $ne: "eliminado" };
      else if (estado !== "todos") filter.estado = estado;
      const data = await RepuestoSiniestro.find(filter).sort({ createdAt: -1 }).lean();
      const formatted = data.map((item) => format(item, etapa as Etapa | undefined));
      return res.json({ data: etapa ? formatted.filter((item) => item.articulosEtapa.length && etapaIncompleta(item.avance, etapa as Etapa)) : formatted });
    } catch (error) { logError("RepuestosSiniestrosController.list"); console.error(error); return res.status(500).json({ message: "Error al listar los casos" }); }
  };
  static unidad = async (req: Request, res: Response) => {
    try { const interno = positiveInteger(req.params.interno); if (!interno) return res.status(400).json({ error: "El interno debe ser un numero positivo" }); const data = await findUnidad(interno); if (!data) return res.status(404).json({ error: "No se encontro una unidad 0 km para el interno indicado" }); return res.json({ data }); }
    catch (error) { logError("RepuestosSiniestrosController.unidad"); console.error(error); return res.status(500).json({ message: "Error al consultar el interno" }); }
  };
  static notasPedido = async (req: Request, res: Response) => {
    try { const numero = positiveInteger(req.query.numero); if (!numero) return res.status(400).json({ error: "El numero de Nota de Pedido debe ser positivo" }); const data = await sequelizeNIC.query<Nota>(notasPedidoPorNumeroQuery(), { type: QueryTypes.SELECT, replacements: { numero } }); return res.json({ data }); }
    catch (error) { logError("RepuestosSiniestrosController.notasPedido"); console.error(error); return res.status(500).json({ message: "Error al buscar las notas de pedido" }); }
  };
  static notaPedido = async (req: Request, res: Response) => {
    try { const operacion = positiveInteger(req.params.mscNroope); if (!operacion) return res.status(400).json({ error: "La operacion de la nota no es valida" }); const data = await findNota(operacion); if (!data) return res.status(404).json({ error: "La Nota de Pedido no existe o no tiene articulos" }); return res.json({ data }); }
    catch (error) { logError("RepuestosSiniestrosController.notaPedido"); console.error(error); return res.status(500).json({ message: "Error al consultar la Nota de Pedido" }); }
  };
  static create = async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Usuario no autenticado" });
      const interno = positiveInteger(req.body?.interno); const operacion = positiveInteger(req.body?.mscNroope);
      if (!interno || !operacion) return res.status(400).json({ error: "El interno y la Nota de Pedido son obligatorios" });
      const [unidad, nota] = await Promise.all([findUnidad(interno), findNota(operacion)]);
      if (!unidad) return res.status(404).json({ error: "No se encontro una unidad 0 km para el interno indicado" });
      if (!nota) return res.status(404).json({ error: "La Nota de Pedido no existe o fue alterada en SIAC" });
      const name = actorName(req.user); const after = { interno, unidad, nota: noteSnapshot(nota), articulos: nota.articulos };
      const data = await RepuestoSiniestro.create({ interno, unidad, nota: noteSnapshot(nota), articulos: nota.articulos.map((articulo) => ({ ...articulo, pedido: false, arribado: false, retirado: false })), createdBy: req.user._id, createdByName: name, audit: [{ action: repuestoSiniestroAuditAction.CREATED, actorId: req.user._id, actorName: name, before: {}, after }] });
      return res.status(201).json({ message: "Caso creado correctamente", data: format(data.toObject()) });
    } catch (error: any) { if (error?.code === 11000) return res.status(409).json({ error: "Ya existe un caso activo para ese interno y Nota de Pedido" }); logError("RepuestosSiniestrosController.create"); console.error(error); return res.status(500).json({ message: "Error al crear el caso" }); }
  };
  static update = async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Usuario no autenticado" });
      const operacion = positiveInteger(req.body?.mscNroope); if (!operacion) return res.status(400).json({ error: "La Nota de Pedido es obligatoria" });
      const item = await RepuestoSiniestro.findById(req.params.id); if (!item) return res.status(404).json({ error: "Caso no encontrado" });
      if (item.estado !== "pendiente") return res.status(400).json({ error: "Solo se pueden modificar casos pendientes" });
      const nota = await findNota(operacion); if (!nota) return res.status(404).json({ error: "La Nota de Pedido no existe o fue alterada en SIAC" });
      if (item.nota.operacion === operacion) return res.json({ message: "El caso no tiene cambios", data: format(item.toObject()) });
      const duplicate = await RepuestoSiniestro.exists({ _id: { $ne: item._id }, interno: item.interno, "nota.operacion": operacion, activo: true });
      if (duplicate) return res.status(409).json({ error: "Ya existe un caso activo para ese interno y Nota de Pedido" });
      const before = { nota: item.nota, articulos: item.articulos }; item.nota = noteSnapshot(nota); item.articulos = nota.articulos.map((articulo) => ({ ...articulo, pedido: false, arribado: false, retirado: false }));
      item.audit.push({ action: repuestoSiniestroAuditAction.NOTE_UPDATED, actorId: new mongoose.Types.ObjectId(req.user._id), actorName: actorName(req.user), before, after: { nota: item.nota, articulos: item.articulos }, createdAt: new Date() });
      await item.save(); return res.json({ message: "Nota de Pedido actualizada correctamente", data: format(item.toObject()) });
    } catch (error: any) { if (error?.code === 11000) return res.status(409).json({ error: "Ya existe un caso activo para ese interno y Nota de Pedido" }); logError("RepuestosSiniestrosController.update"); console.error(error); return res.status(500).json({ message: "Error al actualizar el caso" }); }
  };
  static updateEstadoArticulo = async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Usuario no autenticado" });
      const renglon = positiveInteger(req.params.renglon);
      const field = String(req.body?.field ?? "");
      const value = req.body?.value;
      if (!renglon || !["pedido", "arribado", "retirado"].includes(field) || typeof value !== "boolean") return res.status(400).json({ error: "El repuesto y el estado indicado son obligatorios" });
      const item = await RepuestoSiniestro.findById(req.params.id);
      if (!item) return res.status(404).json({ error: "Caso no encontrado" });
      if (item.estado !== "pendiente") return res.status(400).json({ error: "Solo se pueden modificar casos pendientes" });
      const articulo = item.articulos.find((entry) => Number(entry.renglon) === renglon);
      if (!articulo) return res.status(404).json({ error: "El repuesto no pertenece a este caso" });
      if (field === "pedido" && !value && articulo.arribado) return res.status(400).json({ error: "Primero debe desmarcar el arribo del repuesto" });
      if (field === "arribado" && value && !articulo.pedido) return res.status(400).json({ error: "El repuesto debe estar marcado como pedido antes de registrar su arribo" });
      if (field === "arribado" && !value && articulo.retirado) return res.status(400).json({ error: "Primero debe desmarcar el retiro del repuesto" });
      if (field === "retirado" && value && !articulo.arribado) return res.status(400).json({ error: "El repuesto debe estar marcado como arribado antes de registrar su retiro" });
      if (articulo[field as "pedido" | "arribado" | "retirado"] === value) return res.json({ message: "El repuesto no tiene cambios", data: format(item.toObject()) });
      const before = { renglon: articulo.renglon, articulo: articulo.articulo, denominacion: articulo.denominacion, pedido: articulo.pedido, arribado: articulo.arribado, retirado: articulo.retirado };
      articulo[field as "pedido" | "arribado" | "retirado"] = value;
      const actionByField = { pedido: repuestoSiniestroAuditAction.REQUEST_CHANGED, arribado: repuestoSiniestroAuditAction.ARRIVAL_CHANGED, retirado: repuestoSiniestroAuditAction.WITHDRAWAL_CHANGED } as const;
      item.audit.push({ action: actionByField[field as keyof typeof actionByField], actorId: new mongoose.Types.ObjectId(req.user._id), actorName: actorName(req.user), before, after: { renglon: articulo.renglon, articulo: articulo.articulo, denominacion: articulo.denominacion, pedido: articulo.pedido, arribado: articulo.arribado, retirado: articulo.retirado }, createdAt: new Date() });
      if (field === "retirado" && value && item.articulos.every((entry) => entry.retirado)) {
        item.estado = "completado";
        item.audit.push({ action: repuestoSiniestroAuditAction.COMPLETED, actorId: new mongoose.Types.ObjectId(req.user._id), actorName: actorName(req.user), before: { estado: "pendiente" }, after: { estado: "completado" }, createdAt: new Date() });
      }
      await item.save();
      return res.json({ message: item.estado === "completado" ? "Repuesto retirado y caso completado" : "Estado del repuesto actualizado", data: format(item.toObject()) });
    } catch (error) { logError("RepuestosSiniestrosController.updateEstadoArticulo"); console.error(error); return res.status(500).json({ message: "Error al actualizar el estado del repuesto" }); }
  };
  static remove = async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Usuario no autenticado" }); const item = await RepuestoSiniestro.findById(req.params.id);
      if (!item) return res.status(404).json({ error: "Caso no encontrado" }); if (item.estado !== "pendiente") return res.status(400).json({ error: "Solo se pueden eliminar casos pendientes" });
      item.estado = "eliminado"; item.activo = false; item.deletedAt = new Date(); item.audit.push({ action: repuestoSiniestroAuditAction.DELETED, actorId: new mongoose.Types.ObjectId(req.user._id), actorName: actorName(req.user), before: { estado: "pendiente" }, after: { estado: "eliminado" }, createdAt: new Date() }); await item.save();
      return res.json({ message: "Caso eliminado correctamente", data: format(item.toObject()) });
    } catch (error) { logError("RepuestosSiniestrosController.remove"); console.error(error); return res.status(500).json({ message: "Error al eliminar el caso" }); }
  };
}
