import { Response, Request } from "express";
import { logError } from "../utils/logError";
import User from "../models/User";
import { hashPassword } from "../utils/hassPassword";

export class UsuarioController {
  static listUsuarios = async (_req: Request, res: Response) => {
    try {
      const usuarios = await User.find({}, { password: 0 })
        .sort({
          enable: -1,
          name: 1,
        })
        .lean();

      if (!usuarios || usuarios.length === 0) {
        return res.status(404).json({
          data: [],
          message: "No existen usuarios registrados",
        });
      }

      return res.status(200).json({
        data: usuarios,
        message: "Usuarios listados",
      });
    } catch (error) {
      logError("UsuarioController.listUsuarios");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error del servidor SIAC",
      });
    }
  };

  static createUsuario = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      const exists = await User.findOne({ email }).lean();

      if (exists) {
        return res.status(409).json({
          data: null,
          message: "El usuario ya existe",
        });
      }

      const defaultPassword = email.includes("@liess.com.ar")
        ? "Liess111+"
        : "Nippon111+";

      const hashedPassword = await hashPassword(defaultPassword);

      const usuario = await User.create({
        ...req.body,
        password: hashedPassword,
      });

      return res.status(201).json({
        data: usuario,
        message: "Usuario creado correctamente",
      });
    } catch (error) {
      logError("UsuarioController.createUsuario");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error del servidor",
      });
    }
  };

  static changeStatusUsuario = async (req: Request, res: Response) => {
    try {
      const { idUsuario } = req.params;

      const usuario = await User.findById(idUsuario);

      if (!usuario) {
        return res.status(404).json({
          data: null,
          message: "El usuario no existe",
        });
      }

      usuario.enable = !usuario.enable;
      await usuario.save();

      return res.status(200).json({
        data: { enable: usuario.enable },
        message: `Usuario ${usuario.enable ? "habilitado" : "deshabilitado"} correctamente`,
      });
    } catch (error) {
      logError("UsuarioController.changeStatusUsuario");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error del servidor",
      });
    }
  };

  static getUsuarioByID = async (req: Request, res: Response) => {
    try {
      const { idUsuario } = req.params;

      const usuario = await User.findById(idUsuario, { password: 0 }).lean();

      if (!usuario) {
        return res.status(404).json({
          data: null,
          message: "Usuario no encontrado",
        });
      }

      return res.status(200).json({
        data: usuario,
        message: "Usuario obtenido correctamente",
      });
    } catch (error) {
      logError("UsuarioController.getUsuarioByID");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error del servidor",
      });
    }
  };

  static updateUsuarioById = async (req: Request, res: Response) => {
    try {
      const { idUsuario } = req.params;

      const usuario = await User.findById(idUsuario);

      if (!usuario) {
        return res.status(404).json({
          data: null,
          message: "Usuario no encontrado",
        });
      }

      const allowedFields = [
        "email",
        "name",
        "lastName",
        "role",
        "company",
        "numberSaleNic",
        "numberSaleLiess",
        "enable",
      ] as const;

      for (const field of allowedFields) {
        if (Object.prototype.hasOwnProperty.call(req.body, field)) {
          (usuario as any)[field] = req.body[field];
        }
      }

      await usuario.save();

      return res.status(200).json({
        message: "Usuario actualizado correctamente",
      });
    } catch (error) {
      logError("UsuarioController.updateUsuarioById");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error del servidor",
      });
    }
  };
}
