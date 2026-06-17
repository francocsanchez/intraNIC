import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";
import { UsadosController } from "../controllers/UsadosController";

const router = Router();
router.use(authenticate);

/**
 *
 * @route GET /
 * @desc Listar stock disponible.
 *
 */
router.get("/stock-disponible", authorizeModules("usados"), UsadosController.stockDisponible);

/**
 *
 * @route GET /
 * @desc Listar stock guardado.
 *
 */
router.get("/stock-guardado", authorizeModules("usados"), UsadosController.stockGuardado);

/**
 *
 * @route GET /
 * @desc Listar stock no reparado.
 *
 */
router.get("/stock-no-reparado", authorizeModules("noReparado"), UsadosController.vendedoresStockNoReparadoUsados);

/**
 *
 * @route GET /
 * @desc Listar stock pendiente de documentacion.
 *
 */
router.get("/stock-pendiente-documentacion", authorizeModules("pendienteDocumentacion"), UsadosController.vendedoresStockPendDocuUsados);

/**
 *
 * @route GET /
 * @desc Listar stock reservado.
 *
 */
router.get("/stock-reservado", authorizeModules("usados"), UsadosController.stockReservado);

/**
 *
 * @route GET /
 * @desc Mis reservas usados.
 *
 */
router.get("/mis-reservas", authorizeModules("usados"), UsadosController.misReservasUsados);

/**
 *
 * @route GET /
 * @desc Listar stock a ingresar.
 *
 */
router.get("/stock-ingreso", authorizeModules("ingresos"), UsadosController.stockIngreso);


export default router;
