import { Router } from "express";
import { UsuarioController } from "../controllers/UsuarioController";
import { authenticate } from "../middleware/authenticate";

const router = Router();

/**
 *
 * @route GET /
 * @desc Listar usuarios.
 *
 */
router.get("/", UsuarioController.listUsuarios);

/**
 *
 * @route POST /
 * @desc Crear usuarios.
 *
 */
router.post("/", UsuarioController.createUsuario);


/**
 *
 * @route PATCH /
 * @desc Actualizar usuario by ID.
 *
 */
router.put("/:idUsuario", UsuarioController.updateUsuarioById);

/**
 *
 * @route PATCH /
 * @desc Activar-desactivar usuario.
 *
 */
router.patch("/:idUsuario/change-status", UsuarioController.changeStatusUsuario);

/**
 *
 * @route POST /
 * @desc Login usuario.
 *
 */
router.post("/login", UsuarioController.login);

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
router.get("/:idUsuario", UsuarioController.getUsuarioByID);

/**
 *
 * @route PATCH /
 * @desc Resetear password.
 *
 */
router.patch("/reset-password/:idUsuario",UsuarioController.resetPassword);

/**
 *
 * @route PATCH /
 * @desc Actualizar password.
 *
 */
router.patch("/change-password",authenticate,UsuarioController.updateMyPassword);

export default router;
