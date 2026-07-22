import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { OperacionesController } from "../controllers/OperacionesController";
import { authorizeModules } from "../middleware/authorizeModules";

const router = Router();

router.use(authenticate);
router.get("/dashboard", authorizeModules("operaciones"), OperacionesController.getDashboard);
router.get(
  "/analisis-preventa",
  authorizeModules("analisisOperaciones"),
  OperacionesController.getAnalisisPreventa,
);
router.get(
  "/analisis-preventa/descuento-mensual",
  authorizeModules("analisisOperaciones"),
  OperacionesController.getAnalisisPreventaDescuentoMensual,
);
router.get(
  "/analisis-preventa/resumen-financiacion",
  authorizeModules("analisisOperaciones"),
  OperacionesController.getAnalisisPreventaResumenFinanciacion,
);
router.get(
  "/analisis-preventa/usados-mensual",
  authorizeModules("analisisOperaciones"),
  OperacionesController.getAnalisisPreventaUsadosMensual,
);
router.get(
  "/analisis-preventa/credito-mensual",
  authorizeModules("analisisOperaciones"),
  OperacionesController.getAnalisisPreventaCreditoMensual,
);
router.get(
  "/analisis-preventa/:numero/forma-pago",
  authorizeModules("analisisOperaciones"),
  OperacionesController.getAnalisisPreventaFormaPago,
);

export default router;
