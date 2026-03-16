import { Router } from "express";
import { LieesController } from "../controllers/LiessController";

const router = Router();

/**
 *
 * @route GET /
 * @desc Listar stock disponible.
 *
 */
router.get("/stock-disponible/:tipo", LieesController.stockDisponible);

export default router;
