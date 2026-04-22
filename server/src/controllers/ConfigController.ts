import { Response, Request } from "express";
import Configuration from "../models/Config";
import { logError } from "../utils/logError";

export class ConfigController {
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
      const userCompanies = req.user?.company ?? [];
      const bodyKeys = Object.keys(req.body ?? {});

      const conventionalKeys = [
        "sistemaActivoConvencional",
        "vendedoresReservasConvencional",
        "vendedoresDisponibleConvencional",
        "vendedoresStockGuardadoConvencional",
      ];

      const usadosKeys = [
        "sistemaActivoUsados",
        "vendedoresReservasUsados",
        "vendedoresDisponibleUsados",
        "vendedoresStockGuardadoUsados",
      ];

      const touchesConvencional = bodyKeys.some((key) =>
        conventionalKeys.includes(key),
      );
      const touchesUsados = bodyKeys.some((key) => usadosKeys.includes(key));

      if (touchesConvencional && !userCompanies.includes("convencional")) {
        return res.status(403).json({
          error: "No tienes permisos para editar la configuracion de Convencional.",
        });
      }

      if (touchesUsados && !userCompanies.includes("usados")) {
        return res.status(403).json({
          error: "No tienes permisos para editar la configuracion de Usados.",
        });
      }

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

  static toggleSistemaConvencional = async (_req: Request, res: Response) => {
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

  static toggleSistemaUsados = async (_req: Request, res: Response) => {
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
