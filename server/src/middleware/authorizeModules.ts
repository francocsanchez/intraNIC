import { Request, Response, NextFunction } from "express";
import type { ModuleKey } from "../constants/modules";
import { hasEnabledModule } from "../constants/modules";

export const authorizeModules = (...allowedModules: ModuleKey[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    if (!hasEnabledModule(req.user.modules, allowedModules)) {
      console.warn("[authorizeModules] acceso denegado", {
        path: req.originalUrl,
        userId: req.user._id,
        userModules: req.user.modules,
        allowedModules,
      });

      return res
        .status(403)
        .json({ error: "No tienes permisos para acceder a este modulo" });
    }

    next();
  };
};
