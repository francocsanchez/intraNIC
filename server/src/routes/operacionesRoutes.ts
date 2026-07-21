import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { OperacionesController } from "../controllers/OperacionesController";
import { authorizeModules } from "../middleware/authorizeModules";
import { requireSuperAdmin } from "../middleware/requireSuperAdmin";

const router = Router();

router.use(authenticate);
router.get("/dashboard", authorizeModules("operaciones"), OperacionesController.getDashboard);
router.get(
  "/analisis-preventa",
  authorizeModules("analisisOperaciones"),
  requireSuperAdmin,
  OperacionesController.getAnalisisPreventa,
);
router.get(
  "/analisis-preventa/descuento-mensual",
  authorizeModules("analisisOperaciones"),
  requireSuperAdmin,
  OperacionesController.getAnalisisPreventaDescuentoMensual,
);
router.get(
  "/analisis-preventa/:numero/forma-pago",
  authorizeModules("analisisOperaciones"),
  requireSuperAdmin,
  OperacionesController.getAnalisisPreventaFormaPago,
);

export default router;
