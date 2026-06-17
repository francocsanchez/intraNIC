import { Router } from "express";
import { LieesController } from "../controllers/LiessController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";
import {
  authorizeLiessTipoByRole,
  authorizeRoleAccess,
} from "../middleware/authorizeRoleAccess";

const router = Router();
router.use(authenticate);

/**
 *
 * @route GET /
 * @desc Listar stock disponible.
 *
 */
router.get("/stock-disponible/:tipo", authorizeModules("liess"), authorizeRoleAccess("liess.stockDisponible"), authorizeLiessTipoByRole(), LieesController.stockDisponible);

export default router;
