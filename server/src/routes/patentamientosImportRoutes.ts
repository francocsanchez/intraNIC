import { Router } from "express";
import { PatentamientosImportController } from "../controllers/PatentamientosImportController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";

const router = Router();

router.use(authenticate);
router.use(authorizeModules("actualizacionRegistros"));

router.get("/importaciones/patent-prendas/estado", PatentamientosImportController.getEstado);
router.post("/importaciones/patent-prendas/ejecutar", PatentamientosImportController.ejecutarImportacion);

export default router;
