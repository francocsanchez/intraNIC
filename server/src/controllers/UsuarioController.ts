import { Response, Request } from "express";
import { logError } from "../utils/logError";
import User from "../models/User";
import { checkPassword, hashPassword } from "../utils/hassPassword";
import { generateJWT } from "../utils/jwt";
import { sendPasswordResetEmail } from "../utils/mail";
import { generateTemporaryPassword } from "../utils/password";

const resetAndSendPassword = async (usuario: any) => {
  const temporaryPassword = generateTemporaryPassword();
  const previousPassword = usuario.password;

  usuario.password = await hashPassword(temporaryPassword);
  await usuario.save();

  try {
    await sendPasswordResetEmail({
      to: usuario.email,
      name: usuario.name,
      temporaryPassword,
    });
  } catch (error) {
    usuario.password = previousPassword;
    await usuario.save();
    throw error;
  }
};

export class UsuarioController {
  static listUsuarios = async (_req: Request, res: Response) => {
    try {
      const usuarios = await User.find({}, { password: 0 })
        .sort({
          enable: -1,
          lastName: 1,
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

  static login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body as {
        email: string;
        password: string;
      };

      if (!email || !password) {
        return res.status(400).json({
          data: null,
          message: "Email y password son obligatorios",
        });
      }

      const normalizedEmail = email.trim().toLowerCase();

      const user = await User.findOne({ email: normalizedEmail }).lean();

      if (!user) {
        return res.status(401).json({
          data: null,
          message: "Credenciales invalidas",
        });
      }

      if (!user.enable) {
        return res.status(403).json({
          data: null,
          message: "Usuario deshabilitado",
        });
      }

      const ok = await checkPassword(password, user.password);

      if (!ok) {
        return res.status(401).json({
          data: null,
          message: "Credenciales invalidas",
        });
      }

      const token = generateJWT({ sub: String(user._id) });

      return res.status(200).json({
        token,
      });
    } catch (error) {
      logError("UsuarioController.login");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error interno del servidor",
      });
    }
  };

  static getMe = async (req: Request, res: Response) => {
    res.json(req.user);
  };

  static updateMyPassword = async (req: Request, res: Response) => {
    try {
      const { _id } = req.user;
      const { newPassword } = req.body;

      if (typeof newPassword !== "string" || newPassword.length < 8) {
        return res.status(400).json({
          data: null,
          message: "La contrasena debe tener al menos 8 caracteres",
        });
      }

      const usuario = await User.findById(_id);

      if (!usuario) {
        return res.status(404).json({
          data: null,
          message: "Usuario no encontrado",
        });
      }

      usuario.password = await hashPassword(newPassword);
      await usuario.save();

      return res.status(200).json({
        data: null,
        message: "Contrasena actualizada correctamente",
      });
    } catch (error) {
      logError("UsuarioController.updateMyPassword");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error del servidor",
      });
    }
  };

  static resetPassword = async (req: Request, res: Response) => {
    try {
      const { idUsuario } = req.params;

      const usuario = await User.findById(idUsuario);

      if (!usuario) {
        return res.status(404).json({
          data: null,
          message: "Usuario no encontrado",
        });
      }

      await resetAndSendPassword(usuario);

      return res.status(200).json({
        data: null,
        message: `Nueva contrasena enviada a ${usuario.email}`,
      });
    } catch (error) {
      logError("UsuarioController.resetPassword");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error del servidor",
      });
    }
  };

  static forgotPassword = async (req: Request, res: Response) => {
    try {
      const { email } = req.body as { email?: string };

      if (!email) {
        return res.status(400).json({
          data: null,
          message: "El email es obligatorio",
        });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const usuario = await User.findOne({ email: normalizedEmail });

      if (!usuario) {
        return res.status(404).json({
          data: null,
          message: "Usuario no encontrado",
        });
      }

      if (!usuario.enable) {
        return res.status(403).json({
          data: null,
          message: "Usuario deshabilitado",
        });
      }

      await resetAndSendPassword(usuario);

      return res.status(200).json({
        data: null,
        message: "Te enviamos una nueva contrasena por email",
      });
    } catch (error) {
      logError("UsuarioController.forgotPassword");
      console.error(error);
      return res.status(500).json({
        data: null,
        message: "Error del servidor",
      });
    }
  };
}
