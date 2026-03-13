import { Router } from "express";
import { LieesController } from "../controllers/LiessController";

const router = Router();

/**
 *
 * @route GET /
 * @desc Listar stock disponible.
 *
 */
router.get("/stock-disponible", LieesController.stockDisponible);

export default router;
