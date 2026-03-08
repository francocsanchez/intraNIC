import { Router } from "express";
import { UsuarioController } from "../controllers/UsuarioController";

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
 * @route GET /
 * @desc Obtener usuario by ID.
 *
 */
router.get("/:idUsuario", UsuarioController.getUsuarioByID);

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

export default router;
