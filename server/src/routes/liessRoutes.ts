import { Router } from "express";
import { LieesController } from "../controllers/LiessController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";

const router = Router();
router.use(authenticate);

/**
 *
 * @route GET /
 * @desc Listar stock disponible.
 *
 */
router.get("/stock-disponible/:tipo", authorizeModules("liess"), LieesController.stockDisponible);

export default router;
