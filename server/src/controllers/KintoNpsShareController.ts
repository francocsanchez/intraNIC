import type { Request, Response } from "express";
import KintoNpsShare from "../models/KintoNpsShare";
import { logError } from "../utils/logError";

const currentYear = () => new Date().getFullYear();
const integer = (value: unknown) => typeof value === "number" ? value : Number(value);
const percentage = (value: unknown) => typeof value === "number" ? value : Number(String(value).replace(",", "."));
const format = (item: any) => ({ _id: String(item._id), anio: item.anio, mes: item.mes, promotores: item.promotores, pasivos: item.pasivos, detractores: item.detractores, createdAt: item.createdAt, updatedAt: item.updatedAt });

const validate = (body: Record<string, unknown>) => {
  const anio = integer(body.anio); const mes = integer(body.mes);
  const promotores = percentage(body.promotores); const pasivos = percentage(body.pasivos); const detractores = percentage(body.detractores);
  if (!Number.isInteger(anio) || anio < 2000 || anio > 2100) return { error: "El año indicado no es válido" };
  if (!Number.isInteger(mes) || mes < 1 || mes > 12) return { error: "El mes indicado no es válido" };
  if (![promotores, pasivos, detractores].every((value) => Number.isFinite(value) && value >= 0 && value <= 100)) return { error: "Cada dimensión debe ser un porcentaje entre 0 y 100" };
  return { data: { anio, mes, promotores, pasivos, detractores } };
};

export class KintoNpsShareController {
  static list = async (req: Request, res: Response) => {
    const anio = req.query.anio === undefined ? currentYear() : integer(req.query.anio);
    if (!Number.isInteger(anio) || anio < 2000 || anio > 2100) return res.status(400).json({ error: "El año indicado no es válido" });
    try {
      const [data, years] = await Promise.all([
        KintoNpsShare.find({ anio }).sort({ mes: 1 }).lean(),
        KintoNpsShare.distinct("anio"),
      ]);
      return res.status(200).json({ data: data.map(format), filtros: { anios: years.sort((a, b) => b - a) } });
    } catch (error) { logError("KintoNpsShareController.list"); console.error(error); return res.status(500).json({ message: "No se pudieron cargar los indicadores NPS Share" }); }
  };

  static save = async (req: Request, res: Response) => {
    const validation = validate(req.body ?? {});
    if ("error" in validation) return res.status(400).json({ error: validation.error });
    try {
      const item = await KintoNpsShare.findOneAndUpdate(
        { anio: validation.data.anio, mes: validation.data.mes },
        { $set: validation.data },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
      );
      return res.status(200).json({ message: "Indicador NPS Share guardado correctamente", data: format(item) });
    } catch (error: any) {
      if (error?.code === 11000) return res.status(409).json({ error: "El período fue actualizado por otro usuario. Volvé a intentar." });
      logError("KintoNpsShareController.save"); console.error(error); return res.status(500).json({ message: "No se pudo guardar el indicador NPS Share" });
    }
  };
}
