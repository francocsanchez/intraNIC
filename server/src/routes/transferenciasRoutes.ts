import { Router } from "express";
import { TransferenciasDashboardController } from "../controllers/TransferenciasDashboardController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";

const router = Router();

router.use(authenticate);
router.use(authorizeModules("transferencias"));

router.get("/dashboard/years", TransferenciasDashboardController.getAvailableYears);
router.get("/dashboard/general/zona-nic", TransferenciasDashboardController.getGeneralZonaNic);

export default router;
