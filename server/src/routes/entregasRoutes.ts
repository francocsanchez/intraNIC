import { Router } from "express";
import { AgendaEntregaController } from "../controllers/AgendaEntregaController";
import { AgendaEntregaLogController } from "../controllers/AgendaEntregaLogController";
import { PendienteTurnarController } from "../controllers/PendienteTurnarController";
import { SucursalEntregaController } from "../controllers/SucursalEntregaController";
import { authenticate } from "../middleware/authenticate";

const router = Router();

router.use(authenticate);

router.get("/interno/:interno", AgendaEntregaController.getInterno);

router.get("/agendas", AgendaEntregaController.list);
router.post("/agendas/reservas", AgendaEntregaController.createReserva);
router.put("/agendas/reservas/:id", AgendaEntregaController.updateReserva);
router.delete("/agendas/reservas/:id", AgendaEntregaController.remove);
router.post("/agendas/reservas/:id/convertir", AgendaEntregaController.convertReserva);
router.get("/agendas/:id", AgendaEntregaController.getById);
router.post("/agendas", AgendaEntregaController.create);
router.put("/agendas/:id", AgendaEntregaController.update);
router.patch("/agendas/:id/entregada-por", AgendaEntregaController.toggleEntregadaPor);
router.delete("/agendas/:id", AgendaEntregaController.remove);

router.get("/pendientes-turnar", PendienteTurnarController.list);
router.post("/pendientes-turnar", PendienteTurnarController.create);
router.put("/pendientes-turnar/:id", PendienteTurnarController.update);
router.delete("/pendientes-turnar/:id", PendienteTurnarController.remove);
router.post("/pendientes-turnar/:id/turnar", PendienteTurnarController.turnar);

router.get("/sucursales", SucursalEntregaController.list);
router.post("/sucursales", SucursalEntregaController.create);
router.put("/sucursales/:id", SucursalEntregaController.update);
router.delete("/sucursales/:id", SucursalEntregaController.remove);

router.get("/registros", AgendaEntregaLogController.list);

export default router;
