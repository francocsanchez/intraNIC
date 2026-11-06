import { Router } from "express";
import { LieesController } from "../controllers/LiessController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";
import { authorizeRoles } from "../middleware/authorizeRoles";
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
router.patch("/stock-disponible/usados/:interno/accion", authorizeModules("liess"), authorizeRoleAccess("liess.stockDisponible"), authorizeRoles("supervisor", "gerente"), LieesController.actualizarAccionUsado);

export default router;
