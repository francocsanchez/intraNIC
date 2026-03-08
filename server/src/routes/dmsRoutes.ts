import { Router } from "express";
import { DmsController } from "../controllers/DmsController";

const router = Router();

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


export default router;
