import { Request, Response, NextFunction } from "express";
import { hasSuperAdminRole, normalizeRoles } from "../constants/roleAccess";

export const requireCotizadorManageAccess = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: "Usuario no autenticado" });
  }

  if (hasSuperAdminRole(req.user.role)) {
    return next();
  }

  const roles = normalizeRoles(req.user.role);
  if (roles.includes("supervisor") || roles.includes("gerente")) {
    return next();
  }

  return res.status(403).json({ error: "No tienes permisos para administrar el cotizador" });
};
