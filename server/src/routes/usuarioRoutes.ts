import { Router } from "express";
import { UsuarioController } from "../controllers/UsuarioController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";

const router = Router();

/**
 *
 * @route GET /
 * @desc Listar usuarios.
 *
 */
router.get("/", authenticate, authorizeModules("usuarios"), UsuarioController.listUsuarios);

/**
 *
 * @route POST /
 * @desc Crear usuarios.
 *
 */
router.post("/", authenticate, authorizeModules("usuarios"), UsuarioController.createUsuario);


/**
 *
 * @route PATCH /
 * @desc Actualizar usuario by ID.
 *
 */
router.put("/:idUsuario", authenticate, authorizeModules("usuarios"), UsuarioController.updateUsuarioById);

/**
 *
 * @route PATCH /
 * @desc Activar-desactivar usuario.
 *
 */
router.patch("/:idUsuario/change-status", authenticate, authorizeModules("usuarios"), UsuarioController.changeStatusUsuario);

/**
 *
 * @route POST /
 * @desc Login usuario.
 *
 */
router.post("/login", UsuarioController.login);

/**
 *
 * @route POST /
 * @desc Recuperar password por email.
 *
 */
router.post("/forgot-password", UsuarioController.forgotPassword);

/**
 *
 * @route GET /
 * @desc Obtener usuario.
 *
 */
router.get("/me", authenticate,UsuarioController.getMe);

/**
 *
 * @route GET /
 * @desc Obtener usuario by ID.
 *
 */
router.get("/:idUsuario", authenticate, authorizeModules("usuarios"), UsuarioController.getUsuarioByID);

/**
 *
 * @route PATCH /
 * @desc Resetear password.
 *
 */
router.patch("/reset-password/:idUsuario", authenticate, authorizeModules("usuarios"), UsuarioController.resetPassword);

/**
 *
 * @route PATCH /
 * @desc Actualizar password.
 *
 */
router.patch("/change-password",authenticate,UsuarioController.updateMyPassword);

export default router;
