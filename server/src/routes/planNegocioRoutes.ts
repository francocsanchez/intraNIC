import { Router } from "express";
import { PlanNegocioController } from "../controllers/PlanNegocioController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";
import { authorizeAnyRoleAccess, authorizeRoleAccess } from "../middleware/authorizeRoleAccess";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorizeModules("configuracion"),
  authorizeRoleAccess("sistema.configuracion"),
  PlanNegocioController.list,
);

router.get(
  "/modelos",
  authorizeModules("configuracion", "planNegocio"),
  authorizeAnyRoleAccess("sistema.configuracion", "convencional.planNegocio"),
  PlanNegocioController.modelos,
);

router.get(
  "/resumen/:anio",
  authorizeModules("planNegocio"),
  authorizeRoleAccess("convencional.planNegocio"),
  PlanNegocioController.resumen,
);

router.post(
  "/",
  authorizeModules("configuracion"),
  authorizeRoleAccess("sistema.configuracion"),
  PlanNegocioController.create,
);

router.put(
  "/:id",
  authorizeModules("configuracion"),
  authorizeRoleAccess("sistema.configuracion"),
  PlanNegocioController.update,
);

router.delete(
  "/:id",
  authorizeModules("configuracion"),
  authorizeRoleAccess("sistema.configuracion"),
  PlanNegocioController.remove,
);

export default router;
