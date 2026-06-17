import { Router } from "express";
import { PreventaController } from "../controllers/PreventaController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";
import { authorizeRoleAccess } from "../middleware/authorizeRoleAccess";

const router = Router();

router.use(authenticate);
router.use(authorizeModules("preventas"));

router.get(
  "/resumen-pendientes",
  authorizeRoleAccess("preventas.resumen"),
  PreventaController.resumenPendientes,
);
router.get(
  "/resumen-pedido-mensual",
  authorizeRoleAccess("preventas.resumen"),
  PreventaController.resumenPedidoMensual,
);

router.get("/", authorizeRoleAccess("preventas.read"), PreventaController.list);
router.get("/:id", authorizeRoleAccess("preventas.manage"), PreventaController.getById);
router.post("/", authorizeRoleAccess("preventas.manage"), PreventaController.create);
router.put("/:id", authorizeRoleAccess("preventas.manage"), PreventaController.update);
router.delete("/:id", authorizeRoleAccess("preventas.manage"), PreventaController.remove);
router.patch(
  "/:id/asignado",
  authorizeRoleAccess("preventas.manage"),
  PreventaController.updateAsignado,
);

export default router;
