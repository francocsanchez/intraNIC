import { QueryTypes } from "sequelize";
import { sequelizeNIC } from "../config/database";
import {
  getVendedorActivoNuevoNicByCode,
  searchVendedoresActivosNuevoNic,
} from "../controllers/querys/dms.query";
import CalidadVentasResultado, {
  type CalidadVentasResult,
  type ICalidadVentasResultado,
} from "../models/CalidadVentasResultado";

type CurrentUser = { _id: string; name?: string; lastName?: string };

export type CalidadVentasPayload = {
  vendedorCodigo: number;
  anio: number;
  mes: number;
  oportunidadesPresupuesto: CalidadVentasResult;
  entregaUsado: CalidadVentasResult;
  tcfa: CalidadVentasResult;
  ssiInterno: CalidadVentasResult;
  ssiValor: number;
};

type SellerRow = { codigo: number; vendedor: string; sucursal: string };

const serialize = (item: ICalidadVentasResultado | Record<string, any>) => ({
  _id: String(item._id),
  vendedorCodigo: Number(item.vendedorCodigo),
  vendedorNombre: String(item.vendedorNombre),
  sucursal: String(item.sucursal),
  anio: Number(item.anio),
  mes: Number(item.mes),
  oportunidadesPresupuesto: item.oportunidadesPresupuesto as CalidadVentasResult,
  entregaUsado: item.entregaUsado as CalidadVentasResult,
  tcfa: item.tcfa as CalidadVentasResult,
  ssiInterno: item.ssiInterno as CalidadVentasResult,
  ssiValor: Number(item.ssiValor),
  puntosOportunidades: Number(item.puntosOportunidades),
  puntosEntregaUsado: Number(item.puntosEntregaUsado),
  puntosTcfa: Number(item.puntosTcfa),
  puntosSsi: Number(item.puntosSsi),
  puntosTotal: Number(item.puntosTotal),
  createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : String(item.createdAt),
  updatedAt: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : String(item.updatedAt),
});

const buildActorName = (user: CurrentUser) => `${user.lastName ?? ""} ${user.name ?? ""}`.trim() || "Usuario";
const toSnapshot = (item: ReturnType<typeof serialize>) => ({
  vendedorCodigo: item.vendedorCodigo,
  vendedorNombre: item.vendedorNombre,
  sucursal: item.sucursal,
  anio: item.anio,
  mes: item.mes,
  oportunidadesPresupuesto: item.oportunidadesPresupuesto,
  entregaUsado: item.entregaUsado,
  tcfa: item.tcfa,
  ssiInterno: item.ssiInterno,
  ssiValor: item.ssiValor,
  puntosOportunidades: item.puntosOportunidades,
  puntosEntregaUsado: item.puntosEntregaUsado,
  puntosTcfa: item.puntosTcfa,
  puntosSsi: item.puntosSsi,
  puntosTotal: item.puntosTotal,
});

export class CalidadVentasService {
  static async list(anio: number, mes: number) {
    const data = await CalidadVentasResultado.find({ anio, mes }).sort({ vendedorNombre: 1 }).lean();
    return { data: data.map(serialize) };
  }

  static async searchVendedores(buscar: string) {
    if (buscar.trim().length < 2) return { data: [] };

    const data = await sequelizeNIC.query<SellerRow>(searchVendedoresActivosNuevoNic(), {
      replacements: { buscar: `%${buscar.trim()}%` },
      type: QueryTypes.SELECT,
    });
    return {
      data: data.map((item) => ({
        codigo: Number(item.codigo),
        vendedor: String(item.vendedor).trim(),
        sucursal: String(item.sucursal).trim() || "SIN ASIGNAR",
      })),
    };
  }

  static async save(payload: CalidadVentasPayload, user: CurrentUser) {
    const existing = await CalidadVentasResultado.findOne({
      vendedorCodigo: payload.vendedorCodigo,
      anio: payload.anio,
      mes: payload.mes,
    });

    let seller: SellerRow | null = null;
    if (!existing) {
      const rows = await sequelizeNIC.query<SellerRow>(getVendedorActivoNuevoNicByCode(), {
        replacements: { codigo: payload.vendedorCodigo },
        type: QueryTypes.SELECT,
      });
      seller = rows[0] ?? null;
      if (!seller) throw new Error("El vendedor seleccionado no está activo para ventas nuevas");
    }

    const puntosOportunidades = payload.oportunidadesPresupuesto === "cumple" ? 3 : 0;
    const puntosEntregaUsado = payload.entregaUsado === "cumple" ? 1 : 0;
    const puntosTcfa = payload.tcfa === "cumple" ? 1 : 0;
    const puntosSsi = payload.ssiInterno === "cumple" ? 3 : 0;
    const puntosTotal = puntosOportunidades + puntosEntregaUsado + puntosTcfa + puntosSsi;
    const actorName = buildActorName(user);

    if (!existing) {
      const next = {
        vendedorCodigo: payload.vendedorCodigo,
        vendedorNombre: String(seller!.vendedor).trim(),
        sucursal: String(seller!.sucursal).trim() || "SIN ASIGNAR",
        anio: payload.anio,
        mes: payload.mes,
        oportunidadesPresupuesto: payload.oportunidadesPresupuesto,
        entregaUsado: payload.entregaUsado,
        tcfa: payload.tcfa,
        ssiInterno: payload.ssiInterno,
        ssiValor: payload.ssiValor,
        puntosOportunidades,
        puntosEntregaUsado,
        puntosTcfa,
        puntosSsi,
        puntosTotal,
      };
      const created = await CalidadVentasResultado.create({
        ...next,
        createdBy: user._id,
        createdByName: actorName,
        updatedBy: user._id,
        updatedByName: actorName,
        auditoria: [{ action: "CREATED", actorId: user._id, actorName, before: { estado: "Sin registro previo" }, after: next }],
      });
      return { message: "Resultado cargado correctamente", data: serialize(created) };
    }

    const before = toSnapshot(serialize(existing));
    existing.set({
      oportunidadesPresupuesto: payload.oportunidadesPresupuesto,
      entregaUsado: payload.entregaUsado,
      tcfa: payload.tcfa,
      ssiInterno: payload.ssiInterno,
      ssiValor: payload.ssiValor,
      puntosOportunidades,
      puntosEntregaUsado,
      puntosTcfa,
      puntosSsi,
      puntosTotal,
      updatedBy: user._id,
      updatedByName: actorName,
    });
    const after = toSnapshot(serialize(existing));
    for (const audit of existing.auditoria) {
      if (!audit.before || Object.keys(audit.before).length === 0) {
        audit.before = { estado: "Sin registro previo" };
      }
      if (!audit.after || Object.keys(audit.after).length === 0) {
        audit.after = { estado: "Sin registro posterior" };
      }
    }
    existing.auditoria.push({ action: "UPDATED", actorId: user._id as any, actorName, before, after, createdAt: new Date() });
    await existing.save();
    return { message: "Resultado actualizado correctamente", data: serialize(existing) };
  }
}
