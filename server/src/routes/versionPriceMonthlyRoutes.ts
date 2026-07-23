import { Router } from "express";
import { VersionPriceMonthlyController } from "../controllers/VersionPriceMonthlyController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";
import { requireCotizadorManageAccess } from "../middleware/requireCotizadorManageAccess";

const router = Router();

router.use(authenticate);
router.use(authorizeModules("cotizador"));
router.use(requireCotizadorManageAccess);

router.get("/", VersionPriceMonthlyController.list);
router.post("/", VersionPriceMonthlyController.create);
router.put("/:id", VersionPriceMonthlyController.update);
router.delete("/:id", VersionPriceMonthlyController.remove);

export default router;
