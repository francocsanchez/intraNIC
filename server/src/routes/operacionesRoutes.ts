import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { OperacionesController } from "../controllers/OperacionesController";
import { authorizeModules } from "../middleware/authorizeModules";
import { SaldoOperacionSnapshotController } from "../controllers/SaldoOperacionSnapshotController";

const router = Router();

router.use(authenticate);
router.get("/dashboard", authorizeModules("operaciones"), OperacionesController.getDashboard);
router.get(
  "/analisis-vendedor/filtros",
  authorizeModules("analisisVendedor"),
  OperacionesController.getAnalisisVendedorFilters,
);
router.get(
  "/analisis-vendedor",
  authorizeModules("analisisVendedor"),
  OperacionesController.getAnalisisVendedor,
);
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
router.get("/saldo-operacion/filtros", authorizeModules("saldoOperacion"), SaldoOperacionSnapshotController.filters);
router.get("/saldo-operacion/resumen", authorizeModules("saldoOperacion"), SaldoOperacionSnapshotController.summary);
router.get("/saldo-operacion/export", authorizeModules("saldoOperacion"), SaldoOperacionSnapshotController.export);
router.get("/saldo-operacion", authorizeModules("saldoOperacion"), SaldoOperacionSnapshotController.list);
router.patch("/saldo-operacion/:codigoOperacion/cancelacion", authorizeModules("saldoOperacion"), SaldoOperacionSnapshotController.updateFechaCancelacion);
export default router;
