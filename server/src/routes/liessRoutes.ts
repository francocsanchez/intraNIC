import { Router } from "express";
import { LieesController } from "../controllers/LiessController";
import { SaldoOperacionLiessSnapshotController } from "../controllers/SaldoOperacionLiessSnapshotController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";
import { authorizeRoles } from "../middleware/authorizeRoles";
import {
  authorizeLiessTipoByRole,
  authorizeRoleAccess,
} from "../middleware/authorizeRoleAccess";

const router = Router();
router.use(authenticate);

/**
 *
 * @route GET /
 * @desc Listar stock disponible.
 *
 */
router.get("/stock-disponible/:tipo", authorizeModules("liess"), authorizeRoleAccess("liess.stockDisponible"), authorizeLiessTipoByRole(), LieesController.stockDisponible);
router.patch("/stock-disponible/usados/:interno/accion", authorizeModules("liess"), authorizeRoleAccess("liess.stockDisponible"), authorizeRoles("supervisor", "gerente"), LieesController.actualizarAccionUsado);
router.get("/saldo-operacion/filtros", authorizeModules("saldoOperacionLiess", "liess"), SaldoOperacionLiessSnapshotController.filters);
router.get("/saldo-operacion/sincronizacion", authorizeModules("saldoOperacionLiess", "liess"), SaldoOperacionLiessSnapshotController.syncStatus);
router.post("/saldo-operacion/sincronizar", authorizeModules("saldoOperacionLiess", "liess"), SaldoOperacionLiessSnapshotController.runSync);
router.get("/saldo-operacion/resumen", authorizeModules("saldoOperacionLiess", "liess"), SaldoOperacionLiessSnapshotController.summary);
router.get("/saldo-operacion/analisis-cancelacion", authorizeModules("saldoOperacionLiess", "liess"), SaldoOperacionLiessSnapshotController.analysis(true));
router.get("/saldo-operacion/analisis-no-canceladas", authorizeModules("saldoOperacionLiess", "liess"), SaldoOperacionLiessSnapshotController.analysis(false));
router.get("/saldo-operacion/export", authorizeModules("saldoOperacionLiess", "liess"), SaldoOperacionLiessSnapshotController.export);
router.get("/saldo-operacion/:codigoOperacion/detalle-pago", authorizeModules("saldoOperacionLiess", "liess"), SaldoOperacionLiessSnapshotController.paymentDetail);
router.get("/saldo-operacion", authorizeModules("saldoOperacionLiess", "liess"), SaldoOperacionLiessSnapshotController.list);
router.patch("/saldo-operacion/:codigoOperacion/tipo-cliente", authorizeModules("saldoOperacionLiess", "liess"), SaldoOperacionLiessSnapshotController.updateTipoCliente);
router.patch("/saldo-operacion/:codigoOperacion/cancelacion", authorizeModules("saldoOperacionLiess", "liess"), SaldoOperacionLiessSnapshotController.updateCancelacion);

export default router;
