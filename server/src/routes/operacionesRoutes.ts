import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { OperacionesController } from "../controllers/OperacionesController";
import { authorizeModules } from "../middleware/authorizeModules";

const router = Router();

router.use(authenticate);
router.use(authorizeModules("operaciones"));
router.get("/dashboard", OperacionesController.getDashboard);

export default router;
