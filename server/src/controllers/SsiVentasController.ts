import type { Request, Response } from "express";
import SsiVentasHotAlertConfig from "../models/SsiVentasHotAlertConfig";
import { SsiVentasService } from "../services/ssiVentas.service";
import { logError } from "../utils/logError";

const parsePositiveInt = (value: unknown) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const normalizeBinaryValue = (value: unknown) => {
  if (value === "si" || value === "no" || value === "noSabe") {
    return value;
  }

  return null;
};

const normalizeNumericValue = (value: unknown) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 10 ? parsed : null;
};

const normalizeOptionalString = (value: unknown) => {
  if (typeof value !== "string") return "";
  return value.trim();
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

const normalizeBoolean = (value: unknown) => value === true;

const normalizeDateString = (value: unknown) => {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : null;
};

const getUserContext = (req: Request) => ({
  id: String(req.user?._id ?? ""),
  name: `${req.user?.lastName ?? ""} ${req.user?.name ?? ""}`.trim(),
});

const normalizeEmail = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const parseEmails = (value: unknown) => {
  if (!Array.isArray(value)) {
    return { error: "Debes enviar una lista de emails" as const };
  }

  const normalized = value.map((entry) => normalizeEmail(entry));

  if (normalized.some((email) => !email)) {
    return { error: "No se permiten emails vacios" as const };
  }

  if (normalized.some((email) => !EMAIL_REGEX.test(email))) {
    return { error: "Uno o mas emails no tienen un formato valido" as const };
  }

  const uniqueEmails = Array.from(new Set(normalized));

  if (uniqueEmails.length !== normalized.length) {
    return { error: "No se permiten emails duplicados" as const };
  }

  return { data: uniqueEmails };
};

const formatHotAlertConfig = (item: any) => ({
  _id: item?._id ? String(item._id) : "virtual-hot-alert-config",
  emails: Array.isArray(item?.emails)
    ? item.emails.map((email: unknown) => normalizeEmail(email)).filter(Boolean)
    : [],
  activo: item?.activo === undefined ? true : Boolean(item.activo),
  createdAt: item?.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
  updatedAt: item?.updatedAt ? new Date(item.updatedAt).toISOString() : new Date().toISOString(),
});

export class SsiVentasController {
  static async getHotAlertConfig(_req: Request, res: Response) {
    try {
      const config = await SsiVentasHotAlertConfig.findOne({}).lean();
      return res.status(200).json({ data: formatHotAlertConfig(config) });
    } catch (error) {
      logError("SsiVentasController.getHotAlertConfig");
      console.error(error);
      return res.status(500).json({ message: "No se pudo obtener la configuracion de Hot Alert" });
    }
  }

  static async updateHotAlertConfig(req: Request, res: Response) {
    try {
      const emailsResult = parseEmails(req.body?.emails);

      if ("error" in emailsResult) {
        return res.status(400).json({ error: emailsResult.error });
      }

      const activo = req.body?.activo === undefined ? true : Boolean(req.body.activo);
      const config = await SsiVentasHotAlertConfig.findOneAndUpdate(
        {},
        {
          emails: emailsResult.data,
          activo,
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        },
      ).lean();

      return res.status(200).json({
        message: "Configuracion de Hot Alert guardada correctamente",
        data: formatHotAlertConfig(config),
      });
    } catch (error) {
      logError("SsiVentasController.updateHotAlertConfig");
      console.error(error);
      return res.status(500).json({ message: "No se pudo guardar la configuracion de Hot Alert" });
    }
  }

  static async listAdministrativas(_req: Request, res: Response) {
    try {
      const response = await SsiVentasService.listAdministrativas();
      return res.status(200).json(response);
    } catch (error) {
      logError("SsiVentasController.listAdministrativas");
      console.error(error);
      return res.status(500).json({ message: "No se pudo obtener la lista de administrativas" });
    }
  }

  static async list(req: Request, res: Response) {
    const page = parsePositiveInt(req.query.page) ?? 1;
    const limit = parsePositiveInt(req.query.limit) ?? 30;
    const deliveryDate = normalizeDateString(req.query.deliveryDate);

    if (!deliveryDate) {
      return res.status(400).json({ message: "La fecha es obligatoria y debe tener formato YYYY-MM-DD" });
    }

    try {
      const response = await SsiVentasService.list(page, limit, deliveryDate);
      return res.status(200).json(response);
    } catch (error) {
      logError("SsiVentasController.list");
      console.error(error);
      return res.status(500).json({ message: "No se pudo obtener el listado SSI Ventas" });
    }
  }

  static async getByOperacion(req: Request, res: Response) {
    const operacion = parsePositiveInt(req.params.operacion);

    if (!operacion) {
      return res.status(400).json({ message: "La operacion es obligatoria y debe ser un entero valido" });
    }

    try {
      const response = await SsiVentasService.getByOperacion(operacion);

      if (!response) {
        return res.status(404).json({ message: "No se encontro la operacion solicitada" });
      }

      return res.status(200).json({ data: response });
    } catch (error) {
      logError("SsiVentasController.getByOperacion");
      console.error(error);
      return res.status(500).json({ message: "No se pudo obtener el detalle SSI Ventas" });
    }
  }

  static async registerNoAnswer(req: Request, res: Response) {
    const operacion = parsePositiveInt(req.params.operacion);

    if (!operacion) {
      return res.status(400).json({ message: "La operacion es obligatoria y debe ser un entero valido" });
    }

    try {
      const response = await SsiVentasService.registerNoAnswer(
        operacion,
        {
          observaciones: normalizeOptionalString(req.body?.observaciones),
          administrativaId: normalizeOptionalString(req.body?.administrativaId),
        },
        getUserContext(req),
      );
      return res.status(200).json(response);
    } catch (error) {
      logError("SsiVentasController.registerNoAnswer");
      console.error(error);
      const message = error instanceof Error ? error.message : "No se pudo registrar el intento";
      return res.status(400).json({ message });
    }
  }

  static async registerSurvey(req: Request, res: Response) {
    const operacion = parsePositiveInt(req.params.operacion);

    if (!operacion) {
      return res.status(400).json({ message: "La operacion es obligatoria y debe ser un entero valido" });
    }

    const numeric = {
      instalacionesConcesionario: normalizeNumericValue(req.body?.numeric?.instalacionesConcesionario),
      atencionVendedor: normalizeNumericValue(req.body?.numeric?.atencionVendedor),
      atencionAdministrativa: normalizeNumericValue(req.body?.numeric?.atencionAdministrativa),
      informacionFechaEntrega: normalizeNumericValue(req.body?.numeric?.informacionFechaEntrega),
      atencionAsesorEntregas: normalizeNumericValue(req.body?.numeric?.atencionAsesorEntregas),
      recomendariaConcesionario: normalizeNumericValue(req.body?.numeric?.recomendariaConcesionario),
    };

    const binary = {
      usadoPartePago: normalizeBinaryValue(req.body?.binary?.usadoPartePago),
      financiacionCompra: normalizeBinaryValue(req.body?.binary?.financiacionCompra),
      seguroVehiculo: normalizeBinaryValue(req.body?.binary?.seguroVehiculo),
      accesoriosVehiculo: normalizeBinaryValue(req.body?.binary?.accesoriosVehiculo),
      aplicacionToyota: normalizeBinaryValue(req.body?.binary?.aplicacionToyota),
      toyotaServiciosConectados: normalizeBinaryValue(req.body?.binary?.toyotaServiciosConectados),
    };

    if (Object.values(numeric).some((value) => value === null)) {
      return res.status(400).json({ message: "Todas las respuestas numericas deben estar entre 1 y 10" });
    }

    if (Object.values(binary).some((value) => value === null)) {
      return res.status(400).json({ message: "Todas las respuestas de seleccion deben ser si, no o noSabe" });
    }

    try {
      const response = await SsiVentasService.registerSurvey(
        operacion,
        {
          numeric: numeric as {
            instalacionesConcesionario: number;
            atencionVendedor: number;
            atencionAdministrativa: number;
            informacionFechaEntrega: number;
            atencionAsesorEntregas: number;
            recomendariaConcesionario: number;
          },
          binary: binary as {
            usadoPartePago: "si" | "no" | "noSabe";
            financiacionCompra: "si" | "no" | "noSabe";
            seguroVehiculo: "si" | "no" | "noSabe";
            accesoriosVehiculo: "si" | "no" | "noSabe";
            aplicacionToyota: "si" | "no" | "noSabe";
            toyotaServiciosConectados: "si" | "no" | "noSabe";
          },
          hotAlert: normalizeBoolean(req.body?.hotAlert),
          observaciones: normalizeOptionalString(req.body?.observaciones),
          administrativaId: normalizeOptionalString(req.body?.administrativaId),
        },
        getUserContext(req),
      );
      return res.status(200).json(response);
    } catch (error) {
      logError("SsiVentasController.registerSurvey");
      console.error(error);
      const message = error instanceof Error ? error.message : "No se pudo guardar la encuesta SSI";
      return res.status(400).json({ message });
    }
  }

  static async updateAdministrativa(req: Request, res: Response) {
    const operacion = parsePositiveInt(req.params.operacion);

    if (!operacion) {
      return res.status(400).json({ message: "La operacion es obligatoria y debe ser un entero valido" });
    }

    try {
      const response = await SsiVentasService.updateAdministrativa(
        operacion,
        {
          administrativaId: normalizeOptionalString(req.body?.administrativaId),
        },
        getUserContext(req),
      );
      return res.status(200).json(response);
    } catch (error) {
      logError("SsiVentasController.updateAdministrativa");
      console.error(error);
      const message = error instanceof Error ? error.message : "No se pudo actualizar la ADM";
      return res.status(400).json({ message });
    }
  }

  static async importCsv(req: Request, res: Response) {
    if (!req.file?.buffer?.length) {
      return res.status(400).json({ message: "Debes seleccionar un archivo CSV" });
    }

    try {
      const response = await SsiVentasService.importCsv(req.file.buffer, getUserContext(req));
      return res.status(200).json(response);
    } catch (error) {
      logError("SsiVentasController.importCsv");
      console.error(error);
      const message = error instanceof Error ? error.message : "No se pudo importar el archivo SSI";
      return res.status(400).json({ message });
    }
  }
}
