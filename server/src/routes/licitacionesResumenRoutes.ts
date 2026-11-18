import { Router } from "express";
import { LicitacionesResumenController } from "../controllers/LicitacionesResumenController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";

const router = Router();

router.use(authenticate);
router.use(authorizeModules("licitacionesResumen"));
router.get("/", LicitacionesResumenController.list);
router.get("/:id/unidades", LicitacionesResumenController.units);

export default router;
