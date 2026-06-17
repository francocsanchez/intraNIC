import { Router } from "express";
import { PreventaController } from "../controllers/PreventaController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";

const router = Router();

router.use(authenticate);
router.use(authorizeModules("preventas"));

router.get(
  "/resumen-pendientes",
  PreventaController.resumenPendientes,
);
router.get(
  "/resumen-pedido-mensual",
  PreventaController.resumenPedidoMensual,
);

router.get("/", PreventaController.list);
router.get("/:id", PreventaController.getById);
router.post("/", PreventaController.create);
router.put("/:id", PreventaController.update);
router.delete("/:id", PreventaController.remove);
router.patch(
  "/:id/asignado",
  PreventaController.updateAsignado,
);

export default router;
