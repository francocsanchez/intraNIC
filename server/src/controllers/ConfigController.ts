import { Response, Request } from "express";
import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import Configuration from "../models/Config";
import { logError } from "../utils/logError";

const DASHBOARD_SALON_MODEL_IMAGE_DIRECTORY = path.resolve(process.cwd(), "uploads", "dashboard-salon-modelos");
const DASHBOARD_SALON_MODEL_IMAGE_PATH_PREFIX = "/uploads/dashboard-salon-modelos/";

const normalizeDashboardSalonModel = (value: unknown) => {
  const normalized = String(value ?? "").trim().replace(/\s+/g, " ");
  return normalized ? normalized.toLocaleUpperCase("es-AR") : null;
};

const removeDashboardSalonModelImage = async (imagePath: string | undefined) => {
  if (!imagePath?.startsWith(DASHBOARD_SALON_MODEL_IMAGE_PATH_PREFIX)) return;
  const filePath = path.join(DASHBOARD_SALON_MODEL_IMAGE_DIRECTORY, path.basename(imagePath));
  await unlink(filePath).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") throw error;
  });
};

export class ConfigController {
  static listDashboardSalonModelImages = async (_req: Request, res: Response) => {
    try {
      const config = await Configuration.findOne({}, { imagenesModelosDashboardSalon: 1 }).lean();
      if (!config) return res.status(404).json({ message: "No existe configuración inicial." });
      return res.status(200).json({
        data: (config.imagenesModelosDashboardSalon ?? []).map((item) => ({
          modelo: item.modelo,
          imageUrl: item.imagePath,
        })),
        message: "Imágenes de modelos listadas",
      });
    } catch (error) {
      logError("ConfigController.listDashboardSalonModelImages");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor" });
    }
  };

  static uploadDashboardSalonModelImage = async (req: Request, res: Response) => {
    const modelo = normalizeDashboardSalonModel(req.body?.modelo);
    const file = req.file;
    if (!modelo || !file) return res.status(400).json({ message: "Debes indicar un modelo y seleccionar una imagen." });
    const extensionByMimeType: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
    };
    const extension = extensionByMimeType[file.mimetype];
    if (!extension) return res.status(400).json({ message: "La imagen debe estar en formato JPG, PNG o WEBP." });

    let newImagePath: string | undefined;
    try {
      const config = await Configuration.findOne();
      if (!config) return res.status(404).json({ message: "No existe configuración inicial." });

      await mkdir(DASHBOARD_SALON_MODEL_IMAGE_DIRECTORY, { recursive: true });
      const fileName = `${randomUUID()}${extension}`;
      const filePath = path.join(DASHBOARD_SALON_MODEL_IMAGE_DIRECTORY, fileName);
      await writeFile(filePath, file.buffer);
      newImagePath = `${DASHBOARD_SALON_MODEL_IMAGE_PATH_PREFIX}${fileName}`;

      const previousImage = config.imagenesModelosDashboardSalon.find((item) => item.modelo === modelo)?.imagePath;
      config.imagenesModelosDashboardSalon = config.imagenesModelosDashboardSalon.filter((item) => item.modelo !== modelo);
      config.imagenesModelosDashboardSalon.push({ modelo, imagePath: newImagePath });
      await config.save();
      await removeDashboardSalonModelImage(previousImage);

      return res.status(200).json({
        data: { modelo, imageUrl: newImagePath },
        message: `Imagen de ${modelo} actualizada correctamente`,
      });
    } catch (error) {
      if (newImagePath) await removeDashboardSalonModelImage(newImagePath).catch(() => undefined);
      logError("ConfigController.uploadDashboardSalonModelImage");
      console.error(error);
      return res.status(500).json({ message: "No se pudo guardar la imagen del modelo" });
    }
  };

  static listConfig = async (_req: Request, res: Response) => {
    try {
      const config = await Configuration.findOne().lean();

      if (!config) {
        return res.status(404).json({
          data: null,
          message: "No existe configuración",
        });
      }

      return res.status(200).json({
        data: config,
        message: "Configuración listada",
      });
    } catch (error) {
      logError("ConfigController.listConfig");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error del servidor",
      });
    }
  };

  static createConfig = async (req: Request, res: Response) => {
    try {
      const exists = await Configuration.exists({}).lean();

      if (exists) {
        return res.status(409).json({
          data: exists,
          message: "La configuración ya existe.",
        });
      }

      const config = await Configuration.create(req.body);

      return res
        .status(201)
        .json({ data: config, message: "Configuración creada" });
    } catch (error) {
      logError("ConfigController.createConfig");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor" });
    }
  };

  static updateConfig = async (req: Request, res: Response) => {
    try {
      const config = await Configuration.findOneAndUpdate({}, req.body, {
        returnDocument: "after",
        runValidators: true,
      }).lean();

      if (!config) {
        return res
          .status(404)
          .json({ message: "No existe configuración inicial." });
      }

      return res.status(200).json({
        data: config,
        message: "Configuración actualizada correctamente",
      });
    } catch (error) {
      logError("ConfigController.updateConfig");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor" });
    }
  };

  static getDashboardSalonSettings = async (req: Request, res: Response) => {
    try {
      const sucursalRaw = req.query.sucursalCodigo;
      const sucursalCodigo = sucursalRaw === undefined ? null : Number(sucursalRaw);
      const anio = Number(req.query.anio);
      const mes = Number(req.query.mes);
      if ((sucursalCodigo !== null && (!Number.isInteger(sucursalCodigo) || sucursalCodigo < 1)) || !Number.isInteger(anio) || anio < 2000 || !Number.isInteger(mes) || mes < 1 || mes > 12) {
        return res.status(400).json({ message: "El período y la sucursal seleccionada deben ser válidos." });
      }
      const config = await Configuration.findOne(
        {},
        { objetivosVendedoresDashboardSalon: 1, objetivosOperacionesTotalesDashboardSalon: 1 },
      ).lean();

      if (!config) {
        return res.status(404).json({ message: "No existe configuración inicial." });
      }

      const objetivoConfigurado = sucursalCodigo === null ? null : config.objetivosVendedoresDashboardSalon?.find(
        (item) => item.sucursalCodigo === sucursalCodigo && item.anio === anio && item.mes === mes,
      )?.objetivo;
      const objetivo = Number(objetivoConfigurado);
      const objetivoOperacionesTotales = Number(
        config.objetivosOperacionesTotalesDashboardSalon?.find(
          (item) => item.anio === anio && item.mes === mes,
        )?.objetivo,
      );
      return res.status(200).json({
        data: {
          sucursalCodigo,
          anio,
          mes,
          objetivoVendedores:
            Number.isFinite(objetivo) && objetivo > 0 ? objetivo : null,
          objetivoOperacionesTotales:
            Number.isFinite(objetivoOperacionesTotales) && objetivoOperacionesTotales > 0
              ? objetivoOperacionesTotales
              : null,
        },
        message: "Configuración de Dashboard Salón listada",
      });
    } catch (error) {
      logError("ConfigController.getDashboardSalonSettings");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor" });
    }
  };

  static updateDashboardSalonSettings = async (req: Request, res: Response) => {
    try {
      const objetivoVendedores = Number(req.body?.objetivoVendedores);
      const objetivoOperacionesTotales = Number(req.body?.objetivoOperacionesTotales);
      const sucursalRaw = req.body?.sucursalCodigo;
      const sucursalCodigo = sucursalRaw === undefined ? null : Number(sucursalRaw);
      const anio = Number(req.body?.anio);
      const mes = Number(req.body?.mes);
      const hasObjetivoVendedores = Number.isInteger(objetivoVendedores) && objetivoVendedores > 0;
      const hasObjetivoOperacionesTotales = Number.isInteger(objetivoOperacionesTotales) && objetivoOperacionesTotales > 0;
      if ((!hasObjetivoVendedores && !hasObjetivoOperacionesTotales) || (hasObjetivoVendedores && (sucursalCodigo === null || !Number.isInteger(sucursalCodigo) || sucursalCodigo < 1)) || !Number.isInteger(anio) || anio < 2000 || !Number.isInteger(mes) || mes < 1 || mes > 12) {
        return res.status(400).json({
          message: "La sucursal, el período y el objetivo deben ser válidos.",
        });
      }

      const config = await Configuration.findOne();

      if (!config) {
        return res.status(404).json({ message: "No existe configuración inicial." });
      }

      if (hasObjetivoVendedores && sucursalCodigo !== null) {
        config.objetivosVendedoresDashboardSalon = config.objetivosVendedoresDashboardSalon.filter(
          (item) => item.sucursalCodigo !== sucursalCodigo || item.anio !== anio || item.mes !== mes,
        );
        config.objetivosVendedoresDashboardSalon.push({ sucursalCodigo, anio, mes, objetivo: objetivoVendedores });
      }
      if (hasObjetivoOperacionesTotales) {
        config.objetivosOperacionesTotalesDashboardSalon = config.objetivosOperacionesTotalesDashboardSalon.filter(
          (item) => item.anio !== anio || item.mes !== mes,
        );
        config.objetivosOperacionesTotalesDashboardSalon.push({ anio, mes, objetivo: objetivoOperacionesTotales });
      }
      await config.save();

      return res.status(200).json({
        data: { sucursalCodigo, anio, mes, objetivoVendedores: hasObjetivoVendedores ? objetivoVendedores : null, objetivoOperacionesTotales: hasObjetivoOperacionesTotales ? objetivoOperacionesTotales : null },
        message: "Objetivo de vendedores actualizado correctamente",
      });
    } catch (error) {
      logError("ConfigController.updateDashboardSalonSettings");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor" });
    }
  };

  static toggleSistemaConvencional = async (req: Request, res: Response) => {
    try {
      const config = await Configuration.findOne();

      if (!config) {
        return res
          .status(404)
          .json({ message: "No existe configuración inicial." });
      }

      config.sistemaActivoConvencional = !config.sistemaActivoConvencional;
      await config.save();

      return res.status(200).json({
        data: { sistemaActivoConvencional: config.sistemaActivoConvencional },
        message: `Sistema Convencional ${
          config.sistemaActivoConvencional ? "activo" : "inactivo"
        }`,
      });
    } catch (error) {
      logError("ConfigController.toggleSistemaConvencional");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor" });
    }
  };

  static toggleSistemaUsados = async (req: Request, res: Response) => {
    try {
      const config = await Configuration.findOne();

      if (!config) {
        return res
          .status(404)
          .json({ message: "No existe configuración inicial." });
      }

      config.sistemaActivoUsados = !config.sistemaActivoUsados;
      await config.save();

      return res.status(200).json({
        data: { sistemaActivoUsados: config.sistemaActivoUsados },
        message: `Sistema Usados ${
          config.sistemaActivoUsados ? "activo" : "inactivo"
        }`,
      });
    } catch (error) {
      logError("ConfigController.toggleSistemaUsados");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor" });
    }
  };

  static toggleSistemaLIESS = async (_req: Request, res: Response) => {
    try {
      const config = await Configuration.findOne();

      if (!config) {
        return res
          .status(404)
          .json({ message: "No existe configuración inicial." });
      }

      config.sistemaActivoLIESS = !config.sistemaActivoLIESS;
      await config.save();

      return res.status(200).json({
        data: { sistemaActivoLIESS: config.sistemaActivoLIESS },
        message: `Sistema LIESS ${
          config.sistemaActivoLIESS ? "activo" : "inactivo"
        }`,
      });
    } catch (error) {
      logError("ConfigController.toggleSistemaLIESS");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor" });
    }
  };
}
