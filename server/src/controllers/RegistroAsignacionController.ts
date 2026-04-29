import { Request, Response } from "express";
import mongoose from "mongoose";
import { QueryTypes } from "sequelize";
import { sequelizeNIC } from "../config/database";
import { infoOperaRegistroQuery } from "./querys/convencional.query";
import RegistroAsignacion, {
  registroAsignacionTipo,
  type RegistroAsignacionTipo,
} from "../models/RegistroAsignacion";
import { logError } from "../utils/logError";

type InfoOperacionRow = {
  opera: number;
  interno: number;
  clienteNombre: string;
  version: string;
  sucursal: string;
  modelo: string;
  chasis: string;
  vendedor: string;
};

type RegistroAsignacionPayload = {
  fecha?: string;
  operacion?: number;
  observaciones?: string;
  tipo?: RegistroAsignacionTipo;
};

const normalizeText = (value: unknown) => {
  if (typeof value !== "string") return "-";

  const normalized = value.trim();
  return normalized.length ? normalized : "-";
};

const isValidFecha = (value: unknown) =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);

const isValidTipo = (value: unknown): value is RegistroAsignacionTipo =>
  value === registroAsignacionTipo.ASIGNADO ||
  value === registroAsignacionTipo.DESASIGNADO;

const getOperacionInfo = async (operacion: number) => {
  const rows = await sequelizeNIC.query<InfoOperacionRow>(
    infoOperaRegistroQuery(),
    {
      type: QueryTypes.SELECT,
      replacements: { operacion },
    },
  );

  const unidad = rows[0];

  if (!unidad) {
    throw new Error(
      "No se encontro informacion para la operacion solicitada",
    );
  }

  return {
    operacion: unidad.opera,
    interno: unidad.interno,
    cliente: normalizeText(unidad.clienteNombre),
    modelo: normalizeText(unidad.modelo),
    version: normalizeText(unidad.version),
    chasis: normalizeText(unidad.chasis),
    sucursal: normalizeText(unidad.sucursal),
    vendedor: normalizeText(unidad.vendedor),
  };
};

const buildResumenMensualPorModelo = (
  rows: Array<{ _id: { modelo: string; tipo: RegistroAsignacionTipo }; total: number }>,
) => {
  const grouped = new Map<
    string,
    { modelo: string; asignadas: number; desasignadas: number; neto: number }
  >();

  rows.forEach((row) => {
    const modelo = normalizeText(row._id.modelo);
    const current = grouped.get(modelo) ?? {
      modelo,
      asignadas: 0,
      desasignadas: 0,
      neto: 0,
    };

    if (row._id.tipo === registroAsignacionTipo.ASIGNADO) {
      current.asignadas = row.total;
    }

    if (row._id.tipo === registroAsignacionTipo.DESASIGNADO) {
      current.desasignadas = row.total;
    }

    current.neto = current.asignadas - current.desasignadas;
    grouped.set(modelo, current);
  });

  const data = Array.from(grouped.values()).sort((a, b) =>
    a.modelo.localeCompare(b.modelo, "es"),
  );

  const total = data.reduce(
    (acc, item) => {
      acc.asignadas += item.asignadas;
      acc.desasignadas += item.desasignadas;
      acc.neto += item.neto;
      return acc;
    },
    {
      asignadas: 0,
      desasignadas: 0,
      neto: 0,
    },
  );

  return { data, total };
};

const buildResumenModeloSucursal = (
  rows: Array<{
    _id: { modelo: string; sucursal: string; tipo: RegistroAsignacionTipo };
    total: number;
  }>,
) => {
  const sucursalesSet = new Set<string>();
  const modelosMap = new Map<
    string,
    {
      modelo: string;
      total: number;
      asignadas: number;
      desasignadas: number;
      sucursales: Record<
        string,
        { asignadas: number; desasignadas: number; neto: number }
      >;
    }
  >();

  const sucursalesMap = new Map<
    string,
    { sucursal: string; asignadas: number; desasignadas: number; neto: number }
  >();

  rows.forEach((row) => {
    const modelo = normalizeText(row._id.modelo);
    const sucursal = normalizeText(row._id.sucursal);
    sucursalesSet.add(sucursal);

    const modeloActual = modelosMap.get(modelo) ?? {
      modelo,
      total: 0,
      asignadas: 0,
      desasignadas: 0,
      sucursales: {},
    };

    const sucursalActual = modeloActual.sucursales[sucursal] ?? {
      asignadas: 0,
      desasignadas: 0,
      neto: 0,
    };

    const sucursalResumen = sucursalesMap.get(sucursal) ?? {
      sucursal,
      asignadas: 0,
      desasignadas: 0,
      neto: 0,
    };

    if (row._id.tipo === registroAsignacionTipo.ASIGNADO) {
      modeloActual.asignadas += row.total;
      sucursalActual.asignadas += row.total;
      sucursalResumen.asignadas += row.total;
    }

    if (row._id.tipo === registroAsignacionTipo.DESASIGNADO) {
      modeloActual.desasignadas += row.total;
      sucursalActual.desasignadas += row.total;
      sucursalResumen.desasignadas += row.total;
    }

    sucursalActual.neto =
      sucursalActual.asignadas - sucursalActual.desasignadas;
    sucursalResumen.neto =
      sucursalResumen.asignadas - sucursalResumen.desasignadas;

    modeloActual.total = modeloActual.asignadas - modeloActual.desasignadas;
    modeloActual.sucursales[sucursal] = sucursalActual;

    modelosMap.set(modelo, modeloActual);
    sucursalesMap.set(sucursal, sucursalResumen);
  });

  const sucursales = Array.from(sucursalesSet).sort((a, b) =>
    a.localeCompare(b, "es"),
  );

  const porModelo = Array.from(modelosMap.values())
    .map((item) => {
      const sucursalesCompletas = sucursales.reduce(
        (acc, sucursal) => {
          acc[sucursal] = item.sucursales[sucursal] ?? {
            asignadas: 0,
            desasignadas: 0,
            neto: 0,
          };
          return acc;
        },
        {} as Record<
          string,
          { asignadas: number; desasignadas: number; neto: number }
        >,
      );

      return {
        ...item,
        sucursales: sucursalesCompletas,
      };
    })
    .sort((a, b) => a.modelo.localeCompare(b.modelo, "es"));

  const porSucursal = sucursales.map((sucursal) => {
    const current = sucursalesMap.get(sucursal);
    return (
      current ?? {
        sucursal,
        asignadas: 0,
        desasignadas: 0,
        neto: 0,
      }
    );
  });

  const total = porSucursal.reduce(
    (acc, item) => {
      acc.asignadas += item.asignadas;
      acc.desasignadas += item.desasignadas;
      acc.neto += item.neto;
      return acc;
    },
    { asignadas: 0, desasignadas: 0, neto: 0 },
  );

  return {
    sucursales,
    porModelo,
    porSucursal,
    total,
  };
};

export class RegistroAsignacionController {
  static getInfoOperacion = async (req: Request, res: Response) => {
    const operacion = Number(req.params.operacion);

    if (!Number.isInteger(operacion) || operacion <= 0) {
      return res
        .status(400)
        .json({ error: "La operacion ingresada no es valida" });
    }

    try {
      const data = await getOperacionInfo(operacion);
      return res.status(200).json({ data });
    } catch (error) {
      logError("RegistroAsignacionController.getInfoOperacion");
      console.error(error);

      if (error instanceof Error) {
        return res.status(404).json({ error: error.message });
      }

      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static list = async (req: Request, res: Response) => {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 100);
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        RegistroAsignacion.find()
          .sort({ fecha: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        RegistroAsignacion.countDocuments(),
      ]);

      return res.status(200).json({
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(Math.ceil(total / limit), 1),
        },
      });
    } catch (error) {
      logError("RegistroAsignacionController.list");
      console.error(error);
      return res
        .status(500)
        .json({ message: "Error al listar registros de asignaciones" });
    }
  };

  static create = async (req: Request, res: Response) => {
    const { fecha, operacion, observaciones, tipo } =
      req.body as RegistroAsignacionPayload;

    if (!req.user?._id) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    if (!isValidFecha(fecha)) {
      return res.status(400).json({
        error: "La fecha es obligatoria y debe tener formato YYYY-MM-DD",
      });
    }

    if (!Number.isInteger(Number(operacion)) || Number(operacion) <= 0) {
      return res
        .status(400)
        .json({ error: "Debes ingresar una operacion valida" });
    }

    if (!isValidTipo(tipo)) {
      return res.status(400).json({
        error: "Debes seleccionar un tipo valido",
      });
    }

    try {
      const infoOperacion = await getOperacionInfo(Number(operacion));

      const registro = await RegistroAsignacion.create({
        fecha,
        usuario_id: new mongoose.Types.ObjectId(req.user._id),
        usuarioNombre: `${req.user.lastName}, ${req.user.name}`,
        operacion: infoOperacion.operacion,
        interno: infoOperacion.interno,
        cliente: infoOperacion.cliente,
        modelo: infoOperacion.modelo,
        version: infoOperacion.version,
        chasis: infoOperacion.chasis,
        sucursal: infoOperacion.sucursal,
        vendedor: infoOperacion.vendedor,
        observaciones: normalizeText(observaciones) === "-" ? "" : String(observaciones).trim(),
        tipo,
      });

      return res.status(201).json({
        message: "Registro de asignacion generado correctamente",
        data: registro,
      });
    } catch (error) {
      logError("RegistroAsignacionController.create");
      console.error(error);
      return res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "No se pudo generar el registro de asignacion",
      });
    }
  };

  static update = async (req: Request, res: Response) => {
    const { fecha, operacion, observaciones, tipo } =
      req.body as RegistroAsignacionPayload;

    if (!isValidFecha(fecha)) {
      return res.status(400).json({
        error: "La fecha es obligatoria y debe tener formato YYYY-MM-DD",
      });
    }

    if (!Number.isInteger(Number(operacion)) || Number(operacion) <= 0) {
      return res
        .status(400)
        .json({ error: "Debes ingresar una operacion valida" });
    }

    if (!isValidTipo(tipo)) {
      return res.status(400).json({
        error: "Debes seleccionar un tipo valido",
      });
    }

    try {
      const registro = await RegistroAsignacion.findById(req.params.id);

      if (!registro) {
        return res.status(404).json({ error: "Registro no encontrado" });
      }

      const infoOperacion = await getOperacionInfo(Number(operacion));

      registro.fecha = fecha;
      registro.operacion = infoOperacion.operacion;
      registro.interno = infoOperacion.interno;
      registro.cliente = infoOperacion.cliente;
      registro.modelo = infoOperacion.modelo;
      registro.version = infoOperacion.version;
      registro.chasis = infoOperacion.chasis;
      registro.sucursal = infoOperacion.sucursal;
      registro.vendedor = infoOperacion.vendedor;
      registro.observaciones =
        normalizeText(observaciones) === "-" ? "" : String(observaciones).trim();
      registro.tipo = tipo;
      await registro.save();

      return res.status(200).json({
        message: "Registro de asignacion actualizado correctamente",
        data: registro,
      });
    } catch (error) {
      logError("RegistroAsignacionController.update");
      console.error(error);
      return res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "No se pudo actualizar el registro de asignacion",
      });
    }
  };

  static remove = async (req: Request, res: Response) => {
    try {
      const registro = await RegistroAsignacion.findByIdAndDelete(req.params.id);

      if (!registro) {
        return res.status(404).json({ error: "Registro no encontrado" });
      }

      return res.status(200).json({
        message: "Registro de asignacion eliminado correctamente",
      });
    } catch (error) {
      logError("RegistroAsignacionController.remove");
      console.error(error);
      return res.status(500).json({
        message: "No se pudo eliminar el registro de asignacion",
      });
    }
  };

  static summary = async (req: Request, res: Response) => {
    const mes = Math.min(Math.max(Number(req.query.mes) || 1, 1), 12);
    const ano = Math.max(Number(req.query.ano) || new Date().getFullYear(), 2020);
    const periodPrefix = `${ano}-${String(mes).padStart(2, "0")}`;
    const yearPrefix = `${ano}-`;

    try {
      const [resumenMensualRows, resumenAnualRows, resumenModeloSucursalRows, resumenDiarioRows] = await Promise.all([
        RegistroAsignacion.aggregate([
          {
            $match: {
              fecha: { $regex: `^${periodPrefix}` },
            },
          },
          {
            $group: {
              _id: {
                modelo: "$modelo",
                tipo: "$tipo",
              },
              total: { $sum: 1 },
            },
          },
        ]),
        RegistroAsignacion.aggregate([
          {
            $match: {
              fecha: { $regex: `^${yearPrefix}` },
            },
          },
          {
            $group: {
              _id: {
                mes: { $substr: ["$fecha", 5, 2] },
                tipo: "$tipo",
              },
              total: { $sum: 1 },
            },
          },
        ]),
        RegistroAsignacion.aggregate([
          {
            $match: {
              fecha: { $regex: `^${periodPrefix}` },
            },
          },
          {
            $group: {
              _id: {
                modelo: "$modelo",
                sucursal: "$sucursal",
                tipo: "$tipo",
              },
              total: { $sum: 1 },
            },
          },
        ]),
        RegistroAsignacion.aggregate([
          {
            $match: {
              fecha: { $regex: `^${periodPrefix}` },
            },
          },
          {
            $group: {
              _id: {
                dia: { $substr: ["$fecha", 8, 2] },
                tipo: "$tipo",
              },
              total: { $sum: 1 },
            },
          },
        ]),
      ]);

      const mensualPorModelo = buildResumenMensualPorModelo(
        resumenMensualRows as Array<{
          _id: { modelo: string; tipo: RegistroAsignacionTipo };
          total: number;
        }>,
      );
      const resumenModeloSucursal = buildResumenModeloSucursal(
        resumenModeloSucursalRows as Array<{
          _id: {
            modelo: string;
            sucursal: string;
            tipo: RegistroAsignacionTipo;
          };
          total: number;
        }>,
      );

      const chartByMonth = new Map<
        number,
        { mes: number; label: string; asignadas: number; desasignadas: number }
      >(
        Array.from({ length: 12 }, (_, index) => [
          index + 1,
          {
            mes: index + 1,
            label: new Date(ano, index, 1).toLocaleDateString("es-AR", {
              month: "short",
            }),
            asignadas: 0,
            desasignadas: 0,
          },
        ]),
      );

      (resumenAnualRows as Array<{
        _id: { mes: string; tipo: RegistroAsignacionTipo };
        total: number;
      }>).forEach((row) => {
        const month = Number(row._id.mes);
        const current = chartByMonth.get(month);

        if (!current) return;

        if (row._id.tipo === registroAsignacionTipo.ASIGNADO) {
          current.asignadas = row.total;
        }

        if (row._id.tipo === registroAsignacionTipo.DESASIGNADO) {
          current.desasignadas = row.total;
        }
      });

      const ultimoDiaDelMes = new Date(ano, mes, 0).getDate();
      const chartByDay = new Map<
        number,
        { dia: number; label: string; asignadas: number; desasignadas: number }
      >(
        Array.from({ length: ultimoDiaDelMes }, (_, index) => [
          index + 1,
          {
            dia: index + 1,
            label: String(index + 1),
            asignadas: 0,
            desasignadas: 0,
          },
        ]),
      );

      (resumenDiarioRows as Array<{
        _id: { dia: string; tipo: RegistroAsignacionTipo };
        total: number;
      }>).forEach((row) => {
        const day = Number(row._id.dia);
        const current = chartByDay.get(day);

        if (!current) return;

        if (row._id.tipo === registroAsignacionTipo.ASIGNADO) {
          current.asignadas = row.total;
        }

        if (row._id.tipo === registroAsignacionTipo.DESASIGNADO) {
          current.desasignadas = row.total;
        }
      });

      return res.status(200).json({
        resumenMensual: {
          periodo: { mes, ano },
          porModelo: mensualPorModelo.data,
          total: mensualPorModelo.total,
          porModeloSucursal: resumenModeloSucursal.porModelo,
          sucursales: resumenModeloSucursal.sucursales,
          resumenSucursales: resumenModeloSucursal.porSucursal,
          porDia: Array.from(chartByDay.values()),
        },
        resumenAnual: {
          ano,
          porMes: Array.from(chartByMonth.values()),
        },
      });
    } catch (error) {
      logError("RegistroAsignacionController.summary");
      console.error(error);
      return res.status(500).json({
        message: "No se pudo generar el resumen de registros de asignaciones",
      });
    }
  };
}
