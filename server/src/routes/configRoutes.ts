import { Router } from "express";
import { ConfigController } from "../controllers/ConfigController";
import { authenticate } from "../middleware/authenticate";
import { authorizeRoles } from "../middleware/authorizeRoles";

const router = Router();
router.use(authenticate);

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
router.post("/", authorizeRoles("admin"), ConfigController.createConfig);

/**
 *
 * @route PATCH /
 * @desc Actualizar confinguracion configuracion.
 *
 */
router.patch("/", authorizeRoles("admin", "supervisor", "stock"), ConfigController.updateConfig);

/**
 *
 * @route PATCH /toggle/convencional
 * @desc Activar / Desactivar sistema Convencional.
 *
 */
router.patch("/change-status/convencional", authorizeRoles("admin"), ConfigController.toggleSistemaConvencional);

/**
 *
 * @route PATCH /toggle/usados
 * @desc Activar / Desactivar sistema Usados.
 *
 */
router.patch("/change-status/usados", authorizeRoles("admin"), ConfigController.toggleSistemaUsados);

/**
 *
 * @route PATCH /toggle/liess
 * @desc Activar / Desactivar sistema LIESS.
 *
 */
router.patch("/change-status/liess", authorizeRoles("admin"), ConfigController.toggleSistemaLIESS);

export default router;
