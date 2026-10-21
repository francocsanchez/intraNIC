import { Router } from "express";
import { KintoDashboardController } from "../controllers/KintoDashboardController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";

const router = Router();

router.use(authenticate);
router.use(authorizeModules("kintoDashboard"));
router.get("/", KintoDashboardController.get);

export default router;
