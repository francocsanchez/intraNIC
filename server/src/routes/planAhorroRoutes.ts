import { Router } from "express";
import { PlanAhorroController } from "../controllers/PlanAhorroController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";

const router = Router();

router.use(authenticate);

router.get(
  "/promedios/:ano",
  authorizeModules("promediosPlanAhorro"),
  PlanAhorroController.promedioVentas,
);

export default router;
