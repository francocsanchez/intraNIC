import { Request, Response, NextFunction } from "express";

const normalizeRole = (role: unknown) =>
  String(role)
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase();

export const authorizeRoles = (...allowedRoles: string[]) => {
  const normalizedAllowedRoles = allowedRoles.map(normalizeRole).filter(Boolean);

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    const roles = (req.user.role ?? []).map(normalizeRole).filter(Boolean);

    if (roles.includes("superadmin")) {
      return next();
    }

    const hasAllowedRole = normalizedAllowedRoles.some((role) => roles.includes(role));

    if (!hasAllowedRole) {
      return res.status(403).json({
        error: "No tienes permisos para ejecutar esta accion",
      });
    }

    return next();
  };
};
