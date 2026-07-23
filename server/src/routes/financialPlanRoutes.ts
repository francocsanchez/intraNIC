import { Router } from "express";
import { FinancialPlanController } from "../controllers/FinancialPlanController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";
import { requireCotizadorManageAccess } from "../middleware/requireCotizadorManageAccess";

const router = Router();

router.use(authenticate);

router.get("/", authorizeModules("cotizador"), requireCotizadorManageAccess, FinancialPlanController.list);
router.post("/", authorizeModules("cotizador"), requireCotizadorManageAccess, FinancialPlanController.create);
router.put("/:id", authorizeModules("cotizador"), requireCotizadorManageAccess, FinancialPlanController.update);
router.delete("/:id", authorizeModules("cotizador"), requireCotizadorManageAccess, FinancialPlanController.remove);

export default router;
