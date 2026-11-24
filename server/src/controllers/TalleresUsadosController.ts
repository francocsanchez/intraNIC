import type { Request, Response } from "express";
import mongoose from "mongoose";
import { QueryTypes } from "sequelize";
import { sequelizeNIC } from "../config/database";
import TallerUsados from "../models/TallerUsados";
import PresupuestoUsados from "../models/PresupuestoUsados";
import XLSX from "xlsx";

const estados = ["Pendiente", "Aprobado", "Rechazado", "Revisar"];
const prioridades = ["Alta", "Media", "Baja"];
const clean = (value: unknown) => String(value ?? "").trim();
const normalized = (value: unknown) => clean(value).toLocaleLowerCase();
const number = (value: unknown) => Number(value);
const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime());
const date = (value: unknown) => clean(value) ? new Date(`${clean(value)}T00:00:00Z`) : null;
const asDate = (value: unknown) => value instanceof Date ? value.toISOString() : value;
const serializeTaller = (item: any) => ({ _id: String(item._id), nombre: item.nombre, tipoTrabajo: item.tipoTrabajo || "", activo: Boolean(item.activo) });
const serialize = (item: any) => ({ ...item, _id: String(item._id), tallerId: String(item.tallerId), fechaPedido: asDate(item.fechaPedido), fechaIngresoTaller: asDate(item.fechaIngresoTaller), fechaEgresoTaller: asDate(item.fechaEgresoTaller), createdAt: asDate(item.createdAt), updatedAt: asDate(item.updatedAt) });

async function findUnidad(interno: string) {
  const rows = await sequelizeNIC.query<any>(`SELECT TOP 1 CAST(sa.sa_codigo AS varchar(32)) interno, LTRIM(RTRIM(ISNULL(anx.aus_dominio, ''))) dominio, LTRIM(RTRIM(ISNULL(m.mar_nombre, ''))) marca, LTRIM(RTRIM(ISNULL(a.au_nombre, ''))) modelo, ISNULL(anx.aus_km, 0) km, LTRIM(RTRIM(ISNULL(anx.aus_chasis, ''))) chasis FROM siac.dbo.stoauto sa LEFT JOIN siac.dbo.auto a ON a.au_marca = sa.sa_marca AND a.au_codigo = sa.sa_auto LEFT JOIN siac.dbo.marca m ON m.mar_codigo = sa.sa_marca LEFT JOIN siac.dbo.anexusa anx ON anx.aus_tipo = sa.sa_tipo AND anx.aus_codigo = sa.sa_codigo WHERE sa.sa_tipo = 10 AND CAST(sa.sa_codigo AS varchar(32)) = :interno`, { replacements: { interno }, type: QueryTypes.SELECT });
  return rows[0] ?? null;
}

function calculated(body: any) {
  const costo = number(body.costo), valorInfo = number(body.valorInfo), porcentajeToma = number(body.porcentajeToma);
  if (![costo, valorInfo, porcentajeToma].every(Number.isFinite) || costo <= 0 || valorInfo <= 0 || porcentajeToma < 0 || porcentajeToma > 100) return null;
  const valorIngreso = valorInfo - (valorInfo * porcentajeToma / 100);
  return { costo, costoConIva: Math.round(costo * 1.21 * 100) / 100, valorInfo, porcentajeToma, valorIngreso, diferencia: valorInfo - valorIngreso };
}

export class TalleresUsadosController {
  static listPresupuestos = async (req: Request, res: Response) => { try { const query: any = {}; for (const key of ["estado", "tallerId"] as const) if (clean(req.query[key])) query[key] = clean(req.query[key]); for (const key of ["interno", "dominio"] as const) if (clean(req.query[key])) query[key] = { $regex: clean(req.query[key]), $options: "i" }; const data = await PresupuestoUsados.find(query).sort({ fechaPedido: -1, createdAt: -1 }).lean(); return res.json({ data: data.map(serialize) }); } catch { return res.status(500).json({ error: "No se pudieron listar los presupuestos" }); } };
  static createPresupuesto = async (req: Request, res: Response) => { try { const body = req.body ?? {}, origen = clean(body.origen), common = calculated(body), fechaPedido = clean(body.fechaPedido), tallerId = clean(body.tallerId); if (!common || !validDate(fechaPedido) || !mongoose.Types.ObjectId.isValid(tallerId) || !["interno", "externo"].includes(origen)) return res.status(400).json({ error: "Completá los datos obligatorios con valores válidos" }); if (!prioridades.includes(clean(body.prioridad) || "Media")) return res.status(400).json({ error: "Prioridad inválida" }); const taller = await TallerUsados.findById(tallerId).lean(); if (!taller) return res.status(400).json({ error: "El taller seleccionado no existe" }); let unidad: any; if (origen === "interno") { unidad = await findUnidad(clean(body.interno)); if (!unidad) return res.status(400).json({ error: "No se encontró una unidad usada para el interno" }); } else { const marcaCodigo = clean(body.marcaCodigo), modeloCodigo = clean(body.modeloCodigo); const rows = await sequelizeNIC.query<any>(`SELECT TOP 1 LTRIM(RTRIM(m.mar_nombre)) marca, LTRIM(RTRIM(a.au_nombre)) modelo FROM siac.dbo.auto a INNER JOIN siac.dbo.marca m ON m.mar_codigo = a.au_marca WHERE CAST(a.au_marca AS varchar(32)) = :marcaCodigo AND CAST(a.au_codigo AS varchar(32)) = :modeloCodigo`, { replacements: { marcaCodigo, modeloCodigo }, type: QueryTypes.SELECT }); unidad = rows[0] && { interno: "", dominio: clean(body.dominio), marca: rows[0].marca, modelo: rows[0].modelo }; if (!unidad || !unidad.dominio) return res.status(400).json({ error: "La marca, modelo y dominio externos son obligatorios" }); }
    const km = number(body.km), ingreso = clean(body.fechaIngresoTaller), egreso = clean(body.fechaEgresoTaller); if (!Number.isInteger(km) || km < 0) return res.status(400).json({ error: "KM informado inválido" }); if ((ingreso && !validDate(ingreso)) || (egreso && (!validDate(egreso) || !ingreso || egreso < ingreso))) return res.status(400).json({ error: "Las fechas de taller no son válidas" }); const item = await PresupuestoUsados.create({ ...common, interno: unidad.interno, esExterno: origen === "externo", esReingreso: origen === "externo" && Boolean(body.esReingreso), dominio: unidad.dominio, marca: unidad.marca, modelo: unidad.modelo, km, observaciones: clean(body.observaciones), tallerId, tallerNombre: taller.nombre, nroPresupuesto: clean(body.nroPresupuesto), prioridad: clean(body.prioridad) || "Media", detalle: clean(body.detalle), fechaPedido: date(fechaPedido), fechaIngresoTaller: date(ingreso), fechaEgresoTaller: date(egreso) }); return res.status(201).json({ data: serialize(item.toObject()) }); } catch (error) { return res.status(500).json({ error: "No se pudo guardar el presupuesto" }); } };
  static updatePresupuesto = async (req: Request, res: Response) => { try { const id = clean(req.params.id), body = req.body ?? {}; if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "Presupuesto inválido" }); const update: any = {}; if (body.estado !== undefined) { if (!estados.includes(clean(body.estado))) return res.status(400).json({ error: "Estado inválido" }); update.estado = clean(body.estado); } for (const field of ["detalle", "observaciones"] as const) if (body[field] !== undefined) update[field] = clean(body[field]); for (const field of ["fechaIngresoTaller", "fechaEgresoTaller"] as const) if (body[field] !== undefined) { const value = clean(body[field]); if (value && !validDate(value)) return res.status(400).json({ error: "Fecha inválida" }); update[field] = date(value); } if (update.fechaEgresoTaller && (!update.fechaIngresoTaller || update.fechaEgresoTaller < update.fechaIngresoTaller)) return res.status(400).json({ error: "El egreso requiere un ingreso anterior" }); const item = await PresupuestoUsados.findByIdAndUpdate(id, { $set: update }, { new: true }).lean(); return item ? res.json({ data: serialize(item) }) : res.status(404).json({ error: "Presupuesto no encontrado" }); } catch { return res.status(500).json({ error: "No se pudo actualizar el presupuesto" }); } };
  static listTalleres = async (req: Request, res: Response) => { const query = req.query.todos === "1" ? {} : { activo: true }; const data = await TallerUsados.find(query).sort({ nombre: 1 }).lean(); return res.json({ data: data.map(serializeTaller) }); };
  static saveTaller = async (req: Request, res: Response) => { try { const id = clean(req.params.id), nombre = clean(req.body?.nombre), tipoTrabajo = clean(req.body?.tipoTrabajo), activo = req.body?.activo; if (!nombre || nombre.length > 120 || (activo !== undefined && typeof activo !== "boolean")) return res.status(400).json({ error: "Datos de taller inválidos" }); const nombreNormalizado = normalized(nombre); const exists = await TallerUsados.exists({ nombreNormalizado, ...(id ? { _id: { $ne: id } } : {}) }); if (exists) return res.status(400).json({ error: "Ya existe un taller con ese nombre" }); const item = id ? await TallerUsados.findByIdAndUpdate(id, { nombre, nombreNormalizado, tipoTrabajo, ...(activo === undefined ? {} : { activo }) }, { new: true }) : await TallerUsados.create({ nombre, nombreNormalizado, tipoTrabajo, activo: activo ?? true }); return res.status(id ? 200 : 201).json({ data: serializeTaller(item) }); } catch { return res.status(500).json({ error: "No se pudo guardar el taller" }); } };
  static deleteTaller = async (req: Request, res: Response) => { const id = clean(req.params.id); if (await PresupuestoUsados.exists({ tallerId: id })) return res.status(400).json({ error: "No se puede eliminar un taller con presupuestos asociados" }); const result = await TallerUsados.findByIdAndDelete(id); return result ? res.json({ ok: true }) : res.status(404).json({ error: "Taller no encontrado" }); };
  static unidad = async (req: Request, res: Response) => { try { const item = await findUnidad(clean(req.query.interno)); return item ? res.json({ data: item }) : res.status(404).json({ error: "Unidad no encontrada" }); } catch { return res.status(500).json({ error: "No se pudo consultar SIAC" }); } };
  static catalogo = async (req: Request, res: Response) => { try { const marcaCodigo = clean(req.query.marcaCodigo), query = clean(req.query.query); if (!marcaCodigo) { const data = await sequelizeNIC.query<any>(`SELECT DISTINCT CAST(m.mar_codigo AS varchar(32)) codigo, LTRIM(RTRIM(m.mar_nombre)) nombre FROM siac.dbo.auto a INNER JOIN siac.dbo.marca m ON m.mar_codigo = a.au_marca WHERE LTRIM(RTRIM(ISNULL(m.mar_nombre, ''))) <> '' ORDER BY nombre`, { type: QueryTypes.SELECT }); return res.json({ data }); } if (query.length < 3) return res.status(400).json({ error: "Ingresá al menos 3 caracteres" }); const data = await sequelizeNIC.query<any>(`SELECT DISTINCT TOP 50 CAST(a.au_codigo AS varchar(32)) codigo, LTRIM(RTRIM(a.au_nombre)) nombre FROM siac.dbo.auto a WHERE CAST(a.au_marca AS varchar(32)) = :marcaCodigo AND LOWER(LTRIM(RTRIM(a.au_nombre))) LIKE '%' + :query + '%' ORDER BY nombre`, { replacements: { marcaCodigo, query: query.toLocaleLowerCase() }, type: QueryTypes.SELECT }); return res.json({ data }); } catch { return res.status(500).json({ error: "No se pudo consultar el catálogo" }); } };
  static dashboard = async (req: Request, res: Response) => {
    const year = Number(req.query.year) || new Date().getFullYear();
    const all = await PresupuestoUsados.find().lean();
    const repairs = Array.from({ length: 12 }, () => ({ totalDays: 0, count: 0 }));
    const todayUtc = Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate());

    all.forEach((item: any) => {
      const pedido = new Date(item.fechaPedido);
      if (item.estado !== "Aprobado" || !item.fechaIngresoTaller || pedido.getUTCFullYear() !== year) return;
      const ingreso = new Date(item.fechaIngresoTaller);
      const fin = item.fechaEgresoTaller ? new Date(item.fechaEgresoTaller) : new Date(todayUtc);
      const days = Math.max(0, Math.floor((Date.UTC(fin.getUTCFullYear(), fin.getUTCMonth(), fin.getUTCDate()) - Date.UTC(ingreso.getUTCFullYear(), ingreso.getUTCMonth(), ingreso.getUTCDate())) / 86_400_000));
      const bucket = repairs[pedido.getUTCMonth()];
      bucket.totalDays += days;
      bucket.count += 1;
    });

    const rows = repairs.map((repair, index) => ({
      month: index + 1,
      analisis: repair.count ? Number((repair.totalDays / repair.count).toFixed(1)) : 0,
      esperandoIngreso: 0,
      enReparacion: 0,
      reparado: repair.count,
    }));
    const years = Array.from(new Set(all.map((item: any) => new Date(item.fechaPedido).getUTCFullYear()))).sort((a, b) => b - a);
    return res.json({ data: { year, availableYears: years, rows } });
  };
  static exportPresupuestos = async (_req: Request, res: Response) => { try { const data = await PresupuestoUsados.find().sort({ fechaPedido: -1, createdAt: -1 }).lean(); const rows = data.map((item: any) => ({ Estado: item.estado, Prioridad: item.prioridad, Taller: item.tallerNombre, Tipo: item.esExterno ? "Externo" : "Sistema", "Es re-ingreso": item.esReingreso ? "Sí" : "No", Interno: item.interno, Dominio: item.dominio, Marca: item.marca, Modelo: item.modelo, "KM informado": item.km, "Costo ARS": item.costo, "Costo con IVA ARS": item.costoConIva, "Valor info ARS": item.valorInfo, "% toma": item.porcentajeToma, "Valor ingreso ARS": item.valorIngreso, "Diferencia ARS": item.diferencia, "F. Pedido": item.fechaPedido, "Ingreso a taller": item.fechaIngresoTaller, "Egreso de taller": item.fechaEgresoTaller, "Nro. presupuesto": item.nroPresupuesto, Detalle: item.detalle, Observaciones: item.observaciones })); const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(rows), "Presupuestos"); const buffer = XLSX.write(book, { type: "buffer", bookType: "xlsx" }); res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"); res.setHeader("Content-Disposition", "attachment; filename=presupuestos-usados.xlsx"); return res.send(buffer); } catch { return res.status(500).json({ error: "No se pudo exportar el Excel" }); } };
}
