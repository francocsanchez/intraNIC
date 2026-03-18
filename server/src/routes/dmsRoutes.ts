import { Router } from "express";
import { DmsController } from "../controllers/DmsController";
import { authenticate } from "../middleware/authenticate";

const router = Router();
router.use(authenticate);
/**
 *
 * @route GET /
 * @desc Listar vendedores.
 *
 */
router.get("/vendedores", DmsController.getVendedores);

/**
 *
 * @route GET /
 * @desc Listar vendedores activos.
 *
 */
router.get("/vendedores/activos", DmsController.getVendedoresActivos);

/**
 *
 * @route GET /
 * @desc Listar asignacion por mes y anio.
 *
 */
router.get("/asignaciones/:mes/:anio", DmsController.getAsignacion);

export default router;
