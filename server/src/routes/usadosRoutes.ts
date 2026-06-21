import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";
import { UsadosController } from "../controllers/UsadosController";
import { authorizeRoleAccess } from "../middleware/authorizeRoleAccess";

const router = Router();
router.use(authenticate);

/**
 *
 * @route GET /
 * @desc Listar stock disponible.
 *
 */
router.get("/stock-disponible", authorizeModules("usados"), authorizeRoleAccess("usados.stockDisponible"), UsadosController.stockDisponible);

/**
 *
 * @route GET /
 * @desc Listar stock guardado.
 *
 */
router.get("/stock-guardado", authorizeModules("usados"), authorizeRoleAccess("usados.stockGuardado"), UsadosController.stockGuardado);

/**
 *
 * @route GET /
 * @desc Listar stock no reparado.
 *
 */
router.get("/stock-no-reparado", authorizeModules("noReparado"), authorizeRoleAccess("usados.noReparado"), UsadosController.vendedoresStockNoReparadoUsados);

/**
 *
 * @route GET /
 * @desc Listar stock pendiente de documentacion.
 *
 */
router.get("/stock-pendiente-documentacion", authorizeModules("pendienteDocumentacion"), authorizeRoleAccess("usados.pendienteDocumentacion"), UsadosController.vendedoresStockPendDocuUsados);

/**
 *
 * @route GET /
 * @desc Listar stock reservado.
 *
 */
router.get("/stock-reservado", authorizeModules("usados"), authorizeRoleAccess("usados.stockReservado"), UsadosController.stockReservado);

/**
 *
 * @route GET /
 * @desc Mis reservas usados.
 *
 */
router.get("/mis-reservas", authorizeModules("usados"), authorizeRoleAccess("usados.misReservas"), UsadosController.misReservasUsados);

/**
 *
 * @route GET /
 * @desc Mis operaciones usados.
 *
 */
router.get("/mis-operaciones/:mes/:ano", authorizeModules("usados"), authorizeRoleAccess("usados.misOperaciones"), UsadosController.misOperaciones);

/**
 *
 * @route GET /
 * @desc Listar stock a ingresar.
 *
 */
router.get("/stock-ingreso", authorizeModules("ingresos"), authorizeRoleAccess("usados.ingresos"), UsadosController.stockIngreso);


export default router;
