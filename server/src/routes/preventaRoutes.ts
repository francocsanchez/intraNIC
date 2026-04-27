import { Router } from "express";
import { PreventaController } from "../controllers/PreventaController";
import { authenticate } from "../middleware/authenticate";
import { authorizeCompanies, authorizeRoles } from "../middleware/authorizeRoles";

const router = Router();

router.use(authenticate);
router.use(authorizeCompanies("convencional"));

router.get(
  "/resumen-pendientes",
  authorizeRoles("admin", "stock", "supervisor"),
  PreventaController.resumenPendientes,
);
router.get(
  "/resumen-pedido-mensual",
  authorizeRoles("stock", "admin", "supervisor"),
  PreventaController.resumenPedidoMensual,
);

router.get("/", authorizeRoles("admin", "stock", "supervisor"), PreventaController.list);
router.get("/:id", authorizeRoles("admin", "stock", "supervisor"), PreventaController.getById);
router.post("/", authorizeRoles("admin", "stock", "supervisor"), PreventaController.create);
router.put("/:id", authorizeRoles("admin", "stock", "supervisor"), PreventaController.update);
router.delete("/:id", authorizeRoles("admin", "stock", "supervisor"), PreventaController.remove);
router.patch(
  "/:id/asignado",
  authorizeRoles("admin", "stock", "supervisor"),
  PreventaController.updateAsignado,
);

export default router;
