import { Router } from "express";
import { DmsController } from "../controllers/DmsController";
import { authenticate } from "../middleware/authenticate";
import { authorizeCompanies, authorizeRoles } from "../middleware/authorizeRoles";

const router = Router();
router.use(authenticate);
/**
 *
 * @route GET /
 * @desc Listar vendedores.
 *
 */
router.get("/vendedores", authorizeRoles("admin", "stock", "supervisor"), DmsController.getVendedores);

/**
 *
 * @route GET /
 * @desc Listar vendedores activos.
 *
 */
router.get("/vendedores/activos", authorizeRoles("admin", "stock", "gerente", "supervisor"), DmsController.getVendedoresActivos);

/**
 *
 * @route GET /
 * @desc Listar asignacion por mes y anio.
 *
 */
router.get("/asignaciones/:mes/:anio", authorizeCompanies("convencional"), authorizeRoles("admin", "gerente", "stock"), DmsController.getAsignacion);

/**
 *
 * @route GET /
 * @desc Listar asignacion por mes y anio.
 *
 */
router.get("/consolidado/stock", authorizeCompanies("convencional"), authorizeRoles("admin"), DmsController.getStockConsolidado);

/**
 *
 * @route GET /
 * @desc Listar asignacion por mes y anio.
 *
 */
router.get("/reventas/facturas", authorizeRoles("admin", "stock", "gerente", "supervisor", "vendedor", "administracion"), DmsController.getFactuasReventas);

export default router;
