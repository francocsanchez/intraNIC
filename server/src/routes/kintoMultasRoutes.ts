import { Router } from "express";
import { KintoMultasController } from "../controllers/KintoMultasController";
import { authenticate } from "../middleware/authenticate";
import { authorizeModules } from "../middleware/authorizeModules";

const router = Router();
router.use(authenticate);
router.use(authorizeModules("kintoMultas"));
router.get("/dominios", KintoMultasController.domains);
router.get("/", KintoMultasController.list);
router.post("/", KintoMultasController.create);
router.get("/:id/historial", KintoMultasController.history);
router.patch("/:id", KintoMultasController.update);
router.patch("/:id/estado", KintoMultasController.updateStatus);
router.delete("/:id", KintoMultasController.remove);
export default router;
