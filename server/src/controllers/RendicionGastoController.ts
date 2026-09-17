import { Request, Response } from "express";
import EmpresaGasto from "../models/EmpresaGasto";
import RendicionGasto from "../models/RendicionGasto";
import { buildRendicionGastoResponse, upsertEmpresaCanonica, upsertEmpresasCanonicas, validateRendicionGasto } from "../services/rendicionGasto.service";
import { generateRendicionGastoPdf } from "../utils/rendicionGastoPdf";
import { logError } from "../utils/logError";

const findOwnRendicion = (id: string, userId: string) => RendicionGasto.findOne({ _id: id, createdBy: userId }).lean();

export class RendicionGastoController {
  static list = async (req: Request, res: Response) => {
    try { const data = await RendicionGasto.find({ createdBy: req.user!._id }).sort({ createdAt: -1 }).lean(); return res.json({ data: data.map(buildRendicionGastoResponse) }); }
    catch (error) { logError("RendicionGastoController.list"); console.error(error); return res.status(500).json({ message: "Error al listar rendiciones" }); }
  };
  static getById = async (req: Request, res: Response) => {
    try { const data = await findOwnRendicion(String(req.params.id), req.user!._id); if (!data) return res.status(404).json({ error: "Rendición no encontrada" }); return res.json({ data: buildRendicionGastoResponse(data) }); }
    catch (error) { logError("RendicionGastoController.getById"); console.error(error); return res.status(500).json({ message: "Error al obtener la rendición" }); }
  };
  static create = async (req: Request, res: Response) => {
    try {
      const payload = validateRendicionGasto(req.body);
      await upsertEmpresasCanonicas(payload.gastos);
      const data = await RendicionGasto.create({ ...payload, createdBy: req.user!._id });
      return res.status(201).json({ message: "Rendición guardada correctamente", data: buildRendicionGastoResponse(data.toObject()) });
    } catch (error) { logError("RendicionGastoController.create"); console.error(error); return res.status(400).json({ error: error instanceof Error ? error.message : "No se pudo guardar la rendición" }); }
  };
  static getEmpresaByCuit = async (req: Request, res: Response) => {
    const cuit = String(req.params.cuit ?? "");
    if (!/^\d{11}$/.test(cuit)) return res.status(400).json({ error: "El CUIT debe tener exactamente 11 dígitos" });
    const data = await EmpresaGasto.findOne({ cuit }).lean();
    return res.json({ data: data ? { cuit: data.cuit, nombre: data.nombre } : null });
  };
  static createEmpresa = async (req: Request, res: Response) => {
    try {
      const data = await upsertEmpresaCanonica(req.body?.cuit, req.body?.nombre);
      return res.status(201).json({ data });
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : "No se pudo guardar la empresa" });
    }
  };
  static exportPdf = async (req: Request, res: Response) => {
    try {
      const data = await findOwnRendicion(String(req.params.id), req.user!._id);
      if (!data) return res.status(404).json({ error: "Rendición no encontrada" });
      const response = buildRendicionGastoResponse(data);
      const pdf = await generateRendicionGastoPdf(response, `${req.user!.lastName}, ${req.user!.name}`);
      res.setHeader("Content-Type", "application/pdf"); res.setHeader("Content-Disposition", `attachment; filename="rendicion-gastos-${response._id}.pdf"`);
      return res.send(pdf);
    } catch (error) { logError("RendicionGastoController.exportPdf"); console.error(error); return res.status(500).json({ message: "Error al generar el PDF" }); }
  };
}
