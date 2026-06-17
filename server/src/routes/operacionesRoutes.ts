import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { OperacionesController } from "../controllers/OperacionesController";
import { authorizeModules } from "../middleware/authorizeModules";
import { authorizeRoleAccess } from "../middleware/authorizeRoleAccess";

const router = Router();

router.use(authenticate);
router.use(authorizeModules("operaciones"));
router.use(authorizeRoleAccess("analisis.operaciones"));
router.get("/dashboard", OperacionesController.getDashboard);

export default router;
