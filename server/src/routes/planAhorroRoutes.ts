import { Router } from "express";
import { PlanAhorroController } from "../controllers/PlanAhorroController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";
import { authorizeRoleAccess } from "../middleware/authorizeRoleAccess";

const router = Router();

router.use(authenticate);

router.get(
  "/promedios/:ano",
  authorizeModules("promediosPlanAhorro"),
  authorizeRoleAccess("planAhorro.promedios"),
  PlanAhorroController.promedioVentas,
);

export default router;
