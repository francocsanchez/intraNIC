import { Request, Response, NextFunction } from "express";
import type { ModuleKey } from "../constants/modules";
import { hasEnabledModule } from "../constants/modules";

const hasSuperAdminRole = (roles: string[] | undefined) =>
  (roles ?? []).some((role) => String(role).trim().toLowerCase() === "superadmin");

export const authorizeModules = (...allowedModules: ModuleKey[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    if (hasSuperAdminRole(req.user.role)) {
      return next();
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
