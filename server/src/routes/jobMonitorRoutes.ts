import { Router } from "express";
import { JobMonitorController } from "../controllers/JobMonitorController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";

const router = Router();

router.use(authenticate);
router.use(authorizeModules("actualizacionRegistros"));

router.get("/", JobMonitorController.list);
router.get("/:jobKey", JobMonitorController.getByKey);
router.post("/:jobKey/run", JobMonitorController.run);

export default router;
