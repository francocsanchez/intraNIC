import type { Request, Response } from "express";
import mongoose from "mongoose";
import { QueryTypes } from "sequelize";
import { sequelizeLIESS } from "../config/database";
import LiessReparacionPresupuestoV2, { liessReparacionEstados, liessReparacionEtapas, liessReparacionPrioridades, type LiessReparacionEstado } from "../models/LiessReparacionPresupuestoV2";
import LiessTaller from "../models/LiessTaller";
import { logError } from "../utils/logError";
import { unidadLiessPorInternoQuery } from "./querys/liess.query";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
const number = (value: unknown) => Number(value);

type UnidadLiessRow = { interno: number; marca: string; version: string; color: string | null; chasis: string | null; anio: number | null; kilometrosBase: number | null };

const getUnidad = async (internoValue: unknown, tipoValue: unknown) => {
  const interno = number(internoValue);
  const tipo = text(tipoValue).toLowerCase() === "nuevo" ? "nuevo" : text(tipoValue).toLowerCase() === "usado" ? "usado" : null;
  if (!Number.isInteger(interno) || interno <= 0 || !tipo) return null;
  const rows = await sequelizeLIESS.query<UnidadLiessRow>(unidadLiessPorInternoQuery(), { replacements: { interno, tipo: tipo === "nuevo" ? 5 : 10 }, type: QueryTypes.SELECT });
  const row = rows[0];
  return row ? { interno: Number(row.interno), tipo, marca: text(row.marca), version: text(row.version), color: text(row.color), chasis: text(row.chasis), anio: row.anio == null ? null : Number(row.anio), kilometrosBase: row.kilometrosBase == null ? null : Number(row.kilometrosBase) } : null;
};

const daysBetween = (ingreso: string | null, egreso: string | null) => ingreso && egreso ? Math.round((Date.parse(`${egreso}T00:00:00Z`) - Date.parse(`${ingreso}T00:00:00Z`)) / 86_400_000) : null;
const etapasIniciales = () => liessReparacionEtapas.map(() => false);
const normalizeEtapas = (value: unknown) => {
  if (!Array.isArray(value) || ![liessReparacionEtapas.length, liessReparacionEtapas.length - 1].includes(value.length) || value.some((item) => typeof item !== "boolean")) return null;
  return value.length === liessReparacionEtapas.length - 1
    ? [value[0], value[1], value[1], value[2], value[3], value[4]] as boolean[]
    : value as boolean[];
};
const etapasEnOrden = (etapas: boolean[]) => etapas.every((item, index) => !item || index === 0 || etapas[index - 1]);
const etapasDePresupuesto = (item: any) => {
  const etapas = normalizeEtapas(item.etapasReparacion) ?? etapasIniciales();
  if (item.fechaIngreso) { etapas[0] = true; etapas[1] = true; }
  return etapas;
};
const responseTaller = (item: any) => ({ _id: String(item._id), nombre: item.nombre, tipoTrabajo: item.tipoTrabajo, activo: item.activo !== false, createdAt: item.createdAt, updatedAt: item.updatedAt });
const responsePresupuesto = (item: any) => ({ _id: String(item._id), fecha: item.fecha, unidad: item.unidad, kmInformado: item.kmInformado, tallerId: String(item.taller), tallerNombre: item.tallerNombre, tallerTipoTrabajo: item.tallerTipoTrabajo, numeroPresupuesto: item.numeroPresupuesto ?? "", costo: item.costo, prioridad: item.prioridad, detalles: item.detalles, estado: item.estado, fechaIngreso: item.fechaIngreso ?? null, fechaEgreso: item.fechaEgreso ?? null, etapasReparacion: etapasDePresupuesto(item), diasReparacion: daysBetween(item.fechaIngreso ?? null, item.fechaEgreso ?? null), createdAt: item.createdAt, updatedAt: item.updatedAt });

export class LiessReparacionesController {
  static listarTalleres = async (req: Request, res: Response) => { try { const data = await LiessTaller.find(req.query.incluirInactivos === "true" ? {} : { activo: true }).sort({ activo: -1, nombre: 1 }).lean(); return res.json({ data: data.map(responseTaller) }); } catch (error) { logError("LiessReparaciones.listarTalleres"); console.error(error); return res.status(500).json({ message: "No se pudieron cargar los talleres" }); } };
  static crearTaller = async (req: Request, res: Response) => { const nombre = text(req.body?.nombre), tipoTrabajo = text(req.body?.tipoTrabajo); if (!nombre || !tipoTrabajo) return res.status(400).json({ error: "Nombre y tipo de trabajo son obligatorios" }); try { const item = await LiessTaller.create({ nombre, tipoTrabajo }); return res.status(201).json({ message: "Taller creado correctamente", data: responseTaller(item) }); } catch (error) { logError("LiessReparaciones.crearTaller"); console.error(error); return res.status(500).json({ message: "No se pudo crear el taller" }); } };
  static editarTaller = async (req: Request, res: Response) => { const id = text(req.params.id), nombre = text(req.body?.nombre), tipoTrabajo = text(req.body?.tipoTrabajo); if (!mongoose.Types.ObjectId.isValid(id) || !nombre || !tipoTrabajo) return res.status(400).json({ error: "Datos de taller inválidos" }); try { const item = await LiessTaller.findByIdAndUpdate(id, { nombre, tipoTrabajo }, { new: true }); return item ? res.json({ message: "Taller actualizado correctamente", data: responseTaller(item) }) : res.status(404).json({ error: "Taller no encontrado" }); } catch (error) { logError("LiessReparaciones.editarTaller"); console.error(error); return res.status(500).json({ message: "No se pudo actualizar el taller" }); } };
  static cambiarTallerActivo = async (req: Request, res: Response) => { const id = text(req.params.id), activo = req.body?.activo; if (!mongoose.Types.ObjectId.isValid(id) || typeof activo !== "boolean") return res.status(400).json({ error: "Estado de taller inválido" }); try { const item = await LiessTaller.findByIdAndUpdate(id, { activo }, { new: true }); return item ? res.json({ message: activo ? "Taller reactivado correctamente" : "Taller desactivado correctamente", data: responseTaller(item) }) : res.status(404).json({ error: "Taller no encontrado" }); } catch (error) { logError("LiessReparaciones.cambiarTallerActivo"); console.error(error); return res.status(500).json({ message: "No se pudo actualizar el taller" }); } };
  static buscarUnidad = async (req: Request, res: Response) => { try { const data = await getUnidad(req.params.interno, req.query.tipo); return data ? res.json({ data }) : res.status(404).json({ error: "No se encontró una unidad LIESS para ese interno y tipo" }); } catch (error) { logError("LiessReparaciones.buscarUnidad"); console.error(error); return res.status(500).json({ message: "No se pudo buscar el interno" }); } };
  static listarPresupuestos = async (_req: Request, res: Response) => { try { const data = await LiessReparacionPresupuestoV2.find().sort({ fecha: -1, createdAt: -1 }).lean(); return res.json({ data: data.map(responsePresupuesto) }); } catch (error) { logError("LiessReparaciones.listarPresupuestos"); console.error(error); return res.status(500).json({ message: "No se pudieron cargar los presupuestos" }); } };
  static crearPresupuesto = async (req: Request, res: Response) => {
    const fecha = text(req.body?.fecha), tallerId = text(req.body?.tallerId), detalles = text(req.body?.detalles), prioridad = text(req.body?.prioridad);
    const kmInformado = number(req.body?.kmInformado), costo = number(req.body?.costo);
    if (!datePattern.test(fecha) || !Number.isInteger(kmInformado) || kmInformado < 0 || !Number.isFinite(costo) || costo < 0 || !detalles || !liessReparacionPrioridades.includes(prioridad as any) || !mongoose.Types.ObjectId.isValid(tallerId)) return res.status(400).json({ error: "Completá los datos obligatorios del presupuesto" });
    try {
      const [unidad, taller] = await Promise.all([getUnidad(req.body?.interno, req.body?.tipoUnidad), LiessTaller.findOne({ _id: tallerId, activo: true }).lean()]);
      if (!unidad) return res.status(404).json({ error: "No se encontró una unidad LIESS para ese interno y tipo" });
      if (!taller) return res.status(400).json({ error: "Seleccioná un taller activo válido" });
      const item = await LiessReparacionPresupuestoV2.create({ fecha, unidad, kmInformado, taller: new mongoose.Types.ObjectId(tallerId), tallerNombre: taller.nombre, tallerTipoTrabajo: taller.tipoTrabajo, numeroPresupuesto: text(req.body?.numeroPresupuesto), costo, prioridad, detalles, estado: "Pendiente", fechaIngreso: null, fechaEgreso: null, etapasReparacion: etapasIniciales() });
      return res.status(201).json({ message: "Presupuesto cargado correctamente", data: responsePresupuesto(item) });
    } catch (error) { logError("LiessReparaciones.crearPresupuesto"); console.error(error); return res.status(500).json({ message: "No se pudo cargar el presupuesto" }); }
  };
  static gestionarPresupuesto = async (req: Request, res: Response) => {
    const id = text(req.params.id), estado = text(req.body?.estado) as LiessReparacionEstado;
    const fechaIngreso = text(req.body?.fechaIngreso) || null, fechaEgreso = text(req.body?.fechaEgreso) || null;
    if (!mongoose.Types.ObjectId.isValid(id) || !liessReparacionEstados.includes(estado)) return res.status(400).json({ error: "La gestión del presupuesto no es válida" });
    if (estado === "Aprobado" && ((fechaIngreso && !datePattern.test(fechaIngreso)) || (fechaEgreso && (!fechaIngreso || !datePattern.test(fechaEgreso) || fechaEgreso < fechaIngreso)))) return res.status(400).json({ error: "Ingresá fechas de taller válidas; el egreso requiere ingreso y no puede ser anterior" });
    try {
      const item = await LiessReparacionPresupuestoV2.findById(id);
      if (!item) return res.status(404).json({ error: "Presupuesto no encontrado" });
      const etapas = estado === "Aprobado" ? normalizeEtapas(req.body?.etapasReparacion ?? item.etapasReparacion) : etapasIniciales();
      if (!etapas) return res.status(400).json({ error: "Las etapas de reparación no son válidas" });
      if (fechaIngreso) { etapas[0] = true; etapas[1] = true; }
      if (!etapasEnOrden(etapas)) return res.status(400).json({ error: "Las etapas deben completarse en orden" });
      item.estado = estado;
      item.fechaIngreso = estado === "Aprobado" ? fechaIngreso : null;
      item.fechaEgreso = estado === "Aprobado" ? fechaEgreso : null;
      item.etapasReparacion = etapas;
      await item.save();
      return res.json({ message: "Presupuesto actualizado correctamente", data: responsePresupuesto(item) });
    } catch (error) { logError("LiessReparaciones.gestionarPresupuesto"); console.error(error); return res.status(500).json({ message: "No se pudo actualizar el presupuesto" }); }
  };
}
