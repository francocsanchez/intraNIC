import { Router } from "express";
import { VersionController } from "../controllers/VersionController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";

const router = Router();

router.use(authenticate);
router.use(authorizeModules("configuracion"));
router.get("/", VersionController.list);
router.post("/", VersionController.create);
router.put("/:id", VersionController.update);
router.delete("/:id", VersionController.remove);

export default router;
