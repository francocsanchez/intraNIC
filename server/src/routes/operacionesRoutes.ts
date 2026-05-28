import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { OperacionesController } from "../controllers/OperacionesController";

const router = Router();

router.use(authenticate);
router.get("/dashboard", OperacionesController.getDashboard);

export default router;
