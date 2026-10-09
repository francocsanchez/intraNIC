import { Router } from "express";
import { TableroCobranzasController } from "../controllers/TableroCobranzasController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";

const router = Router();

router.use(authenticate);
router.get("/diario", authorizeModules("tableroCobranzas"), TableroCobranzasController.getDiario);
router.get("/diario/detalle", authorizeModules("tableroCobranzas"), TableroCobranzasController.getDetalleDiario);

export default router;
