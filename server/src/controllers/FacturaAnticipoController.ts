import { Request, Response } from "express";
import OperacionFacturaAnticipo from "../models/OperacionFacturaAnticipo";
import {
  getFacturadasByNumeroOp,
  getOperacionFacturaAnticipoInfo,
} from "../services/facturaAnticipoService";
import { logError } from "../utils/logError";

const buildUsuarioCarga = (req: Request) => {
  const lastName = req.user?.lastName?.trim() ?? "";
  const name = req.user?.name?.trim() ?? "";
  return [lastName, name].filter(Boolean).join(", ");
};

export class FacturaAnticipoController {
  static list = async (_req: Request, res: Response) => {
    try {
      const registros = await OperacionFacturaAnticipo.find()
        .sort({ fechaCarga: -1, numeroOp: -1 })
        .lean();
      const facturadasSet = await getFacturadasByNumeroOp(registros.map((registro) => registro.numeroOp));

      return res.status(200).json({
        data: registros.map((registro) => ({
          ...registro,
          estaFacturada: facturadasSet.has(registro.numeroOp),
        })),
      });
    } catch (error) {
      logError("FacturaAnticipoController.list");
      console.error(error);
      return res.status(500).json({ message: "Error al obtener las facturas de anticipo" });
    }
  };

  static create = async (req: Request, res: Response) => {
    const numeroOp = Number(req.body?.numeroOp);

    if (!req.user) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    if (!Number.isInteger(numeroOp) || numeroOp <= 0) {
      return res.status(400).json({ error: "El numero OP es obligatorio y debe ser valido" });
    }

    try {
      const existing = await OperacionFacturaAnticipo.exists({ numeroOp });
      if (existing) {
        return res.status(409).json({ error: "Esa operacion ya fue cargada previamente en este modulo" });
      }

      const operacion = await getOperacionFacturaAnticipoInfo(numeroOp);
      if (!operacion) {
        return res.status(404).json({ error: "No se encontro la operacion indicada en SIAC/DMS" });
      }

      const registro = await OperacionFacturaAnticipo.create({
        numeroOp: operacion.numeroOp,
        cliente: operacion.cliente,
        version: operacion.version,
        vendedor: operacion.vendedor,
        chasis: operacion.chasis,
        usuarioCarga: buildUsuarioCarga(req),
        fechaCarga: new Date(),
      });

      return res.status(201).json({
        message: "Operacion cargada correctamente",
        data: {
          ...registro.toObject(),
          estaFacturada: operacion.estaFacturada,
        },
      });
    } catch (error: any) {
      logError("FacturaAnticipoController.create");
      console.error(error);

      if (error?.code === 11000) {
        return res.status(409).json({ error: "Esa operacion ya fue cargada previamente en este modulo" });
      }

      return res.status(500).json({
        error: error instanceof Error ? error.message : "No se pudo cargar la operacion",
      });
    }
  };

  static delete = async (req: Request, res: Response) => {
    try {
      const deleted = await OperacionFacturaAnticipo.findByIdAndDelete(req.params.id).lean();

      if (!deleted) {
        return res.status(404).json({ error: "Registro no encontrado" });
      }

      return res.status(200).json({
        message: "Registro eliminado correctamente",
      });
    } catch (error) {
      logError("FacturaAnticipoController.delete");
      console.error(error);
      return res.status(400).json({ error: "No se pudo eliminar el registro" });
    }
  };
}
