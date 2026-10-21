import { Router } from "express";
import { KintoNpsShareController } from "../controllers/KintoNpsShareController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";

const router = Router();
router.use(authenticate);
router.use(authorizeModules("kintoNpsShare"));
router.get("/", KintoNpsShareController.list);
router.put("/", KintoNpsShareController.save);
export default router;
