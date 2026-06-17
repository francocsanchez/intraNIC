import { Router } from "express";
import { ConfigController } from "../controllers/ConfigController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";
import { authorizeRoleAccess } from "../middleware/authorizeRoleAccess";

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
router.post("/", authorizeModules("configuracion"), authorizeRoleAccess("sistema.configuracion"), ConfigController.createConfig);

/**
 *
 * @route PATCH /
 * @desc Actualizar confinguracion configuracion.
 *
 */
router.patch("/", authorizeModules("configuracion"), authorizeRoleAccess("sistema.configuracion"), ConfigController.updateConfig);

/**
 *
 * @route PATCH /toggle/convencional
 * @desc Activar / Desactivar sistema Convencional.
 *
 */
router.patch("/change-status/convencional", authorizeModules("configuracion"), authorizeRoleAccess("sistema.configuracion"), ConfigController.toggleSistemaConvencional);

/**
 *
 * @route PATCH /toggle/usados
 * @desc Activar / Desactivar sistema Usados.
 *
 */
router.patch("/change-status/usados", authorizeModules("configuracion"), authorizeRoleAccess("sistema.configuracion"), ConfigController.toggleSistemaUsados);

/**
 *
 * @route PATCH /toggle/liess
 * @desc Activar / Desactivar sistema LIESS.
 *
 */
router.patch("/change-status/liess", authorizeModules("configuracion"), authorizeRoleAccess("sistema.configuracion"), ConfigController.toggleSistemaLIESS);

export default router;
