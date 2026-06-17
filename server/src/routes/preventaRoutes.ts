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
router.get("/:id", authorizeRoleAccess("preventas.update"), PreventaController.getById);
router.post("/", authorizeRoleAccess("preventas.create"), PreventaController.create);
router.put("/:id", authorizeRoleAccess("preventas.update"), PreventaController.update);
router.delete("/:id", authorizeRoleAccess("preventas.delete"), PreventaController.remove);
router.patch(
  "/:id/asignado",
  authorizeRoleAccess("preventas.assign"),
  PreventaController.updateAsignado,
);

export default router;
