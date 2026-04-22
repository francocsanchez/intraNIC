import { Router } from "express";
import { LieesController } from "../controllers/LiessController";
import { authenticate } from "../middleware/authenticate";
import { authorizeCompanies, authorizeRoles } from "../middleware/authorizeRoles";

const router = Router();
router.use(authenticate);
router.use(authorizeCompanies("liess"));

/**
 *
 * @route GET /
 * @desc Listar stock disponible.
 *
 */
router.get("/stock-disponible/:tipo", authorizeRoles("admin", "supervisor", "gerente", "vendedor", "stock"), LieesController.stockDisponible);

export default router;
