import { Request, Response } from "express";
import { QueryTypes } from "sequelize";
import mongoose from "mongoose";
import { sequelizeNIC } from "../config/database";
import Color from "../models/Color";
import PedidoMensual from "../models/PedidoMensual";
import Preventa from "../models/Preventa";
import Version from "../models/Version";
import { getVendedoresActivosNic } from "./querys/dms.query";
import { logError } from "../utils/logError";

type VendedorActivoRow = {
  vendedor: string;
  codigo: number;
};

type PreventaPayload = {
  vendedor?: number;
  numero_op?: number | null;
  cliente?: string;
  version?: string;
  colores?: string[];
  monto_reserva?: number | null;
  observaciones?: string;
  mes_asigna?: string;
  asignado?: boolean;
};

const preventaPopulate = [
  { path: "version", select: "nombre activo" },
  { path: "colores", select: "nombre activo" },
];

const parseAsignado = (value: unknown) => {
  if (value === "true" || value === true) return true;
  if (value === "false" || value === false) return false;
  return undefined;
};

const normalizeText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const normalizeNullableNumber = (value: unknown) => {
  if (value === "" || value === null || typeof value === "undefined") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

const normalizeMesAsigna = (value: unknown) => {
  if (typeof value !== "string") return null;

  const normalized = value.trim();

  if (/^\d{4}-\d{2}$/.test(normalized)) {
    return `${normalized}-01`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    const [year, month] = normalized.split("-");
    return `${year}-${month}-01`;
  }

  return null;
};

const buildPreventaResponse = <T extends { mes_asigna?: Date | string | null }>(row: T) => {
  const mesAsigna = row.mes_asigna ? new Date(row.mes_asigna) : null;
  const mes = mesAsigna ? String(mesAsigna.getUTCMonth() + 1).padStart(2, "0") : "";
  const anio = mesAsigna ? String(mesAsigna.getUTCFullYear()) : "";

  return {
    ...row,
    mes_asigna_label: mesAsigna ? `${mes}-${anio}` : "",
  };
};

const getNamedEntityNombre = (value: unknown, fallback: string) => {
  if (
    value &&
    typeof value === "object" &&
    "nombre" in value &&
    typeof (value as { nombre?: unknown }).nombre === "string"
  ) {
    return (value as { nombre: string }).nombre;
  }

  return fallback;
};

const getVendedoresActivosMap = async () => {
  const data = await sequelizeNIC.query<VendedorActivoRow>(getVendedoresActivosNic(), {
    type: QueryTypes.SELECT,
  });

  return new Map(data.map((item) => [Number(item.codigo), item.vendedor]));
};

const validatePayload = async (payload: PreventaPayload) => {
  const vendedor = Number(payload.vendedor);
  const cliente = normalizeText(payload.cliente);
  const versionId = normalizeText(payload.version);
  const observaciones = normalizeText(payload.observaciones);
  const colorIds = Array.isArray(payload.colores)
    ? Array.from(new Set(payload.colores.map((colorId) => String(colorId).trim()).filter(Boolean)))
    : [];
  const mesAsigna = normalizeMesAsigna(payload.mes_asigna);
  const numeroOp = normalizeNullableNumber(payload.numero_op);
  const montoReserva = normalizeNullableNumber(payload.monto_reserva);

  if (!Number.isInteger(vendedor) || vendedor <= 0) {
    throw new Error("El vendedor es obligatorio");
  }

  if (!cliente) {
    throw new Error("El cliente es obligatorio");
  }

  if (!mongoose.isValidObjectId(versionId)) {
    throw new Error("La version es obligatoria");
  }

  if (!mesAsigna) {
    throw new Error("El mes de asignacion es obligatorio y debe tener formato YYYY-MM");
  }

  if (Number.isNaN(numeroOp)) {
    throw new Error("El numero de operacion no es valido");
  }

  if (Number.isNaN(montoReserva)) {
    throw new Error("El monto de reserva no es valido");
  }

  const vendedoresActivos = await getVendedoresActivosMap();
  const vendedorNombre = vendedoresActivos.get(vendedor);

  if (!vendedorNombre) {
    throw new Error("El vendedor seleccionado no se encuentra activo en NIC");
  }

  const version = await Version.findOne({ _id: versionId, activo: true }).lean();
  if (!version) {
    throw new Error("La version seleccionada no existe o esta inactiva");
  }

  if (colorIds.some((colorId) => !mongoose.isValidObjectId(colorId))) {
    throw new Error("Uno o mas colores seleccionados no son validos");
  }

  const colores = colorIds.length
    ? await Color.find({ _id: { $in: colorIds }, activo: true }).lean()
    : [];

  if (colores.length !== colorIds.length) {
    throw new Error("Uno o mas colores seleccionados no existen o estan inactivos");
  }

  return {
    vendedor,
    vendedorNombre,
    cliente,
    version: version._id,
    colores: colores.map((color) => color._id),
    numero_op: numeroOp,
    monto_reserva: montoReserva,
    observaciones,
    mes_asigna: new Date(`${mesAsigna}T00:00:00.000Z`),
    asignado: Boolean(payload.asignado),
  };
};

export class PreventaController {
  static list = async (req: Request, res: Response) => {
    try {
      const asignado = parseAsignado(req.query.asignado);
      const filter = typeof asignado === "boolean" ? { asignado } : {};

      const data = await Preventa.find(filter)
        .populate(preventaPopulate)
        .sort({ mes_asigna: 1, createdAt: -1 })
        .lean();

      return res.status(200).json({ data: data.map((row) => buildPreventaResponse(row)) });
    } catch (error) {
      logError("PreventaController.list");
      console.error(error);
      return res.status(500).json({ message: "Error al listar preventas" });
    }
  };

  static getById = async (req: Request, res: Response) => {
    try {
      const data = await Preventa.findById(req.params.id).populate(preventaPopulate).lean();

      if (!data) {
        return res.status(404).json({ error: "Preventa no encontrada" });
      }

      return res.status(200).json({ data: buildPreventaResponse(data) });
    } catch (error) {
      logError("PreventaController.getById");
      console.error(error);
      return res.status(500).json({ message: "Error al obtener la preventa" });
    }
  };

  static create = async (req: Request, res: Response) => {
    try {
      const payload = await validatePayload(req.body as PreventaPayload);
      const data = await Preventa.create({ ...payload, asignado: false });
      const populated = await Preventa.findById(data._id).populate(preventaPopulate).lean();

      return res.status(201).json({
        message: "Preventa creada correctamente",
        data: populated ? buildPreventaResponse(populated) : data,
      });
    } catch (error) {
      logError("PreventaController.create");
      console.error(error);
      return res.status(400).json({
        error: error instanceof Error ? error.message : "No se pudo crear la preventa",
      });
    }
  };

  static update = async (req: Request, res: Response) => {
    try {
      const preventa = await Preventa.findById(req.params.id);

      if (!preventa) {
        return res.status(404).json({ error: "Preventa no encontrada" });
      }

      const payload = await validatePayload(req.body as PreventaPayload);

      preventa.vendedor = payload.vendedor;
      preventa.vendedorNombre = payload.vendedorNombre;
      preventa.numero_op = payload.numero_op;
      preventa.cliente = payload.cliente;
      preventa.version = payload.version;
      preventa.colores = payload.colores;
      preventa.monto_reserva = payload.monto_reserva;
      preventa.observaciones = payload.observaciones;
      preventa.mes_asigna = payload.mes_asigna;
      await preventa.save();

      const populated = await Preventa.findById(preventa._id).populate(preventaPopulate).lean();

      return res.status(200).json({
        message: "Preventa actualizada correctamente",
        data: populated ? buildPreventaResponse(populated) : preventa,
      });
    } catch (error) {
      logError("PreventaController.update");
      console.error(error);
      return res.status(400).json({
        error: error instanceof Error ? error.message : "No se pudo actualizar la preventa",
      });
    }
  };

  static remove = async (req: Request, res: Response) => {
    try {
      const data = await Preventa.findByIdAndDelete(req.params.id).populate(preventaPopulate).lean();

      if (!data) {
        return res.status(404).json({ error: "Preventa no encontrada" });
      }

      return res.status(200).json({
        message: "Preventa eliminada correctamente",
        data: buildPreventaResponse(data),
      });
    } catch (error) {
      logError("PreventaController.remove");
      console.error(error);
      return res.status(500).json({ message: "Error al eliminar la preventa" });
    }
  };

  static updateAsignado = async (req: Request, res: Response) => {
    const asignado = parseAsignado(req.body?.asignado);

    if (typeof asignado !== "boolean") {
      return res.status(400).json({ error: "Debes indicar el estado asignado" });
    }

    try {
      const preventa = await Preventa.findById(req.params.id);

      if (!preventa) {
        return res.status(404).json({ error: "Preventa no encontrada" });
      }

      preventa.asignado = asignado;
      await preventa.save();

      const populated = await Preventa.findById(preventa._id).populate(preventaPopulate).lean();

      return res.status(200).json({
        message: "Estado de preventa actualizado correctamente",
        data: populated ? buildPreventaResponse(populated) : preventa,
      });
    } catch (error) {
      logError("PreventaController.updateAsignado");
      console.error(error);
      return res.status(500).json({ message: "Error al actualizar el estado de la preventa" });
    }
  };

  static resumenPendientes = async (_req: Request, res: Response) => {
    try {
      const preventas = await Preventa.find({ asignado: false })
        .populate(preventaPopulate)
        .sort({ mes_asigna: 1, createdAt: -1 })
        .lean();

      const grouped = preventas.reduce<Record<string, {
        mes_asigna: Date | string;
        mes_asigna_label: string;
        version: string;
        color: string;
        vendedor: string;
        cantidad: number;
      }>>((acc, preventa) => {
        const row = buildPreventaResponse(preventa);
        const versionNombre = getNamedEntityNombre((row as { version?: unknown }).version, "Sin version");
        const colorNombre =
          Array.isArray(row.colores) && row.colores.length
            ? row.colores
                .map((color) => getNamedEntityNombre(color, ""))
                .filter(Boolean)
                .join(" / ")
            : "Sin color";

        const key = [row.mes_asigna_label, versionNombre, colorNombre, row.vendedorNombre].join("|");

        if (!acc[key]) {
          acc[key] = {
            mes_asigna: row.mes_asigna,
            mes_asigna_label: row.mes_asigna_label,
            version: versionNombre,
            color: colorNombre,
            vendedor: row.vendedorNombre,
            cantidad: 0,
          };
        }

        acc[key].cantidad += 1;
        return acc;
      }, {});

      const data = Object.values(grouped).sort((a, b) => {
        const monthCompare = String(a.mes_asigna).localeCompare(String(b.mes_asigna));
        if (monthCompare !== 0) return monthCompare;

        const versionCompare = a.version.localeCompare(b.version);
        if (versionCompare !== 0) return versionCompare;

        const colorCompare = a.color.localeCompare(b.color);
        if (colorCompare !== 0) return colorCompare;

        return a.vendedor.localeCompare(b.vendedor);
      });

      return res.status(200).json({ data });
    } catch (error) {
      logError("PreventaController.resumenPendientes");
      console.error(error);
      return res.status(500).json({ message: "Error al obtener el resumen de preventas pendientes" });
    }
  };

  static resumenPedidoMensual = async (_req: Request, res: Response) => {
    try {
      const [versiones, pedidoMensual, preventasPendientes] = await Promise.all([
        Version.find({ activo: true }).sort({ nombre: 1 }).lean(),
        PedidoMensual.find().populate([{ path: "version", select: "nombre" }]).lean(),
        Preventa.aggregate([
          { $match: { asignado: false } },
          {
            $group: {
              _id: "$version",
              preventas_pendientes: { $sum: 1 },
            },
          },
        ]) as Promise<Array<{ _id: mongoose.Types.ObjectId; preventas_pendientes: number }>>,
      ]);

      const pedidosMap = new Map(
        pedidoMensual.map((item) => [
          String(item.version && typeof item.version === "object" && "_id" in item.version ? item.version._id : item.version),
          item.cantidad,
        ]),
      );

      const preventasMap = new Map(
        preventasPendientes.map((item) => [String(item._id), item.preventas_pendientes]),
      );

      const data = versiones.map((version) => {
        const pedido = pedidosMap.get(String(version._id)) ?? 0;
        const preventas_pendientes = preventasMap.get(String(version._id)) ?? 0;

        return {
          versionId: String(version._id),
          version: version.nombre,
          pedido,
          preventas_pendientes,
          disponible: pedido - preventas_pendientes,
        };
      });

      return res.status(200).json({ data });
    } catch (error) {
      logError("PreventaController.resumenPedidoMensual");
      console.error(error);
      return res.status(500).json({ message: "Error al obtener el resumen de pedido mensual" });
    }
  };
}
