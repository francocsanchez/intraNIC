import { Response, Request } from "express";
import Configuration from "../models/Config";
import { logError } from "../utils/logError";

const normalizeDashboardSalonModel = (value: unknown) => {
  const normalized = String(value ?? "").trim().replace(/\s+/g, " ");
  return normalized ? normalized.toLocaleUpperCase("es-AR") : null;
};

const normalizeDashboardSalonImageUrl = (value: unknown) => {
  const imageUrl = String(value ?? "").trim();
  if (!imageUrl) return null;

  try {
    const parsed = new URL(imageUrl);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
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

  static saveDashboardSalonModelImage = async (req: Request, res: Response) => {
    const modelo = normalizeDashboardSalonModel(req.body?.modelo);
    const imageUrl = normalizeDashboardSalonImageUrl(req.body?.imageUrl);
    if (!modelo || !imageUrl) return res.status(400).json({ message: "Debes indicar el modelo y un enlace HTTP(S) válido para la imagen." });

    try {
      const config = await Configuration.findOne();
      if (!config) return res.status(404).json({ message: "No existe configuración inicial." });

      config.imagenesModelosDashboardSalon = config.imagenesModelosDashboardSalon.filter((item) => item.modelo !== modelo);
      config.imagenesModelosDashboardSalon.push({ modelo, imagePath: imageUrl });
      await config.save();

      return res.status(200).json({
        data: { modelo, imageUrl },
        message: `Imagen de ${modelo} actualizada correctamente`,
      });
    } catch (error) {
      logError("ConfigController.saveDashboardSalonModelImage");
      console.error(error);
      return res.status(500).json({ message: "No se pudo guardar el enlace de la imagen del modelo" });
    }
  };

  static deleteDashboardSalonModelImage = async (req: Request, res: Response) => {
    const modelo = normalizeDashboardSalonModel(req.params.modelo);
    if (!modelo) return res.status(400).json({ message: "Debes indicar el modelo a eliminar." });

    try {
      const config = await Configuration.findOne();
      if (!config) return res.status(404).json({ message: "No existe configuración inicial." });

      const images = config.imagenesModelosDashboardSalon ?? [];
      if (!images.some((item) => item.modelo === modelo)) {
        return res.status(404).json({ message: "No existe una imagen configurada para ese modelo." });
      }

      config.imagenesModelosDashboardSalon = images.filter((item) => item.modelo !== modelo);
      await config.save();
      return res.status(200).json({ message: `Imagen de ${modelo} eliminada correctamente` });
    } catch (error) {
      logError("ConfigController.deleteDashboardSalonModelImage");
      console.error(error);
      return res.status(500).json({ message: "No se pudo eliminar el enlace de la imagen del modelo" });
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
