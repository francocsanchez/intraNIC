import { Router } from "express";
import { AgendaEntregaController } from "../controllers/AgendaEntregaController";
import { AgendaEntregaLogController } from "../controllers/AgendaEntregaLogController";
import { SucursalEntregaController } from "../controllers/SucursalEntregaController";
import { authenticate } from "../middleware/authenticate";

const router = Router();

router.use(authenticate);

router.get("/interno/:interno", AgendaEntregaController.getInterno);

router.get("/agendas", AgendaEntregaController.list);
router.get("/agendas/:id", AgendaEntregaController.getById);
router.post("/agendas", AgendaEntregaController.create);
router.put("/agendas/:id", AgendaEntregaController.update);
router.delete("/agendas/:id", AgendaEntregaController.remove);

router.get("/sucursales", SucursalEntregaController.list);
router.post("/sucursales", SucursalEntregaController.create);
router.put("/sucursales/:id", SucursalEntregaController.update);
router.delete("/sucursales/:id", SucursalEntregaController.remove);

router.get("/registros", AgendaEntregaLogController.list);

export default router;
