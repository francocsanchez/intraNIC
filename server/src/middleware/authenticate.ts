import { Response, Request, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import User from "../models/User";

declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string;
        name: string;
        lastName: string;
        email: string;
        numberSaleNic?: number;
        numberSaleLiess?: number;
        role: string[];
        company?: string[];
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

    const user = await User.findById(userId).lean();

    if (!user) {
      res.status(401).json({ error: "Token inválido" });
      return;
    }

    if (!user.enable) {
      res.status(403).json({ error: "Usuario deshabilitado" });
      return;
    }
    
    req.user = {
      _id: String(user._id),
      name: user.name,
      email: user.email,
      lastName: user.lastName,
      role: user.role,
      enable: user.enable,
      numberSaleNic: user.numberSaleNic,
      numberSaleLiess: user.numberSaleLiess,
      company: user.company,
    };

    next();
  } catch (error) {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
};
