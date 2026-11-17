import { QueryTypes } from "sequelize";
import { sequelizeLIESS } from "../config/database";
import { saldoOperacionLiessSnapshotSourceQuery } from "../controllers/querys/saldoOperacionLiessSnapshot.query";
import SaldoOperacionLiessSnapshot from "../models/SaldoOperacionLiessSnapshot";
import { normalizeSaldoOperacionChasis } from "./saldoOperacionCreditoLiquidado.service";

export const tiposClienteLiess = ["Particular", "Leasing", "Reventa", "Empresa", "Licitación"] as const;
export type TipoClienteLiess = typeof tiposClienteLiess[number];
export const analysisDimensionsLiess = ["vendedor"] as const;
export type AnalysisDimensionLiess = typeof analysisDimensionsLiess[number];
export const defaultAnalysisDimensionOrderLiess: AnalysisDimensionLiess[] = ["vendedor"];
const trim = (value: unknown, fallback = "") => String(value ?? "").trim() || fallback;
const number = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : null;
const date = (value: unknown) => /^\d{4}-\d{2}-\d{2}$/.test(trim(value)) ? trim(value) : null;
const dayDiff = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000);
const creditoEstado = (item: any) => { const pactado = item.creditoBanco ?? 0, liquidado = item.creditoLiquidadoMonto ?? 0; if (pactado <= 0) return "sin_credito"; if (liquidado >= pactado) return "liquidado"; return liquidado > 0 ? "parcial" : "pendiente"; };
// Solo el crédito bancario contabilizado en LIESS (salglo, movimiento 150) reduce el saldo comercial.
const saldo = (item: any) => (item.total ?? 0) - (item.senas ?? 0) - (item.usado ?? 0) - (item.creditoLiquidadoMonto ?? 0);
const operationId = (tipoOperacion: number, codigoOperacion: number) => `${tipoOperacion}-${codigoOperacion}`;
const serialize = (item: any) => ({
  codigoOperacion: Number(item.codigoOperacion), tipoOperacion: Number(item.tipoOperacion ?? 5), clienteNombre: item.clienteNombre ?? "", tipoCliente: item.tipoCliente ?? null,
  vendedor: item.vendedor ?? "", sucursal: item.sucursal ?? "SIN SUCURSAL", marca: item.marca ?? "SIN MARCA", version: item.version ?? "SIN VERSION", chasis: item.chasis ?? "",
  total: item.total ?? null, gestoria: item.gestoria ?? null, bonificacion: item.bonificacion ?? null, senas: item.senas ?? null, usado: item.usado ?? null,
  creditoBanco: item.creditoBanco ?? null, creditoLiquidadoMonto: item.creditoLiquidadoMonto ?? null, creditoEstado: creditoEstado(item), creditoLiquidado: Boolean(item.creditoLiquidadoManual),
  fechaAsignacion: item.fechaAsignacion ?? null, fechaFactura: item.fechaFactura ?? null, diasAsignada: item.diasAsignada ?? null,
  fechaCancelacion: item.fechaCancelacion ?? null, diasHastaCancelacion: item.diasHastaCancelacion ?? null, entregada: Boolean(item.entregada), saldo: saldo(item),
});
const currentFilter = (params: any) => {
  const filter: any = {};
  const entregadas = String(params.entrega ?? "").toLowerCase() === "entregadas";
  if (entregadas) filter.entregada = true;
  else { filter.fechaCancelacion = String(params.section ?? "").toLowerCase() === "canceladas" ? { $ne: null } : null; if (String(params.entrega ?? "") === "sin-entregar") filter.entregada = { $ne: true }; }
  const tipoOperacion = Number(params.tipoOperacion); if ([5, 10].includes(tipoOperacion)) filter.tipoOperacion = tipoOperacion;
  const creditoMarcado = String(params.creditoMarcado ?? ""); if (creditoMarcado === "si" || creditoMarcado === "no") { filter.creditoBanco = { $gt: 0 }; filter.creditoLiquidadoManual = creditoMarcado === "si" ? true : { $ne: true }; }
  for (const key of ["sucursal", "vendedor"] as const) if (trim(params[key])) filter[key] = trim(params[key]);
  const codigo = Number(params.operacion); if (Number.isInteger(codigo) && codigo > 0) filter.codigoOperacion = codigo;
  return filter;
};
const analysisValue = (row: any, _dimension: AnalysisDimensionLiess) => trim(row.vendedor, "Sin vendedor");

export class SaldoOperacionLiessSnapshotService {
  static async syncFromLiess() {
    // Los números de operación pueden repetirse entre Nuevo (5) y Usado (10).
    // Se migra el identificador de los snapshots previos antes de incorporar ambas series.
    await SaldoOperacionLiessSnapshot.collection.updateMany(
      { operacionId: { $exists: false } },
      [{ $set: { operacionId: { $concat: [{ $toString: "$tipoOperacion" }, "-", { $toString: "$codigoOperacion" }] } } }],
    );
    await SaldoOperacionLiessSnapshot.collection.updateMany({ creditoLiquidadoManual: { $exists: false } }, { $set: { creditoLiquidadoManual: false } });
    await SaldoOperacionLiessSnapshot.collection.dropIndex("codigoOperacion_1").catch(() => undefined);
    await SaldoOperacionLiessSnapshot.collection.createIndex({ operacionId: 1 }, { unique: true, name: "operacionId_1" });
    const rows = await sequelizeLIESS.query<Record<string, unknown>>(saldoOperacionLiessSnapshotSourceQuery(), { type: QueryTypes.SELECT });
    const now = new Date();
    const source = rows.map((row) => { const codigoOperacion = number(row.codigo_operacion), tipoOperacion = number(row.tipo_operacion) ?? 5; return { operacionId: codigoOperacion ? operationId(tipoOperacion, codigoOperacion) : "", codigoOperacion, tipoOperacion, clienteNombre: trim(row.cliente_nombre), vendedor: trim(row.vendedor), sucursal: trim(row.sucursal, "SIN SUCURSAL"), marca: trim(row.marca, "SIN MARCA"), version: trim(row.version, "SIN VERSION"), chasis: normalizeSaldoOperacionChasis(row.chasis), total: number(row.total), gestoria: number(row.gestoria), bonificacion: number(row.bonificacion), senas: number(row.senas), usado: number(row.usado), creditoBanco: number(row.credito_banco), creditoLiquidadoMonto: number(row.credito_liquidado_monto), creditoLiquidadoEn: date(row.credito_liquidado_en), fechaAsignacion: date(row.fecha_asignacion), fechaFactura: date(row.fecha_factura), diasAsignada: number(row.dias_asignada), entregada: Boolean(row.entregada), sincronizadoEn: now }; }).filter((row) => row.codigoOperacion) as any[];
    const writes = source.map((row) => ({ updateOne: { filter: { operacionId: row.operacionId }, update: { $set: { ...row, ...(row.entregada ? { fechaEntregaDetectada: now } : {}) }, $setOnInsert: { tipoCliente: null, fechaCancelacion: null, diasHastaCancelacion: null, creditoLiquidadoManual: false } }, upsert: true } }));
    if (writes.length) await SaldoOperacionLiessSnapshot.bulkWrite(writes, { ordered: false });
    const ids = source.map((row) => row.operacionId);
    const deleted = await SaldoOperacionLiessSnapshot.deleteMany({ operacionId: { $nin: ids } });
    return { total: source.length, createdOrUpdated: writes.length, entregadas: source.filter((row) => row.entregada).length, eliminadasSinAsignacion: deleted.deletedCount ?? 0 };
  }

  static async list(params: any) {
    const rows = (await SaldoOperacionLiessSnapshot.find(currentFilter(params)).lean()).map(serialize);
    const sortKey = ["codigoOperacion", "clienteNombre", "vendedor", "version", "gestoria", "fechaAsignacion", "diasAsignada", "fechaCancelacion", "diasHastaCancelacion", "creditoBanco", "creditoLiquidado", "saldo"].includes(params.sortKey) ? params.sortKey : "saldo";
    const direction = params.sortDirection === "desc" ? -1 : 1;
    rows.sort((a: any, b: any) => { const left = a[sortKey], right = b[sortKey]; if (left == null) return 1; if (right == null) return -1; return (typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right), "es", { numeric: true })) * direction; });
    const page = Math.max(1, Number(params.page) || 1), limit = Math.min(200, Math.max(1, Number(params.limit) || 60));
    return { data: rows.slice((page - 1) * limit, page * limit), total: rows.length, page, limit, totalPages: Math.max(1, Math.ceil(rows.length / limit)) };
  }
  static async filters() { const rows = await SaldoOperacionLiessSnapshot.find({}, { sucursal: 1, vendedor: 1 }).lean(); return { data: { sucursales: [...new Set(rows.map((row) => trim(row.sucursal)).filter(Boolean))].sort(), vendedores: [...new Set(rows.map((row) => trim(row.vendedor)).filter(Boolean))].sort() } }; }
  static async syncStatus() { const row = await SaldoOperacionLiessSnapshot.findOne({}, { sincronizadoEn: 1 }).sort({ sincronizadoEn: -1 }).lean(); return { data: { sincronizadoEn: row?.sincronizadoEn?.toISOString() ?? null } }; }
  static async summary(params: any) { const rows = (await SaldoOperacionLiessSnapshot.find(currentFilter({ ...params, section: "conSaldo" })).lean()).map(serialize); const group = new Map<string, { marca: string; operaciones: number; saldo: number }>(), conSaldo = rows.filter((row: any) => row.saldo >= 0), opUsados = conSaldo.filter((row: any) => row.tipoOperacion === 10); conSaldo.filter((row: any) => row.tipoOperacion !== 10).forEach((row: any) => { const value = group.get(row.marca) ?? { marca: row.marca, operaciones: 0, saldo: 0 }; value.operaciones += 1; value.saldo += row.saldo; group.set(row.marca, value); }); return { data: { operaciones: rows.length, saldo: rows.reduce((sum: number, row: any) => sum + row.saldo, 0), creditoPendiente: rows.reduce((sum: number, row: any) => sum + Math.max(0, (row.creditoBanco ?? 0) - (row.creditoLiquidadoMonto ?? 0)), 0), usadoPendiente: rows.reduce((sum: number, row: any) => sum + (row.usado ?? 0), 0), porMarca: [...group.values()].sort((a, b) => b.saldo - a.saldo), opUsados: { operaciones: opUsados.length, saldo: opUsados.reduce((sum: number, row: any) => sum + row.saldo, 0) } } }; }
  static async updateTipoCliente(codigoOperacion: number, tipoOperacion: number, tipoCliente: TipoClienteLiess | null) { const row = await SaldoOperacionLiessSnapshot.findOneAndUpdate({ operacionId: operationId(tipoOperacion, codigoOperacion) }, { $set: { tipoCliente } }, { new: true }); if (!row) throw new Error("La operación LIESS no existe"); return serialize(row); }
  static async updateCreditoLiquidado(codigoOperacion: number, tipoOperacion: number, creditoLiquidadoManual: boolean) { const row = await SaldoOperacionLiessSnapshot.findOneAndUpdate({ operacionId: operationId(tipoOperacion, codigoOperacion) }, { $set: { creditoLiquidadoManual } }, { new: true }); if (!row) throw new Error("La operación LIESS no existe"); return serialize(row); }
  static async paymentDetail(codigoOperacion: number, tipoOperacion = 5) { const row = await SaldoOperacionLiessSnapshot.findOne({ operacionId: operationId(tipoOperacion, codigoOperacion) }).lean(); if (!row) throw new Error("La operación LIESS no existe"); return serialize(row); }
  static async updateCancelacion(codigoOperacion: number, tipoOperacion: number, fechaCancelacion: string | null) { const row = await SaldoOperacionLiessSnapshot.findOne({ operacionId: operationId(tipoOperacion, codigoOperacion) }); if (!row) throw new Error("La operación LIESS no existe"); if (fechaCancelacion && !/^\d{4}-\d{2}-\d{2}$/.test(fechaCancelacion)) throw new Error("La fecha de cancelación no es válida"); if (fechaCancelacion && !row.fechaAsignacion) throw new Error("La operación no tiene fecha de asignación"); row.fechaCancelacion = fechaCancelacion; row.diasHastaCancelacion = fechaCancelacion && row.fechaAsignacion ? dayDiff(row.fechaAsignacion, fechaCancelacion) : null; await row.save(); return serialize(row); }
  static async exportRows(params: any) { return (await SaldoOperacionLiessSnapshot.find(currentFilter(params)).lean()).map(serialize); }
  static async analysis(canceladas: boolean, month?: string, year?: string, dimensions: AnalysisDimensionLiess[] = defaultAnalysisDimensionOrderLiess) {
    const filter: any = canceladas ? { fechaCancelacion: { $ne: null }, diasHastaCancelacion: { $type: "number" } } : { fechaCancelacion: null, diasAsignada: { $type: "number" } };
    if (year) filter.fechaAsignacion = { $regex: `^${year}-` }; if (month) filter.fechaAsignacion = { $regex: `^${month}` };
    const rows = await SaldoOperacionLiessSnapshot.find(filter).lean();
    const leaf = (items: any[], index: number): any[] => { const dimension = dimensions[index]; if (!dimension) return []; const branches = new Map<string, any[]>(); items.forEach((item) => { const name = analysisValue(item, dimension); branches.set(name, [...(branches.get(name) ?? []), item]); }); return [...branches.entries()].sort(([a], [b]) => a.localeCompare(b, "es")).map(([name, entries]) => ({ name, operations: entries.length, averageDays: entries.reduce((sum, item) => sum + (canceladas ? item.diasHastaCancelacion : item.diasAsignada), 0) / entries.length, saldoTotal: entries.reduce((sum, item) => sum + saldo(item), 0), children: leaf(entries, index + 1) })); };
    const averageDays = rows.length ? rows.reduce((sum, item) => sum + (canceladas ? (item.diasHastaCancelacion ?? 0) : (item.diasAsignada ?? 0)), 0) / rows.length : 0;
    return { data: { operations: rows.length, averageDays, dimensionOrder: dimensions, tree: { name: "Tiempo total", operations: rows.length, averageDays, children: leaf(rows, 0) } } };
  }
}
