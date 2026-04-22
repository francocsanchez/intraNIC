import { Request, Response, NextFunction } from "express";

const normalizeValues = (values: unknown): string[] => {
  const normalizeEntry = (value: unknown) =>
    String(value)
      .normalize("NFKC")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/\s+/g, "")
      .trim()
      .toLowerCase();

  if (Array.isArray(values)) {
    return values
      .map((value) => normalizeEntry(value))
      .filter(Boolean);
  }

  if (typeof values === "string") {
    return values
      .split(",")
      .map((value) => normalizeEntry(value))
      .filter(Boolean);
  }

  return [];
};

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    const normalizedAllowedRoles = normalizeValues(allowedRoles);
    const userRoles = normalizeValues(req.user.role);

    const hasPermission = userRoles.some((role) =>
      normalizedAllowedRoles.includes(role),
    );

    if (!hasPermission) {
      console.warn("[authorizeRoles] acceso denegado", {
        path: req.originalUrl,
        userId: req.user._id,
        userRoles,
        allowedRoles: normalizedAllowedRoles,
      });

      return res
        .status(403)
        .json({ error: "No tienes permisos para acceder a este recurso" });
    }

    next();
  };
};

export const authorizeCompanies = (...allowedCompanies: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    const normalizedAllowedCompanies = normalizeValues(allowedCompanies);
    const userCompanies = normalizeValues(req.user.company);
    const hasPermission = userCompanies.some((company) =>
      normalizedAllowedCompanies.includes(company),
    );

    if (!hasPermission) {
      console.warn("[authorizeCompanies] acceso denegado", {
        path: req.originalUrl,
        userId: req.user._id,
        userCompanies,
        allowedCompanies: normalizedAllowedCompanies,
      });

      return res
        .status(403)
        .json({ error: "No tienes permisos para acceder a esta compania" });
    }

    next();
  };
};
