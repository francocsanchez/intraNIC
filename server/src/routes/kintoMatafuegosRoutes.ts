import { Router } from "express";
import { KintoMatafuegosController } from "../controllers/KintoMatafuegosController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";

const router = Router();
router.use(authenticate);
router.use(authorizeModules("kintoMatafuegos"));
router.get("/", KintoMatafuegosController.list);
router.get("/:flotaId/historial", KintoMatafuegosController.history);
router.post("/:flotaId/recargas", KintoMatafuegosController.createRecarga);

export default router;
