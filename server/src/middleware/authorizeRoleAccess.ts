import { Request, Response, NextFunction } from "express";
import {
  canAccessByRole,
  canAccessLiessTipoByRole,
  hasSuperAdminRole,
  type RoleAccessKey,
} from "../constants/roleAccess";

type RoleAccessOptions = {
  validate?: (req: Request) => boolean;
};

export const authorizeRoleAccess = (
  accessKey: RoleAccessKey,
  options?: RoleAccessOptions,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    if (hasSuperAdminRole(req.user.role)) {
      return next();
    }

    if (!canAccessByRole(req.user.role, accessKey)) {
      return res.status(403).json({
        error: "No tienes permisos para acceder a este recurso segun tu rol",
      });
    }

    if (options?.validate && !options.validate(req)) {
      return res.status(403).json({
        error: "No tienes permisos para acceder a este recurso segun tu rol",
      });
    }

    return next();
  };
};

export const authorizeAnyRoleAccess = (...accessKeys: RoleAccessKey[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    if (hasSuperAdminRole(req.user.role)) {
      return next();
    }

    const hasAnyPermission = accessKeys.some((accessKey) =>
      canAccessByRole(req.user?.role, accessKey),
    );

    if (!hasAnyPermission) {
      return res.status(403).json({
        error: "No tienes permisos para acceder a este recurso segun tu rol",
      });
    }

    return next();
  };
};

export const authorizeLiessTipoByRole = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    if (!canAccessLiessTipoByRole(req.user.role, req.params.tipo)) {
      return res.status(403).json({
        error: "No tienes permisos para acceder a este recurso segun tu rol",
      });
    }

    return next();
  };
};
