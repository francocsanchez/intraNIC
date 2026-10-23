import type { Request, Response } from "express";
import { CalidadVentasService, type CalidadVentasPayload } from "../services/calidadVentas.service";
import type { CalidadVentasResult } from "../models/CalidadVentasResultado";
import { logError } from "../utils/logError";

const resultValues = new Set<CalidadVentasResult>(["cumple", "noCumple"]);
const toInteger = (value: unknown) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
};

const parsePayload = (body: any): CalidadVentasPayload | string => {
  const vendedorCodigo = toInteger(body?.vendedorCodigo);
  const anio = toInteger(body?.anio);
  const mes = toInteger(body?.mes);
  const ssiRaw = body?.ssiValor;
  const ssiValor = Number(ssiRaw);
  const values = [body?.oportunidadesPresupuesto, body?.entregaUsado, body?.tcfa, body?.ssiInterno];

  if (!vendedorCodigo || !anio || anio < 2000 || anio > 2100 || !mes || mes < 1 || mes > 12) {
    return "El vendedor, mes y año son obligatorios y deben ser válidos";
  }
  if (!values.every((value) => resultValues.has(value))) {
    return "Todos los objetivos deben indicar Cumple o No cumple";
  }
  if (
    ssiRaw === undefined ||
    ssiRaw === null ||
    (typeof ssiRaw === "string" && !ssiRaw.trim()) ||
    !Number.isFinite(ssiValor) ||
    ssiValor < 0 ||
    ssiValor > 100 ||
    Math.abs(ssiValor * 100 - Math.round(ssiValor * 100)) > 1e-8
  ) {
    return "SSI Interno debe ser un número entre 0 y 100 con hasta dos decimales";
  }
  if ((body.ssiInterno === "cumple" && ssiValor < 95) || (body.ssiInterno === "noCumple" && ssiValor >= 95)) {
    return "SSI Interno debe cumplir con el valor cargado: Cumple desde 95,00";
  }

  return {
    vendedorCodigo,
    anio,
    mes,
    oportunidadesPresupuesto: body.oportunidadesPresupuesto,
    entregaUsado: body.entregaUsado,
    tcfa: body.tcfa,
    ssiInterno: body.ssiInterno,
    ssiValor,
  };
};

export class CalidadVentasController {
  static async list(req: Request, res: Response) {
    const anio = toInteger(req.query.anio);
    const mes = toInteger(req.query.mes);
    if (!anio || anio < 2000 || anio > 2100 || !mes || mes < 1 || mes > 12) {
      return res.status(400).json({ message: "Mes y año son obligatorios y deben ser válidos" });
    }
    try {
      return res.status(200).json(await CalidadVentasService.list(anio, mes));
    } catch (error) {
      logError("CalidadVentasController.list");
      console.error(error);
      return res.status(500).json({ message: "No se pudieron obtener los resultados de Calidad Ventas" });
    }
  }

  static async searchVendedores(req: Request, res: Response) {
    const buscar = typeof req.query.buscar === "string" ? req.query.buscar : "";
    try {
      return res.status(200).json(await CalidadVentasService.searchVendedores(buscar));
    } catch (error) {
      logError("CalidadVentasController.searchVendedores");
      console.error(error);
      return res.status(500).json({ message: "No se pudieron buscar los vendedores" });
    }
  }

  static async save(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ message: "Usuario no autenticado" });
    const payload = parsePayload(req.body);
    if (typeof payload === "string") return res.status(400).json({ message: payload });
    try {
      return res.status(200).json(await CalidadVentasService.save(payload, req.user));
    } catch (error) {
      logError("CalidadVentasController.save");
      console.error(error);
      const message = error instanceof Error ? error.message : "No se pudo guardar el resultado";
      return res.status(400).json({ message });
    }
  }
}
