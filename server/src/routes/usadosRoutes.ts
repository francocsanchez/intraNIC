import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorizeRoles } from "../middleware/authorizeRoles";
import { UsadosController } from "../controllers/UsadosController";

const router = Router();
router.use(authenticate);

/**
 *
 * @route GET /
 * @desc Listar stock disponible.
 *
 */
router.get("/stock-disponible", authorizeRoles("admin", "supervisor", "gerente", "vendedor"), UsadosController.stockDisponible);

/**
 *
 * @route GET /
 * @desc Listar stock guardado.
 *
 */
router.get("/stock-guardado", authorizeRoles("admin", "gerente"), UsadosController.stockGuardado);

/**
 *
 * @route GET /
 * @desc Listar stock reservado.
 *
 */
router.get("/stock-reservado", authorizeRoles("admin", "supervisor", "gerente"), UsadosController.stockReservado);

/**
 *
 * @route GET /
 * @desc Listar stock a ingresar.
 *
 */
router.get("/stock-ingreso", authorizeRoles("admin", "supervisor", "gerente", "vendedor"), UsadosController.stockIngreso);


export default router;
