import { Router } from "express";
import { UsuarioController } from "../controllers/UsuarioController";
import { authenticate } from "../middleware/authenticate";
import { authorizeRoles } from "../middleware/authorizeRoles";

const router = Router();

/**
 *
 * @route GET /
 * @desc Listar usuarios.
 *
 */
router.get("/", authenticate, authorizeRoles("admin", "supervisor", "stock"), UsuarioController.listUsuarios);

/**
 *
 * @route POST /
 * @desc Crear usuarios.
 *
 */
router.post("/", authenticate, authorizeRoles("admin", "stock"), UsuarioController.createUsuario);


/**
 *
 * @route PATCH /
 * @desc Actualizar usuario by ID.
 *
 */
router.put("/:idUsuario", authenticate, authorizeRoles("admin"), UsuarioController.updateUsuarioById);

/**
 *
 * @route PATCH /
 * @desc Activar-desactivar usuario.
 *
 */
router.patch("/:idUsuario/change-status", authenticate, authorizeRoles("admin"), UsuarioController.changeStatusUsuario);

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
router.get("/:idUsuario", authenticate, authorizeRoles("admin"), UsuarioController.getUsuarioByID);

/**
 *
 * @route PATCH /
 * @desc Resetear password.
 *
 */
router.patch("/reset-password/:idUsuario", authenticate, authorizeRoles("admin", "stock"), UsuarioController.resetPassword);

/**
 *
 * @route PATCH /
 * @desc Actualizar password.
 *
 */
router.patch("/change-password",authenticate,UsuarioController.updateMyPassword);

export default router;
