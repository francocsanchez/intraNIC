import type { Request, Response } from "express";
import { OperacionesDashboardService } from "../services/operacionesDashboard.service";
import { logError } from "../utils/logError";
import * as XLSX from "xlsx";

const parsePositiveInt = (value: unknown) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const parseStringList = (value: unknown) => {
  if (typeof value !== "string") return [];

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseOptionalString = (value: unknown) => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const parseNumericList = (value: unknown) =>
  parseStringList(value)
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item > 0);

const parseStrictPositiveInt = (value: unknown) => {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }

  const normalized = String(value).trim();

  if (!/^\d+$/.test(normalized)) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

export class OperacionesController {
  static getDashboard = async (req: Request, res: Response) => {
    const anios = parseNumericList(req.query.anios);

    if (!anios.length) {
      return res.status(400).json({ message: "Debes seleccionar al menos un ano" });
    }

    const meses = parseNumericList(req.query.meses).filter((mes) => mes >= 1 && mes <= 12);
    const dias = parseNumericList(req.query.dias).filter((dia) => dia >= 1 && dia <= 31);
    const sucursales = parseStringList(req.query.sucursales);
    const modelos = parseStringList(req.query.modelos);

    try {
      const response = await OperacionesDashboardService.getDashboard({
        anios,
        meses,
        sucursales,
        modelos,
        dias,
      });

      return res.status(200).json(response);
    } catch (error) {
      logError("OperacionesController.getDashboard");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static getAnalisisPreventa = async (req: Request, res: Response) => {
    const anio = parseStrictPositiveInt(req.query.anio);
    const mes = parseStrictPositiveInt(req.query.mes);

    if (!anio) {
      return res.status(400).json({ message: "El parametro anio es obligatorio y debe ser un entero valido" });
    }

    if (!mes || mes < 1 || mes > 12) {
      return res.status(400).json({ message: "El parametro mes es obligatorio y debe estar entre 1 y 12" });
    }

    try {
      const response = await OperacionesDashboardService.getAnalisisPreventa({
        anio,
        mes,
        tipo: "Cero",
      });

      return res.status(200).json(response);
    } catch (error) {
      logError("OperacionesController.getAnalisisPreventa");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static getAnalisisVendedorFilters = async (_req: Request, res: Response) => {
    try {
      const response = await OperacionesDashboardService.getAnalisisVendedorFilters();
      return res.status(200).json(response);
    } catch (error) {
      logError("OperacionesController.getAnalisisVendedorFilters");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static getAnalisisVendedor = async (req: Request, res: Response) => {
    const anio = parseStrictPositiveInt(req.query.anio);
    const vendedor =
      typeof req.query.vendedor === "undefined" || String(req.query.vendedor).trim() === ""
        ? null
        : parseStrictPositiveInt(req.query.vendedor);

    if (!anio) {
      return res.status(400).json({ message: "El parametro anio es obligatorio y debe ser un entero valido" });
    }

    if (typeof req.query.vendedor !== "undefined" && String(req.query.vendedor).trim() !== "" && !vendedor) {
      return res.status(400).json({ message: "El parametro vendedor debe ser un entero valido" });
    }

    try {
      const response = await OperacionesDashboardService.getAnalisisVendedor({
        anio,
        vendedor,
      });
      return res.status(200).json(response);
    } catch (error) {
      logError("OperacionesController.getAnalisisVendedor");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static getAnalisisPreventaFormaPago = async (req: Request, res: Response) => {
    const numero = parsePositiveInt(req.params.numero);

    if (!numero) {
      return res.status(400).json({ message: "El numero de operacion es obligatorio y debe ser un entero valido" });
    }

    try {
      const response = await OperacionesDashboardService.getAnalisisPreventaFormaPago(numero);

      if (!response) {
        return res.status(404).json({ message: "No se encontro la forma de pago para la operacion solicitada" });
      }

      return res.status(200).json(response);
    } catch (error) {
      logError("OperacionesController.getAnalisisPreventaFormaPago");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static getAnalisisPreventaDescuentoMensual = async (req: Request, res: Response) => {
    const anio = parseStrictPositiveInt(req.query.anio);
    const modelo = typeof req.query.modelo === "string" ? req.query.modelo.trim() : "";

    if (!anio) {
      return res.status(400).json({ message: "El parametro anio es obligatorio y debe ser un entero valido" });
    }

    try {
      const response = await OperacionesDashboardService.getAnalisisPreventaDescuentoMensual(
        anio,
        modelo || undefined,
      );
      return res.status(200).json(response);
    } catch (error) {
      logError("OperacionesController.getAnalisisPreventaDescuentoMensual");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static getAnalisisPreventaResumenFinanciacion = async (req: Request, res: Response) => {
    const anio = parseStrictPositiveInt(req.query.anio);
    const mes = parseStrictPositiveInt(req.query.mes);

    if (!anio) {
      return res.status(400).json({ message: "El parametro anio es obligatorio y debe ser un entero valido" });
    }

    if (!mes || mes < 1 || mes > 12) {
      return res.status(400).json({ message: "El parametro mes es obligatorio y debe estar entre 1 y 12" });
    }

    try {
      const response = await OperacionesDashboardService.getAnalisisPreventaResumenFinanciacion(anio, mes);
      return res.status(200).json(response);
    } catch (error) {
      logError("OperacionesController.getAnalisisPreventaResumenFinanciacion");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static getAnalisisPreventaUsadosMensual = async (req: Request, res: Response) => {
    const anio = parseStrictPositiveInt(req.query.anio);

    if (!anio) {
      return res.status(400).json({ message: "El parametro anio es obligatorio y debe ser un entero valido" });
    }

    try {
      const response = await OperacionesDashboardService.getAnalisisPreventaUsadosMensual(anio);
      return res.status(200).json(response);
    } catch (error) {
      logError("OperacionesController.getAnalisisPreventaUsadosMensual");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static getAnalisisPreventaCreditoMensual = async (req: Request, res: Response) => {
    const anio = parseStrictPositiveInt(req.query.anio);

    if (!anio) {
      return res.status(400).json({ message: "El parametro anio es obligatorio y debe ser un entero valido" });
    }

    try {
      const response = await OperacionesDashboardService.getAnalisisPreventaCreditoMensual(anio);
      return res.status(200).json(response);
    } catch (error) {
      logError("OperacionesController.getAnalisisPreventaCreditoMensual");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static getSaldoOperacion = async (req: Request, res: Response) => {
    const section = parseOptionalString(req.query.section);
    const estado = parseOptionalString(req.query.estado);
    const ubicacion = parseOptionalString(req.query.ubicacion);
    const page = parsePositiveInt(req.query.page) ?? 1;
    const limit = parsePositiveInt(req.query.limit) ?? 100;

    try {
      const response = await OperacionesDashboardService.getSaldoOperacion(section, estado, ubicacion, page, limit);
      return res.status(200).json(response);
    } catch (error) {
      logError("OperacionesController.getSaldoOperacion");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static getSaldoOperacionFilters = async (_req: Request, res: Response) => {
    try {
      const response = await OperacionesDashboardService.getSaldoOperacionFilters();
      return res.status(200).json(response);
    } catch (error) {
      logError("OperacionesController.getSaldoOperacionFilters");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static updateSaldoOperacionCancelada = async (req: Request, res: Response) => {
    const codigoOperacion = parsePositiveInt(req.params.codigoOperacion);
    const cancelada = req.body?.cancelada;
    const numeroFabrica =
      typeof req.body?.numeroFabrica === "string" ? req.body.numeroFabrica.trim() : "";

    if (!codigoOperacion) {
      return res.status(400).json({ message: "El codigo de operacion es obligatorio y debe ser un entero valido" });
    }

    if (typeof cancelada !== "boolean") {
      return res.status(400).json({ message: "El estado cancelada debe ser booleano" });
    }

    if (!numeroFabrica) {
      return res.status(400).json({ message: "El numero de fabrica es obligatorio" });
    }

    if (!req.user?._id) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    try {
      const response = await OperacionesDashboardService.updateSaldoOperacionCancelada(
        codigoOperacion,
        numeroFabrica,
        cancelada,
        {
          id: req.user._id,
          name: `${req.user.lastName ?? ""} ${req.user.name ?? ""}`.trim(),
        },
      );
      return res.status(200).json(response);
    } catch (error) {
      logError("OperacionesController.updateSaldoOperacionCancelada");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static exportSaldoOperacion = async (req: Request, res: Response) => {
    const section = parseOptionalString(req.query.section);
    const estado = parseOptionalString(req.query.estado);
    const ubicacion = parseOptionalString(req.query.ubicacion);

    try {
      const response = await OperacionesDashboardService.exportSaldoOperacion(section, estado, ubicacion);
      const rows = response.data.map((item) => ({
        op: item.codigoOperacion ?? "",
        numero_fabrica: item.numeroFabrica,
        version: item.version,
        modelo: item.modeloGeneral,
        cliente: item.clienteNombre,
        vendedor: item.vendedor,
        estado_unidad: ubicacion ?? "",
        estado_operacion: item.estado,
        total: item.total ?? 0,
        abonado: item.senas ?? 0,
        usado: item.usado ?? 0,
        credito: item.creditoBanco ?? 0,
        saldo: (item.total ?? 0) - (item.senas ?? 0) - (item.usado ?? 0) - (item.creditoBanco ?? 0),
        seccion: item.cancelada ? "Cancelada" : "Con saldo",
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "SaldoOperacion");

      const fileBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
      const date = new Date();
      const filename = `saldo-operacion-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}.xlsx`;

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=\"${filename}\"`);
      return res.status(200).send(fileBuffer);
    } catch (error) {
      logError("OperacionesController.exportSaldoOperacion");
      console.error(error);
      return res.status(500).json({ message: "Error al exportar Saldo de operacion" });
    }
  };
}
