import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorizeCompanies, authorizeRoles } from "../middleware/authorizeRoles";
import { UsadosController } from "../controllers/UsadosController";

const router = Router();
router.use(authenticate);
router.use(authorizeCompanies("usados"));

/**
 *
 * @route GET /
 * @desc Listar stock disponible.
 *
 */
router.get("/stock-disponible", authorizeRoles("admin", "supervisor", "gerente", "vendedor", "stock"), UsadosController.stockDisponible);

/**
 *
 * @route GET /
 * @desc Listar stock guardado.
 *
 */
router.get("/stock-guardado", authorizeRoles("admin", "supervisor", "gerente", "stock"), UsadosController.stockGuardado);

/**
 *
 * @route GET /
 * @desc Listar stock reservado.
 *
 */
router.get("/stock-reservado", authorizeRoles("admin", "supervisor", "gerente", "stock"), UsadosController.stockReservado);

/**
 *
 * @route GET /
 * @desc Listar stock a ingresar.
 *
 */
router.get("/stock-ingreso", authorizeRoles("admin", "gerente", "stock"), UsadosController.stockIngreso);


export default router;
