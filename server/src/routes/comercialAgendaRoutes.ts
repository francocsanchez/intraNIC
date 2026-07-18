import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";
import { ComercialAgendaController } from "../controllers/ComercialAgendaController";

const router = Router();

router.use(authenticate);
router.use(authorizeModules("agendaComercial"));

router.get("/unidades-negocio", ComercialAgendaController.listUnidadesNegocio);
router.get("/users", ComercialAgendaController.listEligibleUsers);
router.get("/puestos", ComercialAgendaController.listPuestos);
router.put("/puestos", ComercialAgendaController.savePuestos);
router.get("/week", ComercialAgendaController.getWeek);
router.put("/cell", ComercialAgendaController.saveCell);

export default router;
