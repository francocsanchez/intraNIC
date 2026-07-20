import { NextFunction, Request, Response } from "express";
import { hasSuperAdminRole } from "../constants/roleAccess";

export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: "Usuario no autenticado" });
  }

  if (!hasSuperAdminRole(req.user.role)) {
    return res.status(403).json({ error: "Solo superAdmin puede acceder a este recurso" });
  }

  return next();
};
