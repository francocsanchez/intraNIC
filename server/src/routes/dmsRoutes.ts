import { Router } from "express";
import { DmsController } from "../controllers/DmsController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";

const router = Router();
router.use(authenticate);
/**
 *
 * @route GET /
 * @desc Listar vendedores.
 *
 */
router.get("/vendedores", authorizeModules("usuarios", "configuracion"), DmsController.getVendedores);

/**
 *
 * @route GET /
 * @desc Listar vendedores activos.
 *
 */
router.get("/vendedores/activos", authorizeModules("configuracion", "preventas"), DmsController.getVendedoresActivos);

/**
 *
 * @route GET /
 * @desc Listar asignacion por mes y anio.
 *
 */
router.get("/asignaciones/:mes/:anio", authorizeModules("asignaciones"), DmsController.getAsignacion);

/**
 *
 * @route GET /
 * @desc Listar asignacion por mes y anio.
 *
 */
router.get("/consolidado/stock", authorizeModules("convencional"), DmsController.getStockConsolidado);

/**
 *
 * @route GET /
 * @desc Listar asignacion por mes y anio.
 *
 */
router.get("/reventas/facturas", authorizeModules("reventaPendientes"), DmsController.getFactuasReventas);

export default router;
