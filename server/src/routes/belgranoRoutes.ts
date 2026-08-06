import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";
import { authorizeRoleAccess } from "../middleware/authorizeRoleAccess";
import { BelgranoController } from "../controllers/BelgranoController";

const router = Router();
router.use(authenticate);

router.get("/stock-disponible", authorizeModules("belgrano"), authorizeRoleAccess("belgrano.stockDisponible"), BelgranoController.stockDisponible);

export default router;
