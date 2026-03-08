import { Router } from "express";
import { ConfigController } from "../controllers/ConfigController";

const router = Router();

/**
 *
 * @route GET /
 * @desc Listar configuracion.
 *
 */
router.get("/", ConfigController.listConfig);

/**
 *
 * @route POST /
 * @desc Crear configuracion.
 *
 */
router.post("/", ConfigController.createConfig);

/**
 *
 * @route PATCH /
 * @desc Actualizar confinguracion configuracion.
 *
 */
router.patch("/", ConfigController.updateConfig);

/**
 *
 * @route PATCH /toggle/convencional
 * @desc Activar / Desactivar sistema Convencional.
 *
 */
router.patch("/change-status/convencional", ConfigController.toggleSistemaConvencional);

/**
 *
 * @route PATCH /toggle/usados
 * @desc Activar / Desactivar sistema Usados.
 *
 */
router.patch("/change-status/usados", ConfigController.toggleSistemaUsados);

/**
 *
 * @route PATCH /toggle/liess
 * @desc Activar / Desactivar sistema LIESS.
 *
 */
router.patch("/change-status/liess", ConfigController.toggleSistemaLIESS);

export default router;
