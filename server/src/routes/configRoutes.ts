import { Router } from "express";
import { ConfigController } from "../controllers/ConfigController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";
import { ColorUnidadController } from "../controllers/ColorUnidadController";
import { requireSuperAdmin } from "../middleware/requireSuperAdmin";

const router = Router();
router.use(authenticate);

router.get("/colores-unidades/badges", ColorUnidadController.badges);
router.get("/colores-unidades", requireSuperAdmin, ColorUnidadController.list);
router.post("/colores-unidades", requireSuperAdmin, ColorUnidadController.save);
router.put("/colores-unidades/:id", requireSuperAdmin, ColorUnidadController.save);

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
router.post("/", authorizeModules("configuracion"), ConfigController.createConfig);

/**
 *
 * @route PATCH /
 * @desc Actualizar confinguracion configuracion.
 *
 */
router.patch("/", authorizeModules("configuracion"), ConfigController.updateConfig);

/**
 *
 * @route PATCH /toggle/convencional
 * @desc Activar / Desactivar sistema Convencional.
 *
 */
router.patch("/change-status/convencional", authorizeModules("configuracion"), ConfigController.toggleSistemaConvencional);

/**
 *
 * @route PATCH /toggle/usados
 * @desc Activar / Desactivar sistema Usados.
 *
 */
router.patch("/change-status/usados", authorizeModules("configuracion"), ConfigController.toggleSistemaUsados);

/**
 *
 * @route PATCH /toggle/liess
 * @desc Activar / Desactivar sistema LIESS.
 *
 */
router.patch("/change-status/liess", authorizeModules("configuracion"), ConfigController.toggleSistemaLIESS);

export default router;
