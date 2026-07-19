import { Router } from "express";
import { PlanNegocioController } from "../controllers/PlanNegocioController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorizeModules("configuracion"),
  PlanNegocioController.list,
);

router.get(
  "/modelos",
  authorizeModules("configuracion", "planNegocio"),
  PlanNegocioController.modelos,
);

router.get(
  "/resumen/:anio",
  authorizeModules("planNegocio"),
  PlanNegocioController.resumen,
);

router.post(
  "/",
  authorizeModules("configuracion"),
  PlanNegocioController.create,
);

router.put(
  "/:id",
  authorizeModules("configuracion"),
  PlanNegocioController.update,
);

router.delete(
  "/:id",
  authorizeModules("configuracion"),
  PlanNegocioController.remove,
);

export default router;
