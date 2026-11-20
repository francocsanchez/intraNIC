import type { Request, Response } from "express";
import mongoose from "mongoose";
import { QueryTypes } from "sequelize";
import { sequelizeNIC } from "../config/database";
import LicitacionAdministracion from "../models/LicitacionAdministracion";
import Conversion from "../models/Conversion";
import Version from "../models/Version";
import { logError } from "../utils/logError";
import { unidadCambioColorQuery, unidadesCambioColorChasisQuery } from "./querys/solicitudCambioColor.query";
import { generateLicitacionResumenPdfBuffer } from "../utils/licitacionResumenPdf";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
const todayBuenosAires = () => {
  const parts = new Intl.DateTimeFormat("en", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
};

const validDate = (value: string) => {
  if (!datePattern.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

const expiration = (fechaApertura: string, dias: number) => {
  const [year, month, day] = fechaApertura.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + dias - 1));
  return date.toISOString().slice(0, 10);
};

const daysRemaining = (fechaApertura: string, dias: number) => {
  const [year, month, day] = expiration(fechaApertura, dias).split("-").map(Number);
  const [todayYear, todayMonth, todayDay] = todayBuenosAires().split("-").map(Number);
  return Math.round((Date.UTC(year, month - 1, day) - Date.UTC(todayYear, todayMonth - 1, todayDay)) / 86_400_000);
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

const format = (item: any) => ({
  _id: String(item._id), entidad: item.entidad, cuit: item.cuit,
  contacto: { nombre: item.contactoNombre, apellido: item.contactoApellido, telefono: item.contactoTelefono },
  fechaApertura: item.fechaApertura, diasMantenimientoOferta: item.diasMantenimientoOferta,
  totalUnidades: (item.unidades ?? []).reduce((total: number, unit: any) => total + (Number(unit.cantidad) || 1), 0),
  vencimientoMantenimiento: expiration(item.fechaApertura, item.diasMantenimientoOferta),
  diasRestantesMantenimiento: daysRemaining(item.fechaApertura, item.diasMantenimientoOferta),
  tecnica: item.tecnica ?? null, preAdjudicado: item.preAdjudicado ?? null, pagare: item.pagare, oc: item.oc,
  estado: stateOf(item), createdAt: item.createdAt, updatedAt: item.updatedAt,
});

const flowValues = (item: any) => ({ tecnica: item.tecnica ?? null, preAdjudicado: item.preAdjudicado ?? null, pagare: item.pagare, oc: item.oc, estado: stateOf(item) });

const validateBase = (body: Record<string, unknown>) => {
  const entidad = text(body.entidad); const cuit = text(body.cuit).replace(/\D/g, "");
  const contactoNombre = text(body.contactoNombre); const contactoApellido = text(body.contactoApellido); const contactoTelefono = text(body.contactoTelefono);
  const fechaApertura = text(body.fechaApertura); const diasMantenimientoOferta = Number(body.diasMantenimientoOferta);
  if (!entidad || !cuit || !contactoNombre || !contactoApellido || !contactoTelefono) return { error: "Todos los datos de la entidad y el contacto son obligatorios" };
  if (!/^\d{11}$/.test(cuit)) return { error: "El CUIT debe contener 11 dígitos" };
  if (!validDate(fechaApertura)) return { error: "La fecha de apertura debe ser válida" };
  if (!Number.isInteger(diasMantenimientoOferta) || diasMantenimientoOferta < 1) return { error: "Los días de mantenimiento deben ser un entero mayor a cero" };
  return { data: { entidad, cuit, contactoNombre, contactoApellido, contactoTelefono, fechaApertura, diasMantenimientoOferta } };
};

const progressFields = ["asignada", "equipadaTransformada", "arribada", "patentada", "pagada", "entregada"] as const;
type ProgressField = (typeof progressFields)[number];
const deliveredSiacStates = new Set([35, 40]);
const unitStateFromSiac = (estado: number) => Number(estado) === 35 || Number(estado) === 40 ? "ENTREGADA" : "ASIGNADA";
const formatUnits = (item: any) => (item.unidades ?? []).map((unit: any) => ({ _id: String(unit._id), interno: unit.interno ?? null, versionId: unit.versionId ? String(unit.versionId) : null, versionNombre: unit.versionNombre, cantidad: unit.cantidad, asignada: Boolean(unit.interno), equipadaTransformada: unit.equipadaTransformada ?? false, arribada: unit.arribada ?? false, patentada: unit.patentada ?? false, pagada: unit.pagada ?? false, entregada: unit.entregada ?? false }));

// Las cargas anteriores agrupaban unidades iguales. Al accederlas se desdoblan una sola vez
// para que cada unidad tenga identidad y estado propios.
const normalizeUnits = (item: any) => {
  const units = item.unidades as any[];
  const normalized = units.flatMap((unit) => Array.from({ length: unit.cantidad }, (_, index) => ({
    _id: index === 0 ? unit._id : new mongoose.Types.ObjectId(),
    versionId: unit.versionId,
    versionNombre: unit.versionNombre,
    interno: unit.interno ?? null,
    cantidad: 1,
    asignada: Boolean(unit.interno),
    equipadaTransformada: unit.equipadaTransformada ?? false,
    arribada: unit.arribada ?? false,
    patentada: unit.patentada ?? Boolean(unit.patentamiento),
    pagada: unit.pagada ?? false,
    entregada: unit.entregada ?? unit.estado === "ENTREGADA",
  })));
  const changed = normalized.length !== units.length || units.some((unit) => unit.cantidad !== 1 || progressFields.some((field) => typeof unit[field] !== "boolean"));
  if (changed) item.set("unidades", normalized);
  return changed;
};

const findUnit = (item: any, unitId: string) =>
  item.unidades.id?.(unitId) ?? (item.unidades as any[]).find((unit) => String(unit._id) === unitId);

const syncDeliveredUnits = async (item: any) => {
  const internos = [...new Set((item.unidades ?? []).map((unit: any) => Number(unit.interno)).filter((interno: number) => Number.isInteger(interno) && interno > 0))];
  if (!internos.length) return false;
  const rows = await sequelizeNIC.query<{ interno: number; estado: number }>(unidadesCambioColorChasisQuery(), { type: QueryTypes.SELECT, replacements: { internos } });
  const deliveredInternos = new Set(rows.filter((row) => deliveredSiacStates.has(Number(row.estado))).map((row) => Number(row.interno)));
  let changed = false;
  for (const unit of item.unidades as any[]) {
    if (unit.interno && deliveredInternos.has(Number(unit.interno)) && unit.estado !== "ENTREGADA") {
      unit.estado = "ENTREGADA";
      changed = true;
    }
  }
  return changed;
};

const validateUnit = async (body: Record<string, unknown>) => {
  const versionId = text(body.versionId); const cantidad = Number(body.cantidad);
  if (!mongoose.Types.ObjectId.isValid(versionId)) return { error: "La versión es obligatoria" };
  if (!Number.isInteger(cantidad) || cantidad < 1) return { error: "La cantidad debe ser un entero mayor a cero" };
  const version = await Version.findOne({ _id: versionId, activo: true }).lean();
  if (!version) return { error: "La versión seleccionada no existe o está inactiva" };
  return { data: { versionId: String(version._id), versionNombre: version.nombre, cantidad } };
};

export class LicitacionesAdministracionController {
  static catalogs = async (_req: Request, res: Response) => {
    try {
      const versiones = await Version.find({ activo: true }).sort({ nombre: 1 }).lean();
      return res.status(200).json({ versiones: versiones.map((item) => ({ _id: String(item._id), nombre: item.nombre })) });
    } catch (error) { logError("LicitacionesAdministracionController.catalogs"); console.error(error); return res.status(500).json({ message: "No se pudieron cargar las versiones y conversiones" }); }
  };

  static list = async (_req: Request, res: Response) => {
    try { const data = await LicitacionAdministracion.find({ deletedAt: null }).sort({ fechaApertura: -1, createdAt: -1 }).lean(); return res.status(200).json({ data: data.map(format) }); }
    catch (error) { logError("LicitacionesAdministracionController.list"); console.error(error); return res.status(500).json({ message: "No se pudieron cargar las licitaciones" }); }
  };

  static create = async (req: Request, res: Response) => {
    try {
      const validation = validateBase(req.body ?? {}); if ("error" in validation) return res.status(400).json({ error: validation.error });
      const item = await LicitacionAdministracion.create(validation.data);
      return res.status(201).json({ message: "Licitación registrada correctamente", data: format(item) });
    } catch (error) { logError("LicitacionesAdministracionController.create"); console.error(error); return res.status(500).json({ message: "No se pudo registrar la licitación" }); }
  };

  static update = async (req: Request, res: Response) => {
    const id = text(req.params.id); if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "La licitación no es válida" });
    try {
      const validation = validateBase(req.body ?? {}); if ("error" in validation) return res.status(400).json({ error: validation.error });
      const item = await LicitacionAdministracion.findOne({ _id: id, deletedAt: null }); if (!item) return res.status(404).json({ error: "Licitación no encontrada" });
      const before = JSON.stringify({ entidad: item.entidad, cuit: item.cuit, contactoNombre: item.contactoNombre, contactoApellido: item.contactoApellido, contactoTelefono: item.contactoTelefono, fechaApertura: item.fechaApertura, diasMantenimientoOferta: item.diasMantenimientoOferta }); Object.assign(item, validation.data); const after = JSON.stringify({ entidad: item.entidad, cuit: item.cuit, contactoNombre: item.contactoNombre, contactoApellido: item.contactoApellido, contactoTelefono: item.contactoTelefono, fechaApertura: item.fechaApertura, diasMantenimientoOferta: item.diasMantenimientoOferta });
      if (JSON.stringify(before) === JSON.stringify(after)) return res.status(400).json({ error: "La licitación no tuvo cambios" });
      await item.save(); return res.status(200).json({ message: "Licitación actualizada correctamente", data: format(item) });
    } catch (error) { logError("LicitacionesAdministracionController.update"); console.error(error); return res.status(500).json({ message: "No se pudo actualizar la licitación" }); }
  };

  static remove = async (req: Request, res: Response) => {
    const id = text(req.params.id); if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "La licitación no es válida" });
    try {
      const item = await LicitacionAdministracion.findOne({ _id: id, deletedAt: null });
      if (!item) return res.status(404).json({ error: "Licitación no encontrada" });
      const data = format(item);
      await item.deleteOne();
      return res.status(200).json({ message: "Licitación y unidades eliminadas correctamente", data });
    } catch (error) { logError("LicitacionesAdministracionController.remove"); console.error(error); return res.status(500).json({ message: "No se pudo eliminar la licitación" }); }
  };

  static updateFlow = async (req: Request, res: Response) => {
    const id = text(req.params.id); const field = text(req.body?.field); const value = req.body?.value;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "La licitación no es válida" });
    const nullableDecision = field === "tecnica" || field === "preAdjudicado";
    if (!( ["tecnica", "preAdjudicado", "pagare", "oc"] as string[]).includes(field) || (typeof value !== "boolean" && !(nullableDecision && value === null))) return res.status(400).json({ error: "El cambio de flujo no es válido" });
    try {
      const item = await LicitacionAdministracion.findOne({ _id: id, deletedAt: null }); if (!item) return res.status(404).json({ error: "Licitación no encontrada" });
      const before = flowValues(item);
      if (field === "tecnica") { item.tecnica = value; item.preAdjudicado = null; item.pagare = false; item.oc = false; }
      if (field === "preAdjudicado") {
        if (item.tecnica !== true) return res.status(400).json({ error: "Primero debés aprobar la técnica" });
        if (todayBuenosAires() < expiration(item.fechaApertura, item.diasMantenimientoOferta)) return res.status(400).json({ error: "Todavía no venció el mantenimiento de oferta" });
        item.preAdjudicado = value; item.pagare = false; item.oc = false;
      }
      if (field === "pagare") { if (item.preAdjudicado !== true) return res.status(400).json({ error: "Primero debés marcar la pre-adjudicación" }); item.pagare = value; if (!value) item.oc = false; }
      if (field === "oc") { if (!item.pagare) return res.status(400).json({ error: "Primero debés marcar el pagaré" }); item.oc = value; }
      const after = flowValues(item); if (JSON.stringify(before) === JSON.stringify(after)) return res.status(400).json({ error: "El flujo no tuvo cambios" });
      await item.save(); return res.status(200).json({ message: "Flujo actualizado correctamente", data: format(item) });
    } catch (error) { logError("LicitacionesAdministracionController.updateFlow"); console.error(error); return res.status(500).json({ message: "No se pudo actualizar el flujo" }); }
  };

  static extendMaintenance = async (req: Request, res: Response) => {
    const id = text(req.params.id); const dias = Number(req.body?.dias);
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "La licitación no es válida" });
    if (!Number.isInteger(dias) || dias < 1) return res.status(400).json({ error: "La prórroga debe ser una cantidad entera de días mayor a cero" });
    try { const item = await LicitacionAdministracion.findOne({ _id: id, deletedAt: null }); if (!item) return res.status(404).json({ error: "Licitación no encontrada" }); item.diasMantenimientoOferta += dias; await item.save(); return res.status(200).json({ message: "Prórroga registrada correctamente", data: format(item) }); }
    catch (error) { logError("LicitacionesAdministracionController.extendMaintenance"); console.error(error); return res.status(500).json({ message: "No se pudo registrar la prórroga" }); }
  };

  static units = async (req: Request, res: Response) => {
    const id = text(req.params.id); if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "La licitación no es válida" });
    try { const item = await LicitacionAdministracion.findOne({ _id: id, deletedAt: null }); if (!item) return res.status(404).json({ error: "Licitación no encontrada" }); const normalized = normalizeUnits(item); const delivered = await syncDeliveredUnits(item); if (normalized || delivered) await item.save(); return res.status(200).json({ data: formatUnits(item) }); }
    catch (error) { logError("LicitacionesAdministracionController.units"); console.error(error); return res.status(500).json({ message: "No se pudieron cargar las unidades" }); }
  };

  static exportPdf = async (req: Request, res: Response) => {
    const id = text(req.params.id); if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "La licitación no es válida" });
    try {
      const item = await LicitacionAdministracion.findOne({ _id: id, deletedAt: null }); if (!item) return res.status(404).json({ error: "Licitación no encontrada" });
      const normalized = normalizeUnits(item); const delivered = await syncDeliveredUnits(item); if (normalized || delivered) await item.save();
      const pdf = await generateLicitacionResumenPdfBuffer({
        entidad: item.entidad, cuit: item.cuit, contactoNombre: item.contactoNombre, contactoApellido: item.contactoApellido, contactoTelefono: item.contactoTelefono,
        fechaApertura: item.fechaApertura, diasMantenimientoOferta: item.diasMantenimientoOferta, diasRestantes: daysRemaining(item.fechaApertura, item.diasMantenimientoOferta),
        estado: stateOf(item), tecnica: item.tecnica ?? null, preAdjudicado: item.preAdjudicado ?? null, pagare: item.pagare, oc: item.oc, unidades: formatUnits(item),
      });
      const filename = `licitacion-${item.entidad.toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/(^-|-$)/g, "")}-${item.fechaApertura}.pdf`;
      res.setHeader("Content-Type", "application/pdf"); res.setHeader("Content-Disposition", `attachment; filename="${filename}"`); return res.status(200).send(pdf);
    } catch (error) { logError("LicitacionesAdministracionController.exportPdf"); console.error(error); return res.status(500).json({ message: "No se pudo generar el PDF de la licitación" }); }
  };

  static addUnit = async (req: Request, res: Response) => {
    const id = text(req.params.id); if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "La licitación no es válida" });
    try {
      const validation = await validateUnit(req.body ?? {}); if ("error" in validation) return res.status(400).json({ error: validation.error });
      const item = await LicitacionAdministracion.findOne({ _id: id, deletedAt: null }); if (!item) return res.status(404).json({ error: "Licitación no encontrada" });
      normalizeUnits(item);
      const units = item.unidades as any[];
      units.push(...Array.from({ length: validation.data.cantidad }, () => ({ ...validation.data, cantidad: 1, asignada: false, equipadaTransformada: false, arribada: false, patentada: false, pagada: false, entregada: false })));
      await item.save(); return res.status(200).json({ message: "Unidades agregadas correctamente", data: formatUnits(item) });
    } catch (error) { logError("LicitacionesAdministracionController.addUnit"); console.error(error); return res.status(500).json({ message: "No se pudo agregar la unidad" }); }
  };

  static updateUnit = async (req: Request, res: Response) => {
    const id = text(req.params.id); const unitId = text(req.params.unitId);
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(unitId)) return res.status(400).json({ error: "La unidad no es válida" });
    try {
      const validation = await validateUnit(req.body ?? {}); if ("error" in validation) return res.status(400).json({ error: validation.error });
      if (validation.data.cantidad !== 1) return res.status(400).json({ error: "Cada línea representa una única unidad" });
      const item = await LicitacionAdministracion.findOne({ _id: id, deletedAt: null }); if (!item) return res.status(404).json({ error: "Licitación no encontrada" });
      normalizeUnits(item);
      const units = item.unidades as any[]; const current = units.find((unit) => String(unit._id) === unitId); if (!current) return res.status(404).json({ error: "Unidad no encontrada" });
      Object.assign(current, validation.data, { cantidad: 1 });
      await item.save(); return res.status(200).json({ message: "Unidad actualizada correctamente", data: formatUnits(item) });
    } catch (error) { logError("LicitacionesAdministracionController.updateUnit"); console.error(error); return res.status(500).json({ message: "No se pudo actualizar la unidad" }); }
  };

  static updateUnitProgress = async (req: Request, res: Response) => {
    const id = text(req.params.id); const unitId = text(req.params.unitId); const field = text(req.body?.field) as ProgressField; const value = req.body?.value;
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(unitId) || !progressFields.includes(field) || typeof value !== "boolean") return res.status(400).json({ error: "El avance de la unidad no es válido" });
    try {
      const item = await LicitacionAdministracion.findOne({ _id: id, deletedAt: null }); if (!item) return res.status(404).json({ error: "Licitación no encontrada" });
      normalizeUnits(item);
      const unit = findUnit(item, unitId); if (!unit) return res.status(404).json({ error: "Unidad no encontrada" });
      unit[field] = value;
      await item.save(); return res.status(200).json({ message: "Avance actualizado correctamente", data: formatUnits(item) });
    } catch (error) { logError("LicitacionesAdministracionController.updateUnitProgress"); console.error(error); return res.status(500).json({ message: "No se pudo actualizar el avance de la unidad" }); }
  };

  static updateUnitsProgress = async (req: Request, res: Response) => {
    const id = text(req.params.id); const field = text(req.body?.field) as ProgressField; const value = req.body?.value;
    if (!mongoose.Types.ObjectId.isValid(id) || !progressFields.includes(field) || field === "asignada" || typeof value !== "boolean") return res.status(400).json({ error: "El avance masivo no es válido" });
    try {
      const item = await LicitacionAdministracion.findOne({ _id: id, deletedAt: null }); if (!item) return res.status(404).json({ error: "Licitación no encontrada" });
      normalizeUnits(item);
      for (const unit of item.unidades as any[]) unit[field] = value;
      await item.save(); return res.status(200).json({ message: `Columna ${value ? "marcada" : "desmarcada"} correctamente`, data: formatUnits(item) });
    } catch (error) { logError("LicitacionesAdministracionController.updateUnitsProgress"); console.error(error); return res.status(500).json({ message: "No se pudo actualizar la columna" }); }
  };

  static assignUnitInterno = async (req: Request, res: Response) => {
    const id = text(req.params.id); const unitId = text(req.params.unitId); const interno = Number(req.body?.interno);
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(unitId) || !Number.isInteger(interno) || interno < 1) return res.status(400).json({ error: "El interno no es válido" });
    try {
      const used = await LicitacionAdministracion.findOne({ deletedAt: null, _id: { $ne: id }, "unidades.interno": interno }).lean();
      const item = await LicitacionAdministracion.findOne({ _id: id, deletedAt: null }); if (!item) return res.status(404).json({ error: "Licitación no encontrada" });
      normalizeUnits(item);
      const unit = findUnit(item, unitId); if (!unit) return res.status(404).json({ error: "Unidad no encontrada" });
      if (used || (item.unidades as any[]).some((entry) => String(entry._id) !== unitId && entry.interno === interno)) return res.status(400).json({ error: "Ese interno ya está asignado a otra unidad; primero quitálo de esa fila" });
      const rows = await sequelizeNIC.query<{ interno: number; version: string; color: string; estado: number }>(unidadCambioColorQuery(), { type: QueryTypes.SELECT, replacements: { interno } });
      const source = rows[0]; if (!source) return res.status(404).json({ error: "No se encontró una unidad nueva para ese interno" });
      unit.interno = interno; unit.versionId = null; unit.versionNombre = source.version; unit.asignada = true;
      await item.save(); return res.status(200).json({ message: "Interno asignado correctamente", data: formatUnits(item) });
    } catch (error) { logError("LicitacionesAdministracionController.assignUnitInterno"); console.error(error); return res.status(500).json({ message: "No se pudo buscar y asignar el interno" }); }
  };

  static releaseUnitInterno = async (req: Request, res: Response) => {
    const id = text(req.params.id); const unitId = text(req.params.unitId);
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(unitId)) return res.status(400).json({ error: "La unidad no es válida" });
    try {
      const item = await LicitacionAdministracion.findOne({ _id: id, deletedAt: null }); if (!item) return res.status(404).json({ error: "Licitación no encontrada" });
      normalizeUnits(item);
      const unit = findUnit(item, unitId); if (!unit) return res.status(404).json({ error: "Unidad no encontrada" });
      unit.interno = null; unit.asignada = false; unit.estado = "PENDIENTE_ASIGNAR";
      await item.save(); return res.status(200).json({ message: "Interno liberado correctamente", data: formatUnits(item) });
    } catch (error) { logError("LicitacionesAdministracionController.releaseUnitInterno"); console.error(error); return res.status(500).json({ message: "No se pudo liberar el interno" }); }
  };

  static updateUnitDetails = async (req: Request, res: Response) => {
    const id = text(req.params.id); const unitId = text(req.params.unitId); const { patentamiento, flete, acc } = req.body ?? {}; const cantidadServicios = Number(req.body?.cantidadServicios); const conversionId = text(req.body?.conversionId); const estadoConversion = req.body?.estadoConversion;
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(unitId)) return res.status(400).json({ error: "La unidad no es válida" });
    if (typeof patentamiento !== "boolean" || typeof flete !== "boolean" || typeof acc !== "boolean" || !Number.isInteger(cantidadServicios) || cantidadServicios < 0) return res.status(400).json({ error: "Patentamiento, flete, ACC y cantidad de servicios no son válidos" });
    if (conversionId && !mongoose.Types.ObjectId.isValid(conversionId)) return res.status(400).json({ error: "La conversión no es válida" });
    if (!conversionId && estadoConversion !== null && estadoConversion !== undefined) return res.status(400).json({ error: "El estado de conversión requiere una conversión seleccionada" });
    if (conversionId && !["PENDIENTE", "EN_PROVEEDOR", "CONVERTIDA"].includes(estadoConversion)) return res.status(400).json({ error: "El estado de conversión no es válido" });
    try {
      const item = await LicitacionAdministracion.findOne({ _id: id, deletedAt: null }); if (!item) return res.status(404).json({ error: "Licitación no encontrada" });
      normalizeUnits(item);
      const unit = (item.unidades as any[]).find((entry) => String(entry._id) === unitId); if (!unit) return res.status(404).json({ error: "Unidad no encontrada" });
      let conversion: { _id: mongoose.Types.ObjectId; tipoConversion: string; proveedor: string } | null = null;
      if (conversionId) { conversion = await Conversion.findById(conversionId).lean(); if (!conversion) return res.status(400).json({ error: "La conversión seleccionada ya no existe" }); }
      unit.patentamiento = patentamiento; unit.flete = flete; unit.cantidadServicios = cantidadServicios; unit.acc = acc;
      unit.conversionId = conversion?._id ?? null; unit.conversionTipo = conversion?.tipoConversion ?? ""; unit.conversionProveedor = conversion?.proveedor ?? ""; unit.estadoConversion = conversion ? estadoConversion : null;
      await item.save(); return res.status(200).json({ message: "Datos de la unidad actualizados correctamente", data: formatUnits(item) });
    } catch (error) { logError("LicitacionesAdministracionController.updateUnitDetails"); console.error(error); return res.status(500).json({ message: "No se pudieron actualizar los datos de la unidad" }); }
  };

  static removeUnit = async (req: Request, res: Response) => {
    const id = text(req.params.id); const unitId = text(req.params.unitId); const rowIndex = Number(req.body?.rowIndex);
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(unitId)) return res.status(400).json({ error: "La unidad no es válida" });
    try {
      const item = await LicitacionAdministracion.findOne({ _id: id, deletedAt: null }); if (!item) return res.status(404).json({ error: "Licitación no encontrada" });
      normalizeUnits(item); const units = item.unidades as any[];
      const target = units.find((unit) => String(unit._id) === unitId) ?? (Number.isInteger(rowIndex) && rowIndex >= 0 ? units[rowIndex] : undefined);
      if (!target) return res.status(404).json({ error: "Unidad no encontrada" });
      (item as any).unidades = units.filter((unit) => String(unit._id) !== String(target._id));
      await item.save(); return res.status(200).json({ message: "Unidad quitada correctamente", data: formatUnits(item) });
    }
    catch (error) { logError("LicitacionesAdministracionController.removeUnit"); console.error(error); return res.status(500).json({ message: "No se pudo quitar la unidad" }); }
  };

}
