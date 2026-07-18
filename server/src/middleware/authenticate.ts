import { Response, Request, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import User from "../models/User";
import { type UserModules } from "../constants/modules";
import { serializeUserResponse } from "../utils/userResponse";

declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string;
        name: string;
        lastName: string;
        email: string;
        celular?: string;
        numberSaleNic?: number;
        numberSaleLiess?: number;
        sucursalPredeterminada?: {
          _id: string;
          nombre: string;
          activa: boolean;
          direccion?: string;
        } | null;
        sucursalEntrega?: {
          _id: string;
          nombre: string;
          activa: boolean;
          direccion?: string;
        } | null;
        unidadNegocio?: {
          _id: string;
          nombre: string;
          activo: boolean;
          orden: number;
        } | null;
        role: string[];
        company?: string[];
        modules?: UserModules;
        enable: boolean;
      };
    }
  }
}

type AuthPayload = JwtPayload & { sub?: string };

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Token no válido o ausente" });
      return;
    }

    const token = authHeader.slice(7).trim();

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET no definida");
    }

    const decoded = jwt.verify(token, jwtSecret) as AuthPayload;
    const userId = decoded.sub;

    if (!userId) {
      res.status(401).json({ error: "Token malformado" });
      return;
    }

    const user = await User.findById(userId)
      .populate("sucursalEntrega", "nombre activa direccion")
      .populate("unidadNegocio", "nombre activo orden")
      .lean();

    if (!user) {
      res.status(401).json({ error: "Token inválido" });
      return;
    }

    if (!user.enable) {
      res.status(403).json({ error: "Usuario deshabilitado" });
      return;
    }
    
    req.user = serializeUserResponse(user);

    next();
  } catch (error) {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
};
